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
const customClaims=migrated.evidence.filter(x=>x.subjectId==='CUSTOM-1'&&['commission','pWith','pWithout'].includes(x.claimKey));
assert.equal(customClaims.length,3,'every action numeric input receives claim-level evidence');
assert.ok(customClaims.every(x=>x.kind==='assumption'&&x.quality==='none'&&x.sourceType==='user_input'));
assert.ok(customClaims.every(x=>x.isSynthetic===false));
assert.equal(migrated.actions[0].evidenceStatus,'verified','legacy action fields remain readable');
assert.equal(migrated.actions[1].confidence,75,'confidence remains on the action independently of evidence quality');
assert.equal(customClaims[0].quality,'none','evidence quality is not derived from confidence');

const again=E.migrateState(migrated,seeds);
assert.equal(again.evidence.length,migrated.evidence.length,'migration is idempotent');
assert.deepEqual(again.evidence,migrated.evidence);

const edited={...migrated.actions[1],commission:2500,pWith:72,pWithout:35};
const beforeEdit=migrated.evidence.filter(x=>x.subjectId==='CUSTOM-1'&&['commission','pWith','pWithout'].includes(x.claimKey));
E.syncActionClaims(edited,migrated.evidence);
for(const [claimKey,value] of [['commission',2500],['pWith',72],['pWithout',35]]){
 const records=migrated.evidence.filter(x=>x.subjectId==='CUSTOM-1'&&x.claimKey===claimKey);
 const supersededIds=new Set(records.map(x=>x.supersedesId).filter(Boolean));
 const current=records.filter(x=>!supersededIds.has(x.id));
 assert.equal(current.length,1,'exactly one current evidence record remains for '+claimKey);
 assert.equal(current[0].claimValue,value,'current evidence matches edited '+claimKey);
 assert.equal(current[0].kind,'assumption');
 assert.equal(current[0].sourceType,'user_input');
 assert.equal(current[0].quality,'none');
 assert.equal(current[0].supersedesId,beforeEdit.find(x=>x.claimKey===claimKey).id,'edited evidence links to its prior version');
}
assert.deepEqual(beforeEdit.map(x=>x.claimValue),[1000,60,40],'previous evidence records remain unchanged for audit');
assert.equal(E.validateEvidence(migrated.evidence).length,0);

const bad=JSON.parse(JSON.stringify(initial));
bad.evidence.push({...bad.evidence[0]});
assert.ok(E.validateEvidence(bad.evidence).length);
const ungrounded={...bad.evidence[0],id:'bad-verified',kind:'verified_fact',verifiedAt:null,verifiedBy:null};
assert.ok(E.validateEvidence([ungrounded]).length);
const verifiedFact={...bad.evidence[0],id:'verified-fact',kind:'verified_fact',quality:'medium',sourceType:'document',sourceRef:'doc://ownership-check',verifiedAt:'2026-11-12T08:00:00Z',verifiedBy:'manual review',isSynthetic:false};
assert.equal(E.validateEvidence([verifiedFact]).length,0,'verified facts require provenance and non-none quality');
assert.ok(E.validateEvidence([{...verifiedFact,quality:'none'}]).length);
assert.ok(E.validateEvidence([{...verifiedFact,sourceType:'synthetic_demo',isSynthetic:true}]).length);
const fakeSynthetic={...bad.evidence[0],id:'fake-synthetic',sourceType:'user_input'};
assert.ok(E.validateEvidence([{...fakeSynthetic,isSynthetic:true}]).length);
assert.throws(()=>E.migrateState({actions:[],outcomes:[],evidence:[{bad:true}]},seeds),/Evidence record/);
assert.throws(()=>E.migrateState({actions:[]},seeds),/actions and outcomes/);
assert.equal(E.validateConfidence(0),null);
assert.equal(E.validateConfidence(100),null);
assert.equal(E.validateConfidence('72'),null);
assert.ok(E.validateConfidence(-1));
assert.ok(E.validateConfidence(101));
assert.ok(E.validateConfidence(''));
assert.ok(E.validateConfidence(null));
assert.ok(E.validateConfidence(false));

const revisionAction=migrated.actions[1];
const revisionBase=JSON.parse(JSON.stringify(migrated.evidence));
const priorProbability=E.currentClaimEvidence(revisionBase,'CUSTOM-1','pWith');
const revisedEvidence=E.reviseClaimEvidence(revisionBase,revisionAction,{
 claimKey:'pWith',kind:'estimate',quality:'medium',sourceType:'public_source',
 sourceRef:'https://example.com/probability-basis',observedAt:'2026-11-12T08:00:00Z',
 capturedAt:'2026-11-13T08:00:00Z',note:'Recent public comparable evidence informs this probability estimate.'
});
const revisedProbability=E.currentClaimEvidence(revisedEvidence,'CUSTOM-1','pWith');
assert.equal(revisedProbability.quality,'medium');
assert.equal(revisedProbability.kind,'estimate');
assert.equal(revisedProbability.supersedesId,priorProbability.id);
assert.deepEqual(priorProbability,revisionBase.find(x=>x.id===priorProbability.id),'prior evidence remains immutable');
assert.equal(revisionAction.confidence,75,'editing evidence quality does not alter confidence');
assert.equal(E.summarizeActionEvidence(revisedEvidence,'CUSTOM-1').claims.find(x=>x.claimKey==='pWith').quality,'medium');
assert.throws(()=>E.reviseClaimEvidence(revisionBase,revisionAction,{
 claimKey:'commission',kind:'verified_fact',quality:'none',sourceType:'public_source',
 sourceRef:'',note:'Not enough verification details.'
}),/verified_fact|source reference/i);
assert.throws(()=>E.reviseClaimEvidence(revisionBase,revisionAction,{
 claimKey:'commission',kind:'verified_fact',quality:'medium',sourceType:'document',
 sourceRef:'document:ownership',verifiedAt:null,verifiedBy:'Reviewer',note:'Missing verification time.'
}),/verified_fact/i);

const syntheticEvidence=JSON.parse(JSON.stringify(initial.evidence));
const syntheticEdited={...initial.actions[0],commission:26000};
E.syncActionClaims(syntheticEdited,syntheticEvidence);
const syntheticCommission=E.currentClaimEvidence(syntheticEvidence,'DF-01','commission');
assert.equal(syntheticCommission.claimValue,26000);
assert.equal(syntheticCommission.isSynthetic,true);
assert.equal(syntheticCommission.sourceType,'synthetic_demo');
assert.equal(syntheticCommission.quality,'none');
assert.throws(()=>E.reviseClaimEvidence(syntheticEvidence,initial.actions[0],{
 claimKey:'pWith',kind:'estimate',quality:'high',sourceType:'public_source',
 sourceRef:'https://example.com',note:'Attempted to relabel synthetic demo data.'
}),/Synthetic demo evidence/i);
assert.ok(E.validateEvidence([{...verifiedFact,sourceRef:''}]).length,'verified facts require a source reference');
assert.ok(E.validateEvidence([{...verifiedFact,kind:'estimate',quality:'low',sourceRef:'',verifiedAt:null,verifiedBy:null}]).length,'non-none quality requires a source reference');
assert.ok(E.validateEvidence([{...verifiedFact,quality:'high',isSynthetic:true,sourceType:'synthetic_demo'}]).length,'synthetic evidence cannot be assigned quality');
console.log('Evidence schema, editing, confidence and migration tests passed.');
