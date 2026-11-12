'use strict';
(function(root){
  const STATUSES=new Set(['completed','not_completed','lost','pending']);
  const EVENT_TYPES=new Set(['outcome_recorded','outcome_corrected']);
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function validateOutcomeEvents(events){
    if(!Array.isArray(events))return ['Outcome events must be an array.'];
    const ids=new Set(),children=new Map(),errors=[];
    for(const e of events){
      if(!e||typeof e!=='object'||Array.isArray(e)){errors.push('Outcome event must be an object.');continue;}
      for(const k of ['eventId','actionId','eventType','status','recordedAt','occurredAt','recordedBy'])
        if(typeof e[k]!=='string'||!e[k].trim())errors.push('Outcome event '+(e.eventId||'?')+': '+k+' must be non-empty text.');
      if(ids.has(e.eventId))errors.push('Duplicate outcome event ID: '+e.eventId+'.');
      ids.add(e.eventId);
      if(!EVENT_TYPES.has(e.eventType))errors.push('Outcome event '+e.eventId+': invalid eventType.');
      if(!STATUSES.has(e.status))errors.push('Outcome event '+e.eventId+': invalid status.');
      if(e.actualCommission!==null&&(!Number.isFinite(e.actualCommission)||e.actualCommission<0))errors.push('Outcome event '+e.eventId+': actualCommission must be null or non-negative.');
      if(!Number.isFinite(e.minutes)||e.minutes<0)errors.push('Outcome event '+e.eventId+': minutes must be non-negative.');
      for(const k of ['recordedAt','occurredAt'])if(typeof e[k]==='string'&&Number.isNaN(Date.parse(e[k])))errors.push('Outcome event '+e.eventId+': '+k+' must be a valid timestamp.');
      if(e.supersedesEventId!==null&&e.supersedesEventId!==undefined){
        if(typeof e.supersedesEventId!=='string'||!e.supersedesEventId.trim())errors.push('Outcome event '+e.eventId+': supersedesEventId must be null or text.');
        children.set(e.supersedesEventId,(children.get(e.supersedesEventId)||0)+1);
      }
    }
    const byId=new Map(events.filter(Boolean).map(e=>[e.eventId,e]));
    for(const e of events.filter(Boolean)){
      if(e.supersedesEventId){
        const prior=byId.get(e.supersedesEventId);
        if(!prior)errors.push('Outcome event '+e.eventId+': superseded event does not exist.');
        else if(prior.actionId!==e.actionId)errors.push('Outcome event '+e.eventId+': cannot supersede another action.');
        if(e.eventType!=='outcome_corrected')errors.push('Superseding events must be outcome_corrected.');
      }else if(e.eventType!=='outcome_recorded')errors.push('Initial outcome events must be outcome_recorded.');
    }
    for(const [id,count] of children)if(count>1)errors.push('Outcome event '+id+' has multiple corrections.');
    return errors;
  }
  function currentEvents(events){
    const superseded=new Set(events.map(e=>e.supersedesEventId).filter(Boolean));
    return events.filter(e=>!superseded.has(e.eventId));
  }
  function projectOutcomes(events){
    return currentEvents(events).map(e=>({id:e.actionId,status:e.status,actualCommission:e.actualCommission,minutes:e.minutes,at:e.occurredAt,updatedAt:e.recordedAt,eventId:e.eventId,notes:e.notes||''}));
  }
  function migrateState(input){
    if(!input||typeof input!=='object')throw new Error('State is required.');
    const state=clone(input);
    if(!Array.isArray(state.outcomeEvents)){
      const legacy=Array.isArray(state.outcomes)?state.outcomes:[];
      state.outcomeEvents=legacy.map(o=>{
        const stamp=o.updatedAt||o.at||'1970-01-01T00:00:00.000Z';
        return {eventId:'legacy-outcome:'+o.id,actionId:String(o.id),eventType:'outcome_recorded',
          status:o.status||'pending',actualCommission:Number.isFinite(o.actualCommission)?o.actualCommission:null,
          minutes:Number.isFinite(o.minutes)?o.minutes:0,occurredAt:o.at||stamp,recordedAt:stamp,
          recordedBy:'legacy_migration',notes:'Migrated from the Alpha 01.3 mutable outcome record.',supersedesEventId:null,
          provenance:'legacy_migration'};
      });
    }
    const errors=validateOutcomeEvents(state.outcomeEvents);
    if(errors.length)throw new Error(errors.join('\\n'));
    state.outcomes=projectOutcomes(state.outcomeEvents);
    state.outcomeSchemaVersion=1;
    return state;
  }
  function appendOutcomeEvent(events,input){
    if(!Array.isArray(events))throw new Error('Outcome events must be an array.');
    const current=currentEvents(events).find(e=>e.actionId===input.actionId)||null;
    const recordedAt=input.recordedAt||new Date().toISOString();
    const event={eventId:input.eventId||input.actionId+':'+Date.parse(recordedAt)+':'+events.length,
      actionId:input.actionId,eventType:current?'outcome_corrected':'outcome_recorded',
      status:input.status,actualCommission:input.actualCommission===undefined?null:input.actualCommission,
      minutes:input.minutes,occurredAt:input.occurredAt||recordedAt,recordedAt,
      recordedBy:input.recordedBy||'user_input',notes:input.notes||'',
      supersedesEventId:current?current.eventId:null,provenance:'user_entered'};
    const next=[...events,event];
    const errors=validateOutcomeEvents(next);
    if(errors.length)throw new Error(errors.join('\\n'));
    return next;
  }
  root.DealFlowOutcomes={validateOutcomeEvents,currentEvents,projectOutcomes,migrateState,appendOutcomeEvent};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DealFlowOutcomes;
})(typeof globalThis!=='undefined'?globalThis:this);
