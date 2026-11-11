const assert=require('node:assert/strict'); const E=require('./engine.js');
const a=(id,opportunityId,commission,extra={})=>({id,opportunityId,name:'Opportunity '+opportunityId,action:'Test '+id,commission,pWith:80,pWithout:20,effort:30,deadline:5,...extra});
const duplicate=[a('first','deal-42',10000),a('second','DEAL-42',20000)]; assert.equal(E.optimize(duplicate,2).value,12000);
const prep=a('prep','same-deal',1000,{pWith:30,pWithout:40,effort:15}); const close=a('close','same-deal',10000,{pWith:80,pWithout:20,effort:30,dependency:'prep'}); assert.equal(E.optimize([prep,close],2).value,5900);
const setup=a('setup','setup-deal',1000,{pWith:50,pWithout:40,effort:40,deadline:3}); const urgent=a('urgent','urgent-deal',10000,{pWith:80,pWithout:20,effort:30,deadline:1.5,dependency:'setup'}); const independent=a('independent','independent-deal',10000,{pWith:80,pWithout:20,effort:30,deadline:2}); const result=E.optimize([setup,urgent,independent],2); assert.deepEqual(result.items.map(x=>x.id),['setup','urgent','independent']); assert.equal(result.value,12100);
const whitespaceOpportunity=[a('space-1',' ',10000),a('space-2',' ',10000)]; assert.ok(E.validatePortfolio(whitespaceOpportunity,2).some(x=>x.includes('opportunityId must be a non-empty string')));
console.log('4 P0 JavaScript regression tests passed.');
