import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
export async function completeBasic7ParentAccess(client){
 const marker='018_basic7_birth_dates_parent_access';if((await client.query('SELECT name FROM bms_migrations WHERE name=$1',[marker])).rowCount)return;
 const {rows:[admin]}=await client.query("SELECT id FROM bms_users WHERE role='administrator' AND NOT disabled ORDER BY login LIMIT 1");if(!admin)throw Error('Administrator required.');
 for(const entry of [{index:'bms 001',name:'Mohammed Muslima',birth:'2000-01-01',password:'010100'},{index:'bms 002',name:'Musah Mariama',birth:'2000-01-02',password:'020100'}]){
  const {rows}=await client.query('SELECT s.id,s.guardian_user_id,u.name FROM bms_students s JOIN bms_users u ON u.id=s.id WHERE lower(s.index_number)=$1 FOR UPDATE OF s',[entry.index]);
  if(rows.length!==1||rows[0].name.trim().toLowerCase()!==entry.name.toLowerCase())throw Error('Student identity requires review: '+entry.index);
  const student=rows[0];let parentId=student.guardian_user_id;
  if(!parentId){parentId=randomUUID();const salt=randomBytes(16).toString('hex'),digest='scrypt:'+salt+':'+scryptSync(entry.password,salt,64).toString('hex');await client.query("INSERT INTO bms_users(id,name,login,role,password_hash,must_change) VALUES($1,$2,$3,'parent',$4,true)",[parentId,'Parent / guardian of '+entry.name,'guardian:'+student.id,digest]);}
  await client.query('UPDATE bms_students SET date_of_birth=$1,guardian_user_id=$2 WHERE id=$3',[entry.birth,parentId,student.id]);
  await client.query('INSERT INTO bms_parent_students(parent_id,student_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[parentId,student.id]);
  await client.query('INSERT INTO bms_audit(actor_id,action,target) VALUES($1,$2,$3)',[admin.id,'student-birth-date-parent-access-updated',student.id]);
 }
 await client.query('INSERT INTO bms_migrations(name) VALUES($1)',[marker]);console.log('Requested student birth dates saved and parent access linked. Existing account passwords preserved.');
}
