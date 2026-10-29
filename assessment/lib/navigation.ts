import type {Role} from './domain';

const allowed:Record<Role,readonly string[]>={
  administrator:['Dashboard','Scorebook','Administrator','Resources','Reports','Overall Performance','Settings'],
  headteacher:['Dashboard','Scorebook','Headteacher','Resources','Reports','Overall Performance','Settings'],
  teacher:['Dashboard','Scorebook','Teacher Portal','Resources','Settings'],
  parent:['Dashboard','Reports','Resources','Settings'],
  student:['Dashboard','Scorebook','Resources','Reports','Settings'],
};
export function canNavigate(role:Role,view:string){return allowed[role]?.includes(view)??false;}
export function navigationLabel(role:Role,view:string){
  if(role==='student')return ({Dashboard:'My Dashboard',Scorebook:'My Results',Resources:'Learning Resources',Reports:'My Report Cards',Settings:'Change Password'} as Record<string,string>)[view]??view;
  if(role==='teacher')return ({Dashboard:'My Overview',Scorebook:'Assigned-class Scorebook',Settings:'My Account'} as Record<string,string>)[view]??view;
  return view;
}
