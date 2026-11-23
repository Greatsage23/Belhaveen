import {randomBytes,randomUUID,scryptSync} from 'node:crypto';

// Explicit school request, applied once inside the deployment transaction.
export async function activateAssessmentEntry(client){
 const marker='019_assessment_term_and_student_passwords_20261123';
 if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 await client.query('LOCK TABLE bms_periods IN EXCLUSIVE MODE');
 await client.query('UPDATE bms_periods SET active=false');
 const {rows:[period]}=await client.query('INSERT INTO bms_periods(id,year,term,active) VALUES($1,$2,$3,true) ON CONFLICT(year,term) DO UPDATE SET active=true RETURNING id',[randomUUID(),'2026/2027','Term 1']);
 await client.query('INSERT INTO bms_enrolments(student_id,period_id,class_id) SELECT id,$1,class_id FROM bms_students WHERE class_id IS NOT NULL ON CONFLICT(student_id,period_id) DO NOTHING',[period.id]);
 const {rows:students}=await client.query("SELECT id FROM bms_users WHERE role='student' FOR UPDATE");
 for(const student of students){
  const salt=randomBytes(16).toString('hex');
  const digest='scrypt:'+salt+':'+scryptSync('0000',salt,64).toString('hex');
  await client.query('UPDATE bms_users SET password_hash=$1,must_change=false,failures=0,locked_until=NULL,version=version+1 WHERE id=$2',[digest,student.id]);
  await client.query('UPDATE bms_sessions SET revoked=true WHERE user_id=$1',[student.id]);
  await client.query('INSERT INTO bms_audit(action,target) VALUES($1,$2)',['student-temporary-password-reset',student.id]);
 }
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);
 console.log('Requested academic period activated and temporary student passwords applied.');
}
