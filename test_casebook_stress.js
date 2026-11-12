const assert = require('node:assert/strict');
const fs = require('node:fs');
const E = require('./engine.js');

const caseData = JSON.parse(fs.readFileSync('validation/stress_tests/DF-STRESS-001.json', 'utf8'));
assert.equal(caseData.case_type, 'synthetic_fixture');
assert.equal(caseData.public_context.linked_public_case_id, 'DF-PUBLIC-001');
const actions = caseData.candidate_actions.map(item => ({
  id: item.action_id,
  opportunityId: item.opportunity_id,
  name: item.opportunity_type + ' — ' + item.area,
  action: item.action_description,
  commission: item.net_commission_aed,
  pWith: item.p_close_with_action_pct,
  pWithout: item.p_close_without_action_pct,
  effort: item.effort_minutes,
  deadline: item.deadline_hours,
  dependency: item.dependency_action_id || '',
  confidence: item.confidence_pct,
  evidenceStatus: item.evidence_status,
  evidenceNote: item.assumption_notes
}));
const result = E.optimize(actions, caseData.capacity_hours);
assert.equal(result.value, 15700);
assert.equal(result.minutes, 165);
assert.deepEqual(result.items.map(item => item.id), ['ST-ACT-001', 'ST-ACT-005', 'ST-ACT-002', 'ST-ACT-003']);
assert.equal(E.portfolioValue(result.items), 14100, 'duplicate opportunity commission lift must not be added twice');
console.log('Public casebook benchmark + optimization stress parity: passed.');
