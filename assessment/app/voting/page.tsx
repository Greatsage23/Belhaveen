'use client';
import {useEffect,useRef,useState} from 'react';
import Admin from './admin';
import {VotingData,request,photo} from './shared';
import './voting.css';
export default function Voting(){
 const [view,setView]=useState('home'),[data,setData]=useState<VotingData|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[choices,setChoices]=useState<Record<string,string>>({}),[code,setCode]=useState('');
 const pending=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 async function load(){try{const r=await fetch('/api/voting',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setData(d);}catch(e){setMessage(e instanceof Error?e.message:'Unable to load election.');}}
 useEffect(()=>{load();const url=new URL(location.href);if(url.searchParams.get('admin')==='1')setView('admin');return()=>{if(timer.current)clearTimeout(timer.current);};},[]);
 useEffect(()=>{if(view==='vote')load();},[view]);
 async function submit(){
  if(!data||pending.current)return;
  if(Object.keys(choices).length!==data.portfolios.length){setMessage('Please select one candidate for every portfolio.');return;}
  if(!confirm('Confirm your ballot:\n\n'+data.portfolios.map(p=>p.name+': '+data.candidates.find(c=>c.id===choices[p.id])?.name).join('\n')+'\n\nSubmit these selections?'))return;
  pending.current=true;setBusy(true);setMessage('');
  const storageKey='belhaveen-pending-ballot';
  try{
   const payload={action:'ballot',mode:data.settings.mode,generation:data.run.generation,revision:data.settings.revision,choices:Object.entries(choices).map(([portfolioId,candidateId])=>({portfolioId,candidateId})).sort((a,b)=>a.portfolioId.localeCompare(b.portfolioId)),code};
   // Persist only an opaque id and fingerprint: never persist a student's choices.
   const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const previous=JSON.parse(sessionStorage.getItem(storageKey)??'null');
   const id=previous?.fingerprint===fingerprint?previous.id:crypto.randomUUID();
   sessionStorage.setItem(storageKey,JSON.stringify({id,fingerprint}));
   await request({...payload,id});sessionStorage.removeItem(storageKey);setSuccess(true);setChoices({});setCode('');
   timer.current=setTimeout(()=>{setSuccess(false);load();},3000);
  }catch(e){setMessage(e instanceof Error?e.message:'Submission interrupted. Retry the same selections.');}finally{pending.current=false;setBusy(false);}
 }
 return <main className="voting"><header className="vote-header"><a href="/">← School website</a><button className="text-button" onClick={()=>{setView('home');setChoices({});setCode('');setMessage('');}}>Election home</button></header><section className="vote-hero"><img src="https://belhaveen.vercel.app/assets/logo.png" width="88" height="88" alt="Belhaveen Montessori School crest"/><p className="kicker">BELHAVEEN MONTESSORI SCHOOL</p><h1>STUDENT LEADERSHIP<br/>ELECTIONS</h1><p>Your voice helps shape our school.</p>{view==='home'&&<div className="entry-buttons"><button onClick={()=>{setMessage('');setView('vote');}}>VOTE NOW <span>Choose your student leaders →</span></button><button className="outline" onClick={()=>{setMessage('');setView('admin');}}>ADMINISTRATOR <span>Manage elections and view results →</span></button></div>}</section>
 {view==='admin'?<Admin/>:<>{data&&<div className={'mode-banner '+data.settings.mode}>{data.settings.mode==='demo'?'DEMO MODE · Practice votes only':'REAL MODE · Official election'} <span>{data.run.status.toUpperCase()}</span></div>}{message&&<p role="alert" className="vote-notice">{message}</p>}{view==='home'&&<section className="vote-panel"><h2>Every voice matters.</h2><p>Select one candidate for each portfolio, review your choices and submit your ballot. Voting is anonymous and supervised by the school.</p></section>}{view==='vote'&&(success?<section className="vote-panel success" role="status"><h2>✓ Your vote has been successfully recorded. Thank you for voting!</h2><p>Preparing a fresh ballot for the next student…</p></section>:data?.run.status==='open'?<><section className="vote-progress"><strong>{Object.keys(choices).length} of {data.portfolios.length} portfolios completed</strong><progress aria-label="Ballot completion" value={Object.keys(choices).length} max={data.portfolios.length}/></section>{data.portfolios.map((p,i)=><section className="vote-panel" key={p.id}><p className="kicker">PORTFOLIO {i+1}</p><h2>{p.name}</h2><p>{p.description}</p><div className="candidate-grid" role="radiogroup" aria-label={p.name}>{data.candidates.filter(c=>c.portfolio_id===p.id).map(c=><article className={'candidate '+(choices[p.id]===c.id?'selected':'')} key={c.id}><img src={photo(c.photo_id)} alt={c.name}/><div><h3>{c.name}</h3><p>{c.class_name}{c.number?' · No. '+c.number:''}</p><button role="radio" aria-checked={choices[p.id]===c.id} aria-label={'Vote for '+c.name} disabled={busy} onClick={()=>setChoices({...choices,[p.id]:c.id})}>{choices[p.id]===c.id?'✓ SELECTED':'YES'}</button></div></article>)}</div></section>)}<section className="vote-panel">{data.settings.codes_required&&<label>Single-use voting code<input autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} /></label>}<p>Review your choices before submitting. Your ballot cannot be changed once recorded.</p><button className="submit-vote" disabled={busy||Object.keys(choices).length!==data.portfolios.length||!data.portfolios.length||(data.settings.codes_required&&!code.trim())} onClick={submit}>{busy?'Recording your ballot…':'SUBMIT VOTE'}</button></section></>:<section className="vote-panel"><h2>Voting is not open</h2><p>{data?.run.status==='paused'?'Voting has been paused. Please wait for the election supervisor.':'The school will announce when voting begins.'}</p><button onClick={load}>Check again</button></section>)}</>}
 <footer className="vote-footer">Belhaveen Montessori School · Student Leadership Elections</footer></main>;
}
