import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function addOrganisingCandidate(client){
 const marker='014_add_sualihu_sulemana_shahida';
 if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 const root=new URL('../seed/election-2026/',import.meta.url);
 const candidate=JSON.parse(await readFile(new URL('additional-candidate.json',root),'utf8'));
 const {rows:[settings]}=await client.query('SELECT mode FROM bms_vote_settings WHERE id=1 FOR UPDATE');
 if(settings.mode!=='demo'||(await client.query("SELECT 1 FROM bms_vote_runs WHERE mode='real' AND started_at IS NOT NULL")).rowCount||(await client.query("SELECT 1 FROM bms_vote_ballots WHERE mode='real' LIMIT 1")).rowCount)throw Error('Candidate addition requires review because real voting has started.');
 const {rows:portfolios}=await client.query('SELECT id FROM bms_vote_portfolios WHERE lower(btrim(name))=lower($1)',[candidate.portfolio]);
 if(portfolios.length!==1)throw Error('Exactly one Organization Prefect portfolio is required.');
 const {rows:matches}=await client.query('SELECT id FROM bms_vote_candidates WHERE portfolio_id=$1 AND lower(btrim(name))=lower($2)',[portfolios[0].id,candidate.name]);
 if(matches.length>1)throw Error('Duplicate nominee requires review.');
 const bytes=await readFile(new URL('photos/'+candidate.photo,root));
 if(bytes.length>1048576||createHash('sha256').update(bytes).digest('hex')!==candidate.photoSha256)throw Error('Candidate photograph verification failed.');
 await client.query("INSERT INTO bms_vote_photos(id,mime,data) VALUES($1,'image/webp',$2)",[candidate.photoId,bytes]);
 if(matches.length)await client.query('UPDATE bms_vote_candidates SET photo_id=$1 WHERE id=$2',[candidate.photoId,matches[0].id]);
 else await client.query("INSERT INTO bms_vote_candidates(id,portfolio_id,name,class_name,gender,number,photo_id) VALUES($1,$2,$3,'','','',$4)",[candidate.id,portfolios[0].id,candidate.name,candidate.photoId]);
 await client.query('UPDATE bms_vote_settings SET revision=revision+1 WHERE id=1');
 const {rows:[administrator]}=await client.query("SELECT id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1");
 if(!administrator)throw Error('An active administrator is required.');
 await client.query('INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES($1,$2,$3)',[administrator.id,'candidate-added',JSON.stringify({source:'authorised deployment',name:candidate.name,portfolio:candidate.portfolio,mode:'demo',existingDemoVotesPreserved:true})]);
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);
 console.log('Added Sualihu Sulemana Shahida to Organization Prefect. Existing votes preserved.');
}
