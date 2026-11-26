import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {applicationSchema,assertCapacity,classOpen,validTransition,parentRecord,spreadsheetSafe} from '../lib/admission-domain.ts';

test('admission validation requires consent, real birth dates and transfer details',()=>{
 const data={studentName:'Example Child',dateOfBirth:'2020-01-01',gender:'Female',nationality:'Ghanaian',region:'Northern',hometown:'Tamale',address:'Example address',guardianName:'Example Guardian',relationship:'Parent',phone:'0240000000',occupation:'Teacher',guardianAddress:'Example address',emergencyName:'Example Contact',emergencyPhone:'0240000001',neverAttended:true,declarationName:'Example Guardian',consent:true,privacy:true};
 assert.equal(applicationSchema.safeParse(data).success,true);
 assert.equal(applicationSchema.safeParse({...data,consent:false}).success,false);
 assert.equal(applicationSchema.safeParse({...data,dateOfBirth:'2025-02-30'}).success,false);
 assert.equal(applicationSchema.safeParse({...data,neverAttended:false}).success,false);
 assert.equal(applicationSchema.safeParse({...data,neverAttended:false,previousSchool:'Example',previousClass:'Nursery',previousYear:'2025/2026',previousLocation:'Tamale'}).success,true);
});
test('capacity reservations include offers and cannot be overbooked',()=>{assert.throws(()=>assertCapacity('review','offered',10,10));assert.doesNotThrow(()=>assertCapacity('offered','accepted',10,10));assert.doesNotThrow(()=>assertCapacity('accepted','enrolled',10,10));assert.doesNotThrow(()=>assertCapacity('review','waitlisted',10,10));assert.throws(()=>assertCapacity('waitlisted','offered',0,0));});
test('enrolment cannot bypass an accepted offer',()=>{assert.equal(validTransition('received','enrolled'),false);assert.equal(validTransition('offered','enrolled'),false);assert.equal(validTransition('accepted','enrolled'),true);assert.equal(validTransition('enrolled','review'),false);});
test('admission windows include both boundary dates and honour closure',()=>{assert.equal(classOpen({enabled:true,opens:'2026-11-01',closes:'2026-11-30'},'2026-11-30'),true);assert.equal(classOpen({enabled:true,closes:'2026-11-30'},'2026-12-01'),false);assert.equal(classOpen({enabled:false},'2026-11-01'),false);});
test('parent records exclude private remarks and exports neutralise spreadsheet formulas',()=>{assert.deepEqual(parentRecord({reference:'BMS-2027-0001',private_notes:'Staff only'}),{reference:'BMS-2027-0001'});assert.equal(spreadsheetSafe('=HYPERLINK("bad")'),'\'=HYPERLINK("bad")');assert.equal(spreadsheetSafe('Example'),'Example');});
test('PostgreSQL admission schema persists drafts, prevents duplicate references and protects private tables',async()=>{
 const db=new PGlite();try{
 await db.exec('CREATE TABLE bms_users(id uuid PRIMARY KEY);CREATE TABLE bms_students(id uuid PRIMARY KEY);');
 await db.exec(await readFile(new URL('../migrations/020_admissions.sql',import.meta.url),'utf8'));
 const classes=await db.query('SELECT id FROM bms_admission_classes');assert.equal(classes.rows.length,14);
 const id=randomUUID(),classId=(classes.rows[0] as {id:string}).id;
 await db.query('INSERT INTO bms_admissions(id,email,class_id,data) VALUES($1,$2,$3,$4)',[id,'parent@example.test',classId,JSON.stringify({studentName:'Test Child'})]);
 await db.query("UPDATE bms_admissions SET status='received',reference='BMS-2027-0001' WHERE id=$1",[id]);
 assert.equal((await db.query<{status:string}>('SELECT status FROM bms_admissions WHERE id=$1',[id])).rows[0].status,'received');
 await assert.rejects(()=>db.query("INSERT INTO bms_admissions(id,email,reference) VALUES($1,'another@example.test','BMS-2027-0001')",[randomUUID()]));
 await assert.rejects(()=>db.query("UPDATE bms_admissions SET status='invalid' WHERE id=$1",[id]));
 await db.exec('CREATE ROLE anonymous; SET ROLE anonymous');await assert.rejects(()=>db.query('SELECT * FROM bms_admissions'));await db.exec('RESET ROLE');
 const fid=randomUUID();await db.query("INSERT INTO bms_admission_files(id,application_id,kind,name,mime,content,size) VALUES($1,$2,'photograph','photo.jpg','image/jpeg',$3,3)",[fid,id,new Uint8Array([1,2,3])]);await db.query('DELETE FROM bms_admissions WHERE id=$1',[id]);assert.equal((await db.query('SELECT * FROM bms_admission_files')).rows.length,0);
 }finally{await db.close();}
});
