'use strict';

// Adversarial regression suite for the real Decision Desk eligibility path.
// Every case calls DealFlowDecisionDesk.eligibility; no evaluator-only shortcuts.
// Expected failures describe required safety behavior, not current implementation behavior.

const assert = require('node:assert/strict');
const Engine = require('./engine.js');
const Desk = require('./decision_desk.js');

const AS_OF = '2026-11-13T12:00:00.000Z';
const POLICY = { maxAgeMinutes: 240 };
const failures = [];
const skips = [];

function claim(claimId = 'CLAIM-1', evidenceType = 'buyer_intent') {
  return { claimId, evidenceType, text: 'Synthetic claim ' + claimId };
}
function record(overrides = {}) {
  return {
    evidenceId: 'E-1',
    claimId: 'CLAIM-1',
    evidenceType: 'buyer_intent',
    sourceType: 'agent_report',
    sourceReference: null,
    observedAt: '2026-11-13T11:30:00.000Z',
    recordedAt: '2026-11-13T11:31:00.000Z',
    sourceCheckedAt: null,
    validUntil: null,
    supportRelation: 'supports',
    verificationLevel: 'agent_reported',
    supportNote: 'Synthetic adversarial test evidence.',
    ...overrides
  };
}
function runGate(claims, records, policies = { buyer_intent: POLICY }, asOf = AS_OF) {
  const action = {
    id: 'ADV-1',
    opportunityId: 'ADV-OPP-1',
    name: 'Synthetic adversarial opportunity',
    action: 'Verify evidence',
    commission: 12000,
    pWith: 65,
    pWithout: 40,
    effort: 30,
    deadline: 4,
    confidence: 70,
    evidenceClaims: claims,
    evidenceRecords: records,
    evidenceStatus: 'user_reported',
    evidenceNote: 'Synthetic regression fixture.'
  };
  const gate = Desk.eligibility([action], 2, Engine, {
    asOfDate: '2026-11-13',
    asOfTimestamp: asOf,
    evidencePolicies: policies
  });
  const rejection = gate.rejectedActions.find(x => x.actionId === action.id);
  return {
    decision: gate.decision,
    eligible: gate.eligibleActions.some(x => x.id === action.id),
    reason: rejection?.reason || gate.reasons.join(' | '),
    gate
  };
}
function check(name, fn) {
  try {
    const detail = fn();
    console.log('PASS ' + name + (detail ? ' — ' + detail : ''));
  } catch (error) {
    failures.push({ name, error: error.message });
    console.log('FAIL ' + name + ' — ' + error.message);
  }
}
function expectEligible(result, message) {
  assert.equal(result.decision, 'READY_FOR_OPTIMIZATION', message + '; actual: ' + result.decision + ' / ' + result.reason);
  assert.equal(result.eligible, true, message);
}
function expectAbstain(result, code, message) {
  assert.equal(result.decision, 'ABSTAIN', message + '; actual: ' + result.decision + ' / ' + result.reason);
  assert.equal(result.eligible, false, message);
  assert.ok(result.reason.includes(code), message + '; expected reason code ' + code + ', got: ' + result.reason);
}
function sameOutcome(a, b, message) {
  assert.equal(a.decision, b.decision, message + ': decision differs');
  assert.equal(a.reason, b.reason, message + ': reason differs');
}

// A. A bad/missing-observation supportive record must not mask a separate valid record.
const valid = record({ evidenceId: 'E-VALID' });
const missingObserved = record({ evidenceId: 'E-MISSING-OBS', observedAt: null });
check('A1 valid + missing-observation records (valid first)', () => {
  expectEligible(runGate([claim()], [valid, missingObserved]), 'valid evidence should remain usable');
});
check('A2 valid + missing-observation records (missing first)', () => {
  expectEligible(runGate([claim()], [missingObserved, valid]), 'record order must not change eligibility');
});
check('A3 permutation invariance for A', () => {
  const x = runGate([claim()], [valid, missingObserved]);
  const y = runGate([claim()], [missingObserved, valid]);
  sameOutcome(x, y, 'A evidence permutation');
});

// B. A stale supportive record must not mask a separate valid record.
const stale = record({ evidenceId: 'E-STALE', observedAt: '2026-11-13T06:00:00.000Z' });
check('B1 valid + stale records (valid first)', () => {
  expectEligible(runGate([claim()], [valid, stale]), 'valid evidence should remain usable');
});
check('B2 valid + stale records (stale first)', () => {
  expectEligible(runGate([claim()], [stale, valid]), 'stale record must not mask valid evidence');
});
check('B3 permutation invariance for B', () => {
  const x = runGate([claim()], [valid, stale]);
  const y = runGate([claim()], [stale, valid]);
  sameOutcome(x, y, 'B evidence permutation');
});

// C. A fresh material contradiction must block unqualified eligibility.
const contradiction = record({
  evidenceId: 'E-CONTRADICT',
  supportRelation: 'contradicts',
  supportNote: 'Fresh source explicitly says the buyer withdrew.'
});
check('C fresh support + fresh contradiction abstains', () => {
  expectAbstain(runGate([claim()], [valid, contradiction]), 'CONFLICTING_EVIDENCE', 'unresolved contradiction must block eligibility');
});

// D. Lifecycle handling is tested only if the model explicitly exposes it.
const lifecycleModeled = Array.isArray(Desk.EvidenceModel?.EVIDENCE_STATUSES) ||
  Array.isArray(Desk.EvidenceModel?.RECORD_STATUSES);
if (!lifecycleModeled) {
  skips.push('D lifecycle conflict: revoked/superseded/withdrawn status is not explicitly modeled by the current evidence model; conditional case not applicable yet.');
  console.log('SKIP D lifecycle conflict — no explicit evidence lifecycle status enum in current model');
} else {
  for (const status of ['superseded', 'revoked', 'withdrawn']) {
    check('D ' + status + ' contradiction does not create false conflict', () => {
      const retired = { ...contradiction, evidenceId: 'E-' + status.toUpperCase(), status };
      expectEligible(runGate([claim()], [valid, retired]), 'retired contradiction should not override current support');
    });
  }
}

// E. validUntil is an exclusive expiry instant: <= asOf is expired.
for (const [label, expiry, expected] of [
  ['one millisecond before', '2026-11-13T11:59:59.999Z', false],
  ['exactly equal', AS_OF, false],
  ['one millisecond after', '2026-11-13T12:00:00.001Z', true]
]) {
  check('E validUntil ' + label, () => {
    const result = runGate([claim()], [record({ validUntil: expiry })]);
    if (expected) expectEligible(result, 'evidence remains valid just before expiry');
    else expectAbstain(result, 'EXPIRED_EVIDENCE', 'evidence at or beyond expiry must abstain');
  });
}

// F. Source type cannot bypass source-reference/check provenance by omitting fields.
check('F1 source-backed type with missing reference and check timestamp abstains', () => {
  const item = record({ sourceType: 'listing_portal', sourceReference: null, sourceCheckedAt: null });
  expectAbstain(runGate([claim('CLAIM-1', 'listing_availability')], [
    { ...item, evidenceType: 'listing_availability', observedAt: '2026-11-13T11:30:00Z' }
  ], { listing_availability: POLICY }), 'MISSING_SOURCE_PROVENANCE', 'source-backed evidence must require reference and check time');
});
check('F2 future sourceCheckedAt abstains', () => {
  const item = record({ sourceType: 'listing_portal', sourceReference: 'https://example.invalid/listing/1', sourceCheckedAt: '2026-11-13T12:01:00Z' });
  expectAbstain(runGate([claim()], [item]), 'FUTURE_SOURCE_CHECK_TIMESTAMP', 'future source check cannot support current eligibility');
});
check('F3 source-check chronology before observation is rejected', () => {
  const item = record({ sourceType: 'listing_portal', sourceReference: 'https://example.invalid/listing/1', sourceCheckedAt: '2026-11-13T11:20:00Z', observedAt: '2026-11-13T11:30:00Z' });
  expectAbstain(runGate([claim()], [item]), 'INCOHERENT_PROVENANCE_TIMESTAMPS', 'source-check chronology must be coherent');
});

// G. Future provenance/event timestamps must be rejected across temporal categories.
check('G1 future recordedAt on volatile evidence abstains', () => {
  expectAbstain(runGate([claim()], [record({ recordedAt: '2026-11-13T12:00:00.001Z' })]), 'FUTURE_RECORDED_TIMESTAMP', 'future recording time is invalid');
});
check('G2 future observedAt on nonvolatile evidence abstains', () => {
  const c = claim('CLAIM-NONVOLATILE', 'company_profile');
  const r = record({ claimId: c.claimId, evidenceType: c.evidenceType, observedAt: '2026-11-13T12:00:00.001Z' });
  expectAbstain(runGate([c], [r], {}), 'FUTURE_OBSERVATION_TIMESTAMP', 'future observation must be rejected for every category');
});
check('G3 future event timestamp on historical evidence abstains', () => {
  const c = claim('CLAIM-HIST', 'historical_transaction');
  const r = record({ claimId: c.claimId, evidenceType: c.evidenceType, observedAt: '2026-11-14T00:00:00Z' });
  expectAbstain(runGate([c], [r], {}), 'FUTURE_HISTORICAL_EVENT_TIMESTAMP', 'historical event cannot occur after evaluation time');
});

// H. Strict calendar validation and malformed expiry must not be silently hidden.
check('H1 impossible ISO calendar date is rejected', () => {
  const item = record({ observedAt: '2026-02-30T11:30:00Z' });
  expectAbstain(runGate([claim()], [item]), 'INVALID_OBSERVATION_TIMESTAMP', 'impossible calendar date must be invalid');
});
check('H2 malformed validUntil is explicit even beside valid support', () => {
  const malformedExpiry = record({ evidenceId: 'E-BAD-EXPIRY', validUntil: '2026-02-30T12:00:00Z' });
  const result = runGate([claim()], [valid, malformedExpiry]);
  expectAbstain(result, 'INVALID_EXPIRY_TIMESTAMP', 'invalid material record cannot be hidden by another positive record');
});

// I. Multi-claim evaluation must abstain deterministically if any claim fails.
check('I1 one failing claim in a multi-claim bundle abstains', () => {
  const c1 = claim('CLAIM-GOOD', 'buyer_intent');
  const c2 = claim('CLAIM-BAD', 'listing_availability');
  const good = record({ claimId: c1.claimId, evidenceType: c1.evidenceType });
  const bad = record({ evidenceId: 'E-BAD', claimId: c2.claimId, evidenceType: c2.evidenceType, observedAt: null });
  const result = runGate([c1, c2], [good, bad], { buyer_intent: POLICY, listing_availability: POLICY });
  expectAbstain(result, 'MISSING_OBSERVATION_TIMESTAMP', 'one failed claim must block the action');
});
check('I2 multi-claim failure reason is stable across claim/evidence permutations', () => {
  const c1 = claim('CLAIM-GOOD', 'buyer_intent');
  const c2 = claim('CLAIM-BAD', 'listing_availability');
  const good = record({ claimId: c1.claimId, evidenceType: c1.evidenceType });
  const bad = record({ evidenceId: 'E-BAD', claimId: c2.claimId, evidenceType: c2.evidenceType, observedAt: null });
  const x = runGate([c1, c2], [good, bad], { buyer_intent: POLICY, listing_availability: POLICY });
  const y = runGate([c2, c1], [bad, good], { buyer_intent: POLICY, listing_availability: POLICY });
  sameOutcome(x, y, 'multi-claim permutation');
});
check('I3 duplicate evidence IDs abstain with explicit reason', () => {
  const duplicate = { ...valid, claimId: 'CLAIM-1', evidenceId: valid.evidenceId };
  expectAbstain(runGate([claim()], [valid, duplicate]), 'DUPLICATE_EVIDENCE_ID', 'duplicate IDs must not be silently double-counted');
});

console.log('\nAdversarial eligibility results: ' + (failures.length === 0 ? 'PASS' : 'FAIL') +
  ' — ' + failures.length + ' failing, ' + skips.length + ' skipped.');
if (skips.length) for (const item of skips) console.log('SKIP DETAIL: ' + item);
if (failures.length) {
  for (const item of failures) console.log('REGRESSION: ' + item.name + ' :: ' + item.error);
  process.exitCode = 1;
} else {
  console.log('All applicable adversarial cases passed through DealFlowDecisionDesk.eligibility.');
}
