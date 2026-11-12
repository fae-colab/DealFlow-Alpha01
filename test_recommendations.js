const assert=require('node:assert/strict');
const R=require('./recommendations.js');
const actions=[
 {id:'A',name:'Buyer A',commission:10000,pWith:70,pWithout:40,effort:30,deadline:4,confidence:80},
 {id:'B',name:'Seller B',commission:5000,pWith:60,pWithout:50,effort:60,deadline:2,confidence:50}
];
const best={value:3000,minutes:30,items:[{...actions[0],scheduledStartMinutes:0,scheduledFinishMinutes:30}]};
const snapshot=R.captureSnapshot({createdAt:'2026-11-12T10:00:00Z',sequence:1,capacityHours:1,actions,best,
 commission:{value:2000,minutes:60,items:[actions[1]]},hourly:{value:3000,minutes:30,items:[actions[0]]},
 evidence:[{id:'e-A-commission',subjectType:'action',subjectId:'A',claimKey:'commission'}],
 incremental:a=>a.commission*(a.pWith-a.pWithout)/100});
assert.deepEqual(snapshot.selectedActionIds,['A']);
assert.equal(snapshot.decisions[0].standaloneExpectedIncrementalCommission,3000);
assert.equal(snapshot.decisions[0].evidenceRecordIds[0],'e-A-commission');
assert.equal(snapshot.decisions[0].reasonCode,'selected_by_portfolio_optimizer');
assert.equal(snapshot.decisions[1].selected,false);
assert.ok(snapshot.decisions[1].reasonText.includes('not a claim'));
const log=R.appendSnapshot([],snapshot);
assert.equal(log.length,1);
const edited=JSON.parse(JSON.stringify(actions));edited[0].commission=999999;edited[0].pWith=99;
assert.equal(log[0].inputActions[0].commission,10000,'later input edits cannot rewrite captured inputs');
assert.equal(log[0].decisions[0].action.commission,10000);
assert.equal(R.validateSnapshots(log).length,0);
assert.throws(()=>R.appendSnapshot(log,snapshot),/Duplicate recommendation snapshot ID/);
const restored=R.migrateState({actions:edited,outcomes:[],recommendationSnapshots:log});
assert.deepEqual(restored.recommendationSnapshots,log);
assert.throws(()=>R.migrateState({recommendationSnapshots:[{...snapshot,selectedActionIds:['missing']}]}),/selected action is absent/);
assert.equal(R.migrateState({}).recommendationSnapshots.length,0);
const oldSnapshot=JSON.parse(JSON.stringify(snapshot));oldSnapshot.decisions[0].expectedIncrementalCommission=3000;delete oldSnapshot.decisions[0].standaloneExpectedIncrementalCommission;
const upgraded=R.migrateState({recommendationSnapshots:[oldSnapshot]});
assert.equal(upgraded.recommendationSnapshots[0].decisions[0].standaloneExpectedIncrementalCommission,3000,'older snapshots migrate without losing their original estimate');
assert.equal(upgraded.recommendationSnapshots[0].decisions[0].valueBasis,'standalone_action_estimate_not_allocated_portfolio_contribution');
console.log('Immutable recommendation snapshot tests passed.');
