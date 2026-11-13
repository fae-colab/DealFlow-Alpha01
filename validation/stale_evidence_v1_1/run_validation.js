'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const cases = require(path.join(ROOT, 'validation/stale_evidence_v1_1/cases_v1_1.json'));
const Engine = require(path.join(ROOT, 'engine.js'));
const Desk = require(path.join(ROOT, 'decision_desk.js'));

// Fixed evaluation date makes this replay deterministic and directly comparable.
const AS_OF_DATE = '2026-11-13';
const MAX_EVIDENCE_AGE_DAYS = Desk.DEFAULT_MAX_EVIDENCE_AGE_DAYS;
const results = [];
for (const fixture of cases.cases) {
  const gate = Desk.eligibility(fixture.actions, fixture.capacity_hours, Engine, {
    asOfDate: AS_OF_DATE,
    maxEvidenceAgeDays: MAX_EVIDENCE_AGE_DAYS
  });
  const eligible = gate.eligibleActions || [];
  const best = gate.decision === 'READY_FOR_OPTIMIZATION'
    ? Engine.optimize(eligible, fixture.capacity_hours, [])
    : { value: 0, minutes: 0, items: [] };
  const commission = Engine.greedy(eligible, fixture.capacity_hours, a => a.commission, []);
  const hourly = Engine.greedy(eligible, fixture.capacity_hours, a => Engine.incremental(a) / (a.effort / 60), []);
  const report = Desk.createReport({
    actions: fixture.actions, gate, best, commission, hourly, engine: Engine,
    capacityHours: fixture.capacity_hours, generatedAt: AS_OF_DATE + 'T00:00:00.000Z'
  });
  const errors = Desk.validateOutput(report);
  if (errors.length) throw new Error(fixture.case_id + ': invalid output: ' + errors.join('; '));
  results.push({
    caseId: fixture.case_id, theme: fixture.theme, decision: report.decision,
    selectedActionIds: report.recommendations.map(x => x.actionId),
    rejectedActions: report.excludedActions,
    abstentionReasons: report.abstention?.reasons || []
  });
}
const br003 = results.find(x => x.caseId === 'BR-003');
if (!br003 || br003.decision !== 'ABSTAIN' ||
    !br003.rejectedActions.some(x => x.actionId === 'A_STALE' && /Evidence is stale/i.test(x.reason))) {
  throw new Error('BR-003 did not abstain for the explicit stale-evidence reason.');
}
const report = {
  reportId: 'DEALFLOW-POST-FIX-EVIDENCE-FRESHNESS-VALIDATION-1.1',
  status: 'COMPLETED_UNSCORED_SYNTHETIC_BEHAVIOR_VALIDATION',
  benchmarkId: cases.benchmark_id,
  evaluationDate: AS_OF_DATE,
  freshnessPolicy: {
    maxEvidenceAgeDays: MAX_EVIDENCE_AGE_DAYS,
    note: '365 days is an explicit configurable default for this validation, not a universally validated real-estate evidence lifetime. Product policy requires domain review.'
  },
  originalV1_1BlindResult: 'Preserved; not modified or overwritten.',
  answerKeyAccessed: false,
  answerKeyDecrypted: false,
  scoredAgainstExpectedOutcomes: false,
  caseCount: results.length,
  br003: br003,
  caseResults: results
};
const out = path.join(__dirname, 'POST_FIX_REPORT.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
const lines = [
  '# DealFlow post-fix evidence-freshness validation v1.1',
  '',
  '**Status:** Completed synthetic behavior validation; unscored against expected outcomes.',
  '',
  '- Benchmark: ' + cases.benchmark_id,
  '- Evaluation date: ' + AS_OF_DATE,
  '- Evidence freshness default: ' + MAX_EVIDENCE_AGE_DAYS + ' days (configurable; requires domain review)',
  '- Cases executed: ' + results.length,
  '- Answer key accessed/decrypted: No',
  '- Original v1.1 blind result: Preserved and not overwritten',
  '',
  '## BR-003 regression',
  '',
  '- Decision: ' + br003.decision,
  '- Rejection: ' + br003.rejectedActions.find(x => x.actionId === 'A_STALE').reason,
  '',
  '## Per-case decisions',
  '',
  '| Case | Theme | Decision | Selected actions |',
  '|---|---|---|---|'
];
for (const x of results) lines.push('| ' + x.caseId + ' | ' + x.theme + ' | ' + x.decision + ' | ' + (x.selectedActionIds.join(', ') || '—') + ' |');
lines.push('', '## Interpretation', '', 'This report demonstrates deterministic software behavior on synthetic fixtures only. It is not a scored benchmark result, real-agent validation, evidence that the 365-day default is appropriate for every evidence type, or proof of revenue uplift.', '');
fs.writeFileSync(path.join(__dirname, 'POST_FIX_REPORT.md'), lines.join('\n'));
process.stdout.write(JSON.stringify({ report: out, cases: results.length, br003: br003.decision, scored: false }, null, 2) + '\n');
