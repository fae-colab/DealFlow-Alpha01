'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Engine=require('./engine.js');
const Desk=require('./decision_desk.js');
const fixture=JSON.parse(fs.readFileSync('validation/evidence_taxonomy_v1/regression_cases.json','utf8'));
const expected=new Map([
 ['EV-001','STALE_VOLATILE_CLAIM'],
 ['EV-002','MISSING_OBSERVATION_TIMESTAMP'],
 ['EV-003','FRESH_CLAIM_MATCHED_EVIDENCE'],
 ['EV-004','VALID_HISTORICAL_EVENT'],
 ['EV-005','SOURCE_DOES_NOT_SUPPORT_CLAIM']
]);
for(const item of fixture.cases){
 const action={
  id:item.caseId,opportunityId:item.caseId,name:item.claim.text,action:'Validate evidence for '+item.name,
  commission:12000,pWith:65,pWithout:40,effort:30,deadline:4,confidence:70,
  evidenceClaims:[{...item.claim,evidenceType:item.evidenceType}],
  evidenceRecords:[item.evidence],
  evidenceStatus:'user_reported',
  evidenceNote:'Synthetic behavior-test input; evidence evaluated by the claim-linked evidence model.'
 };
 const gate=Desk.eligibility([action],2,Engine,{
  asOfDate:'2026-11-13',asOfTimestamp:fixture.evaluationDate,
  evidencePolicies:{[item.evidenceType]:item.policy}
 });
 const expectedDecision=item.expected.decision==='ELIGIBLE'?'READY_FOR_OPTIMIZATION':'ABSTAIN';
 assert.equal(gate.decision,expectedDecision,item.caseId+': engine gate decision');
 if(item.expected.decision==='ELIGIBLE'){
  assert.equal(gate.eligibleActions.length,1,item.caseId+': action should be eligible');
  assert.equal(gate.rejectedActions.length,0,item.caseId+': no rejection expected');
 }else{
  assert.equal(gate.eligibleActions.length,0,item.caseId+': no action may pass');
  const rejection=gate.rejectedActions.find(x=>x.actionId===item.caseId);
  assert.ok(rejection,item.caseId+': expected explicit rejection');
  assert.ok(rejection.reason.includes(expected.get(item.caseId)),item.caseId+': reason code must be explicit: '+rejection.reason);
  assert.ok(rejection.reason.includes(item.expected.nextStep),item.caseId+': next step must be explicit');
 }
 console.log(item.caseId+' '+gate.decision+' '+(gate.rejectedActions[0]?.reason||'eligible'));
}
console.log('5 executable evidence-model behavior tests passed against DealFlowDecisionDesk. These are synthetic contract tests, not real-agent validation.');
