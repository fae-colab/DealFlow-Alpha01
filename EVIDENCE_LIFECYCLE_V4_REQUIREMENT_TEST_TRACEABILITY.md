# DealFlow — v4 Normative Requirement-to-Test Traceability Matrix

**Status:** Documentation-only review artifact. No implementation, migration or test execution is authorized.  
**Baseline:** v4 architecture, server implementation specification and migration/recovery test plan on the v4 documentation branch.  
**Purpose:** Make every architectural guarantee traceable to a normative implementation obligation and an observable acceptance test. This matrix is part of the system contract; a requirement without a test or justified review method is not closed.

## 1. Governing interpretation

The Independent Commit Witness (ICW) is the authoritative lifecycle commit log. The relational database is a transactional projection. Every accepted lifecycle batch has a complete, durable ICW envelope and signed receipt at its commit point. Periodic checkpoints accelerate verification but do not authenticate a database-only tail. No database-only fallback is permitted.

A test is PASS only when all stated positive and negative assertions match. FAIL means any required assertion is violated or forbidden state/action occurs. BLOCKED means a required dependency, pinned fixture, signed parameter register or independent oracle is unavailable; BLOCKED is never PASS. NOT RUN is not evidence.

## 2. Architecture invariant traceability

| Requirement ID | Normative guarantee | Architecture | Server obligation | Acceptance tests |
|---|---|---|---|---|
| AR-01 | Evidence and lifecycle payloads immutable after authoritative commit | §§1, 2, 3, A2–A4 | ICW retains complete canonical envelope; projection applies receipt-bound bytes | 110, 114, 121, 124, 150 |
| AR-02 | Closed lifecycle vocabulary; no reactivation/status setter/delete | §§1, 3, 10 | Only typed commands; no direct DML; witness accepts valid event types only | 112, 128, 166–168; inherited v2-009–021, 031–038, 102–109 |
| AR-03 | Terminal states irreversible | §§3, 4, A2–A4 | ICW validates transition and atomic batch; projection constraints defend in depth | 115–118, 158, 163–165; v3 tests 6–10, 23–27, 87–89 |
| AR-04 | Legacy evidence quarantined absent explicit re-attestation | §§11, A10 | Isolated quarantine namespace; new ID via ordinary create command | v3 tests 79–84; inherited v2-001–008 |
| AR-05 | Supersession is atomic two-event batch | §§4, A4 | Atomic ICW envelope append plus atomic projection transaction | 110, 116, 120–122, 158, 165; v3 tests 1–16 |
| AR-06 | Concurrency, uniqueness and idempotency enforced below application layer and at commit authority | §§4, A2–A4 | ICW CAS/idempotency; database constraints and lock order | 115–118, 121, 122, 158–165; v3 tests 6–29 |
| AR-07 | One sequence authority; only complete batch watermarks | §§5, A2–A5 | ICW assigns sequence; DB cursor is projection only | 110, 115–116, 123–126, 132–138, 158; v3 tests 1–5, 9 |
| AR-08 | Checkpoint trust independent of ordinary DB rollback/admin | §§6, A5–A7 | Separate ICW and checkpoint trust domain, monotonic CAS | 125–138, 166–172; v3 tests 30–52, 97–102, 109 |
| AR-09 | Restore reconciles against latest trusted authoritative history before serving | §§6, A6–A7 | Rebuild projection exclusively from ICW receipts/envelopes | 111–115, 123–138; v3 tests 37–47, 101–102, 109 |
| AR-10 | Lifecycle state and eligibility are separate | §§7, 12 | Eligibility uses verified receipt watermark and versioned evidence rules | 123–126, 151–157, 163–165; v3 tests 87–90 |
| AR-11 | Every finalized recommendation has immutable snapshot, independent integrity and reconstructable context | §§8, A8 | ICW snapshot receipt binds digest to exact ledger receipt | 139–157; v3 tests 53–64, 73–78, 103–108 |
| AR-12 | Later events/policy changes never rewrite historical snapshot | §§8, A8 | Append-only snapshot state/correction stream | 149–157; v3 tests 65–72, 107 |
| AR-13 | Corrections are new linked records | §§8, A8 | Separate correction identity and independent finalization receipt | 149, 157; v3 tests 69–72, 107 |
| AR-14 | Unverifiable history/dependency causes explicit unavailable/abstain, never fallback | §§6, 7, 8, 12, A6–A8 | Typed integrity/provenance/reconstruction states; no DB-only fallback | 111–115, 123–128, 131–138, 140–157; v3 tests 43, 49–52, 77, 90 |
| AR-15 | Immutability scope is limited to authoritative history, not all operational records | §§1, 10 | Role/DDL scope distinguishes lifecycle and operational data | 166–169; v3 tests 65, 86 |

## 3. Review-finding closure mapping

| Finding | Required normative resolution | Primary tests | Closure evidence |
|---|---|---|---|
| F-01 unanchored-tail authenticity | ICW receipt and full immutable batch envelope for every commit; no checkpoint-only trust | 110–128, 133–138 | Receipt/envelope bytes, signatures, tamper/restore reports |
| F-02 snapshot-to-ledger provenance | Snapshot receipt binds exact ICW ledger receipt and proves chain inclusion | 139–144 | Independent verifier output and receipt proof |
| F-03 historical reconstruction | Separate integrity/provenance/reconstruction/recomputation outcomes and pinned artifacts | 151–157 | Golden replay artifacts, dependency manifest and comparison report |
| F-04 executable acceptance contract | Requirement matrix, deterministic oracle and PASS/FAIL/BLOCKED/NOT RUN | §19 and this matrix | Every requirement has tests; every test has fixtures and assertions |
| F-05 checkpoint crash windows | Object-before-CAS ordering, idempotent retry and reconciliation | 129–132 | Fault-injection trace and final anchor/object state |
| F-06 expected-watermark semantics | Command-by-command precondition matrix and idempotent replay behavior | 158–160 | API contract and command matrix fixtures |
| F-07 lifecycle lock/projection semantics | Stable lock target; ICW history authoritative; projections rebuildable and fail closed | 161–165 | Lock-order and stale/corrupt projection reports |
| F-08 pending/finalized exposure | Explicit publication states; all consumers gate actionability | 145–148 | API/cache/export/downstream denial results |
| F-09 privileged-role threat boundary | Enumerated role matrix, separated ICW and DB authority, dual control | 166–172 | IAM/DB grant exports, adversarial role test report |

## 4. Server requirement coverage

| Server contract area | Required behavior | Test coverage |
|---|---|---|
| Authentication and tenant derivation | Trusted context only; no client override | v3 tests 20, 22, 26, 84, 92–93; 166–168 |
| ICW receipt and envelope | Complete durable content; signed receipt; contiguous CAS | 110–118, 125–128 |
| Mutation state machine | PREPARED → WITNESS_COMMITTED → PROJECTION_PENDING → APPLIED_VERIFIED or explicit failure | 119–124 |
| Projection transaction | Entire batch all-or-none; receipt/digest checked before commit | 120–124 |
| Supersession/graph constraints | No fork, merge, cycle, duplicate successor or partial transition | v3 tests 6–16, 23–27; 116, 165 |
| Checkpoint publication | Immutable object before CAS; reconcile after crash | 129–132 |
| Recovery | ICW-only authoritative replay; no re-signing database-only history | 111–115, 133–138 |
| Snapshot finalization | Exact receipt binding, immutable payload and non-actionable pending state | 139–150 |
| Historical verification/recomputation | Distinct result fields and deterministic oracle | 151–157 |
| Watermark preconditions | Explicit command matrix; stale/future/interior semantics | 158–160 |
| Locking/projection consistency | Stable lock, projection mismatch blocks mutation | 161–165 |
| Privileged roles | Capabilities and residual risks explicit | 166–172 |
| Privacy/retention/erasure | Pinned deployment policy; integrity vs reconstruction separation | v3 tests 58–64, 72; 151 |

## 5. Non-testable or review-based obligations

The following require documentary/security review in addition to executable tests. A passing test does not replace approval of these artifacts:

1. **ICW trust-domain design:** provider/service architecture, linearizability and durable-acknowledgement guarantees, administrative ownership, independent credentials and storage retention.
2. **Cryptographic design:** algorithm approval, canonical preimages, key custody, rotation, compromise response and historical verification.
3. **Role matrix:** actual IAM/DB grants, break-glass path, dual-control and audit ownership.
4. **Deployment parameter register:** exact signed thresholds, retention, RPO/RTO, outage and availability behavior.
5. **Privacy/legal review:** data minimization, lawful retention, legal hold, erasure and reconstruction-limited states.
6. **Operational runbooks:** ICW outage, projection rebuild, receipt/object loss, key compromise, restore, fork quarantine and re-enable.
7. **Independent verifier review:** implementation independence, pinned dependencies, reproducible builds and golden vectors.

Each review item must have an owner, artifact reference, version/digest, reviewer, date and explicit accepted/rejected outcome before implementation authorization.

## 6. Mandatory parameter and command matrices

### 6.1 Command watermark matrix

Before implementation authorization, publish a versioned table for `createEvidence`, `supersedeEvidence`, `revokeEvidence`, and `withdrawEvidence` specifying:
- whether expected watermark is required;
- whether it must equal current ICW head or may be an explicit ancestor;
- missing/stale/future/interior watermark outcome;
- whether idempotent replay bypasses fresh-head validation after current authorization;
- exact typed API code and whether an ICW receipt may be created.

Test 158 must instantiate every cell. No command may be left to implementation interpretation.

### 6.2 Signed deployment parameter register

The register must specify concrete values and units for:
- maximum ICW read/append outage tolerance;
- maximum projection lag and reconciliation timeout;
- checkpoint interval and maximum checkpoint age;
- receipt/envelope/object retention and WORM/legal-hold behavior;
- idempotency tombstone retention horizon;
- RPO/RTO and restore acceptance time;
- clock skew tolerance;
- signing-key rotation and historical key retention;
- privacy/erasure policy and permitted reconstruction outcomes;
- alert thresholds and service-level objectives.

Every value has a named owner, approval, effective date, version and digest. Tests load this exact register. Missing or unapproved values block authorization.

## 7. Test evidence record schema

Each executed case must persist:
- requirement and test IDs;
- exact document version/commit;
- fixture and canonical request digests;
- initial ICW receipt/head and DB projection cursor/head;
- actor/role and authorization context;
- operation and injected fault;
- expected typed response and actual response;
- expected and actual receipt delta;
- expected and actual projection state/cursor;
- expected and actual ledger availability/actionability state;
- positive assertions and forbidden-state assertions;
- parameter-register digest;
- verifier, runner, database, ICW and build versions;
- output/log/artifact digests;
- PASS/FAIL/BLOCKED/NOT RUN with reviewer and timestamp.

## 8. Authorization gate

Implementation authorization is blocked until:
- all P0/P1 findings F-01 through F-09 are closed in all three v4 documents;
- all 15 architecture invariants map to normative server obligations and deterministic acceptance tests or approved review-based evidence;
- all inherited v2 cases remain mandatory or are explicitly replaced by stricter, traceable tests;
- ICW architecture/provider semantics and signed parameter register are approved;
- role, cryptographic, privacy and operational reviews are complete;
- protected 18-case post-fix regression artifacts remain unchanged;
- a fresh independent review finds no unresolved critical/high contradiction.

This matrix is documentation only. It does not authorize implementation, test execution, migration, data ingestion, PR #30 merge, or PR #32 readiness/merge.
