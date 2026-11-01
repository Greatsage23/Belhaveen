'use client';
import {useState, type FormEvent} from 'react';
import {total, grade} from '../../lib/domain';

export default function StudentPreview({students}:{students:Record<string,any>[]}) {
  const [preview,setPreview]=useState<any>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function open(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget;
    setBusy(true);setError('');setPreview(null);
    try {
      const fields=Object.fromEntries(new FormData(form));
      const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,action:'override'})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error);
      setPreview(data);form.reset();
    } catch(e){setError((e as Error).message)} finally {setBusy(false)}
  }
  return <section className="panel"><h2>Student dashboard preview</h2><p>View published student information with the administrator override secret. Each access is recorded in the activity log.</p><form className="form-grid" onSubmit={open}><label>Student<select name="studentId" required><option value="">Choose student</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.index_number}</option>)}</select></label><label>Override secret<input name="secret" type="password" autoComplete="off" required/></label><button disabled={busy||!students.length}>{busy?'Opening…':'Open student preview'}</button></form>{error&&<p role="alert">{error}</p>}{preview&&<div><div className="list-row"><h3>{preview.student.name} · {preview.student.class_name}</h3><button className="secondary" onClick={()=>setPreview(null)}>Close preview</button></div><p>Index number: {preview.student.index_number}</p><h3>Published results</h3>{preview.results.length?<div className="table-scroll"><table><thead><tr><th>Period</th><th>Subject</th><th>Total /100</th><th>Grade</th></tr></thead><tbody>{preview.results.map((r:any,i:number)=><tr key={i}><td>{r.year} · {r.term}</td><td>{r.subject}</td><td>{total(r.class_score,r.exam_score)??'Incomplete'}</td><td>{grade(total(r.class_score,r.exam_score))}</td></tr>)}</tbody></table></div>:<p>No published results yet.</p>}<h3>Learning materials, assignments and notices</h3>{preview.materials.length?preview.materials.map((d:any,i:number)=><article key={i}><h4>{d.title}</h4><p>{typeof d.content.body==='string'?d.content.body:''}</p></article>):<p>No approved materials yet.</p>}</div>}</section>;
}
