import {addOrganisingCandidate} from './add-organising-candidate.mjs';
import {importElectionCandidates} from './import-election-candidates.mjs';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import pg from 'pg';
// Preview builds must never migrate or bootstrap a production database.
if(process.env.VERCEL_ENV!=='production'){
 console.log('Database setup skipped outside Vercel Production.');
}else{
 process.env.DATABASE_URL ||= process.env.POSTGRES_URL;
 if(!process.env.DATABASE_URL)throw Error('Connect Neon to this project’s Production environment before deploying. DATABASE_URL is missing.');
 await import('./migrate.mjs');
 const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
 await client.connect();
 try{
  await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(76233511)');
  await client.query('INSERT INTO bms_auth_secrets(name,value) VALUES($1,$2) ON CONFLICT(name) DO NOTHING',['session_signing',randomBytes(48).toString('base64url')]);
  const {rowCount}=await client.query("SELECT id FROM bms_users WHERE role='administrator'");
  if(!rowCount){const password=process.env.BOOTSTRAP_ADMIN_PASSWORD||'administrator';if(password.length<12||password.length>128)throw Error('Bootstrap administrator password must be 12–128 characters.');const salt=randomBytes(16).toString('hex');const hash='scrypt:'+salt+':'+scryptSync(password,salt,64).toString('hex');await client.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,'School Administrator','administrator','administrator',$2,true)",[randomUUID(),hash]);console.log('Initial administrator created; private password change required.');}
  // Explicit user-requested recovery, applied once; later deployments never reset the password again.
  const resetMarker='010_admin_password_reset_20261119';
  if(!(await client.query('SELECT name FROM bms_migrations WHERE name=$1',[resetMarker])).rowCount){
   const salt=randomBytes(16).toString('hex');const digest='scrypt:'+salt+':'+scryptSync('administrator',salt,64).toString('hex');
   const {rows}=await client.query("UPDATE bms_users SET password_hash=$1,must_change=true,failures=0,locked_until=NULL,version=version+1 WHERE login='administrator' AND role='administrator' AND NOT disabled RETURNING id",[digest]);
   if(rows.length!==1)throw Error('Administrator recovery requires exactly one active administrator login.');
   await client.query('UPDATE bms_sessions SET revoked=true WHERE user_id=$1',[rows[0].id]);
   await client.query('INSERT INTO bms_audit(actor_id,action,target) VALUES($1,$2,$3)',[rows[0].id,'administrator-password-reset',rows[0].id]);
   await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[resetMarker]);
   console.log('Requested administrator recovery applied; private password change required.');
  }
  await importElectionCandidates(client);
  await addOrganisingCandidate(client);
  await client.query('COMMIT');console.log('School and election database setup complete. Existing accounts and records preserved.');
 }catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}
}
