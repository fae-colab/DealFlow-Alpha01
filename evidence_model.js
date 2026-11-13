'use strict';
(function(root){
  const VOLATILE = new Set(['buyer_intent','buyer_readiness','listing_availability','property_terms','seller_mandate','market_comparable','agent_context']);
  const RELATIONS = new Set(['supports','contradicts','context_only','unassessed']);
  const LEVELS = new Set(['agent_reported','agent_documented','independently_verified','unverified']);
  const STATUSES = new Set(['active','superseded','revoked','withdrawn']);
  const RETIRED = new Set(['superseded','revoked','withdrawn']);
  const SOURCE_TYPES = new Set([
    'agent_report','agent_document','listing_portal','developer_inventory',
    'public_registry','land_department_record','authoritative_transaction_record',
    'transaction_repository','public_market_article'
  ]);
  const SOURCE_BACKED = new Set([
    'agent_document','listing_portal','developer_inventory','public_registry',
    'land_department_record','authoritative_transaction_record',
    'transaction_repository','public_market_article'
  ]);
  const FAILURE_PRIORITY = [
    'MISSING_OBSERVATION_TIMESTAMP','INVALID_OBSERVATION_TIMESTAMP','FUTURE_OBSERVATION_TIMESTAMP',
    'MISSING_RECORDED_TIMESTAMP','INVALID_RECORDED_TIMESTAMP','FUTURE_RECORDED_TIMESTAMP',
    'INCOHERENT_PROVENANCE_TIMESTAMPS','MISSING_SOURCE_PROVENANCE','INVALID_SOURCE_CHECK_TIMESTAMP',
    'FUTURE_SOURCE_CHECK_TIMESTAMP','MISSING_HISTORICAL_EVENT_TIMESTAMP',
    'INVALID_HISTORICAL_EVENT_TIMESTAMP','FUTURE_HISTORICAL_EVENT_TIMESTAMP',
    'INVALID_EXPIRY_TIMESTAMP','EXPIRED_EVIDENCE','STALE_VOLATILE_CLAIM',
    'UNSUPPORTED_SOURCE_TYPE','UNVERIFIED_EVIDENCE','INVALID_EVIDENCE_STATUS',
    'INVALID_FRESHNESS_POLICY','INSUFFICIENT_OR_INVALID_EVIDENCE'
  ];

  function timestamp(value){
    if(typeof value!=='string') return null;
    const m=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/);
    if(!m) return null;
    const year=Number(m[1]), month=Number(m[2]), day=Number(m[3]);
    const hour=Number(m[4]), minute=Number(m[5]), second=Number(m[6]);
    const leap=(year%4===0&&year%100!==0)||year%400===0;
    const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59) return null;
    if(m[8]!=='Z'){
      const oh=Number(m[10]), om=Number(m[11]);
      if(oh>14||om>59||(oh===14&&om!==0)) return null;
    }
    const parsed=Date.parse(value);
    return Number.isFinite(parsed)?parsed:null;
  }

  function result(ok,reasonCode,nextStep,detail){
    return {ok,decision:ok?'ELIGIBLE':'ABSTAIN',reasonCode,nextStep:nextStep||null,detail:detail||''};
  }
  function failure(code,detail,claim){
    const type=claim&&claim.evidenceType||'evidence';
    const next={
      MISSING_OBSERVATION_TIMESTAMP:'reconfirm_'+type,
      INVALID_OBSERVATION_TIMESTAMP:'correct_'+type+'_observation_time',
      FUTURE_OBSERVATION_TIMESTAMP:'verify_observation_time',
      MISSING_RECORDED_TIMESTAMP:'restore_evidence_record_time',
      INVALID_RECORDED_TIMESTAMP:'correct_evidence_record_time',
      FUTURE_RECORDED_TIMESTAMP:'verify_recorded_time',
      INCOHERENT_PROVENANCE_TIMESTAMPS:'reconcile_evidence_timestamps',
      MISSING_SOURCE_PROVENANCE:'attach_source_reference_and_check_time',
      INVALID_SOURCE_CHECK_TIMESTAMP:'correct_source_check_time',
      FUTURE_SOURCE_CHECK_TIMESTAMP:'verify_source_check_time',
      MISSING_HISTORICAL_EVENT_TIMESTAMP:'verify_historical_record',
      INVALID_HISTORICAL_EVENT_TIMESTAMP:'correct_historical_event_time',
      FUTURE_HISTORICAL_EVENT_TIMESTAMP:'verify_historical_event_time',
      INVALID_EXPIRY_TIMESTAMP:'correct_evidence_expiry',
      EXPIRED_EVIDENCE:'refresh_or_replace_expired_evidence',
      STALE_VOLATILE_CLAIM:'reconfirm_'+type,
      UNSUPPORTED_SOURCE_TYPE:'map_source_to_approved_type',
      UNVERIFIED_EVIDENCE:'verify_evidence_or_record_as_context',
      INVALID_EVIDENCE_STATUS:'correct_evidence_lifecycle_status',
      INVALID_FRESHNESS_POLICY:'configure_evidence_policy',
      DUPLICATE_EVIDENCE_ID:'deduplicate_or_reissue_evidence_ids',
      CONFLICTING_EVIDENCE:'resolve_conflicting_evidence',
      SOURCE_DOES_NOT_SUPPORT_CLAIM:type==='buyer_readiness'?'obtain_buyer_specific_financing_evidence':'obtain_claim_specific_evidence',
      INSUFFICIENT_OR_INVALID_EVIDENCE:'reconfirm_or_verify_evidence'
    }[code]||'reconfirm_or_verify_evidence';
    return result(false,code,next,detail);
  }
  function duplicateEvidenceId(evidence){
    const counts=new Map();
    for(const e of evidence||[]){
      if(!e||typeof e.evidenceId!=='string'||!e.evidenceId.trim()) continue;
      counts.set(e.evidenceId,(counts.get(e.evidenceId)||0)+1);
    }
    const duplicates=[...counts.entries()].filter(([,count])=>count>1).map(([id])=>id);
    duplicates.sort((a,b)=>a===b?0:(a<b?-1:1));
    return duplicates[0]||null;
  }
  function recordEvaluation(e,claim,policy,now){
    const status=e.status===undefined||e.status===null?'active':e.status;
    if(!STATUSES.has(status)) return {kind:'invalid',code:'INVALID_EVIDENCE_STATUS',detail:'Evidence status must be active, superseded, revoked, or withdrawn.'};
    if(RETIRED.has(status)) return {kind:'retired'};
    if(typeof e.evidenceId!=='string'||!e.evidenceId.trim()||e.evidenceId.trim()!==e.evidenceId||!e.sourceType||!RELATIONS.has(e.supportRelation)||!LEVELS.has(e.verificationLevel)||typeof e.supportNote!=='string'||!e.supportNote.trim())
      return {kind:'invalid',code:'INSUFFICIENT_OR_INVALID_EVIDENCE',detail:'Active evidence requires an ID, source type, valid relation and verification level, and a non-empty support note.'};
    if(!SOURCE_TYPES.has(e.sourceType))
      return {kind:'invalid',code:'UNSUPPORTED_SOURCE_TYPE',detail:'Unsupported sourceType: '+e.sourceType+'.'};
    const observed=timestamp(e.observedAt);
    if(e.observedAt===null||e.observedAt===undefined||e.observedAt==='') return {kind:'invalid',code:'MISSING_OBSERVATION_TIMESTAMP',detail:'Active evidence requires observedAt.'};
    if(observed===null) return {kind:'invalid',code:'INVALID_OBSERVATION_TIMESTAMP',detail:'observedAt is not a valid strict ISO 8601 timestamp.'};
    if(observed>now) return {kind:'invalid',code:'FUTURE_OBSERVATION_TIMESTAMP',detail:'Evidence observation is later than evaluation time.'};

    const recorded=timestamp(e.recordedAt);
    if(e.recordedAt===null||e.recordedAt===undefined||e.recordedAt==='') return {kind:'invalid',code:'MISSING_RECORDED_TIMESTAMP',detail:'Active evidence requires recordedAt.'};
    if(recorded===null) return {kind:'invalid',code:'INVALID_RECORDED_TIMESTAMP',detail:'recordedAt is not a valid strict ISO 8601 timestamp.'};
    if(recorded>now) return {kind:'invalid',code:'FUTURE_RECORDED_TIMESTAMP',detail:'Evidence record time is later than evaluation time.'};
    if(recorded<observed) return {kind:'invalid',code:'INCOHERENT_PROVENANCE_TIMESTAMPS',detail:'recordedAt cannot precede observedAt.'};

    const needsSource=SOURCE_BACKED.has(e.sourceType);
    if(needsSource&&(!e.sourceReference||typeof e.sourceReference!=='string'||!e.sourceReference.trim()||!e.sourceCheckedAt))
      return {kind:'invalid',code:'MISSING_SOURCE_PROVENANCE',detail:'Source-backed evidence requires a non-empty sourceReference and sourceCheckedAt.'};
    if(e.sourceCheckedAt!==null&&e.sourceCheckedAt!==undefined){
      const checked=timestamp(e.sourceCheckedAt);
      if(checked===null) return {kind:'invalid',code:'INVALID_SOURCE_CHECK_TIMESTAMP',detail:'sourceCheckedAt is not a valid strict ISO 8601 timestamp.'};
      if(checked>now) return {kind:'invalid',code:'FUTURE_SOURCE_CHECK_TIMESTAMP',detail:'Source check is later than evaluation time.'};
      if(checked<observed) return {kind:'invalid',code:'INCOHERENT_PROVENANCE_TIMESTAMPS',detail:'sourceCheckedAt cannot precede observedAt.'};
    }

    if(e.validUntil!==null&&e.validUntil!==undefined){
      const expiry=timestamp(e.validUntil);
      if(expiry===null) return {kind:'invalid',code:'INVALID_EXPIRY_TIMESTAMP',detail:'validUntil is not a valid strict ISO 8601 timestamp.'};
      if(expiry<=now) return {kind:'invalid',code:'EXPIRED_EVIDENCE',detail:'Evidence expired at or before the evaluation instant.'};
    }

    if(claim.evidenceType==='historical_transaction'){
      if(e.eventAt===null||e.eventAt===undefined||e.eventAt==='') return {kind:'invalid',code:'MISSING_HISTORICAL_EVENT_TIMESTAMP',detail:'Historical transaction evidence requires eventAt, separate from observedAt.'};
      const event=timestamp(e.eventAt);
      if(event===null) return {kind:'invalid',code:'INVALID_HISTORICAL_EVENT_TIMESTAMP',detail:'eventAt is not a valid strict ISO 8601 timestamp.'};
      if(event>now) return {kind:'invalid',code:'FUTURE_HISTORICAL_EVENT_TIMESTAMP',detail:'Historical event time is later than evaluation time.'};
    }

    if(VOLATILE.has(claim.evidenceType)){
      if(!policy||!Number.isFinite(policy.maxAgeMinutes)||policy.maxAgeMinutes<0)
        return {kind:'invalid',code:'INVALID_FRESHNESS_POLICY',detail:'A non-negative category-specific maxAgeMinutes policy is required for volatile evidence.'};
      const age=(now-observed)/60000;
      if(age>policy.maxAgeMinutes)
        return {kind:'invalid',code:'STALE_VOLATILE_CLAIM',detail:'Observation is '+age+' minutes old; policy permits '+policy.maxAgeMinutes+' minutes.'};
    }

    if(e.verificationLevel==='unverified') return {kind:'invalid',code:'UNVERIFIED_EVIDENCE',detail:'Unverified evidence cannot support or contradict a claim.'};
    if(e.supportRelation==='supports') return {kind:'support'};
    if(e.supportRelation==='contradicts') return {kind:'contradiction'};
    return {kind:'context'};
  }

  function chooseFailure(errors,claim){
    if(!errors.length) return failure('INSUFFICIENT_OR_INVALID_EVIDENCE','No usable supporting evidence remains.',claim);
    errors.sort((a,b)=>{
      const ai=FAILURE_PRIORITY.indexOf(a.code), bi=FAILURE_PRIORITY.indexOf(b.code);
      const byPriority=(ai<0?999:ai)-(bi<0?999:bi);
      if(byPriority) return byPriority;
      const codeA=String(a.code), codeB=String(b.code);
      if(codeA!==codeB) return codeA<codeB?-1:1;
      const detailA=String(a.detail), detailB=String(b.detail);
      return detailA===detailB?0:(detailA<detailB?-1:1);
    });
    return failure(errors[0].code,errors[0].detail,claim);
  }

  function evaluateClaim(claim,evidence,policy,asOf){
    if(!claim||!claim.claimId||!claim.evidenceType||!Array.isArray(evidence)||!evidence.length)
      return failure('MISSING_CLAIM_OR_EVIDENCE','Claim and at least one evidence record are required.',claim);
    const now=timestamp(asOf);
    if(now===null) return failure('INVALID_EVALUATION_TIMESTAMP','Evaluation time must be a strict ISO 8601 timestamp with timezone.',claim);
    const duplicate=duplicateEvidenceId(evidence);
    if(duplicate) return failure('DUPLICATE_EVIDENCE_ID','Evidence ID '+duplicate+' appears more than once in the evaluation bundle.',claim);
    const matching=evidence.filter(e=>e&&e.claimId===claim.claimId&&e.evidenceType===claim.evidenceType);
    if(!matching.length) return failure('CLAIM_EVIDENCE_MISMATCH','No evidence record is linked to this claim and evidence category.',claim);
    const errors=[];
    let hasSupport=false,hasContradiction=false,hasContext=false;
    for(const e of matching){
      const evaluated=recordEvaluation(e,claim,policy,now);
      if(evaluated.kind==='invalid'){errors.push(evaluated);continue;}
      if(evaluated.kind==='retired') continue;
      if(evaluated.kind==='support') hasSupport=true;
      else if(evaluated.kind==='contradiction') hasContradiction=true;
      else if(evaluated.kind==='context') hasContext=true;
    }
    if(hasContradiction) return failure('CONFLICTING_EVIDENCE','At least one active, valid, claim-matched material contradiction remains unresolved.',claim);
    if(hasSupport) return result(true,claim.evidenceType==='historical_transaction'?'VALID_HISTORICAL_EVENT':'FRESH_CLAIM_MATCHED_EVIDENCE',null,'At least one active, unexpired, claim-matched supporting evidence record passed provenance and temporal policy.');
    if(errors.length) return chooseFailure(errors,claim);
    if(hasContext) return failure('SOURCE_DOES_NOT_SUPPORT_CLAIM','Evidence is contextual or unassessed; it does not support the specific claim.',claim);
    return failure('INSUFFICIENT_OR_INVALID_EVIDENCE','No active supporting evidence record remains.',claim);
  }

  function evaluateBundle(claims,evidence,policies,asOf){
    if(!Array.isArray(claims)||!claims.length) return failure('MISSING_CLAIM_OR_EVIDENCE','At least one claim is required.');
    if(!Array.isArray(evidence)) return failure('MISSING_CLAIM_OR_EVIDENCE','Evidence records must be supplied as an array.');
    const duplicate=duplicateEvidenceId(evidence);
    if(duplicate) return failure('DUPLICATE_EVIDENCE_ID','Evidence ID '+duplicate+' appears more than once in the evaluation bundle.');
    const ordered=claims.slice().sort((a,b)=>{const x=String(a&&a.claimId||''),y=String(b&&b.claimId||'');return x===y?0:(x<y?-1:1);});
    const failures=[];
    for(const claim of ordered){
      const r=evaluateClaim(claim,evidence,(policies||{})[claim&&claim.evidenceType],asOf);
      if(!r.ok) failures.push({claimId:String(claim&&claim.claimId||''),result:r});
    }
    if(failures.length) return failures[0].result;
    return result(true,'ALL_CLAIMS_SUPPORTED',null,'All claims passed evidence evaluation.');
  }

  const api={
    VOLATILE_EVIDENCE_TYPES:[...VOLATILE],
    EVIDENCE_STATUSES:['active','superseded','revoked','withdrawn'],
    SOURCE_TYPES:[...SOURCE_TYPES],
    evaluateClaim,evaluateBundle
  };
  root.DealFlowEvidenceModel=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
