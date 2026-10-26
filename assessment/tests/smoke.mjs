import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=4191;
const env={...process.env,DATABASE_URL:'',SESSION_SECRET:'',APP_ORIGIN:`http://127.0.0.1:${port}`};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
try {
  for(let i=0;i<60;i++) {if(output.includes('Ready in'))break;if(server.exitCode!==null)throw new Error(output);await new Promise(r=>setTimeout(r,500));}
  for(const path of ['/','/portal']){const r=await fetch(env.APP_ORIGIN+path);assert.equal(r.status,200);assert.equal(r.headers.get('x-frame-options'),'DENY');console.log('PASS page and security headers',path);}
  const auth=await fetch(env.APP_ORIGIN+'/api/auth').then(r=>r.json());assert.equal(auth.user,null);assert.equal(auth.configured,false);console.log('PASS unconfigured login state');
  for(const path of ['/api/data?type=students','/api/files?id=invalid','/api/export?studentId=invalid']){const r=await fetch(env.APP_ORIGIN+path);assert.equal(r.status,403);console.log('PASS anonymous request denied',path);}
  const mutation=await fetch(env.APP_ORIGIN+'/api/data',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://invalid.example'},body:JSON.stringify({action:'period'})});assert.equal(mutation.status,400);assert.match((await mutation.json()).error,/origin/);console.log('PASS cross-origin mutation denied');
} finally {server.kill();}
