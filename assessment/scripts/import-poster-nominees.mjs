import {readFile} from 'node:fs/promises';import {createHash,randomUUID} from 'node:crypto';
export async function importPosterNominees(client){
 const marker='015_library_canteen_poster_nominees';if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 const root=new URL('../seed/poster-nominees/',import.meta.url);const candidates=JSON.parse(await readFile(new URL('candidates.json',root),'utf8'));
 if(candidates.length!==5)throw Error('Five poster candidates are required.');
 const {rows:[settings]}=await client.query('SELECT mode FROM bms_vote_settings WHERE id=1 FOR UPDATE');
 if(settings.mode!=='demo'||(await client.query("SELECT 1 FROM bms_vote_runs WHERE mode='real' AND started_at IS NOT NULL")).rowCount||(await client.query("SELECT 1 FROM bms_vote_ballots WHERE mode='real' LIMIT 1")).rowCount)throw Error('Poster nominations require review: real voting has started.');
 for(const [position,name] of [[11,'Library Prefect'],[12,'Canteen Prefect']]){
  const {rows:existing}=await client.query('SELECT id FROM bms_vote_portfolios WHERE lower(btrim(name))=lower($1)',[name]);
  if(existing.length>1)throw Error('Duplicate portfolio requires review: '+name);
  const portfolioId=existing[0]?.id??randomUUID();if(!existing.length)await client.query("INSERT INTO bms_vote_portfolios(id,name,description,position,active) VALUES($1,$2,'',$3,true)",[portfolioId,name,position]);else await client.query('UPDATE bms_vote_portfolios SET active=true WHERE id=$1',[portfolioId]);
  for(const c of candidates.filter(c=>c.portfolio===name)){
   const bytes=await readFile(new URL('photos/'+c.photo,root));if(bytes.length>1048576||createHash('sha256').update(bytes).digest('hex')!==c.photoSha256)throw Error('Photo validation failed: '+c.name);
   const {rows:matches}=await client.query('SELECT id FROM bms_vote_candidates WHERE portfolio_id=$1 AND lower(btrim(name))=lower($2)',[portfolioId,c.name]);if(matches.length>1)throw Error('Duplicate candidate requires review.');
   await client.query("INSERT INTO bms_vote_photos(id,mime,data) VALUES($1,'image/webp',$2)",[c.photoId,bytes]);
   if(matches.length)await client.query('UPDATE bms_vote_candidates SET photo_id=$1 WHERE id=$2',[c.photoId,matches[0].id]);else await client.query("INSERT INTO bms_vote_candidates(id,portfolio_id,name,class_name,gender,number,photo_id) VALUES($1,$2,$3,'','','',$4)",[c.id,portfolioId,c.name,c.photoId]);
  }
 }
 await client.query('UPDATE bms_vote_settings SET revision=revision+1 WHERE id=1');
 const {rows:[admin]}=await client.query("SELECT id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1");if(!admin)throw Error('An administrator is required.');
 await client.query('INSERT INTO bms_vote_audit(actor_id,action,detail) VALUES($1,$2,$3)',[admin.id,'poster-candidates-added',JSON.stringify({portfolios:['Library Prefect','Canteen Prefect'],candidates:5,source:'user supplied poster',existingDemoVotesPreserved:true})]);
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);console.log('Imported and activated five Library and Canteen Prefect nominees; existing votes preserved.');
}
