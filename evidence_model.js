'use strict';
(function(root){
  const VOLATILE = new Set(['buyer_intent','buyer_readiness','listing_availability','property_terms','seller_mandate','market_comparable','agent_context']);
  const RELATIONS = new Set(['supports','contradicts','context_only','unassessed']);
  const LEVELS = new Set(['agent_reported','agent_documented','independently_verified','unverified']);
  function timestamp(value){
    if(typeof value!=='string'||!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$/.test(value)) return null;
    const n=Date.parse(value); return Number.isFinite(n)?n:null;
  }
  function result(ok,reasonCode,nextStep,detail){return{ok,decision:ok?'ELIGIBLE':'ABSTAIN',reasonCode,nextStep:nextStep||null,detail:detail||''};}
  function evaluateClaim(claim,evidence,policy,asOf){
    if(!claim||!claim.claimId||!claim.evidenceType||!Array.isArray(evidence)||!evidence.length) return result(false,'MISSING_CLAIM_OR_EVIDENCE','attach_claim_matched_evidence','Claim and at least one evidence record are required.');
    const now=timestamp(asOf); if(now===null)return result(false,'INVALID_EVALUATION_TIMESTAMP','correct_evaluation_timestamp','Evaluation time must be an ISO 8601 timestamp with timezone.');
    const matching=evidence.filter(e=>e&&e.claimId===claim.claimId&&e.evidenceType===claim.evidenceType);
    if(!matching.length)return result(false,'CLAIM_EVIDENCE_MISMATCH','attach_claim_matched_evidence','No evidence record is linked to this claim and evidence category.');
    const usable=[];
    for(const e of matching){
      if(!e.evidenceId||!e.sourceType||!RELATIONS.has(e.supportRelation)||!LEVELS.has(e.verificationLevel)||typeof e.supportNote!=='string'||!e.supportNote.trim())continue;
      const recorded=timestamp(e.recordedAt); if(recorded===null)continue;
      if(e.validUntil!==null&&e.validUntil!==undefined){const expiry=timestamp(e.validUntil);if(expiry===null||expiry<now)continue;}
      if(e.supportRelation!=='supports')continue;
      const sourceBacked=!!e.sourceReference;
      if(sourceBacked&&timestamp(e.sourceCheckedAt)===null)continue;
      if(VOLATILE.has(claim.evidenceType)){
        const observed=timestamp(e.observedAt); if(observed===null) return result(false,'MISSING_OBSERVATION_TIMESTAMP','reconfirm_'+claim.evidenceType,'Time-sensitive claim has no valid observation timestamp.');
        if(!policy||!Number.isFinite(policy.maxAgeMinutes)||policy.maxAgeMinutes<0)return result(false,'INVALID_FRESHNESS_POLICY','configure_evidence_policy','A non-negative category-specific maxAgeMinutes policy is required for volatile evidence.');
        const age=(now-observed)/60000;
        if(age<0)return result(false,'FUTURE_OBSERVATION_TIMESTAMP','verify_observation_time','Evidence observation is later than the evaluation time.');
        if(age>policy.maxAgeMinutes)return result(false,'STALE_VOLATILE_CLAIM','reconfirm_'+claim.evidenceType,'Observation is '+age+' minutes old; policy permits '+policy.maxAgeMinutes+' minutes.');
      } else if(claim.evidenceType==='historical_transaction'){
        if(timestamp(e.observedAt)===null)return result(false,'MISSING_HISTORICAL_EVENT_TIMESTAMP','verify_historical_record','Historical event requires its event timestamp.');
      } else if(timestamp(e.observedAt)===null){
        return result(false,'MISSING_OBSERVATION_TIMESTAMP','reconfirm_'+claim.evidenceType,'Evidence observation timestamp is missing.');
      }
      usable.push(e);
    }
    if(usable.length)return result(true,claim.evidenceType==='historical_transaction'?'VALID_HISTORICAL_EVENT':'FRESH_CLAIM_MATCHED_EVIDENCE',null,'At least one unexpired, claim-matched supporting evidence record passed temporal policy.');
    const linked=matching.find(e=>e&&e.supportRelation!=='supports');
    if(linked)return result(false,'SOURCE_DOES_NOT_SUPPORT_CLAIM',claim.evidenceType==='buyer_readiness'?'obtain_buyer_specific_financing_evidence':'obtain_claim_specific_evidence','Evidence relation is '+linked.supportRelation+'; recency and authenticity do not make it supportive.');
    return result(false,'INSUFFICIENT_OR_INVALID_EVIDENCE','reconfirm_or_verify_evidence','No evidence record satisfied provenance, timestamp, support, and temporal requirements.');
  }
  function evaluateBundle(claims,evidence,policies,asOf){
    if(!Array.isArray(claims)||!claims.length)return result(false,'MISSING_CLAIM_OR_EVIDENCE','attach_claim_matched_evidence','At least one claim is required.');
    for(const claim of claims){const r=evaluateClaim(claim,evidence,(policies||{})[claim.evidenceType],asOf);if(!r.ok)return r;}
    return result(true,'ALL_CLAIMS_SUPPORTED',null,'All claims passed evidence evaluation.');
  }
  const api={VOLATILE_EVIDENCE_TYPES:[...VOLATILE],evaluateClaim,evaluateBundle};
  root.DealFlowEvidenceModel=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
