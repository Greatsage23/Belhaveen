export function birthPassword(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Enter date of birth as YYYY-MM-DD');
  const date=new Date(value+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value||date>new Date())throw new Error('Enter a valid date of birth');
  return value.slice(8,10)+value.slice(5,7)+value.slice(2,4);
}
