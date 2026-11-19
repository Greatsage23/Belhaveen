import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function importElectionCandidates(client){
 const marker='012_import_candidate_photos_20261119';
 if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 const root=new URL('../seed/election-2026/',import.meta.url);
 const candidates=JSON.parse(await readFile(new URL('candidates.json',root),'utf8'));
 if(candidates.length!==25||new Set(candidates.map(c=>c.photo)).size!==25||new Set(candidates.map(c=>c.portfolio)).size!==10)throw Error('Candidate import manifest is incomplete.');
 await client.query('SELECT id FROM bms_vote_settings WHERE id=1 FOR UPDATE');
 const {rows:[administrator]}=await client.query("SELECT id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1");
 if(!administrator)throw Error('Candidate import requires an active administrator.');
 const imported=[];
 for(const candidate of candidates){
  const {rows:portfolios}=await client.query('SELECT id,active FROM bms_vote_portfolios WHERE lower(btrim(name))=lower($1)',[candidate.portfolio]);
  if(portfolios.length!==1)throw Error('Candidate import requires exactly one matching portfolio: '+candidate.portfolio);
  const portfolio=portfolios[0];
  if(portfolio.active)throw Error('Candidate import paused: portfolio is active: '+candidate.portfolio);
  if((await client.query('SELECT 1 FROM bms_vote_choices WHERE portfolio_id=$1 LIMIT 1',[portfolio.id])).rowCount)throw Error('Cannot change nominations for a portfolio with recorded votes.');
  if(!/^\d{2}\.webp$/.test(candidate.photo)||!candidate.name.trim())throw Error('Invalid candidate import entry.');
  const bytes=await readFile(new URL('photos/'+candidate.photo,root));
  if(bytes.length>1048576||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Invalid candidate photo: '+candidate.photo);
  if(createHash('sha256').update(bytes).digest('hex')!==candidate.photoSha256)throw Error('Candidate photo checksum mismatch.');
  const photoId=candidate.photoId;await client.query("INSERT INTO bms_vote_photos(id,mime,data) VALUES($1,'image/webp',$2)",[photoId,bytes]);
  const {rows:matches}=await client.query('SELECT id FROM bms_vote_candidates WHERE portfolio_id=$1 AND lower(btrim(name))=lower($2)',[portfolio.id,candidate.name]);
  if(matches.length>1)throw Error('Duplicate candidate requires review: '+candidate.name);
  let candidateId;
  if(matches.length){candidateId=matches[0].id;await client.query('UPDATE bms_vote_candidates SET photo_id=$1 WHERE id=$2',[photoId,candidateId]);}
  else{candidateId=candidate.id;await client.query("INSERT INTO bms_vote_candidates(id,portfolio_id,name,class_name,gender,number,photo_id) VALUES($1,$2,$3,$4,'','',$5)",[candidateId,portfolio.id,candidate.name,candidate.className,photoId]);}
  imported.push(candidateId);
 }
 const {rows:[verified]}=await client.query('SELECT count(*)::integer count FROM bms_vote_candidates c JOIN bms_vote_photos p ON p.id=c.photo_id WHERE c.id=ANY($1::uuid[]) AND octet_length(p.data)>0',[imported]);
 if(verified.count!==25)throw Error('Candidate photo verification failed.');
 await client.query('INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES($1,$2,$3)',[administrator.id,'candidate-photo-import',JSON.stringify({source:'user supplied filenames',candidates:25,portfolios:10,active:false,classes:'not provided'})]);
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);
 console.log('Verified 25 candidates and photographs across 10 inactive portfolios. Existing demo voting preserved.');
}
