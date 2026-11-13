# DealFlow — Legacy evidence migration test plan

**Status:** Review draft — not approved for execution  
**Version:** 1.0  
**Date:** 2026-11-14  
**Related specification:** [SERVER_SIDE_EVIDENCE_LIFECYCLE_IMPLEMENTATION_SPEC.md](./SERVER_SIDE_EVIDENCE_LIFECYCLE_IMPLEMENTATION_SPEC.md)  
**Purpose:** Prove that legacy evidence can be classified and migrated without inventing history, losing records, creating false active evidence, or silently altering the source.  
**Execution rule:** Tests must run against disposable copies/fixtures. No production or user dataset migration is authorized.

## 1. Safety invariants

Every test must preserve these invariants:
1. Original source bytes remain unchanged and their checksum remains identical.
2. Migration never invents a historical actor, reason, capture time, or DealFlow recording time.
3. Missing/unknown/ambiguous lifecycle status never defaults to active.
4. Unresolved supersession graph components are quarantined or rejected as a whole; no partial graph commit.
5. Quarantined/rejected records cannot support decisions.
6. Clean records retain stable, deterministic ID mappings and immutable content hashes.
7. Migration dry-run has no persistent ledger side effects.
8. Commit is bound to the exact source checksum and plan hash.
9. Same migration ID/source/plan is idempotent; changed source/plan with same ID is rejected.
10. Any failure is recoverable from the protected source backup without erasing audit history.

## 2. Fixture design

Create version-controlled synthetic fixtures covering:
- clean records with explicit active status;
- explicit revoked and withdrawn records;
- explicit superseded predecessor/successor chain;
- missing, null, malformed, and unknown statuses;
- inconsistent status and supersedesId combinations;
- duplicate/missing IDs;
- missing and contradictory claim keys;
- valid and invalid timestamps;
- multiple successors, cycles, self-links, and dangling references;
- records with sensitive-looking test values to verify redaction/minimization;
- large datasets and mixed schema versions;
- malformed JSON/encoding and truncated backup inputs.

Fixtures must contain no real buyer or agent personal data.

## 3. Test matrix

### A. Source integrity and dry-run isolation

| ID | Scenario | Expected result |
|---|---|---|
| M001 | Run dry-run on valid fixture | Report generated; no ledger writes |
| M002 | Compare source checksum before/after dry-run | Identical |
| M003 | Verify source byte length and source format metadata | Exact match retained |
| M004 | Malformed/truncated source | Dry-run fails safely; source unchanged |
| M005 | Repeat identical dry-run | Same deterministic plan hash and mapping |
| M006 | Change one source byte after plan creation | Commit blocked by checksum mismatch |
| M007 | Re-serialize parsed data and compare with original | System does not claim byte-for-byte identity for reserialized data |

### B. Status classification and uncertainty

| ID | Scenario | Expected result |
|---|---|---|
| M008 | Explicit, consistent active status | Classified explicit_active; migration event time is migration commit time |
| M009 | Missing status | Quarantined; not projected active |
| M010 | Null/empty status | Quarantined |
| M011 | Unknown status string | Quarantined with UNKNOWN_LEGACY_STATUS |
| M012 | Malformed status type | Quarantined |
| M013 | Explicit revoked status | Revoked migration event; actor/reason provenance visibly marked unknown where absent |
| M014 | Explicit withdrawn status | Withdrawn migration event; actor/reason provenance visibly marked unknown where absent |
| M015 | Explicit superseded status with valid link | Eligible for migration only after graph validation |
| M016 | Superseded status with no predecessor/successor link | Quarantined |
| M017 | Active status plus supersedesId inconsistent with graph | Quarantined/rejected; never silently active |
| M018 | Legacy expired status | Expiry treated as derived from validUntil; not imported as a lifecycle terminal event |
| M019 | Legacy capturedAt present | Preserved as source metadata; not promoted to trusted recordedAt |

### C. Supersession graph validation

| ID | Scenario | Expected result |
|---|---|---|
| M020 | One valid A → B chain | Deterministic predecessor/successor events |
| M021 | Valid A → B → C chain | Linear chain; no branching |
| M022 | A has two successors | Entire connected component quarantined/rejected |
| M023 | A → B → A cycle | Entire connected component quarantined/rejected |
| M024 | Self-supersession A → A | Rejected |
| M025 | Dangling predecessor reference | Quarantined/rejected |
| M026 | Dangling successor reference | Quarantined/rejected |
| M027 | Claim identity mismatch | Quarantined/rejected |
| M028 | Cross-tenant relationship | Rejected; no information leak |
| M029 | Duplicate legacy evidence IDs | Quarantined/rejected; no nondeterministic mapping |
| M030 | Multiple predecessor references to same successor | Quarantined unless explicitly supported by approved domain semantics; default reject |

### D. Actor, reason, and time provenance

| ID | Scenario | Expected result |
|---|---|---|
| M031 | Legacy terminal state has no actor | Migration service actor used; actor provenance flagged unknown |
| M032 | Legacy terminal state has no reason | LEGACY_STATUS_IMPORT reason code; historical reason flagged unknown |
| M033 | Legacy terminal state has explicit actor metadata with documented semantics | Preserved as legacy source metadata; not promoted to authenticated actor without proof |
| M034 | Legacy timestamps ambiguous | Preserve raw field; no fabricated event time |
| M035 | Invalid timestamp | Quarantine or reject according to schema policy |
| M036 | Future effective time | Preserve with explicit anomaly and review; no retroactive current-state effect |
| M037 | Timestamp timezone absent | Preserve raw value and mark timezone unknown; do not assume UTC silently |

### E. Determinism, idempotency, and commit authorization

| ID | Scenario | Expected result |
|---|---|---|
| M038 | Same source/version/policy dry-run twice | Same plan hash and ID mapping |
| M039 | Commit without authorized approver | Denied; no ledger writes |
| M040 | Commit with altered plan hash | Denied |
| M041 | Same migration ID, same checksum and plan | Return original committed result; no duplicate events |
| M042 | Same migration ID, changed checksum | Integrity conflict |
| M043 | Same migration ID, changed policy/plan | Integrity conflict |
| M044 | Two concurrent commits for same migration | One commit; other returns idempotent result or conflict, no duplicates |
| M045 | Two independent clean batches | Deterministic isolated commits; no dependency crosses batch boundary |
| M046 | Graph component split across proposed batches | Batch plan rejected; component remains atomic |

### F. Atomicity and failure injection

| ID | Scenario | Expected result |
|---|---|---|
| M047 | Failure before first insert | No records/events committed |
| M048 | Failure after evidence insert, before event insert | Transaction rollback; no orphan record |
| M049 | Failure after event insert, before ledger-head update | Full rollback |
| M050 | Failure during hash computation/verification | Full rollback |
| M051 | Failure after commit but before response | Retry returns original committed result; no duplicate events |
| M052 | Storage unavailable during commit | No success response; no client-side committed fallback |
| M053 | Concurrent lifecycle write changes ledger sequence during migration | Migration conflict; no overwrite or partial commit |

### G. Post-commit verification, privacy, and recovery

| ID | Scenario | Expected result |
|---|---|---|
| M054 | Compare migrated payload hashes with source canonical payloads | All accepted records match expected hashes |
| M055 | Verify event sequence and hash chain | Full valid chain to trusted checkpoint |
| M056 | Verify migration counts and mappings | Counts reconcile exactly across accepted/quarantined/rejected |
| M057 | Inspect event rows/logs for synthetic personal data | No unnecessary personal fields in immutable event metadata or general logs |
| M058 | Restore from protected pre-migration backup into recovery generation | Source state recoverable; audit of migration attempt retained |
| M059 | Corrupt migrated event/hash | Verification fails; affected records excluded from decisions |
| M060 | Remove/truncate event prefix in a test copy | Checkpoint/prefix verification detects divergence |
| M061 | Replay historical decision at pre-migration watermark | Original snapshot remains reproducible according to captured evidence references |
| M062 | Quarantined record queried by Decision Desk | Record excluded; reason surfaced without fallback to legacy status |
| M063 | Cross-tenant read during migration/replay | Denied without disclosing other tenant record existence |

## 4. Property-based and fuzz testing

In addition to the fixed matrix:
- Generate random directed supersession graphs and assert accepted components are acyclic, same-claim, and have at most one successor per predecessor.
- Generate arbitrary missing/unknown status values and assert none become active by default.
- Generate event order, duplicate ID, timestamp, and hash mutations and assert validation fails closed.
- Generate repeated and concurrent migration requests and assert at-most-once committed effects.
- Fuzz malformed encodings, oversized payloads, deeply nested JSON, and invalid Unicode; enforce bounded resource use and safe failure.
- Use deterministic seeds and retain failing seeds as regression fixtures.

## 5. Required reports and evidence

A migration test run is not considered complete unless it produces:
- fixture/version manifest and deterministic seed list;
- source checksums and byte lengths;
- dry-run plan hashes;
- per-case pass/fail results;
- accepted/quarantined/rejected record counts;
- event and sequence counts;
- payload-hash reconciliation;
- chain/checkpoint verification result;
- injected-failure and recovery results;
- privacy/redaction assertions;
- environment and code commit identifiers.

Do not report only an aggregate pass count. Every failure must include case ID, expected behavior, actual behavior, and a reproducible fixture/seed.

## 6. Release gates

Migration implementation is not ready until:
- all fixed tests M001–M063 pass;
- property/fuzz suite has no unresolved critical failures;
- source preservation and no-default-active invariants are independently reviewed;
- atomicity and recovery failure-injection tests pass;
- tenant-isolation and privacy tests pass;
- a complete dry-run report is reviewed by an authorized human;
- a separate commit authorization is recorded against the exact source checksum and plan hash.

Passing synthetic migration tests does not authorize migration of real-agent data. Real-data migration requires separate approval after platform, privacy, backup, and operational readiness review.

## 7. Explicit execution boundary

This file defines tests to implement and run later. It does not mean tests have been implemented or executed. No migration, implementation, deployment, merge, or real-agent data admission is authorized by this plan.
