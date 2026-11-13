'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'regression_cases.json'), 'utf8'));
assert.equal(fixture.contract, 'DEALFLOW-EVIDENCE-TAXONOMY-V1');
assert.equal(fixture.cases.length, 5, 'exactly five targeted evidence contract vectors are required');
const ids = new Set();
for (const item of fixture.cases) {
  assert.ok(item.caseId && !ids.has(item.caseId), 'case IDs must be present and unique');
  ids.add(item.caseId);
  assert.ok(item.evidence.claimId === item.claim.claimId, item.caseId + ': evidence must bind to the exact claim');
  assert.ok(item.evidence.evidenceId, item.caseId + ': evidence identity is required');
  assert.equal(item.evidence.evidenceType, item.evidenceType, item.caseId + ': evidence record category must match the case claim category');
  assert.ok(['supports', 'contradicts', 'context_only', 'unassessed'].includes(item.evidence.supportRelation));
  assert.ok(['agent_reported', 'agent_documented', 'independently_verified', 'unverified'].includes(item.evidence.verificationLevel));
  assert.ok(['ELIGIBLE', 'ABSTAIN'].includes(item.expected.decision));
  assert.ok(item.expected.reasonCode);
}
const byId = Object.fromEntries(fixture.cases.map(x => [x.caseId, x]));
assert.equal(byId['EV-001'].expected.reasonCode, 'STALE_VOLATILE_CLAIM');
assert.equal(byId['EV-002'].expected.reasonCode, 'MISSING_OBSERVATION_TIMESTAMP');
assert.equal(byId['EV-003'].expected.decision, 'ELIGIBLE');
assert.equal(byId['EV-004'].expected.reasonCode, 'VALID_HISTORICAL_EVENT');
assert.equal(byId['EV-005'].expected.reasonCode, 'SOURCE_DOES_NOT_SUPPORT_CLAIM');
assert.equal(byId['EV-004'].evidence.observedAt.slice(0, 4), '2018');
assert.equal(byId['EV-004'].evidence.sourceCheckedAt.slice(0, 4), '2026');
assert.equal(byId['EV-005'].evidence.supportRelation, 'context_only');
console.log('Evidence taxonomy contract fixtures validated: 5 vectors. Decision-engine behavior is intentionally not asserted until the contract is implemented.');
