'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {VotingData,photo} from './shared';
import {resultRows} from '../../lib/voting-rules';
export default function ResultsWall({data,updated,error,onBack,onReports}:{data:VotingData;updated:string;error:string;onBack:()=>void;onReports:()=>void}){
 const root=useRef<HTMLElement>(null),[ready,setReady]=useState(false),[width,setWidth]=useState(1200);
 useEffect(()=>{setReady(true);const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[]);
 useEffect(()=>{if(!ready||!root.current)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(root.current);return()=>observer.disconnect();},[ready]);
 const mode=data.settings.mode,run=data.runs.find(r=>r.mode===mode),ballots=data.totals.find(t=>t.mode===mode)?.ballots??0;
 const columns=width>=900?4:width>=760?3:width>=480?2:1;
 if(!ready)return null;
 return createPortal(<section ref={root} className="results-wall" aria-label="All candidate live results"><header className="wall-toolbar"><div><p>BELHAVEEN MONTESSORI SCHOOL</p><h1>Live election results</h1></div><div className="wall-controls"><button onClick={async()=>{if(document.fullscreenElement)await document.exitFullscreen();onBack();}}>← Dashboard</button><button onClick={async()=>{if(document.fullscreenElement)await document.exitFullscreen();onReports();}}>Reports</button><button onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else root.current?.requestFullscreen?.().catch(()=>{});}}>Full screen</button></div></header><div className="wall-status"><strong>{mode.toUpperCase()} · {run?.status.toUpperCase()}</strong><span>{ballots} completed ballots · {data.portfolios.length} portfolios · {data.candidates.length} candidates</span><span>{error||'Updated '+updated+' · Refreshes automatically'}</span></div><div className="wall-grid" style={{'--wall-columns':columns,'--wall-rows':Math.ceil(data.portfolios.length/columns)} as React.CSSProperties}>{data.portfolios.map(p=>{
 const candidates=data.candidates.filter(c=>c.portfolio_id===p.id);const rows=resultRows(candidates.map(c=>({id:c.id,votes:data.results.find(r=>r.id===c.id&&r.mode===mode)?.votes??0})));const ties=rows.filter(r=>r.rank===1).length;
 return <article className="wall-portfolio" key={p.id}><header><h2>{p.name}</h2><span>{rows[0]?.total??0} votes{!p.active?' · Inactive':''}</span></header><div className="wall-candidate-list">{rows.map(r=>{const c=candidates.find(c=>c.id===r.id)!;return <div className={'wall-candidate '+(r.total&&r.rank===1?'wall-leading':'')} key={r.id}><img src={photo(c.photo_id)} alt=""/><div className="wall-name"><strong>{c.name}</strong><span>{r.total&&r.rank===1?(ties>1?'Tied':run?.status==='closed'?'Winner':'Leading'):'Rank '+r.rank}</span></div><div className="wall-count"><strong>{r.votes}</strong><span>{r.percentage.toFixed(2)}%</span></div><div className="wall-vote-bar" style={{width:r.percentage+'%'}}/></div>;})}{!rows.length&&<p>No candidates registered</p>}</div></article>;
 })}</div><footer className="wall-footer">All candidates shown together. On small phones, turn the device sideways for a wider view.</footer></section>,document.body);
}
