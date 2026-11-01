import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {hashStudentTemporary,hashParentTemporary} from './crypto';
import {birthPassword} from './enrolment';

export async function provisionStudent(c:PoolClient,input:{name:string;login:string;classId:string;dateOfBirth:string},password='0000'){
  const id=randomUUID(),parentId=randomUUID(),login=input.login.trim().toLowerCase();
  const parentDigest=await hashParentTemporary(birthPassword(input.dateOfBirth));
  const studentDigest=await hashStudentTemporary(password);
  const target=await c.query('SELECT id FROM bms_classes WHERE id=$1 AND NOT archived',[input.classId]);
  if(!target.rowCount)throw new Error('Select an active class');
  await c.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,$2,$3,'student',$4,true)",[id,input.name,login,studentDigest]);
  await c.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,$2,$3,'parent',$4,true)",[parentId,'Parent / guardian of '+input.name,'guardian:'+id,parentDigest]);
  await c.query('INSERT INTO bms_students(id,index_number,class_id,date_of_birth,guardian_user_id) VALUES($1,$2,$3,$4,$5)',[id,login,input.classId,input.dateOfBirth,parentId]);
  await c.query('INSERT INTO bms_parent_students(parent_id,student_id) VALUES($1,$2)',[parentId,id]);
  await c.query('INSERT INTO bms_enrolments(student_id,period_id,class_id) SELECT $1,id,$2 FROM bms_periods WHERE active',[id,input.classId]);
}
