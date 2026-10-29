import test from 'node:test';
import assert from 'node:assert/strict';
import {canNavigate,navigationLabel} from '../lib/navigation.ts';
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
