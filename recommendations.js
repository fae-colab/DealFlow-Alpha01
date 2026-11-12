'use strict';
(function(root){
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function validateSnapshots(snapshots){
    if(!Array.isArray(snapshots))return ['Recommendation snapshots must be an array.'];
    const ids=new Set(),errors=[];
    for(const s of snapshots){
      if(!s||typeof s!=='object'||Array.isArray(s)){errors.push('Recommendation snapshot must be an object.');continue;}
      for(const k of ['snapshotId','createdAt','optimizerVersion'])if(typeof s[k]!=='string'||!s[k].trim())errors.push('Snapshot '+(s.snapshotId||'?')+': '+k+' must be non-empty text.');
      if(ids.has(s.snapshotId))errors.push('Duplicate recommendation snapshot ID: '+s.snapshotId+'.');
      ids.add(s.snapshotId);
      if(typeof s.createdAt==='string'&&Number.isNaN(Date.parse(s.createdAt)))errors.push('Snapshot '+s.snapshotId+': createdAt must be a valid timestamp.');
      if(!Number.isFinite(s.capacityHours)||s.capacityHours<=0)errors.push('Snapshot '+s.snapshotId+': capacityHours must be positive.');
      if(!Array.isArray(s.inputActions)||!Array.isArray(s.decisions)||!Array.isArray(s.selectedActionIds))errors.push('Snapshot '+s.snapshotId+': inputs, decisions and selectedActionIds must be arrays.');
      else{
        const actionIds=new Set(s.inputActions.map(a=>a.id));
        if(s.selectedActionIds.some(id=>!actionIds.has(id)))errors.push('Snapshot '+s.snapshotId+': selected action is absent from captured inputs.');
        if(s.decisions.length!==s.inputActions.length)errors.push('Snapshot '+s.snapshotId+': one decision record is required per input action.');
      }
      if(!s.portfolio||!Number.isFinite(s.portfolio.expectedIncrementalCommission)||!Number.isFinite(s.portfolio.minutes))errors.push('Snapshot '+s.snapshotId+': portfolio totals are invalid.');
    }
    return errors;
  }
  function captureSnapshot(input){
    const createdAt=input.createdAt||new Date().toISOString();
    const snapshotId=input.snapshotId||'recommendation:'+Date.parse(createdAt)+':'+(input.sequence||1);
    const selected=input.best.items||[],selectedIds=selected.map(a=>a.id),rank=new Map(selectedIds.map((id,i)=>[id,i+1]));
    const scheduled=new Map(selected.map(a=>[a.id,a]));
    const inputActions=clone(input.actions);
    const decisions=inputActions.map(action=>{
      const chosen=scheduled.get(action.id),isSelected=Boolean(chosen);
      const evidenceRecords=(input.evidence||[]).filter(e=>e.subjectType==='action'&&e.subjectId===action.id&&['commission','pWith','pWithout'].includes(e.claimKey));
      return {actionId:action.id,selected:isSelected,rank:rank.get(action.id)||null,
        action:clone(action),expectedIncrementalCommission:input.incremental(action),
        probabilityLift:action.pWith-action.pWithout,
        scheduledStartMinutes:chosen?chosen.scheduledStartMinutes:null,
        scheduledFinishMinutes:chosen?chosen.scheduledFinishMinutes:null,
        evidenceRecordIds:evidenceRecords.map(e=>e.id),
        reasonCode:isSelected?'selected_by_portfolio_optimizer':'not_selected_in_optimal_portfolio',
        reasonText:isSelected?'Included in the highest-value feasible portfolio under the captured time, deadline, dependency and opportunity constraints.':'Not included in the optimal feasible portfolio for the captured inputs and capacity; this is not a claim that the action has no value.'};
    });
    return {snapshotId,createdAt,optimizerVersion:'alpha-01.3-p0-engine',
      objective:'maximize_expected_incremental_commission_under_capacity',
      capacityHours:input.capacityHours,inputActions,selectedActionIds:selectedIds,
      portfolio:{expectedIncrementalCommission:input.best.value,minutes:input.best.minutes,selectedCount:selectedIds.length},
      comparisons:{commissionFirst:{value:input.commission.value,minutes:input.commission.minutes,selectedActionIds:input.commission.items.map(a=>a.id)},
        incrementalPerHour:{value:input.hourly.value,minutes:input.hourly.minutes,selectedActionIds:input.hourly.items.map(a=>a.id)}},
      decisions};
  }
  function appendSnapshot(snapshots,snapshot){
    const next=[...clone(snapshots),clone(snapshot)];
    const errors=validateSnapshots(next);
    if(errors.length)throw new Error(errors.join('\n'));
    return next;
  }
  function migrateState(input){
    const state=clone(input);
    if(!Array.isArray(state.recommendationSnapshots))state.recommendationSnapshots=[];
    const errors=validateSnapshots(state.recommendationSnapshots);
    if(errors.length)throw new Error(errors.join('\n'));
    state.recommendationSnapshotSchemaVersion=1;
    return state;
  }
  root.DealFlowRecommendations={validateSnapshots,captureSnapshot,appendSnapshot,migrateState};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DealFlowRecommendations;
})(typeof globalThis!=='undefined'?globalThis:this);
