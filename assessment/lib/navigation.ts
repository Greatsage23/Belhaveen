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

export type DashboardAction={label:string;view:string;anchor?:string;resource?:string;mode?:string};
export function dashboardActions(role:Role):DashboardAction[]{
  const management=role==='administrator'?'Administrator':'Headteacher';
  if(role==='administrator'||role==='headteacher')return [
    {label:'Student management',view:management,anchor:'Student-List'},
    {label:'Staff and teaching assignments',view:management,anchor:'Subject-Teachers'},
    {label:'Approve lesson notes',view:management,anchor:'Approve-Lesson-Notes'},
    {label:'Academic year and term',view:'Settings',anchor:'academic-period'},
    {label:'Scorebook and publication',view:'Scorebook'},
    {label:'Reports',view:'Reports'},
    {label:'Overall performance',view:'Overall Performance'},
    {label:'Schemes of work',view:'Resources',resource:'Scheme of Work'},
    {label:'Learning materials',view:'Resources',resource:'Learning Materials'},
    ...(role==='administrator'?[
      {label:'Authentication settings',view:'Settings',anchor:'teacher-authentication'},
      {label:'Password resets',view:management,anchor:'Student-List'},
      {label:'Activity log',view:'Settings',anchor:'activity-log'},
    ]:[]),
  ];
  if(role==='teacher')return [
    {label:'Assigned classes and subjects',view:'Teacher Portal'},
    {label:'Exercise entry',view:'Teacher Portal',mode:'Exercise'},
    {label:'Examination entry',view:'Teacher Portal',mode:'Examination'},
    {label:'Assigned-class Scorebook',view:'Scorebook'},
    {label:'Lesson drafts and submission',view:'Resources',resource:'Lesson Notes'},
    {label:'Approved schemes of work',view:'Resources',resource:'Scheme of Work'},
    {label:'Question Bank',view:'Resources',resource:'Question Bank'},
    {label:'Mock Questions',view:'Resources',resource:'Mock Questions'},
    {label:'Teaching Resources',view:'Resources',resource:'Learning Materials'},
    {label:'Personal account settings',view:'Settings'},
  ];
  if(role==='student')return [
    {label:'My profile',view:'Dashboard',anchor:'student-profile'},
    {label:'Published results',view:'Scorebook'},
    {label:'My report cards',view:'Reports'},
    {label:'Learning materials',view:'Resources',resource:'Learning Materials'},
    {label:'Assignments',view:'Resources',resource:'Assignments'},
    {label:'Announcements',view:'Resources',resource:'Announcements'},
    {label:'Academic calendar',view:'Resources',resource:'Academic Calendar'},
    {label:'Change password',view:'Settings'},
  ];
  return [];
}
