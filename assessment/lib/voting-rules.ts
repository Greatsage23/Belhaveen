export type Choice={portfolioId:string;candidateId:string};
export function validateBallot(choices:Choice[],portfolios:{id:string}[],candidates:{id:string;portfolio_id:string}[]){
 if(!portfolios.length||choices.length!==portfolios.length||new Set(choices.map(c=>c.portfolioId)).size!==portfolios.length)throw Error('Select one candidate for every portfolio.');
 for(const p of portfolios){const choice=choices.find(c=>c.portfolioId===p.id);if(!choice||!candidates.some(c=>c.id===choice.candidateId&&c.portfolio_id===p.id))throw Error('Select a valid candidate for every portfolio.');}
}
export function nextStatus(status:string,action:string){const transitions:Record<string,Record<string,string>>={draft:{start:'open'},open:{pause:'paused',close:'closed'},paused:{resume:'open',close:'closed'}};const next=transitions[status]?.[action];if(!next)throw Error('This election control is not available in the current state.');return next;}
export function resultRows(candidates:{id:string;votes:number|string}[]){const total=candidates.reduce((n,c)=>n+Number(c.votes),0);return [...candidates].sort((a,b)=>Number(b.votes)-Number(a.votes)).map(c=>({...c,votes:Number(c.votes),total,percentage:total?Number(c.votes)/total*100:0,rank:1+candidates.filter(x=>Number(x.votes)>Number(c.votes)).length}));}
