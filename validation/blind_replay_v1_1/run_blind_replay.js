'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../../..');
const BENCH = path.join(ROOT, 'validation', 'blind_replay_v1_1');
const OUTPUT_DIR = path.join(ROOT, 'artifacts', 'blind_replay_v1_1');
const IMPLEMENTATION_COMMIT = '469992b0f578b285309719cbf490cfaaaea033be';
const EXPECTED = {
  casesBlobSha1: '9f5cc86409763b26351b1f1aa61bb9b8b19418c3',
  sealedBlobSha1: '8c14412e27f457fb72821b76a0443507e211663a',
  sealedSha256: '3cacd2f6158cee5c8d55046c5d37d966d5785ca9eebc00b91b8b0a96ae2d1ff9',
  engineBlobSha1: '7a19cfba06ff452fdd6f67cf1bf9250bc94ce366',
  decisionDeskBlobSha1: '75e097c8d3ea597c6efd25c425e93fcd600c179a',
  answerKeyPlaintextSha256: '7d27e848bebe2bdfed9d8a4f7ad1e45fb3c085d618e9818c6ccf083cd86f4c26'
};

function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
function gitBlobSha1(data) {
  const header = Buffer.from('blob ' + data.length + '\0', 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, data])).digest('hex');
}
function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(label + ' mismatch: expected ' + expected + ', got ' + actual);
}
function readBytes(file) { return fs.readFileSync(file); }
function readJson(file) { return JSON.parse(readBytes(file).toString('utf8')); }
function git(args) { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim(); }

function verifyInputs() {
  const casesRaw = readBytes(path.join(BENCH, 'cases.json'));
  const sealedRaw = readBytes(path.join(BENCH, 'sealed_expected_outcomes.aesgcm.json'));
  const cases = JSON.parse(casesRaw.toString('utf8'));
  const sealed = JSON.parse(sealedRaw.toString('utf8'));

  assertEqual(gitBlobSha1(casesRaw), EXPECTED.casesBlobSha1, 'Cases Git blob SHA-1');
  assertEqual(gitBlobSha1(sealedRaw), EXPECTED.sealedBlobSha1, 'Sealed key Git blob SHA-1');
  assertEqual(sha256(sealedRaw), EXPECTED.sealedSha256, 'Sealed key SHA-256');
  assertEqual(cases.benchmark_id, 'DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1.1', 'Benchmark ID');
  assertEqual(sealed.benchmark_id, cases.benchmark_id, 'Sealed-key benchmark ID');
  assertEqual(cases.schema_version, '1.1', 'Cases schema version');
  assertEqual(cases.count, 18, 'Declared case count');
  assertEqual(cases.cases.length, 18, 'Actual case count');
  assertEqual(sealed.format, 'AES-256-GCM', 'Sealed-key encryption');
  assertEqual(sealed.compression, 'zlib', 'Sealed-key compression');
  assertEqual(sealed.plaintext_sha256, EXPECTED.answerKeyPlaintextSha256, 'Committed plaintext digest');
  if (Object.hasOwn(sealed, 'key') || Object.hasOwn(sealed, 'expected_outcomes')) {
    throw new Error('Plaintext answer material or key material must not appear in the sealed envelope.');
  }
  if (cases.cases.some(c => c.case_type !== 'synthetic_fixture')) {
    throw new Error('Unexpected non-synthetic case type.');
  }

  const engineRaw = readBytes(path.join(ROOT, 'engine.js'));
  const deskRaw = readBytes(path.join(ROOT, 'decision_desk.js'));
  assertEqual(gitBlobSha1(engineRaw), EXPECTED.engineBlobSha1, 'Pinned engine.js Git blob SHA-1');
  assertEqual(gitBlobSha1(deskRaw), EXPECTED.decisionDeskBlobSha1, 'Pinned decision_desk.js Git blob SHA-1');

  const head = git(['rev-parse', 'HEAD']);
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', IMPLEMENTATION_COMMIT, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
  } catch {
    throw new Error('Pinned PR #23 implementation commit is not an ancestor of this replay checkout.');
  }
  if (git(['status', '--porcelain'])) throw new Error('Replay checkout must be clean before execution.');

  return {
    cases,
    integrity: {
      benchmarkId: cases.benchmark_id,
      caseCount: cases.cases.length,
      casesGitBlobSha1: gitBlobSha1(casesRaw),
      sealedEnvelopeGitBlobSha1: gitBlobSha1(sealedRaw),
      sealedEnvelopeSha256: sha256(sealedRaw),
      engineGitBlobSha1: gitBlobSha1(engineRaw),
      decisionDeskGitBlobSha1: gitBlobSha1(deskRaw),
      implementationCommit: IMPLEMENTATION_COMMIT,
      replayCheckoutCommit: head,
      plaintextAnswerKeySha256Commitment: EXPECTED.answerKeyPlaintextSha256,
      answerKeyDecrypted: false
    }
  };
}

function run() {
  const { cases, integrity } = verifyInputs();
  const Engine = require(path.join(ROOT, 'engine.js'));
  const Desk = require(path.join(ROOT, 'decision_desk.js'));
  const reports = [];

  for (const fixture of cases.cases) {
    const actions = fixture.actions;
    const capacity = fixture.capacity_hours;
    const gate = Desk.eligibility(actions, capacity, Engine);
    const eligible = gate.eligibleActions || [];
    const best = gate.decision === 'READY_FOR_OPTIMIZATION'
      ? Engine.optimize(eligible, capacity, [])
      : { value: 0, minutes: 0, items: [] };
    const commission = Engine.greedy(eligible, capacity, a => a.commission, []);
    const hourly = Engine.greedy(eligible, capacity, a => Engine.incremental(a) / (a.effort / 60), []);
    const report = Desk.createReport({
      actions,
      gate,
      best,
      commission,
      hourly,
      engine: Engine,
      capacityHours: capacity,
      generatedAt: new Date().toISOString()
    });
    const validationErrors = Desk.validateOutput(report);
    if (validationErrors.length) {
      throw new Error(fixture.case_id + ' produced invalid Decision Desk output: ' + validationErrors.join(' '));
    }
    reports.push({
      caseId: fixture.case_id,
      theme: fixture.theme,
      capacityHours: capacity,
      inputActionIds: actions.map(a => a.id),
      decision: report.decision,
      selectedActionIds: report.recommendations.map(r => r.actionId),
      excludedActions: report.excludedActions,
      recommendations: report.recommendations,
      abstention: report.abstention,
      portfolio: report.portfolio,
      baselines: report.baselines
    });
  }

  const raw = {
    artifactType: 'DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1.1-RAW-OUTPUTS',
    warning: 'Synthetic benchmark only. These are unscored model outputs; no expected outcomes were accessed.',
    runMetadata: {
      startedAt: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      ciRunId: process.env.GITHUB_RUN_ID || null,
      ciRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      workflow: process.env.GITHUB_WORKFLOW || null,
      eventName: process.env.GITHUB_EVENT_NAME || null,
      integrity
    },
    caseOutputs: reports
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const rawPath = path.join(OUTPUT_DIR, 'raw_outputs.json');
  const rawBytes = Buffer.from(JSON.stringify(raw, null, 2) + '\n', 'utf8');
  fs.writeFileSync(rawPath, rawBytes, { flag: 'wx' });
  const outputSha256 = sha256(rawBytes);
  const frozen = {
    artifactType: 'DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1.1-OUTPUT-COMMITMENT',
    benchmarkId: integrity.benchmarkId,
    implementationCommit: IMPLEMENTATION_COMMIT,
    replayCheckoutCommit: integrity.replayCheckoutCommit,
    rawOutputFile: 'raw_outputs.json',
    rawOutputSha256: outputSha256,
    rawOutputBytes: rawBytes.length,
    answerKeyDecrypted: false,
    scored: false,
    frozenAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'OUTPUT_COMMITMENT.json'), JSON.stringify(frozen, null, 2) + '\n', { flag: 'wx' });
  process.stdout.write(JSON.stringify({
    status: 'BLIND_REPLAY_COMPLETE_OUTPUTS_FROZEN_NOT_SCORED',
    caseCount: reports.length,
    rawOutputSha256: outputSha256,
    implementationCommit: IMPLEMENTATION_COMMIT,
    replayCheckoutCommit: integrity.replayCheckoutCommit,
    answerKeyDecrypted: false
  }, null, 2) + '\n');
}

try { run(); } catch (error) {
  process.stderr.write('BLIND REPLAY STOPPED: ' + (error && error.stack ? error.stack : String(error)) + '\n');
  process.exitCode = 1;
}
