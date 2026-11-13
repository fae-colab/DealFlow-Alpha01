# Alpha 01.5 — Blind Replay Benchmark v1.1

**Status: sealed; not run; not merged.**

Benchmark ID: `DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1.1`  
Cases: 18 synthetic fixtures  
Decision Desk under test: PR #23 head  
Input branch: `validation/alpha-01.5-blind-replay-benchmark-v1.1`

## What changed from v1
v1.1 preserves the same 18 adversarial synthetic scenarios but gives them a new immutable version identity and a new expected-outcome oracle. The v1 answer-key commitment is not reused. The expected outcomes were independently reasoned from the frozen input cases and declared scoring rules, without inspecting PR #23 outputs or implementation behavior.

The answer key is encrypted with AES-256-GCM. Only the encrypted envelope is committed here; the decryption key and plaintext answer key are held separately. The plaintext SHA-256 commitment is recorded in `EXPECTED_OUTCOMES_COMMITMENT.md`.

## Blindness protocol
- Do not decrypt or inspect the expected outcomes before replay outputs are saved and hashed.
- Do not alter the frozen cases or sealed envelope.
- Run each case through the exact PR #23 head, not a later modified implementation.
- Save raw, unedited outputs and record the exact source SHA and runtime.
- Freeze and hash the output artifact before unsealing.
- Verify the decrypted answer-key SHA-256 before scoring.
- If any commitment fails, stop. Do not silently regenerate a key or modify an expected answer.

## Scoring
Evaluate each case on:
1. RECOMMEND vs ABSTAIN correctness.
2. Exact selected action IDs and schedule feasibility.
3. Incremental commission arithmetic using net agent commission × probability lift.
4. Evidence admissibility, freshness, provenance, and explicit uncertainty.
5. Deadlines, dependencies, capacity, and duplicate-opportunity protection.
6. Fair comparison against feasible alternatives and simple baselines.
7. Quality of the five required answers, including why abstention is appropriate.

Count false recommendations and false abstentions separately. Do not hide arithmetic, evidence, or explanation failures behind a correct top-level decision.

## Scope limitation
This is an engineering behavior benchmark only. All cases and amounts are synthetic AED fixtures. It is not evidence of agent adoption, real-world decision advantage, causal revenue uplift, or realized commission.
