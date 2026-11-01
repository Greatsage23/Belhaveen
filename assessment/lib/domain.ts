export const SCHOOL = { name: 'Belhaven Montessori School', location: 'Gurugu / Jisonayilli, Tamale', motto: 'Think, Dream, Believe and Achieve', phone: '024 491 9825', email: 'alameen9825@gmail.com' };
export const LEGACY_LIMITS = [10,10,10,10,5,5,5,5,5,10,10,20];
export const LIMITS = [10,10,10,10,10,10,5,5,5,5,5,10,10,20];
export function limitsFor(version:number){if(version===1)return LEGACY_LIMITS;if(version===2)return LIMITS;throw new Error('Unknown assessment scheme');}
export function continuous(scores: (number|null)[],version=2) { const limits=limitsFor(version);if(scores.length!==limits.length || scores.some((s,i)=>s!==null&&(!Number.isFinite(s)||s<0||s>limits[i]))) throw new Error('Invalid exercise scores'); return scores.some(s=>s===null)?null:Math.round(scores.reduce<number>((a,b)=>a+(b??0),0)/limits.reduce((a,b)=>a+b,0)*30*100)/100; }
export function exam(raw:number|null){if(raw===null)return null;if(!Number.isFinite(raw)||raw<0||raw>100)throw new Error('Examination score must be between 0 and 100');return Math.round(raw*.7*100)/100;}
export function grade(total:number|null){if(total===null)return 'Incomplete';return total>=80?'A':total>=70?'B':total>=60?'C':total>=50?'D':total>=40?'E':'F';}
export function total(a:number|null,b:number|null){return a===null||b===null?null:Math.round((Number(a)+Number(b))*100)/100;}
export function years(){const y=new Date().getFullYear();return Array.from({length:11},(_,i)=>`${y+i}/${y+i+1}`);}
export type Role='administrator'|'headteacher'|'teacher'|'student'|'parent';
export type Actor={id:string;name:string;role:Role;must_change:boolean;version:number;sessionId?:string};
export function manager(a:Actor){return ['administrator','headteacher'].includes(a.role);}
