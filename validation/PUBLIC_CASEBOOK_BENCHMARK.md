# Public Dubai casebook benchmark and optimization stress test

## Scope

- `DF-PUBLIC-001` is the evidence-integrity benchmark. It contains public market observations but no agent-specific pipeline, commission agreement, probabilities, effort, deadlines, or capacity.
- The expected behavior for `DF-PUBLIC-001` is **abstention**: case validation passes, optimizer readiness fails, and no recommendation is fabricated.
- `DF-STRESS-001` is a separate, explicitly synthetic optimization fixture linked to the public case only for market context. All opportunity and numeric business inputs are assumptions, not public facts and not a real agent case.

## Commands

```bash
python -m unittest -v test_validation_cases.py test_casebook_benchmark.py
node test_casebook_stress.js
```

The CI workflow should run both commands in addition to the existing engine, parity, evidence, outcomes, snapshots, and reconciliation suites.

## Stress-fixture expected result

With 3 hours of capacity, the deterministic optimizer should select:

1. `ST-ACT-001` — JVC buyer viewing preparation (30 minutes)
2. `ST-ACT-002` — dependent JVC buyer follow-up (45 minutes)
3. `ST-ACT-003` — Business Bay seller pricing discussion (60 minutes)

Total: 135 minutes; expected incremental commission under the fixture's assumptions: AED 14,100.

The first two actions share one opportunity. Their commission contribution is the maximum action lift for that opportunity (AED 9,600), not the sum of AED 6,000 and AED 9,600. The third action contributes AED 4,500.

This is a deterministic optimizer regression result under invented assumptions. It is **not** evidence that these deals, probabilities, commissions, or outcomes exist in Dubai or for any agent.

## Interpretation

A passing test means the engine follows the tested rules for this fixture. It does not establish that its assumptions are calibrated, that its recommendation would outperform an agent, or that it creates realized incremental commission.
