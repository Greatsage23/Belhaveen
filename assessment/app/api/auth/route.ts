import {randomUUID} from 'node:crypto';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {query,audit,transaction} from '../../../lib/db';
import {actor,session,origin,limit,logout} from '../../../lib/auth';
import {hash,verify,constant} from '../../../lib/crypto';
export const runtime='nodejs';
export async function GET(){try{const user=await actor(true);return Response.json({user});}catch{return Response.json({user:null,configured:!!process.env.DATABASE_URL&&!!process.env.SESSION_SECRET});}}
export async function POST(request:Request){try{origin(request);const p=await request.json();
 if(p.action==='logout'){await logout();return Response.json({ok:true});}
 if(p.action==='password'){const a=await actor(true);const password=z.string().min(12).max(128).parse(p.password);const [u]=await query('SELECT password_hash FROM bms_users WHERE id=$1',[a.id]);if(!await verify(String(p.current??''),u.password_hash))throw new Error('Current password is incorrect');const digest=await hash(password);await query('UPDATE bms_users SET password_hash=$1,must_change=false,version=version+1 WHERE id=$2',[digest,a.id]);await session({...a,version:a.version+1,must_change:false});await audit(a.id,'password-change',a.id);return Response.json({ok:true});}
 if(p.action==='override'){const a=await actor();if(a.role!=='administrator')throw new Error('Access denied');await limit(request,a.id);if(!process.env.STUDENT_OVERRIDE_SECRET||!constant(String(p.secret??''),process.env.STUDENT_OVERRIDE_SECRET))throw new Error('Invalid override secret');const id=z.uuid().parse(p.studentId);const [student]=await query('SELECT s.id,s.class_id,s.index_number,u.name,c.name AS class_name FROM bms_students s JOIN bms_users u ON u.id=s.id JOIN bms_classes c ON c.id=s.class_id WHERE s.id=$1',[id]);if(!student)throw new Error('Student not found');await audit(a.id,'student-dashboard-override',id);const results=await query('SELECT r.class_score,r.exam_score,s.name AS subject,p.year,p.term FROM bms_scores r JOIN bms_subjects s ON s.id=r.subject_id JOIN bms_periods p ON p.id=r.period_id WHERE r.student_id=$1 AND r.published ORDER BY p.year DESC,p.term,s.name',[id]);const materials=await query("SELECT title,kind,content FROM bms_documents WHERE status='approved' AND kind IN ('material','assignment','announcement','calendar') AND (class_id IS NULL OR class_id=$1) ORDER BY updated_at DESC",[student.class_id]);return Response.json({ok:true,student,results,materials});}
 const requestedRole=z.enum(['administrator','headteacher','teacher','student']).parse(p.role);const login=z.string().min(1).max(150).parse(p.login).trim().toLowerCase();await limit(request,login);
 const rows=await query('SELECT * FROM bms_users WHERE login=$1 AND NOT disabled',[login]);const user=rows[0];
 if(!user){await verify(String(p.password??''),'scrypt:00000000000000000000000000000000:'+ '00'.repeat(64));throw new Error('Invalid login details');}
 if(user.locked_until&&new Date(user.locked_until)>new Date())throw new Error('Account temporarily locked. Try again later.');
 let valid=false;
 if(user.role==='teacher'){const [setting]=await query("SELECT value FROM bms_settings WHERE key='teacher_password_enabled'");if(setting?.value===false){const assignment=z.uuid().parse(p.assignmentId);valid=(await query('SELECT id FROM bms_assignments WHERE id=$1 AND teacher_id=$2',[assignment,user.id])).length>0;}}
 if(!valid)valid=await verify(String(p.password??''),user.password_hash);
 if(user.role==='student'){const classId=z.uuid().parse(p.classId);valid=valid&&(await query('SELECT id FROM bms_students WHERE id=$1 AND class_id=$2',[user.id,classId])).length>0;}
 valid=valid&&user.role===requestedRole;
 if(!valid){await query("UPDATE bms_users SET failures=failures+1,locked_until=CASE WHEN failures+1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE id=$1",[user.id]);await audit(user.id,'failed-login',user.id);throw new Error('Invalid login details');}
 await query('UPDATE bms_users SET failures=0,locked_until=NULL WHERE id=$1',[user.id]);await session(user);await audit(user.id,'login',user.id);return Response.json({ok:true});
 }catch(e){return Response.json({error:e instanceof z.ZodError?'Check the login fields.':e instanceof Error?e.message:'Unable to sign in'},{status:400});}}
