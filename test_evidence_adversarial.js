'use strict';

// Adversarial regression suite for the real Decision Desk eligibility path.
// These tests express the approved evidence contract; baseline failures are expected
// until the implementation is amended on this branch.

const assert = require('node:assert/strict');
const Engine = require('./engine.js');
const Desk = require('./decision_desk.js');

const AS_OF = '2026-11-13T12:00:00.000Z';
const POLICY = { maxAgeMinutes: 240 };
const failures = [];
function claim(claimId = 'CLAIM-1', evidenceType = 'buyer_intent') {
  return { claimId, evidenceType, text: 'Synthetic claim ' + claimId };
}
function record(overrides = {}) {
  return {
    evidenceId: 'E-1', claimId: 'CLAIM-1', evidenceType: 'buyer_intent',
    sourceType: 'agent_report', sourceReference: null,
    observedAt: '2026-11-13T11:30:00.000Z',
    recordedAt: '2026-11-13T11:31:00.000Z', sourceCheckedAt: null,
    validUntil: null, status: 'active', supportRelation: 'supports',
    verificationLevel: 'agent_reported',
    supportNote: 'Synthetic adversarial test evidence.', ...overrides
  };
}
function runGate(claims, records, policies = { buyer_intent: POLICY }, asOf = AS_OF) {
  const action = {
    id: 'ADV-1', opportunityId: 'ADV-OPP-1', name: 'Synthetic adversarial opportunity',
    action: 'Verify evidence', commission: 12000, pWith: 65, pWithout: 40,
    effort: 30, deadline: 4, confidence: 70, evidenceClaims: claims,
    evidenceRecords: records, evidenceStatus: 'user_reported',
    evidenceNote: 'Synthetic regression fixture.'
  };
  const gate = Desk.eligibility([action], 2, Engine, {
    asOfDate: '2026-11-13', asOfTimestamp: asOf, evidencePolicies: policies
  });
  const rejection = gate.rejectedActions.find(x => x.actionId === action.id);
  return { decision: gate.decision, eligible: gate.eligibleActions.some(x => x.id === action.id),
    reason: rejection?.reason || gate.reasons.join(' | '), gate };
}
function check(name, fn) {
  try { const detail = fn(); console.log('PASS ' + name + (detail ? ' — ' + detail : '')); }
  catch (error) { failures.push({ name, error: error.message }); console.log('FAIL ' + name + ' — ' + error.message); }
}
function expectEligible(r, msg) {
  assert.equal(r.decision, 'READY_FOR_OPTIMIZATION', msg + '; actual: ' + r.decision + ' / ' + r.reason);
  assert.equal(r.eligible, true, msg);
}
function expectAbstain(r, code, msg) {
  assert.equal(r.decision, 'ABSTAIN', msg + '; actual: ' + r.decision + ' / ' + r.reason);
  assert.equal(r.eligible, false, msg);
  assert.ok(r.reason.includes(code), msg + '; expected ' + code + ', got: ' + r.reason);
}
function sameOutcome(a, b, msg) {
  assert.equal(a.decision, b.decision, msg + ': decision differs');
  assert.equal(a.reason, b.reason, msg + ': reason differs');
}

const valid = record({ evidenceId: 'E-VALID' });

// A/B/H2: record-local quarantine; one bad record cannot poison separate valid support.
check('A1 valid support survives missing-observation record', () =>
  expectEligible(runGate([claim()], [valid, record({ evidenceId: 'E-MISSING', observedAt: null })]), 'valid record remains usable'));
check('A2 record order does not change result with missing observation', () => {
  const x = runGate([claim()], [valid, record({ evidenceId: 'E-MISSING', observedAt: null })]);
  const y = runGate([claim()], [record({ evidenceId: 'E-MISSING', observedAt: null }), valid]);
  sameOutcome(x, y, 'missing-observation permutation');
});
check('B1 fresh support survives stale record', () =>
  expectEligible(runGate([claim()], [valid, record({ evidenceId: 'E-STALE', observedAt: '2026-11-13T06:00:00Z' })]), 'fresh record remains usable'));
check('B2 record order does not change result with stale evidence', () => {
  const stale = record({ evidenceId: 'E-STALE', observedAt: '2026-11-13T06:00:00Z' });
  sameOutcome(runGate([claim()], [valid, stale]), runGate([claim()], [stale, valid]), 'stale-record permutation');
});
check('H2a malformed expiry is quarantined beside valid support', () => {
  const malformed = record({ evidenceId: 'E-BAD-EXPIRY', validUntil: '2026-02-30T12:00:00Z' });
  expectEligible(runGate([claim()], [valid, malformed]), 'valid evidence must survive a malformed separate record');
});
check('H2b malformed-expiry-only evidence abstains explicitly', () => {
  const malformed = record({ evidenceId: 'E-BAD-EXPIRY', validUntil: '2026-02-30T12:00:00Z' });
  expectAbstain(runGate([claim()], [malformed]), 'INVALID_EXPIRY_TIMESTAMP', 'malformed expiry must be reported when no valid support remains');
});

// C/D: current material contradictions block; retired lifecycle records do not.
const contradiction = record({ evidenceId: 'E-CONTRADICT', supportRelation: 'contradicts',
  supportNote: 'Fresh source explicitly says the buyer withdrew.' });
check('C active material contradiction forces abstention', () =>
  expectAbstain(runGate([claim()], [valid, contradiction]), 'CONFLICTING_EVIDENCE', 'current material contradiction blocks support'));
for (const status of ['superseded', 'revoked', 'withdrawn']) {
  check('D retired ' + status + ' contradiction is excluded', () => {
    const retired = { ...contradiction, evidenceId: 'E-' + status.toUpperCase(), status };
    expectEligible(runGate([claim()], [valid, retired]), 'retired contradiction is audit-only');
  });
}
check('D active contradiction still blocks when a retired support record exists', () => {
  const retiredSupport = record({ evidenceId: 'E-RETIRED-SUPPORT', status: 'superseded' });
  expectAbstain(runGate([claim()], [retiredSupport, contradiction]), 'CONFLICTING_EVIDENCE', 'retired support cannot cancel active contradiction');
});

// E: validUntil is exclusive.
for (const [label, expiry, expected] of [
  ['one millisecond before', '2026-11-13T11:59:59.999Z', false],
  ['exactly equal', AS_OF, false],
  ['one millisecond after', '2026-11-13T12:00:00.001Z', true]
]) {
  check('E expiry boundary ' + label, () => {
    const r = runGate([claim()], [record({ validUntil: expiry })]);
    if (expected) expectEligible(r, 'evidence is valid before exclusive expiry');
    else expectAbstain(r, 'EXPIRED_EVIDENCE', 'evidence is expired at or after validUntil');
  });
}
check('E malformed expiry beside support does not poison claim', () =>
  expectEligible(runGate([claim()], [valid, record({ evidenceId: 'E-MALFORMED', validUntil: 'not-a-date' })]), 'malformed record is quarantined'));

// F: provenance follows sourceType, not whether a URL happened to be supplied.
check('F1 listing portal requires reference and source check', () => {
  const item = record({ sourceType: 'listing_portal', sourceReference: null, sourceCheckedAt: null });
  expectAbstain(runGate([claim('CLAIM-1', 'listing_availability')], [
    { ...item, evidenceType: 'listing_availability' }
  ], { listing_availability: POLICY }), 'MISSING_SOURCE_PROVENANCE', 'portal provenance is mandatory');
});
check('F2 future sourceCheckedAt is rejected', () => {
  const item = record({ sourceType: 'listing_portal', sourceReference: 'https://example.invalid/listing/1',
    sourceCheckedAt: '2026-11-13T12:00:00.001Z' });
  expectAbstain(runGate([claim()], [item]), 'FUTURE_SOURCE_CHECK_TIMESTAMP', 'future source check is invalid');
});
check('F3 source check cannot precede observation', () => {
  const item = record({ sourceType: 'listing_portal', sourceReference: 'https://example.invalid/listing/1',
    sourceCheckedAt: '2026-11-13T11:20:00Z', observedAt: '2026-11-13T11:30:00Z' });
  expectAbstain(runGate([claim()], [item]), 'INCOHERENT_PROVENANCE_TIMESTAMPS', 'source-check chronology is incoherent');
});
check('F4 agent report needs no external URL or source check', () =>
  expectEligible(runGate([claim()], [valid]), 'agent report is explicitly agent-reported'));
check('F5 unknown source type abstains', () => {
  const item = record({ sourceType: 'mystery_source', sourceReference: 'record://unknown/1',
    sourceCheckedAt: '2026-11-13T11:30:00Z' });
  expectAbstain(runGate([claim()], [item]), 'UNSUPPORTED_SOURCE_TYPE', 'unknown source types cannot be silently downgraded');
});

// G/H: strict timestamps, chronology and distinct historical event time.
check('G1 future recordedAt is rejected', () =>
  expectAbstain(runGate([claim()], [record({ recordedAt: '2026-11-13T12:00:00.001Z' })]), 'FUTURE_RECORDED_TIMESTAMP', 'record cannot be recorded in the future'));
check('G2 future observation is rejected for nonvolatile evidence', () => {
  const c = claim('CLAIM-NONVOLATILE', 'company_profile');
  const r = record({ claimId: c.claimId, evidenceType: c.evidenceType, observedAt: '2026-11-13T12:00:00.001Z' });
  expectAbstain(runGate([c], [r], {}), 'FUTURE_OBSERVATION_TIMESTAMP', 'future observation is invalid for every category');
});
check('G3 future historical eventAt is rejected', () => {
  const c = claim('CLAIM-HIST', 'historical_transaction');
  const r = record({ claimId: c.claimId, evidenceType: c.evidenceType,
    sourceType: 'authoritative_transaction_record', sourceReference: 'record://synthetic/tx/1',
    observedAt: '2026-11-13T11:00:00Z', recordedAt: '2026-11-13T11:10:00Z',
    sourceCheckedAt: '2026-11-13T11:10:00Z', eventAt: '2026-11-14T00:00:00Z' });
  expectAbstain(runGate([c], [r], {}), 'FUTURE_HISTORICAL_EVENT_TIMESTAMP', 'historical event cannot occur after evaluation time');
});
check('G4 recordedAt cannot precede observedAt', () =>
  expectAbstain(runGate([claim()], [record({ observedAt: '2026-11-13T11:40:00Z', recordedAt: '2026-11-13T11:35:00Z' })]), 'INCOHERENT_PROVENANCE_TIMESTAMPS', 'recording cannot predate observation'));
check('H1 impossible calendar date is rejected', () =>
  expectAbstain(runGate([claim()], [record({ observedAt: '2026-02-30T11:30:00Z' })]), 'INVALID_OBSERVATION_TIMESTAMP', 'impossible calendar date is invalid'));
check('G5 historical evidence requires a distinct eventAt', () => {
  const c = claim('CLAIM-HIST-MISSING', 'historical_transaction');
  const r = record({ claimId: c.claimId, evidenceType: c.evidenceType,
    sourceType: 'authoritative_transaction_record', sourceReference: 'record://synthetic/tx/missing-event',
    observedAt: '2026-11-13T10:00:00Z', recordedAt: '2026-11-13T10:05:00Z',
    sourceCheckedAt: '2026-11-13T10:00:00Z' });
  expectAbstain(runGate([c], [r], {}), 'MISSING_HISTORICAL_EVENT_TIMESTAMP', 'historical event date must be explicit');
});
check('H3 historical event uses eventAt, not observedAt freshness', () => {
  const c = claim('CLAIM-HIST-OLD', 'historical_transaction');
  const r = record({ claimId: c.claimId, evidenceType: c.evidenceType,
    sourceType: 'authoritative_transaction_record', sourceReference: 'record://synthetic/tx/old',
    observedAt: '2026-11-13T10:00:00Z', recordedAt: '2026-11-13T10:05:00Z',
    sourceCheckedAt: '2026-11-13T10:00:00Z', eventAt: '2018-06-12T00:00:00Z' });
  expectEligible(runGate([c], [r], {}), 'old event can be valid when its evidence was recently checked');
});

// I: integrity and all-claims-must-pass behavior.
check('I1 duplicate evidence IDs block the bundle', () => {
  const duplicate = { ...valid, claimId: 'CLAIM-1', evidenceId: valid.evidenceId };
  expectAbstain(runGate([claim()], [valid, duplicate]), 'DUPLICATE_EVIDENCE_ID', 'duplicate IDs are integrity failures');
});
check('I2 all required claims must pass', () => {
  const c1 = claim('CLAIM-GOOD', 'buyer_intent'), c2 = claim('CLAIM-BAD', 'listing_availability');
  const good = record({ claimId: c1.claimId, evidenceType: c1.evidenceType });
  const bad = record({ evidenceId: 'E-BAD', claimId: c2.claimId, evidenceType: c2.evidenceType, observedAt: null });
  expectAbstain(runGate([c1, c2], [good, bad], { buyer_intent: POLICY, listing_availability: POLICY }),
    'MISSING_OBSERVATION_TIMESTAMP', 'one failing required claim blocks action');
});
check('I3 deterministic failure selection across claim permutations', () => {
  const cA = claim('CLAIM-A', 'listing_availability'), cB = claim('CLAIM-B', 'company_profile');
  const badA = record({ evidenceId: 'E-A', claimId: cA.claimId, evidenceType: cA.evidenceType, observedAt: null });
  const badB = record({ evidenceId: 'E-B', claimId: cB.claimId, evidenceType: cB.evidenceType, observedAt: null });
  const policies = { listing_availability: POLICY };
  const x = runGate([cA, cB], [badA, badB], policies);
  const y = runGate([cB, cA], [badB, badA], policies);
  sameOutcome(x, y, 'multiple-failure permutation');
  assert.ok(x.reason.includes('CLAIM-A'), 'stable claim-ID ordering should select CLAIM-A first');
});

console.log('\nAdversarial eligibility results: ' + (failures.length === 0 ? 'PASS' : 'FAIL') +
  ' — ' + failures.length + ' failing, 0 skipped.');
if (failures.length) {
  for (const item of failures) console.log('REGRESSION: ' + item.name + ' :: ' + item.error);
  process.exitCode = 1;
} else {
  console.log('All adversarial cases passed through DealFlowDecisionDesk.eligibility.');
}
