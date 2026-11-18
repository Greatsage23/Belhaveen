import {createHash,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {actor,origin,limit} from '../../../lib/auth';
import {verify} from '../../../lib/crypto';
import {query,transaction} from '../../../lib/db';
import {nextStatus,validateBallot} from '../../../lib/voting-rules';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const uuid=z.uuid();
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 try{
  const admin=new URL(req.url).searchParams.get('admin')==='1';
  if(admin){const a=await actor();if(a.role!=='administrator')return reply({error:'Administrator access required.'},403);}
  return await transaction(async c=>{
   await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
   const {rows:[settings]}=await c.query('SELECT * FROM bms_vote_settings WHERE id=1');
   const {rows:runs}=await c.query('SELECT * FROM bms_vote_runs ORDER BY mode');
   const {rows:portfolios}=await c.query('SELECT * FROM bms_vote_portfolios WHERE $1 OR active ORDER BY position,name',[admin]);
   const {rows:candidates}=await c.query('SELECT c.* FROM bms_vote_candidates c JOIN bms_vote_portfolios p ON p.id=c.portfolio_id WHERE $1 OR p.active ORDER BY c.name',[admin]);
   if(!admin)return reply({settings,run:runs.find(r=>r.mode===settings.mode),portfolios,candidates});
   const {rows:results}=await c.query(`SELECT c.id,c.portfolio_id,r.mode,count(b.id)::integer votes FROM bms_vote_candidates c CROSS JOIN bms_vote_runs r LEFT JOIN bms_vote_choices v ON v.candidate_id=c.id LEFT JOIN bms_vote_ballots b ON b.id=v.ballot_id AND b.mode=r.mode AND b.generation=r.generation GROUP BY c.id,r.mode`);
   const {rows:totals}=await c.query('SELECT r.mode,count(b.id)::integer ballots FROM bms_vote_runs r LEFT JOIN bms_vote_ballots b ON b.mode=r.mode AND b.generation=r.generation GROUP BY r.mode');
   const {rows:audit}=await c.query('SELECT action,detail,created_at FROM bms_vote_audit ORDER BY id DESC LIMIT 100');
   return reply({settings,runs,portfolios,candidates,results,totals,audit});
  });
 }catch{return reply({error:'Voting is unavailable. Check database setup or administrator sign-in.'},503);}
}
export async function POST(req:Request){
 try{
  origin(req);
  const p=await req.json();
  if(p.action==='ballot'){
   const input=z.object({id:uuid,mode:z.enum(['demo','real']),generation:z.number().int().positive(),revision:z.number().int().positive(),choices:z.array(z.object({portfolioId:uuid,candidateId:uuid})).min(1).max(100),code:z.string().max(100).optional()}).parse(p);
   const hash=digest(JSON.stringify({mode:input.mode,generation:input.generation,choices:[...input.choices].sort((a,b)=>a.portfolioId.localeCompare(b.portfolioId))}));
   await transaction(async c=>{
    const {rows:[s]}=await c.query('SELECT * FROM bms_vote_settings WHERE id=1 FOR UPDATE');
    const {rows:[existing]}=await c.query('SELECT digest FROM bms_vote_ballots WHERE id=$1',[input.id]);
    if(existing){if(existing.digest!==hash)throw Error('Submission identifier already used.');return;}
    const {rows:[run]}=await c.query('SELECT * FROM bms_vote_runs WHERE mode=$1 FOR UPDATE',[s.mode]);
    if(s.mode!==input.mode||s.revision!==input.revision||run.generation!==input.generation)throw Error('Election changed. Refresh and select your candidates again.');
    if(run.status!=='open')throw Error('Voting is paused or closed.');
    const {rows:portfolios}=await c.query('SELECT id FROM bms_vote_portfolios WHERE active');
    const {rows:candidates}=await c.query('SELECT id,portfolio_id FROM bms_vote_candidates');
    validateBallot(input.choices,portfolios,candidates);
    if(s.codes_required){const used=await c.query('UPDATE bms_vote_codes SET used=true WHERE hash=$1 AND mode=$2 AND generation=$3 AND NOT used RETURNING hash',[digest((input.code??'').trim().toUpperCase()),s.mode,run.generation]);if(!used.rowCount)throw Error('Enter a valid unused voting code.');}
    await c.query('INSERT INTO bms_vote_ballots(id,mode,generation,digest) VALUES($1,$2,$3,$4)',[input.id,s.mode,run.generation,hash]);
    for(const v of input.choices)await c.query('INSERT INTO bms_vote_choices(ballot_id,portfolio_id,candidate_id) VALUES($1,$2,$3)',[input.id,v.portfolioId,v.candidateId]);
   });
   return reply({ok:true});
  }
  const a=await actor();if(a.role!=='administrator')return reply({error:'Administrator access required.'},403);
  if(p.action==='reset'&&p.mode==='real'){
   await limit(req,'election-reset:'+a.id);
   const [u]=await query('SELECT password_hash FROM bms_users WHERE id=$1',[a.id]);
   if(p.confirm!=='RESET REAL ELECTION'||!await verify(String(p.password??''),u.password_hash))throw Error('Confirm the warning and enter your current password.');
  }
  const output=await transaction(async c=>{
   const {rows:[s]}=await c.query('SELECT * FROM bms_vote_settings WHERE id=1 FOR UPDATE');
   let detail:Record<string,unknown>={};let result:Record<string,unknown>={ok:true};
   const editable=async()=>{const {rows:[r]}=await c.query("SELECT * FROM bms_vote_runs WHERE mode='real'");const {rows:[n]}=await c.query('SELECT count(*)::integer n FROM bms_vote_ballots');if(r.started_at||n.n>0)throw Error('Reset existing demo ballots and formally reset the real election before changing nominations.');};
   if(p.action==='portfolio'){
    await editable();const v=z.object({id:uuid.optional(),name:z.string().trim().min(1).max(150),description:z.string().max(1000),position:z.number().int().min(0).max(999),active:z.boolean()}).parse(p);
    if(v.id)await c.query('UPDATE bms_vote_portfolios SET name=$2,description=$3,position=$4,active=$5 WHERE id=$1',[v.id,v.name,v.description,v.position,v.active]);else await c.query('INSERT INTO bms_vote_portfolios(name,description,position,active) VALUES($1,$2,$3,$4)',[v.name,v.description,v.position,v.active]);detail={name:v.name};
   }else if(p.action==='candidate'){
    await editable();const v=z.object({id:uuid.optional(),portfolioId:uuid,name:z.string().trim().min(1).max(150),className:z.string().trim().min(1).max(100),gender:z.string().max(50),number:z.string().max(30),photoId:uuid}).parse(p);
    if(v.id)await c.query('UPDATE bms_vote_candidates SET portfolio_id=$2,name=$3,class_name=$4,gender=$5,number=$6,photo_id=$7 WHERE id=$1',[v.id,v.portfolioId,v.name,v.className,v.gender,v.number,v.photoId]);else await c.query('INSERT INTO bms_vote_candidates(portfolio_id,name,class_name,gender,number,photo_id) VALUES($1,$2,$3,$4,$5,$6)',[v.portfolioId,v.name,v.className,v.gender,v.number,v.photoId]);detail={name:v.name};
   }else if(p.action==='delete'){
    await editable();const id=uuid.parse(p.id);if(p.kind==='candidate')await c.query('DELETE FROM bms_vote_candidates WHERE id=$1',[id]);else if(p.kind==='portfolio')await c.query('DELETE FROM bms_vote_portfolios WHERE id=$1',[id]);else throw Error('Unknown item');detail={id};
   }else if(p.action==='settings'){
    const title=z.string().trim().min(3).max(150).parse(p.title);const codes=z.boolean().parse(p.codesRequired);
    const {rows:[r]}=await c.query('SELECT status FROM bms_vote_runs WHERE mode=$1',[s.mode]);if(r.status==='open')throw Error('Pause voting before changing settings.');
    await c.query('UPDATE bms_vote_settings SET title=$1,codes_required=$2 WHERE id=1',[title,codes]);detail={title,codes};
   }else if(p.action==='mode'){
    const mode=z.enum(['demo','real']).parse(p.mode);if(p.confirm!==true)throw Error('Confirm mode switch.');await c.query('UPDATE bms_vote_settings SET mode=$1 WHERE id=1',[mode]);detail={from:s.mode,to:mode};
   }else if(p.action==='control'){
    const {rows:[r]}=await c.query('SELECT * FROM bms_vote_runs WHERE mode=$1 FOR UPDATE',[s.mode]);const status=nextStatus(r.status,p.control);
    if(status==='open'){const {rows:ps}=await c.query('SELECT p.id,count(c.id)::integer n FROM bms_vote_portfolios p LEFT JOIN bms_vote_candidates c ON c.portfolio_id=p.id WHERE p.active GROUP BY p.id');if(!ps.length||ps.some(p=>p.n===0))throw Error('Every active portfolio needs at least one candidate.');}
    await c.query("UPDATE bms_vote_runs SET status=$2,started_at=CASE WHEN $2='open' THEN COALESCE(started_at,now()) ELSE started_at END,closed_at=CASE WHEN $2='closed' THEN now() ELSE closed_at END WHERE mode=$1",[s.mode,status]);detail={mode:s.mode,status};
   }else if(p.action==='reset'){
    const mode=z.enum(['demo','real']).parse(p.mode);
    await c.query('DELETE FROM bms_vote_ballots WHERE mode=$1',[mode]);await c.query('DELETE FROM bms_vote_codes WHERE mode=$1',[mode]);await c.query("UPDATE bms_vote_runs SET status='draft',started_at=NULL,closed_at=NULL,generation=generation+1 WHERE mode=$1",[mode]);detail={mode};
   }else if(p.action==='codes'){
    const count=z.number().int().min(1).max(500).parse(p.count);const {rows:[r]}=await c.query('SELECT generation FROM bms_vote_runs WHERE mode=$1',[s.mode]);const codes:string[]=[];
    for(let i=0;i<count;i++){const code=randomBytes(8).toString('hex').toUpperCase();codes.push(code);await c.query('INSERT INTO bms_vote_codes(hash,mode,generation) VALUES($1,$2,$3)',[digest(code),s.mode,r.generation]);}result={ok:true,codes};detail={mode:s.mode,count};
   }else throw Error('Unknown operation.');
   if(p.action!=='codes')await c.query('UPDATE bms_vote_settings SET revision=revision+1 WHERE id=1');
   await c.query('INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES($1,$2,$3)',[a.id,p.action,JSON.stringify(detail)]);return result;
  });return reply(output);
 }catch(e){return reply({error:e instanceof z.ZodError?'Check all required fields.':e instanceof Error&&!('code' in e)?e.message:'Unable to save. Check database setup and linked records.'},400);}
}
