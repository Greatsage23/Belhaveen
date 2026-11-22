import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
export async function addBasic7Students(client){
 const marker='017_basic7_student_enrolment_20261122';if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 const {rows:[admin]}=await client.query("SELECT id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1");if(!admin)throw Error('Administrator required for enrolment.');
 for(const student of [{name:'Mohammed Muslima',index:'bms 001',className:'Basic 7 A'},{name:'Musah Mariama',index:'bms 002',className:'Basic 7 B'}]){
  const {rows:classes}=await client.query('SELECT id FROM bms_classes WHERE lower(btrim(name))=lower($1) AND NOT archived',[student.className]);if(classes.length!==1)throw Error('Active class required: '+student.className);const classId=classes[0].id;
  const {rows:matches}=await client.query("SELECT u.id,u.name,u.login,u.disabled,s.index_number FROM bms_users u JOIN bms_students s ON s.id=u.id WHERE lower(btrim(u.name))=lower($1) OR lower(btrim(s.index_number))=lower($2)",[student.name,student.index]);
  if(matches.length>1)throw Error('Duplicate student records require review: '+student.name);
  let id;
  if(matches.length){const existing=matches[0];if(existing.disabled||existing.name.trim().toLowerCase()!==student.name.toLowerCase()||existing.index_number.trim().toLowerCase()!==student.index)throw Error('Existing student details require review: '+student.name);id=existing.id;await client.query('UPDATE bms_students SET class_id=$1 WHERE id=$2',[classId,id]);}
  else{const salt=randomBytes(16).toString('hex'),digest='scrypt:'+salt+':'+scryptSync('0000',salt,64).toString('hex');id=randomUUID();await client.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,$2,$3,'student',$4,true)",[id,student.name,student.index,digest]);await client.query('INSERT INTO bms_students(id,index_number,class_id) VALUES($1,$2,$3)',[id,student.index,classId]);}
  await client.query('INSERT INTO bms_enrolments(student_id,period_id,class_id) SELECT $1,id,$2 FROM bms_periods WHERE active ON CONFLICT(student_id,period_id) DO UPDATE SET class_id=EXCLUDED.class_id',[id,classId]);
  await client.query('INSERT INTO bms_audit(actor_id,action,target) VALUES($1,$2,$3)',[admin.id,'basic7-student-enrolled',id]);
 }
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);console.log('Enrolled the two requested Basic 7 students. Birth dates and parent access remain unset when not supplied.');
}
