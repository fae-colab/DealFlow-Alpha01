# Alpha 01.5 — Adversarial Blind Replay Benchmark v1

## Status

**Frozen synthetic benchmark inputs. Expected outcomes are sealed outside this public repository. DealFlow has not been run against these cases.**

Benchmark ID: `DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1`  
Case count: 18  
Case type: synthetic fixtures only  
Decision Desk implementation under test: PR #23 head at freeze time  
Base: `feature/alpha-01.5-real-agent-blind-replay`

## Integrity and blindness

This repository is public. The expected-outcome key is therefore deliberately **not** stored here. Its exact UTF-8 JSON bytes are held separately, and this file records a SHA-256 commitment:

`66243641c1bad4e1d49ca33d88ab4cd364a1f5c580c1dadc52a42ec2d45479d7`

Before any DealFlow run:
1. Freeze `cases.json` and record its Git commit SHA.
2. Preserve the expected-key file separately. Do not publish or edit it after observing DealFlow outputs.
3. Verify its SHA-256 against the commitment above before unsealing.
4. Run each case against the frozen Decision Desk implementation and save raw outputs.
5. Only then reveal the key and score exact decision/action matches plus reason quality.

This is a **commitment**, not encryption. Anyone with the separate key can read it; do not place that key in the public repository. If the key is lost, do not reconstruct it from memory after seeing outputs—declare the benchmark compromised and create a newly versioned benchmark.

## Synthetic-data boundary

All 18 cases are deliberately invented to probe recommendation and abstention behavior. They are not real or anonymized realtor situations, verified Dubai market facts, actual client/lead/listing/mandate/transaction records, calibrated probabilities, or earned/realized commission.

The `example.invalid` reference in the stale-evidence case is a placeholder only. Positive synthetic cases use the engine's agent-reported provenance path to exercise the recommendation gate; their notes explicitly state that they are synthetic and not actual agent reports. They must never be described as evidence from a real agent.

## Case coverage

| Case | Challenge |
|---|---|
| BR-001 | Urgent low-lift action competing with higher-value action |
| BR-002 | Large gross commission but weak incremental lift |
| BR-003 | Stale evidence |
| BR-004 | Unknown working capacity |
| BR-005 | Infeasible high-value action with feasible alternative |
| BR-006 | Feasible prerequisite chain |
| BR-007 | Infeasible prerequisite chain |
| BR-008 | Duplicate opportunity / commission double-counting |
| BR-009 | Supported agent-reported inputs; false-abstention trap |
| BR-010 | Mixed supported and unverified candidates |
| BR-011 | No positive conversion lift |
| BR-012 | Missing net agent commission |
| BR-013 | Portfolio time-allocation trade-off |
| BR-014 | Optimizer ties simple baselines; no superiority claim |
| BR-015 | Baseline-regression sentinel |
| BR-016 | All candidates unverified |
| BR-017 | High-value action misses deadline; feasible alternative |
| BR-018 | Invalid probability input |

## Scoring rules

Score more than the top-level label:
- Decision correctness: RECOMMEND vs ABSTAIN.
- Action correctness: exact selected action IDs and no prohibited/infeasible selections.
- Evidence discipline: no unsupported claims, stale evidence handling, clear distinction between synthetic/agent-reported/independently verified.
- Commission arithmetic: (C \times (P_{with}-P_{without})), with (C) defined as net agent payout after splits/fees.
- Feasibility: capacity, deadlines, dependencies, and unique-opportunity constraints.
- Comparison quality: compare against feasible alternatives and simple baselines; do not claim superiority on a tie.
- Abstention quality: correct abstentions and false abstentions are both counted.

Do not change expected answers after seeing outputs. If an expected answer is discovered to be logically wrong, preserve the original, document the issue, and create a versioned v1.1 with a new key commitment before any further run.

## Important known challenge

BR-003 deliberately tests evidence freshness. The current Decision Desk gate checks evidence status and the presence of source/date fields for documented/verified items, but does not appear to enforce a freshness policy. If it recommends on BR-003, record a benchmark failure; do not quietly weaken the expected answer.

BR-014 checks baseline ties: a recommendation can be valid, but DealFlow must not claim superiority over a simple baseline that achieves the same result.

BR-015 is a regression sentinel. A correct exact optimizer should not be beaten by a valid baseline using the same inputs and constraints. If no baseline beats it, the expected behavior is a recommendation with no superiority claim. If a baseline does beat it, the correct output is abstention and an optimizer-regression finding. The sealed key records the frozen expected outcome for this fixture.

## Run order

1. Freeze and hash inputs.
2. Verify expected-key commitment.
3. Run DealFlow without opening the key.
4. Save raw outputs and version metadata.
5. Unseal and score.
6. Report every false recommendation and false abstention separately.
7. Do not expose to a real agent on the strength of this synthetic benchmark alone.

This benchmark is an engineering gate, not evidence of decision advantage, agent adoption, causal uplift, or realized commission.
