# Blind replay benchmark v1.1 — integrity commitment

Benchmark ID: `DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1.1`

Status: **SEALED — NOT RUN — DO NOT MERGE**

## Frozen inputs
- Case count: 18
- Case type: synthetic fixtures only
- Cases path: `validation/blind_replay_v1_1/cases.json`
- Cases Git blob SHA-1: `9f5cc86409763b26351b1f1aa61bb9b8b19418c3`
- Source case set: v1's 18 synthetic cases, copied into a separately versioned v1.1 input file; no DealFlow output was used to author expected outcomes.

## Sealed expected-outcome key
- Path: `validation/blind_replay_v1_1/sealed_expected_outcomes.aesgcm.json`
- Encryption: AES-256-GCM over zlib-compressed canonical UTF-8 JSON
- Encrypted-file Git blob SHA-1: `8c14412e27f457fb72821b76a0443507e211663a`
- Encrypted-file SHA-256: `3cacd2f6158cee5c8d55046c5d37d966d5785ca9eebc00b91b8b0a96ae2d1ff9`
- Decrypted canonical answer-key SHA-256: `7d27e848bebe2bdfed9d8a4f7ad1e45fb3c085d618e9818c6ccf083cd86f4c26`
- The AES key is not stored in this repository. The plaintext answer key is not stored in this repository.

The expected outcomes were authored from the frozen inputs and the written scoring rules, without inspecting DealFlow outputs or using PR #23 implementation behavior as an oracle. This is an independent oracle relative to the implementation, not a claim of third-party certification.

## Release gate
1. Verify the cases and encrypted-file Git blob hashes against this commitment.
2. Verify the encrypted-file SHA-256.
3. Run PR #23's exact Decision Desk head against all 18 cases without decrypting the answer key.
4. Save raw outputs, source commit SHA, run timestamp, and execution environment.
5. Freeze the raw output artifact and its digest.
6. Only then decrypt the answer key and verify its plaintext SHA-256 before scoring.
7. Report every case, false recommendation, false abstention, arithmetic discrepancy, evidence failure, feasibility failure, and baseline-comparison failure.

If any input or sealed-key digest fails, stop. Do not run or score the benchmark. If the key is disclosed before raw outputs are frozen, mark v1.1 compromised and issue a new version.

## Synthetic-data boundary
All 18 cases are synthetic. They are not real or anonymized agent situations, Dubai market evidence, actual commission data, or proof of commercial performance. The `user_reported` status is a fixture that exercises the software's provenance path; it is not an actual agent report.
