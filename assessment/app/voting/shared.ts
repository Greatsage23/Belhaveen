export type Portfolio={id:string;name:string;description:string;position:number;active:boolean};
export type Candidate={id:string;portfolio_id:string;name:string;class_name:string;gender:string;number:string;photo_id:string};
export type Run={mode:string;status:string;generation:number;started_at:string|null;closed_at:string|null};
export type VotingData={settings:{title:string;mode:string;codes_required:boolean;revision:number};run:Run; runs:Run[];portfolios:Portfolio[];candidates:Candidate[];results:{id:string;mode:string;votes:number}[];totals:{mode:string;ballots:number}[];audit:{action:string;detail:object;created_at:string}[]};
export async function request(payload:object){const r=await fetch('/api/voting',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error);return d;}
export const photo=(id:string)=>'/api/voting/photos?id='+encodeURIComponent(id);
