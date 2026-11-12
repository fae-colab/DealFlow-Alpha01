'use strict';
(function(root){
  const ATTRIBUTION=new Set(['associated_only','incremental_supported']);
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function validateReconciliations(records,snapshots,outcomeEvents){
    if(!Array.isArray(records))return ['Reconciliations must be an array.'];
    const ids=new Set(),children=new Map(),errors=[];
    const snapshotById=new Map((snapshots||[]).map(s=>[s.snapshotId,s]));
    const eventById=new Map((outcomeEvents||[]).map(e=>[e.eventId,e]));
    for(const r of records){
      if(!r||typeof r!=='object'||Array.isArray(r)){errors.push('Reconciliation must be an object.');continue;}
      for(const k of ['reconciliationId','snapshotId','actionId','outcomeEventId','recordedAt'])if(typeof r[k]!=='string'||!r[k].trim())errors.push('Reconciliation '+(r.reconciliationId||'?')+': '+k+' must be non-empty text.');
      if(ids.has(r.reconciliationId))errors.push('Duplicate reconciliation ID: '+r.reconciliationId+'.');
      ids.add(r.reconciliationId);
      if(!ATTRIBUTION.has(r.attributionStatus))errors.push('Reconciliation '+r.reconciliationId+': invalid attributionStatus.');
      const snapshot=snapshotById.get(r.snapshotId),event=eventById.get(r.outcomeEventId);
      if(!snapshot)errors.push('Reconciliation '+r.reconciliationId+': recommendation snapshot not found.');
      else if(!snapshot.selectedActionIds.includes(r.actionId))errors.push('Reconciliation '+r.reconciliationId+': action was not selected in the linked snapshot.');
      if(!event)errors.push('Reconciliation '+r.reconciliationId+': outcome event not found.');
      else{
        if(event.actionId!==r.actionId)errors.push('Reconciliation '+r.reconciliationId+': outcome event belongs to another action.');
        if(r.actualCommission!==event.actualCommission)errors.push('Reconciliation '+r.reconciliationId+': actual commission does not match the linked outcome event.');
      }
      if(snapshot){const decision=snapshot.decisions.find(d=>d.actionId===r.actionId&&d.selected);if(decision&&r.predictedIncrementalCommission!==decision.expectedIncrementalCommission)errors.push('Reconciliation '+r.reconciliationId+': predicted amount does not match the linked recommendation snapshot.');}
      if(r.supersedesReconciliationId!==null&&r.supersedesReconciliationId!==undefined){
        children.set(r.supersedesReconciliationId,(children.get(r.supersedesReconciliationId)||0)+1);
        const prior=records.find(x=>x.reconciliationId===r.supersedesReconciliationId);
        if(!prior)errors.push('Reconciliation '+r.reconciliationId+': superseded reconciliation not found.');
        else if(prior.snapshotId!==r.snapshotId||prior.actionId!==r.actionId)errors.push('Reconciliation '+r.reconciliationId+': correction must refer to the same snapshot and action.');
      }
      if(r.attributionStatus==='associated_only'){
        if(r.actualIncrementalCommission!==null||r.predictedActualDelta!==null)errors.push('Associated-only records cannot claim incremental commission or a prediction delta.');
      }else{
        if(!Number.isFinite(r.actualIncrementalCommission)||typeof r.counterfactualMethod!=='string'||!r.counterfactualMethod.trim()||typeof r.evidenceRef!=='string'||!r.evidenceRef.trim()||typeof r.reviewedBy!=='string'||!r.reviewedBy.trim())
          errors.push('Incremental attribution requires a numeric incremental amount, method, evidence reference, and reviewer.');
        if(!Number.isFinite(r.predictedActualDelta))errors.push('Supported incremental attribution requires a numeric predictedActualDelta.');
      }
    }
    for(const [id,count] of children)if(count>1)errors.push('Reconciliation '+id+' has multiple corrections.');
    return errors;
  }
  function appendReconciliation(records,input,snapshots,outcomeEvents){
    if(!Array.isArray(records))throw new Error('Reconciliations must be an array.');
    const snapshot=(snapshots||[]).find(s=>s.snapshotId===input.snapshotId);
    if(!snapshot)throw new Error('Recommendation snapshot not found.');
    const decision=snapshot.decisions.find(d=>d.actionId===input.actionId&&d.selected);
    if(!decision)throw new Error('Only actions selected in the linked recommendation can be reconciled.');
    const event=(outcomeEvents||[]).find(e=>e.eventId===input.outcomeEventId);
    if(!event||event.actionId!==input.actionId)throw new Error('Choose a current outcome event for the same action.');
    const currentEvent=(outcomeEvents||[]).filter(e=>e.actionId===input.actionId).find(e=>!(outcomeEvents||[]).some(x=>x.supersedesEventId===e.eventId));
    if(!currentEvent||currentEvent.eventId!==event.eventId)throw new Error('The selected outcome event has been superseded. Choose the current event.');
    const previous=records.filter(r=>r.snapshotId===input.snapshotId&&r.actionId===input.actionId).filter(r=>!records.some(x=>x.supersedesReconciliationId===r.reconciliationId)).slice(-1)[0]||null;
    const supported=input.attributionStatus==='incremental_supported';
    const actualIncremental=supported?input.actualIncrementalCommission:null;
    const predicted=decision.expectedIncrementalCommission;
    const record={reconciliationId:input.reconciliationId||'reconciliation:'+Date.parse(input.recordedAt||new Date().toISOString())+':'+records.length,
      snapshotId:input.snapshotId,actionId:input.actionId,outcomeEventId:input.outcomeEventId,
      recordedAt:input.recordedAt||new Date().toISOString(),outcomeStatus:event.status,
      actualCommission:event.actualCommission,actualMinutes:event.minutes,
      predictedIncrementalCommission:predicted,attributionStatus:supported?'incremental_supported':'associated_only',
      actualIncrementalCommission:actualIncremental,
      predictedActualDelta:supported?actualIncremental-predicted:null,
      counterfactualMethod:supported?input.counterfactualMethod:null,
      evidenceRef:supported?input.evidenceRef:null,reviewedBy:supported?input.reviewedBy:null,
      supersedesReconciliationId:previous?previous.reconciliationId:null};
    const next=[...records,record],errors=validateReconciliations(next,snapshots,outcomeEvents);
    if(errors.length)throw new Error(errors.join('\\n'));
    return next;
  }
  function migrateState(input,snapshots,outcomeEvents){
    const state=clone(input);
    if(!Array.isArray(state.reconciliations))state.reconciliations=[];
    const errors=validateReconciliations(state.reconciliations,snapshots||[],outcomeEvents||[]);
    if(errors.length)throw new Error(errors.join('\\n'));
    state.reconciliationSchemaVersion=1;
    return state;
  }
  root.DealFlowReconciliation={validateReconciliations,appendReconciliation,migrateState};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DealFlowReconciliation;
})(typeof globalThis!=='undefined'?globalThis:this);
