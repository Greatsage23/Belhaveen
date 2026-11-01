import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {actor,origin} from '../../../lib/auth';
import {query,transaction,audit} from '../../../lib/db';
import {hash} from '../../../lib/crypto';
import {manager} from '../../../lib/domain';

export async function GET(){try{
  const a=await actor();if(a.role!=='parent')throw new Error('Access denied');
  const children=await query('SELECT s.id,s.index_number,u.name,c.name AS class_name FROM bms_parent_students p JOIN bms_students s ON s.id=p.student_id JOIN bms_users u ON u.id=s.id JOIN bms_classes c ON c.id=s.class_id WHERE p.parent_id=$1 ORDER BY u.name',[a.id]);
  const results=await query('SELECT r.student_id,r.period_id,r.class_score,r.exam_score,s.name AS subject,p.year,p.term FROM bms_scores r JOIN bms_parent_students link ON link.student_id=r.student_id JOIN bms_subjects s ON s.id=r.subject_id JOIN bms_periods p ON p.id=r.period_id WHERE link.parent_id=$1 AND r.published ORDER BY p.year DESC,p.term,s.name',[a.id]);
  const materials=await query("SELECT DISTINCT d.id,d.title,d.kind,d.content FROM bms_documents d WHERE d.status='approved' AND d.kind IN ('material','assignment','announcement','calendar') AND EXISTS(SELECT 1 FROM bms_parent_students p JOIN bms_students s ON s.id=p.student_id WHERE p.parent_id=$1 AND (d.class_id IS NULL OR d.class_id=s.class_id)) ORDER BY d.title",[a.id]);
  return Response.json({children,results,materials});
}catch{return Response.json({error:'Parent access is required.'},{status:403});}}

export async function POST(request:Request){try{
  origin(request);const a=await actor();if(!manager(a))return Response.json({error:'Access denied'},{status:403});
  const input=z.object({name:z.string().trim().min(1).max(250),login:z.string().trim().min(1).max(150),password:z.string().min(12).max(128),studentIds:z.array(z.uuid()).min(1).max(30)}).parse(await request.json());
  const id=randomUUID(),digest=await hash(input.password);
  await transaction(async c=>{
    await c.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,$2,$3,'parent',$4,true)",[id,input.name,input.login.toLowerCase(),digest]);
    for(const studentId of new Set(input.studentIds))await c.query('INSERT INTO bms_parent_students(parent_id,student_id) VALUES($1,$2)',[id,studentId]);
  });await audit(a.id,'create-parent',id);return Response.json({ok:true});
}catch{return Response.json({error:'Unable to create parent account. Check required fields, unique login and selected children.'},{status:400});}}
