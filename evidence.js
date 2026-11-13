'use strict';
(function(root){
  const KINDS=new Set(['assumption','estimate','observation','verified_fact']);
  const QUALITIES=new Set(['none','low','medium','high']);
  const SOURCE_TYPES=new Set(['user_input','public_source','document','system_record','third_party_confirmation','synthetic_demo']);
  const SCHEMA_VERSION=1;
  const LEGACY_PREFIX='legacy-evidence:';
  const CLAIMS=['commission','pWith','pWithout'];

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalizeAction(action){
    return {
      confidence:50,evidenceStatus:'unverified',evidenceUrl:'',
      evidenceUpdatedAt:'',evidenceNote:'',...clone(action)
    };
  }
  function isKnownSeed(action,seeds){
    const seed=seeds.find(x=>x.id===action.id);
    return Boolean(seed && action.opportunityId===seed.opportunityId &&
      action.name===seed.name && action.action===seed.action);
  }
  function makeAssumptionRecord(action,claimKey){
    return {
      id:'assumption:'+action.id+':'+claimKey,
      subjectType:'action',subjectId:action.id,claimKey,claimValue:action[claimKey],
      kind:'assumption',quality:'none',sourceType:'user_input',sourceRef:'',
      capturedAt:null,observedAt:null,verifiedAt:null,verifiedBy:null,
      note:'User-entered scenario assumption; no supporting source has been recorded.',
      isSynthetic:false,supersedesId:null
    };
  }
  function makeSyntheticRecord(action,claimKey){
    return {
      id:'synthetic:'+action.id+':'+claimKey,
      subjectType:'action',subjectId:action.id,claimKey,claimValue:action[claimKey],
      kind:'assumption',quality:'none',sourceType:'synthetic_demo',sourceRef:'',
      capturedAt:null,observedAt:null,verifiedAt:null,verifiedBy:null,
      note:'Synthetic Alpha demo scenario input; not observed agent or transaction data.',
      isSynthetic:true,supersedesId:null
    };
  }
  function currentClaimEvidence(records,subjectId,claimKey){
    if(!Array.isArray(records))throw new Error('Evidence must be an array.');
    const scoped=records.filter(record=>record&&record.subjectType==='action'&&record.subjectId===subjectId&&record.claimKey===claimKey);
    const superseded=new Set(scoped.map(record=>record.supersedesId).filter(Boolean));
    const current=scoped.filter(record=>!superseded.has(record.id));
    if(current.length>1)throw new Error('Multiple current evidence records for '+subjectId+'/'+claimKey+'.');
    return current[0]||null;
  }
  function claimEvidenceHistory(records,subjectId,claimKey){
    if(!Array.isArray(records))throw new Error('Evidence must be an array.');
    return records.filter(record=>record&&record.subjectType==='action'&&record.subjectId===subjectId&&record.claimKey===claimKey);
  }
  function validateConfidence(value){
    if(value===null||value===undefined||typeof value==='boolean'||String(value).trim()===''||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>100)
      return 'Confidence must be a number from 0 to 100.';
    return null;
  }
  function reviseClaimEvidence(records,action,input){
    if(!Array.isArray(records))throw new Error('Evidence must be an array.');
    if(!action||typeof action.id!=='string'||!action.id.trim())throw new Error('A valid action is required.');
    if(!input||!CLAIMS.includes(input.claimKey))throw new Error('Evidence must be attached to commission or a close-probability claim.');
    if(!Number.isFinite(Number(action[input.claimKey])))throw new Error('The selected action claim must have a numeric value.');
    const synthetic=action.isSynthetic===true;
    if(synthetic&&((input.kind&&input.kind!=='assumption')||(input.quality&&input.quality!=='none')||(input.sourceType&&input.sourceType!=='synthetic_demo')))
      throw new Error('Synthetic demo evidence must remain an assumption with none quality and synthetic_demo provenance.');
    const current=currentClaimEvidence(records,action.id,input.claimKey);
    const capturedAt=input.capturedAt||new Date().toISOString();
    const baseId=input.id||('evidence:'+action.id+':'+input.claimKey+':'+Date.parse(capturedAt));
    let id=baseId,revision=1;
    while(records.some(record=>record&&record.id===id))id=baseId+':rev'+revision++;
    const record={
      id,subjectType:'action',subjectId:action.id,claimKey:input.claimKey,claimValue:action[input.claimKey],
      kind:synthetic?'assumption':(input.kind||'assumption'),
      quality:synthetic?'none':(input.quality||'none'),
      sourceType:synthetic?'synthetic_demo':(input.sourceType||'user_input'),
      sourceRef:synthetic?'':String(input.sourceRef||'').trim(),
      capturedAt,observedAt:input.observedAt||null,verifiedAt:input.verifiedAt||null,
      verifiedBy:input.verifiedBy?String(input.verifiedBy).trim():null,
      note:String(input.note||'').trim()||(synthetic?'Synthetic demo scenario input; not real-world evidence.':''),
      isSynthetic:synthetic,recordVersion:2,supersedesId:current?current.id:null
    };
    const next=[...records,record],errors=validateEvidence(next);
    if(errors.length)throw new Error(errors.join('\n'));
    return next;
  }
  function summarizeActionEvidence(records,actionId){
    const labels={commission:'commission',pWith:'P(with action)',pWithout:'P(without action)'};
    const claims=CLAIMS.map(claimKey=>{
      const record=currentClaimEvidence(records,actionId,claimKey);
      return {claimKey,label:labels[claimKey],quality:record?record.quality:'none',kind:record?record.kind:'assumption',isSynthetic:record?record.isSynthetic:false};
    });
    const distinct=[...new Set(claims.map(item=>item.quality))];
    return {claims,summary:distinct.length===1?distinct[0]:'mixed',supportedCount:claims.filter(item=>item.quality!=='none').length,
      detail:claims.map(item=>item.label+': '+item.quality).join(' · ')};
  }
  function syncActionClaims(action,evidence){
    if(!Array.isArray(evidence))throw new Error('Evidence must be an array.');
    for(const claimKey of CLAIMS){
      const prior=currentClaimEvidence(evidence,action.id,claimKey);
      if(prior&&Object.is(prior.claimValue,action[claimKey]))continue;
      if(prior&&JSON.stringify(prior.claimValue)===JSON.stringify(action[claimKey]))continue;
      let id='assumption:'+action.id+':'+claimKey;
      if(prior){
        let revision=1;
        do{id=prior.id+':rev'+revision++;}while(evidence.some(record=>record.id===id));
      }else if(evidence.some(record=>record.id===id)){
        let revision=1;
        do{id='assumption:'+action.id+':'+claimKey+':rev'+revision++;}while(evidence.some(record=>record.id===id));
      }
      const synthetic=action.isSynthetic===true;
      evidence.push({
        id,subjectType:'action',subjectId:action.id,claimKey,claimValue:action[claimKey],
        kind:'assumption',quality:'none',sourceType:synthetic?'synthetic_demo':'user_input',
        sourceRef:'',capturedAt:new Date().toISOString(),observedAt:null,verifiedAt:null,verifiedBy:null,
        note:synthetic?'Updated synthetic Alpha demo scenario input; not real-world evidence.':'Updated user-entered scenario assumption; supporting evidence has not been recorded.',
        isSynthetic:synthetic,supersedesId:prior?prior.id:null
      });
    }
    return evidence;
  }
  function hasLegacyEvidence(action){
    return (action.evidenceStatus && action.evidenceStatus!=='unverified') ||
      Boolean(action.evidenceUrl||action.evidenceUpdatedAt||action.evidenceNote);
  }
  function makeLegacyRecord(action){
    const status=action.evidenceStatus||'unverified';
    const url=action.evidenceUrl||'';
    const isSynthetic=action.isSynthetic===true;
    return {
      id:LEGACY_PREFIX+action.id,
      subjectType:'action',subjectId:action.id,claimKey:'legacyEvidence',
      claimValue:{status,url,updatedAt:action.evidenceUpdatedAt||'',note:action.evidenceNote||''},
      kind:status==='unverified'?'assumption':'observation',
      quality:'none',sourceType:isSynthetic?'synthetic_demo':(url?'public_source':'user_input'),
      sourceRef:url,capturedAt:null,observedAt:null,verifiedAt:null,verifiedBy:null,
      note:'Migrated from Alpha 01.2 legacy evidence fields. The prior status is retained as metadata; it does not establish verification or evidence quality.',
      isSynthetic,supersedesId:null,
      legacyMetadata:{evidenceStatus:status,evidenceUrl:url,evidenceUpdatedAt:action.evidenceUpdatedAt||'',evidenceNote:action.evidenceNote||''}
    };
  }
  function validateRecord(record){
    if(!record||typeof record!=='object'||Array.isArray(record))return 'must be an object';
    for(const key of ['id','subjectType','subjectId','claimKey','sourceType','note'])
      if(typeof record[key]!=='string'||!record[key].trim())return key+' must be non-empty text';
    if(typeof record.sourceRef!=='string')return 'sourceRef must be text';
    if(!KINDS.has(record.kind))return 'kind is invalid';
    if(!QUALITIES.has(record.quality))return 'quality is invalid';
    if(!SOURCE_TYPES.has(record.sourceType))return 'sourceType is invalid';
    for(const key of ['capturedAt','observedAt','verifiedAt'])
      if(record[key]!==null && record[key]!==undefined && (typeof record[key]!=='string'||Number.isNaN(Date.parse(record[key]))))return key+' must be a valid timestamp or null';
    if(record.verifiedBy!==null && record.verifiedBy!==undefined && typeof record.verifiedBy!=='string')return 'verifiedBy must be text or null';
    if(typeof record.isSynthetic!=='boolean')return 'isSynthetic must be boolean';
    if(record.supersedesId!==null && record.supersedesId!==undefined && typeof record.supersedesId!=='string')return 'supersedesId must be text or null';
    if(record.recordVersion!==undefined&&record.recordVersion!==2)return 'recordVersion must be 2 when present';
    if(record.recordVersion===2&&record.quality!=='none'&&!record.sourceRef.trim())return 'non-none evidence quality requires a source reference';
    if(record.kind==='verified_fact' && (!record.verifiedAt||!record.verifiedBy||!record.verifiedBy.trim()||record.quality==='none'||record.sourceType==='synthetic_demo'||(record.recordVersion===2&&!record.sourceRef.trim())))return 'verified_fact requires a verification timestamp, verifier, non-none evidence quality, and non-synthetic source; new records also require a source reference';
    if(record.isSynthetic && record.sourceType!=='synthetic_demo')return 'synthetic records must use synthetic_demo sourceType';
    if(record.sourceType==='synthetic_demo' && !record.isSynthetic)return 'synthetic_demo sourceType requires isSynthetic=true';
    if(record.recordVersion===2&&record.isSynthetic&&record.quality!=='none')return 'new synthetic records must retain none quality';
    return null;
  }
  function validateEvidence(records){
    if(!Array.isArray(records))return ['Evidence must be an array.'];
    const ids=new Set(),errors=[];
    for(const record of records){
      const error=validateRecord(record);
      if(error)errors.push('Evidence record '+(record&&record.id||'?')+': '+error+'.');
      else if(ids.has(record.id))errors.push('Duplicate evidence record ID: '+record.id+'.');
      else ids.add(record.id);
    }
    return errors;
  }
  function migrateState(input,seeds){
    if(!input||typeof input!=='object'||!Array.isArray(input.actions)||!Array.isArray(input.outcomes))
      throw new Error('Backup must contain actions and outcomes arrays.');
    const state=clone(input);
    const actions=state.actions.map(normalizeAction);
    const evidence=Array.isArray(state.evidence)?state.evidence: (state.evidence===undefined?[]:null);
    if(!evidence)throw new Error('Evidence must be an array.');
    const existingIds=new Set(evidence.map(x=>x&&x.id));
    const subjectClaims=new Set(evidence.map(x=>x&&x.subjectType==='action'?x.subjectId+'|'+x.claimKey:''));
    for(const action of actions){
      if(!action.id||typeof action.id!=='string')throw new Error('Every action needs a non-empty ID before evidence migration.');
      const synthetic=isKnownSeed(action,seeds);
      if(synthetic)action.isSynthetic=true;
      for(const claimKey of CLAIMS){
        const key=action.id+'|'+claimKey;
        if(!subjectClaims.has(key)){
          const record=synthetic?makeSyntheticRecord(action,claimKey):makeAssumptionRecord(action,claimKey);
          if(!existingIds.has(record.id)){evidence.push(record);existingIds.add(record.id);}
          subjectClaims.add(key);
        }
      }
      if(hasLegacyEvidence(action)){
        const record=makeLegacyRecord(action);
        if(!existingIds.has(record.id)){evidence.push(record);existingIds.add(record.id);}
      }
      syncActionClaims(action,evidence);
    }
    const errors=validateEvidence(evidence);
    if(errors.length)throw new Error(errors.join('\n'));
    state.version='1.3';
    state.schemaVersion=SCHEMA_VERSION;
    state.actions=actions;
    state.evidence=evidence;
    state.outcomes=state.outcomes;
    state.history=Array.isArray(state.history)?state.history:[];
    return state;
  }
  function createInitialState(seeds){
    const actions=seeds.map(x=>({...normalizeAction(x),isSynthetic:true}));
    const evidence=[];
    for(const action of actions)for(const claimKey of CLAIMS)evidence.push(makeSyntheticRecord(action,claimKey));
    return {version:'1.3',schemaVersion:SCHEMA_VERSION,actions,evidence,outcomes:[],history:[]};
  }
  root.DealFlowEvidence={SCHEMA_VERSION,KINDS:[...KINDS],QUALITIES:[...QUALITIES],SOURCE_TYPES:[...SOURCE_TYPES],
    normalizeAction,migrateState,createInitialState,validateEvidence,syncActionClaims,currentClaimEvidence,claimEvidenceHistory,
    validateConfidence,reviseClaimEvidence,summarizeActionEvidence};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.DealFlowEvidence;
})(typeof globalThis!=='undefined'?globalThis:this);
