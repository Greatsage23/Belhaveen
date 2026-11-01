import test from 'node:test';
import assert from 'node:assert/strict';
import {canNavigate,navigationLabel,dashboardActions} from '../lib/navigation.ts';
test('students cannot navigate to staff workspaces',()=>{
  for(const view of ['Administrator','Headteacher','Teacher Portal','Overall Performance'])assert.equal(canNavigate('student',view),false);
  for(const view of ['Dashboard','Scorebook','Resources','Reports','Settings'])assert.equal(canNavigate('student',view),true);
  assert.equal(navigationLabel('student','Scorebook'),'My Results');
});
test('teachers only receive supported teaching areas',()=>{
  assert.equal(canNavigate('teacher','Teacher Portal'),true);
  for(const view of ['Administrator','Headteacher','Reports'])assert.equal(canNavigate('teacher',view),false);
});
test('manager workspaces follow the authenticated role',()=>{
  assert.equal(canNavigate('headteacher','Administrator'),false);
  assert.equal(canNavigate('headteacher','Headteacher'),true);
  assert.equal(canNavigate('administrator','Administrator'),true);
  assert.equal(canNavigate('student','Unknown'),false);
});

test('parents cannot navigate to staff workspaces',()=>{for(const view of ['Administrator','Headteacher','Teacher Portal','Scorebook','Overall Performance'])assert.equal(canNavigate('parent',view),false);assert.equal(canNavigate('parent','Dashboard'),true);});

test('every dashboard shortcut targets an area permitted for its role',()=>{for(const role of ['administrator','headteacher','teacher','student','parent'] as const){for(const action of dashboardActions(role))assert.ok(canNavigate(role,action.view),role+': '+action.label);}});
test('student shortcuts include each personal learning area',()=>{const labels=dashboardActions('student').map(a=>a.label);for(const label of ['My profile','Published results','My report cards','Learning materials','Assignments','Announcements','Academic calendar','Change password'])assert.ok(labels.includes(label));});
test('only administrators receive authentication and audit shortcuts',()=>{assert.ok(dashboardActions('administrator').some(a=>a.anchor==='activity-log'));for(const role of ['teacher','student','headteacher'] as const)assert.ok(!dashboardActions(role).some(a=>a.anchor==='activity-log'||a.anchor==='teacher-authentication'));});
