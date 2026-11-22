import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
export async function assignBasic7Teachers(client){
 const marker='016_basic7_teacher_assignments_20261122';
 if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 const {rows:[admin]}=await client.query("SELECT id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1");if(!admin)throw Error('Administrator required for staff setup.');
 const classes=[];for(const name of ['Basic 7 A','Basic 7 B','Basic 7 C']){const {rows}=await client.query('SELECT id FROM bms_classes WHERE lower(btrim(name))=lower($1) AND NOT archived',[name]);if(rows.length!==1)throw Error('Exactly one active class is required: '+name);classes.push(rows[0]);}
 const entries=[{name:'Iddrisu Abdul Rahaman',login:'iddrisu.abdul.rahaman',subject:'Computing',aliases:['computing']},{name:'Fuseini Ayisha',login:'fuseini.ayisha',subject:'English',aliases:['english','english language']}];
 for(const entry of entries){
  const {rows:matches}=await client.query("SELECT id,login,disabled FROM bms_users WHERE role='teacher' AND lower(regexp_replace(btrim(name),'\\s+',' ','g'))=lower($1)",[entry.name]);if(matches.length>1)throw Error('Duplicate teacher requires review: '+entry.name);if(matches[0]?.disabled)throw Error('Teacher account is disabled: '+entry.name);
  const salt=randomBytes(16).toString('hex'),digest='scrypt:'+salt+':'+scryptSync('0000',salt,64).toString('hex');let id;
  if(matches.length){id=matches[0].id;await client.query('UPDATE bms_users SET password_hash=$1,must_change=true,failures=0,locked_until=NULL,version=version+1 WHERE id=$2',[digest,id]);await client.query('UPDATE bms_sessions SET revoked=true WHERE user_id=$1',[id]);}
  else{id=randomUUID();await client.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,$2,$3,'teacher',$4,true)",[id,entry.name,entry.login,digest]);}
  const {rows:subjects}=await client.query('SELECT id,archived FROM bms_subjects WHERE lower(btrim(name))=ANY($1::text[])',[entry.aliases]);if(subjects.length>1||subjects[0]?.archived)throw Error('Subject assignment requires review: '+entry.subject);let subjectId=subjects[0]?.id;if(!subjectId){subjectId=randomUUID();await client.query('INSERT INTO bms_subjects(id,name) VALUES($1,$2)',[subjectId,entry.subject]);}
  for(const cls of classes)await client.query('INSERT INTO bms_assignments(id,teacher_id,class_id,subject_id) VALUES($1,$2,$3,$4) ON CONFLICT(teacher_id,class_id,subject_id) DO NOTHING',[randomUUID(),id,cls.id,subjectId]);
  const verified=await client.query('SELECT id FROM bms_assignments WHERE teacher_id=$1 AND subject_id=$2 AND class_id=ANY($3::uuid[])',[id,subjectId,classes.map(c=>c.id)]);if(verified.rowCount!==3)throw Error('Teacher assignment verification failed.');
  await client.query('INSERT INTO bms_audit(actor_id,action,target) VALUES($1,$2,$3)',[admin.id,'basic7-teacher-assigned',id]);
 }
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);console.log('Verified Computing and English teacher assignments across Basic 7 A, B and C.');
}
