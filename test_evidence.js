const assert=require('node:assert/strict');
const E=require('./evidence.js');
const seeds=[
 {id:'DF-01',opportunityId:'DEAL-01',name:'Marina buyer',action:'Confirm viewing',commission:24000,pWith:58,pWithout:38},
 {id:'DF-02',opportunityId:'DEAL-02',name:'Downtown seller',action:'Call seller',commission:18000,pWith:52,pWithout:43}
];
const initial=E.createInitialState(seeds);
assert.equal(initial.version,'1.3');
assert.equal(initial.evidence.length,6);
assert.ok(initial.evidence.every(x=>x.isSynthetic&&x.sourceType==='synthetic_demo'&&x.quality==='none'));
assert.equal(E.validateEvidence(initial.evidence).length,0);

const legacy={
 version:'1.2',
 actions:[
  {...seeds[0],evidenceStatus:'verified',evidenceUrl:'https://example.com/listing',evidenceUpdatedAt:'2026-11-01',evidenceNote:'Old label only'},
  {id:'CUSTOM-1',opportunityId:'CUSTOM-DEAL',name:'Custom',action:'Call',commission:1000,pWith:60,pWithout:40,effort:30,deadline:4,confidence:75,evidenceStatus:'documented',evidenceUrl:'',evidenceUpdatedAt:'',evidenceNote:'User says document exists'}
 ],
 outcomes:[{id:'CUSTOM-1',status:'completed',actualCommission:0,minutes:10,at:'2026-11-01T00:00:00Z'}],
 history:[{at:'2026-11-01T00:00:00Z',ids:['CUSTOM-1']}]
};
const migrated=E.migrateState(legacy,seeds);
assert.equal(migrated.version,'1.3');
assert.equal(migrated.outcomes.length,1,'legacy outcomes are preserved unchanged');
assert.equal(migrated.history.length,1,'legacy history is preserved');
const legacyEvidence=migrated.evidence.find(x=>x.id==='legacy-evidence:DF-01');
assert.ok(legacyEvidence);
assert.equal(legacyEvidence.kind,'observation','legacy verified label is not promoted to verified_fact');
assert.equal(legacyEvidence.quality,'none','legacy URL/status cannot upgrade evidence quality');
assert.equal(legacyEvidence.verifiedAt,null);
assert.equal(legacyEvidence.verifiedBy,null);
assert.equal(legacyEvidence.legacyMetadata.evidenceStatus,'verified');
assert.equal(legacyEvidence.sourceRef,'https://example.com/listing');
const customEvidence=migrated.evidence.find(x=>x.id==='legacy-evidence:CUSTOM-1');
assert.equal(customEvidence.kind,'observation');
assert.equal(customEvidence.sourceType,'user_input');
assert.equal(customEvidence.isSynthetic,false);
assert.equal(migrated.actions[0].evidenceStatus,'verified','legacy action fields remain readable');

const again=E.migrateState(migrated,seeds);
assert.equal(again.evidence.length,migrated.evidence.length,'migration is idempotent');
assert.deepEqual(again.evidence,migrated.evidence);

const bad=JSON.parse(JSON.stringify(initial));
bad.evidence.push({...bad.evidence[0]});
assert.ok(E.validateEvidence(bad.evidence).length);
const ungrounded={...bad.evidence[0],id:'bad-verified',kind:'verified_fact',verifiedAt:null,verifiedBy:null};
assert.ok(E.validateEvidence([ungrounded]).length);
const fakeSynthetic={...bad.evidence[0],id:'fake-synthetic',sourceType:'user_input'};
assert.ok(E.validateEvidence([{...fakeSynthetic,isSynthetic:true}]).length);
assert.throws(()=>E.migrateState({actions:[],outcomes:[],evidence:[{bad:true}]},seeds),/Evidence record/);
assert.throws(()=>E.migrateState({actions:[]},seeds),/actions and outcomes/);
console.log('Evidence schema and migration tests passed.');
