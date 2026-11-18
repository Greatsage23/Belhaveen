import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateBallot,nextStatus,resultRows} from '../lib/voting-rules.ts';
const ps=[{id:'p1'},{id:'p2'}],cs=[{id:'a',portfolio_id:'p1'},{id:'b',portfolio_id:'p1'},{id:'c',portfolio_id:'p2'}];
test('complete ballot accepts one choice per portfolio',()=>assert.doesNotThrow(()=>validateBallot([{portfolioId:'p1',candidateId:'a'},{portfolioId:'p2',candidateId:'c'}],ps,cs)));
test('rejects missing portfolios, duplicate portfolios, foreign candidates and empty elections',()=>{
 for(const choices of [[{portfolioId:'p1',candidateId:'a'}],[{portfolioId:'p1',candidateId:'a'},{portfolioId:'p1',candidateId:'b'}],[{portfolioId:'p1',candidateId:'c'},{portfolioId:'p2',candidateId:'a'}],[{portfolioId:'p1',candidateId:'unknown'},{portfolioId:'p2',candidateId:'c'}]])assert.throws(()=>validateBallot(choices,ps,cs));
 assert.throws(()=>validateBallot([],[],[]));
});
test('closed elections cannot reopen and paused elections can resume',()=>{assert.equal(nextStatus('draft','start'),'open');assert.equal(nextStatus('open','pause'),'paused');assert.equal(nextStatus('paused','resume'),'open');assert.equal(nextStatus('paused','close'),'closed');assert.throws(()=>nextStatus('closed','start'));assert.throws(()=>nextStatus('open','resume'));});
test('results handle ties, zero totals and percentages without NaN',()=>{const rows=resultRows([{id:'a',votes:'3'},{id:'b',votes:3},{id:'c',votes:2}]);assert.deepEqual(rows.map(r=>r.rank),[1,1,3]);assert.equal(rows[0].percentage,37.5);assert.equal(rows[0].total,8);assert.equal(resultRows([{id:'a',votes:0}])[0].percentage,0);});
