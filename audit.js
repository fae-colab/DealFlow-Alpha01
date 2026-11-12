'use strict';
(function(root){
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function validateOutcomeEvent(event){
    const errors=[];
    if(!event||typeof event!=='object'||Array.isArray(event))return ['Outcome event must be an object.'];
    for(const key of ['eventId','actionId','opportunityId','eventType','recordedAt','sourceType','verificationStatus'])
      if(typeof event[key]!=='string'||!event[key].trim())errors.push(key+' must be non-empty text.');
    if(!['status_update','commission_received','time_recorded','correction'].includes(event.eventType))errors.push('Invalid outcome eventType.');
    if(event.status!==null&&event.status!==undefined&&!['completed','not_completed','lost','pending'].includes(event.status))errors.push('Invalid outcome status.');
    if(event.actualCommission!==null&&event.actualCommission!==undefined&&(!Number.isFinite(event.actualCommission)||event.actualCommission<0))errors.push('actualCommission must be a non-negative number or null.');
    if(event.actualMinutes!==null&&event.actualMinutes!==undefined&&(!Number.isFinite(event.actualMinutes)||event.actualMinutes<0))errors.push('actualMinutes must be a non-negative number or null.');
    for(const key of ['recordedAt','occurredAt'])if(event[key]!==null&&event[key]!==undefined&&Number.isNaN(Date.parse(event[key])))errors.push(key+' must be a valid timestamp or null.');
    if(event.supersedesEventId!==null&&event.supersedesEventId!==undefined&&typeof event.supersedesEventId!=='string')errors.push('supersedesEventId must be text or null.');
    if(event.actualIncrementalCommission!==null&&event.actualIncrementalCommission!==undefined&&(!Number.isFinite(event.actualIncrementalCommission)||typeof event.attributionMethod!=='string'||!event.attributionMethod.trim()))errors.push('actualIncrementalCommission requires a documented attributionMethod.');
    return errors;
  }
  function appendOutcomeEvent(events,event){
    if(!Array.isArray(events))throw new Error('Outcome event log must be an array.');
    const copy=clone(event),errors=validateOutcomeEvent(copy);
    if(errors.length)throw new Error(errors.join(' '));
    if(events.some(x=>x.eventId===copy.eventId))throw new Error('Duplicate outcome event ID: '+copy.eventId);
    if(copy.supersedesEventId){
      const prior=events.find(x=>x.eventId===copy.supersedesEventId);
      if(!prior)throw new Error('A correction must reference an existing outcome event.');
      if(prior.actionId!==copy.actionId)throw new Error('A correction must reference an event for the same action.');
    }
    return [...events,copy];
  }
  function migrateLegacyOutcomes(outcomes,actions=[]){
    if(!Array.isArray(outcomes))throw new Error('Legacy outcomes must be an array.');
    return outcomes.map((o,i)=>({
      eventId:'legacy-outcome:'+(o.id||i),actionId:String(o.id||''),opportunityId:String(o.opportunityId||(actions.find(x=>x.id===String(o.id||''))||{}).opportunityId||o.id||''),
      eventType:'status_update',status:o.status||'pending',
      actualCommission:Number.isFinite(o.actualCommission)?o.actualCommission:null,
      currency:o.currency||'AED',actualMinutes:Number.isFinite(o.minutes)?o.minutes:null,
      occurredAt:o.at||null,recordedAt:o.updatedAt||o.at||new Date(0).toISOString(),
      sourceType:'legacy_import',verificationStatus:'unverified',
      note:'Imported from the pre-event Alpha 01.3 outcome record; retained as historical, unverified data.',
      supersedesEventId:null,actualIncrementalCommission:null,attributionMethod:null,isLegacy:true
    }));
  }
  function deriveCurrentOutcomes(events){
    if(!Array.isArray(events))throw new Error('Outcome event log must be an array.');
    const superseded=new Set(events.map(x=>x.supersedesEventId).filter(Boolean));
    const current=events.filter(x=>!superseded.has(x.eventId));
    const byAction=new Map();
    for(const event of current){
      const old=byAction.get(event.actionId);
      if(!old||String(event.recordedAt).localeCompare(String(old.recordedAt))>0||
        (event.recordedAt===old.recordedAt&&event.eventId.localeCompare(old.eventId)>0))byAction.set(event.actionId,event);
    }
    return [...byAction.values()].map(clone);
  }
  function createRecommendationSnapshot(input){
    if(!input||!input.runId||!Array.isArray(input.actions)||!Array.isArray(input.evidence)||!input.result)throw new Error('Snapshot requires runId, actions, evidence and optimizer result.');
    const selected=input.result.items||[],selectedIds=selected.map(x=>x.id);
    const snapshot={
      snapshotVersion:1,runId:String(input.runId),createdAt:input.createdAt||new Date().toISOString(),
      engineVersion:'alpha-01.2-objective-v1',schemaVersion:input.schemaVersion||1,
      objective:'maximize_expected_incremental_commission_under_capacity_deadlines_and_dependencies',
      selectionExplanation:'Selected portfolio maximizes the engine objective within the supplied capacity, deadlines and dependencies. Unselected candidates are recorded without inventing a specific exclusion reason.',
      capacityHours:input.capacityHours,
      candidateActions:clone(input.actions),
      evidence:clone(input.evidence),
      selectedActionIds:[...selectedIds],
      scheduledActions:clone(selected),
      unselectedActionIds:input.actions.map(x=>x.id).filter(id=>!selectedIds.includes(id)),
      predictedIncrementalCommission:input.result.value,
      allocatedMinutes:input.result.minutes
    };
    return clone(snapshot);
  }
  function appendRecommendationSnapshot(snapshots,snapshot){
    if(!Array.isArray(snapshots))throw new Error('Recommendation snapshot archive must be an array.');
    const copy=clone(snapshot),errors=validateSnapshot(copy);
    if(errors.length)throw new Error(errors.join(' '));
    if(snapshots.some(x=>x.runId===copy.runId))throw new Error('Duplicate recommendation run ID: '+copy.runId);
    return [...snapshots,copy];
  }
  function validateSnapshot(snapshot){
    if(!snapshot||typeof snapshot!=='object')return ['Snapshot must be an object.'];
    const errors=[];
    for(const key of ['runId','createdAt','engineVersion','objective'])if(typeof snapshot[key]!=='string'||!snapshot[key])errors.push(key+' is required.');
    if(!Number.isFinite(snapshot.capacityHours)||snapshot.capacityHours<=0)errors.push('capacityHours must be positive.');
    if(!Array.isArray(snapshot.candidateActions)||!Array.isArray(snapshot.evidence)||!Array.isArray(snapshot.selectedActionIds)||!Array.isArray(snapshot.scheduledActions)||!Array.isArray(snapshot.unselectedActionIds))errors.push('Snapshot arrays are invalid.');
    if(!Number.isFinite(snapshot.predictedIncrementalCommission)||!Number.isFinite(snapshot.allocatedMinutes))errors.push('Snapshot totals must be numeric.');
    return errors;
  }
  function reconcile(snapshots,events){
    const current=deriveCurrentOutcomes(events),rows=[];
    for(const snapshot of snapshots){
      const selected=snapshot.selectedActionIds||[];
      const actions=(snapshot.candidateActions||[]).filter(a=>selected.includes(a.id));
      const groups=new Map();
      for(const action of actions){
        const key=String(action.opportunityId||action.id);
        if(!groups.has(key))groups.set(key,{opportunityId:key,selectedActionIds:[],predictedLift:0,actualObservations:[]});
        const group=groups.get(key);group.selectedActionIds.push(action.id);
        const lift=action.commission*(action.pWith-action.pWithout)/100;
        if(lift<0)group.predictedLift+=lift;
        else group.predictedLift=Math.max(group.predictedLift,lift);
        const event=current.find(x=>x.actionId===action.id);
        if(event&&(event.actualCommission!==null&&event.actualCommission!==undefined||event.actualIncrementalCommission!==null&&event.actualIncrementalCommission!==undefined))group.actualObservations.push({actionId:action.id,amount:event.actualCommission,eventId:event.eventId,actualIncrementalCommission:event.actualIncrementalCommission,attributionMethod:event.attributionMethod});
      }
      for(const group of groups.values()){
        const amounts=[...new Set(group.actualObservations.map(x=>x.amount).filter(x=>x!==null&&x!==undefined))];
        group.actualCommissionObserved=amounts.length===1?amounts[0]:null;
        group.actualCommissionStatus=amounts.length===0?'not_recorded':amounts.length===1?'observed':'conflicting_observations';
        const attributed=[...new Set(group.actualObservations.map(x=>x.actualIncrementalCommission).filter(x=>x!==null&&x!==undefined))];
        group.actualIncrementalCommission=attributed.length===1?attributed[0]:null;
        group.attributionStatus=attributed.length===1?'documented_method_recorded':attributed.length>1?'conflicting_attribution_records':'unknown';
        group.note=group.attributionStatus==='documented_method_recorded'?'Incremental commission was explicitly entered with an attribution method; review its supporting basis.':'Observed transaction commission is not evidence of incremental commission caused by the action.';
        rows.push({runId:snapshot.runId,createdAt:snapshot.createdAt,...group});
      }
    }
    return rows;
  }
  root.DealFlowAudit={validateOutcomeEvent,appendOutcomeEvent,migrateLegacyOutcomes,deriveCurrentOutcomes,createRecommendationSnapshot,validateSnapshot,appendRecommendationSnapshot,reconcile};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DealFlowAudit;
})(typeof globalThis!=='undefined'?globalThis:this);
