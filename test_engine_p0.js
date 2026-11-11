const assert=require('node:assert/strict'); const E=require('./engine.js');
const a=(id,opportunityId,commission,extra={})=>({id,opportunityId,name:'Opportunity '+opportunityId,action:'Test '+id,commission,pWith:80,pWithout:20,effort:30,deadline:5,...extra});
// Multiple positive actions for the same transaction must never add the same
// transaction's commission twice, even when input estimates differ.
const duplicate=[a('first','deal-42',10000),a('second','DEAL-42',20000)];
assert.equal(E.optimize(duplicate,2).value,12000);
const prep=a('prep','same-deal',1000,{pWith:30,pWithout:40,effort:15});
const close=a('close','same-deal',10000,{pWith:80,pWithout:20,effort:30,dependency:'prep'});
assert.equal(E.optimize([prep,close],2).value,5900,'negative prerequisite lift remains a cost and positive deal lift is counted once');
// Regression: exact search must retain a feasible precedence-respecting order.
const setup=a('setup','setup-deal',1000,{pWith:50,pWithout:40,effort:40,deadline:3});
const urgent=a('urgent','urgent-deal',10000,{pWith:80,pWithout:20,effort:30,deadline:1.5,dependency:'setup'});
const independent=a('independent','independent-deal',10000,{pWith:80,pWithout:20,effort:30,deadline:2});
const result=E.optimize([setup,urgent,independent],2);
assert.deepEqual(result.items.map(x=>x.id),['setup','urgent','independent']);
assert.equal(result.value,12100);
console.log('3 P0 JavaScript regression tests passed.');
