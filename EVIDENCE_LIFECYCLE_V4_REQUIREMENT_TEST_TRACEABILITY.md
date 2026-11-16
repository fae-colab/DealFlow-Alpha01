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
| AR-03 | Terminal states irreversible | §§3, 4, A2–A4 | ICW validates transition and atomic batch; projection constraints defend in depth | 115–118, 158, 163–165; carried-forward tests 6–10, 23–27, 87–89 |
| AR-04 | Legacy evidence quarantined absent explicit re-attestation | §§11, A10 | Isolated quarantine namespace; new ID via ordinary create command | carried-forward tests 79–84; inherited v2-001–008 |
| AR-05 | Supersession is atomic two-event batch | §§4, A4 | Atomic ICW envelope append plus atomic projection transaction | 110, 116, 120–122, 158, 165, 173, 175; carried-forward tests 1–16 |
| AR-06 | Concurrency, uniqueness and idempotency enforced below application layer and at commit authority | §§4, A2–A4 | ICW CAS/idempotency; database constraints and lock order | 115–118, 121, 122, 158–165, 173, 175; carried-forward tests 6–29 |
| AR-07 | One sequence authority; only complete batch watermarks | §§5, A2–A5 | ICW assigns sequence; DB cursor is projection only | 110, 115–116, 123–126, 132–138, 158; carried-forward tests 1–5, 9 |
| AR-08 | Checkpoint trust independent of ordinary DB rollback/admin | §§6, A5–A7 | Separate ICW and checkpoint trust domain, monotonic CAS | 125–138, 166–172; carried-forward tests 30–52, 97–102, 109 |
| AR-09 | Restore reconciles against latest trusted authoritative history before serving | §§6, A6–A7 | Rebuild projection exclusively from ICW receipts/envelopes | 111–115, 123–138; carried-forward tests 37–47, 101–102, 109 |
| AR-10 | Lifecycle state and eligibility are separate | §§7, 12 | Eligibility uses verified receipt watermark and versioned evidence rules | 123–126, 151–157, 163–165; carried-forward tests 87–90 |
| AR-11 | Every finalized recommendation has immutable snapshot, independent integrity and versioned reconstruction dependencies | §§8, A8 | ICW snapshot receipt binds digest to exact ledger receipt | 139–157, 181; carried-forward tests 53–64, 73–78, 103–108 |
| AR-12 | Later events/policy changes never rewrite historical snapshot | §§8, A8 | Append-only snapshot state/correction stream | 149–157; carried-forward tests 65–72, 107 |
| AR-13 | Corrections are new linked records | §§8, A8 | Separate correction identity and independent finalization receipt | 149, 157; carried-forward tests 69–72, 107 |
| AR-14 | Unverifiable history/dependency causes explicit unavailable/abstain, never fallback | §§6, 7, 8, 12, A6–A8 | Typed integrity/provenance/reconstruction states; no DB-only fallback | 111–115, 123–128, 131–138, 140–157, 183–185; carried-forward tests 43, 49–52, 77, 90 |
| AR-15 | Immutability scope is limited to authoritative history, not all operational records | §§1, 10 | Role/DDL scope distinguishes lifecycle and operational data | 166–169; carried-forward tests 65, 86 |

## 3. Review-finding closure mapping

| Finding | Required normative resolution | Primary tests | Closure evidence |
|---|---|---|---|
| F-01 unanchored-tail authenticity | ICW receipt and full immutable batch envelope for every commit; no checkpoint-only trust | 110–128, 133–138 | Receipt/envelope bytes, signatures, tamper/restore reports |
| F-02 snapshot-to-ledger provenance | Snapshot receipt binds exact ICW ledger receipt and proves chain inclusion | 139–144 | Independent verifier output and receipt proof |
| F-03 historical reconstruction | Separate integrity/provenance/reconstruction/recomputation outcomes and pinned artifacts | 151–157 | Golden replay artifacts, dependency manifest and comparison report |
| F-04 executable acceptance contract | Requirement matrix, deterministic oracle and PASS/FAIL/BLOCKED/NOT RUN | Test plan §21 and this matrix | Every requirement has tests; every test has fixtures and assertions |
| F-05 checkpoint crash windows | Object-before-CAS ordering, idempotent retry and reconciliation | 129–132 | Fault-injection trace and final anchor/object state |
| F-06 expected-watermark semantics | Command-by-command precondition matrix and idempotent replay behavior | 158–160, 176–177 | API contract and command matrix fixtures |
| F-07 lifecycle lock/projection semantics | Stable lock target; ICW history authoritative; projections rebuildable and fail closed | 161–165 | Lock-order and stale/corrupt projection reports |
| F-08 pending/finalized exposure | Explicit publication states; all consumers gate actionability | 145–148 | API/cache/export/downstream denial results |
| F-09 privileged-role threat boundary | Enumerated role matrix, separated ICW and DB authority, dual control | 166–172, 186–187 | IAM/DB grant exports, assertion issuer/ICW verification report and adversarial role test report |

## 4. Server requirement coverage

| Server contract area | Required behavior | Test coverage |
|---|---|---|
| Authentication and tenant derivation | Trusted context only; no client override; ICW verifies signed scoped assertion | carried-forward tests 20, 22, 26, 84, 92–93; 166–168, 186–187 |
| ICW receipt and envelope | Complete durable content; signed receipt; contiguous CAS | 110–118, 125–128, 173, 175 |
| Mutation state machine | PREPARED → WITNESS_COMMITTED → PROJECTION_PENDING → APPLIED_VERIFIED or explicit failure | 119–124 |
| Projection transaction | Entire batch all-or-none; receipt/digest checked before commit | 120–124 |
| Supersession/graph constraints | No fork, merge, cycle, duplicate successor or partial transition | carried-forward tests 6–16, 23–27; 116, 165 |
| Checkpoint publication | Immutable object before CAS; reconcile after crash | 129–132 |
| Recovery | ICW-only authoritative replay; no re-signing database-only history | 111–115, 133–138, 182–185 |
| Snapshot finalization | Exact receipt binding, immutable payload and non-actionable pending state | 139–150 |
| Historical verification/recomputation | Distinct result fields and deterministic oracle | 151–157, 181 |
| Watermark preconditions | Explicit command matrix; stale/future/interior semantics | 158–160, 176–177 |
| Locking/projection consistency | Stable lock, projection mismatch blocks mutation; no DB lock across ICW network call | 161–165, 174–175 |
| Privileged roles and authorization assertions | Capabilities, signed assertion issuer and residual risks explicit | 166–172, 186–187 |
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

Binding rule already resolved in v4: every new `createEvidence`, `supersedeEvidence`, `revokeEvidence`, and `withdrawEvidence` command requires the exact current ICW head receipt ID/hash and ending sequence. Missing is a validation error; stale, future, interior or mismatched watermark is a conflict with no receipt. An exact same-key/same-digest idempotent replay returns its original receipt after current authorization recheck even if the head advanced; different digest is an integrity conflict. Test 158 and tests 176–177 instantiate every case. No command is left to implementation interpretation.

### 6.2 Signed deployment parameter register

The register must specify concrete values and units for:
- maximum ICW read/append outage tolerance and maximum age of signed current-head/freshness tokens;
- maximum projection lag and reconciliation timeout;
- checkpoint interval and maximum checkpoint age (operational alert/verification-mode thresholds, not automatic integrity failure);
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


## 9. v4 review-closure matrix updates

The following are binding refinements to the tables above:
- ICW semantic validation is part of AR-03/AR-05/AR-06, not merely application validation (tests 173, 175).
- No database lock or open transaction may be held across the ICW network call (tests 174–175).
- All four lifecycle mutation commands require the exact current ICW head watermark (tests 158, 176); same-key replay is resolved against the original receipt after current authorization (tests 159, 177).
- "Unanchored tail" is retired terminology. The remaining operational lag is the database projection backlog or an ICW receipt not yet summarized by a checkpoint. Tests 48, 50, 180 and 182 exercise checkpoint alerting/verification mode and projection lag; tests 183–185 enforce current-head freshness; every committed batch already has an ICW receipt.
- Sensitive evidence payloads may be encrypted and lawfully erased under the signed privacy policy. Receipt integrity and payload reconstruction are separate outcomes (tests 178–179, 181).
- Snapshot publication state and reconstruction status are separate dimensions (test 181).


## 10. Authorization assertion coverage

The authorization boundary includes both API authentication and a signed assertion independently verified by the ICW. Tests 186–187 cover missing/forged/replayed assertions and attempted application-administrator privilege escalation. The assertion issuer's trust root, key custody, policy version and administrative separation are mandatory review artifacts under §5.


## 11. Final current-head and checkpoint test coverage

The matrix requires both distinct conditions:
- checkpoint staleness changes verification mode and raises an operational alert, but does not invalidate a complete verifiable ICW receipt chain (tests 48, 50, 182);
- current-state serving requires the latest ICW head or a valid freshness token and a matching projection (tests 183–185).

A stale checkpoint must never be mistaken for an unanchored committed tail. A stale projection must never be mistaken for current evidence state.


## 12. Supplemental F-03 recovery crosswalk (v1.0.0, provisional)

**Status: PROPOSED / PROVISIONAL — independent review and architecture-owner approval required.** This crosswalk preserves every original R01–R30 identifier and class definition. It adds traceability only; it does not modify AR-01–AR-15, renumber core tests, or claim that every class has a one-to-one core test. F-03 test IDs refer to the class-specific sections of `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md`; core test numbers are existing IDs in `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md`.

| F-03 class | Original class label | Proposed AR mapping | Architecture / server locus | F-03 test ID | Existing core tests / related tests | Profile | Objective evidence / mapping caveat |
|---|---|---|---|---|---|---|---|
| R01 | Genesis/bootstrap | AR-07, AR-08, AR-09, AR-14 | Architecture §§5–6,A5–A7; server recovery | F03-R01 | 30–36, 37–47, 109 | L/C/D/O/A | Pinned genesis bytes, root fingerprint, signature and continuity; core tests do not fully test genesis package enumeration |
| R02 | Epoch/continuity | AR-07, AR-08, AR-09, AR-14 | Architecture §§5–6,A5–A7; server recovery | F03-R02 | 35, 37–47, 101–102,109 | L/C/D/O/A | Signed epoch transition and terminal receipt; epoch-specific negative cases remain F-03 additions |
| R03 | Append receipts | AR-06, AR-07, AR-08, AR-09, AR-14 | Architecture §§4–6,A2–A7; server ICW receipt | F03-R03 | 110–118, 125–128, 173,175 | L/C/D/O/A | Exact signed receipt bytes from Spanner row, transaction/idempotency/head evidence and independent chain verification; anchor publication remains XD-06 |
| R04 | Canonical batch envelopes | AR-01, AR-05, AR-07, AR-09, AR-14 | Architecture §§2–4,A2–A4; server ICW receipt/projection | F03-R04 | 110–124, 133–138, 173,175 | L/C/D/O/A | Exact S3 VersionId, digest, length, range and receipt binding; payload-vs-envelope model remains XD-07 |
| R05 | Lifecycle events | AR-02, AR-03, AR-05, AR-10, AR-14 | Architecture §§3–4,7,A2–A4; server mutation state machine | F03-R05 | 112,115–124,158–165,173,175 | L/C/D/O/A | Complete event stream and transition proofs; F-03 class test supplies lifecycle-specific enumeration |
| R06 | Evidence payloads | AR-01, AR-10, AR-11, AR-14 | Architecture §§2,7–8,A2,A11; server payload/snapshot | F03-R06 | 151–157,178–181 | C/D/A (scope-dependent) | Exact payload locator/version/digest/key and erasure proof; storage/erasure model explicitly OPEN under XD-07 |
| R07 | Evidence lineage | AR-01, AR-03, AR-05, AR-10, AR-11 | Architecture §§2–4,7–8,A2–A4; server graph/snapshot | F03-R07 | 116–122,151–157,165 | C/D/A (scope-dependent) | Parent/child/source-to-claim graph and digest-bound provenance |
| R08 | Erasure/retention tombstones | AR-01, AR-10, AR-14, AR-15 | Architecture §§7,10,A11; server privacy/retention | F03-R08 | 151,178–181 | C/D/A (scope-dependent) | Authority, scope, key/object disposition and retained metadata; legal approval is review-based |
| R09 | Authorization assertions | AR-02, AR-06, AR-14 | Architecture §§3–4,A2; server authentication/assertion | F03-R09 | 166–172,186–187 | D/A (scope-dependent) | Exact signed assertion and issuer validation |
| R10 | Authorization decisions | AR-02, AR-06, AR-14 | Architecture §§3–4,A2; server authorization | F03-R10 | 166–172,186–187 | D/A (scope-dependent) | Policy digest, entitlement source, context and decision outcome |
| R11 | Issuer trust metadata | AR-06, AR-08, AR-14 | Architecture §§4,6,A5–A7; server authorization | F03-R11 | 166–172,186–187 | L/C/D/A (where required) | Historical issuer keys/JWKS/cert validity and revocation |
| R12 | Witness key history | AR-08, AR-14 | Architecture §6,A5–A7; server crypto verification | F03-R12 | 30–36, 166–172,186–187 | L/C/D/O/A | Public key history, compromise intervals, HSM audit; key custody review remains required |
| R13 | Crypto policy | AR-01, AR-08, AR-11, AR-14 | Architecture §§2,6,8,A2,A5–A8; server canonicalization | F03-R13 | 30–36, 59–64,151–157 | L/C/D/O/A | Algorithm, canonicalization, trusted-time and verifier policy digest |
| R14 | Schemas/serialization | AR-01, AR-07, AR-11, AR-14 | Architecture §§2,5,8,A2,A5,A8; server envelope/schema | F03-R14 | 110–124, 151–157 | L/C/D/A | Versioned schemas and canonical byte vectors |
| R15 | Recommendation snapshots | AR-10, AR-11, AR-12, AR-14 | Architecture §§7–8,A8; server snapshot finalization | F03-R15 | 139–157,181 | D/A | Exact snapshot bytes/input/exclusions/watermark and verification |
| R16 | Finalization receipts | AR-07, AR-11, AR-12, AR-13 | Architecture §§5,8,A5,A8; server snapshot finalization | F03-R16 | 139–150,181 | D/A | Receipt binds snapshot digest, watermark, actor, authority and time |
| R17 | Engine/runtime | AR-11, AR-14 | Architecture §8,A8; server replay/reconstruction | F03-R17 | 151–157 | D/A | Pinned source/build/runtime/lockfiles/SBOM; independent reproducibility evidence |
| R18 | Policy/rules | AR-10, AR-11, AR-12, AR-14 | Architecture §§7–8,A8; server replay | F03-R18 | 151–157 | D/A | Exact rule/eligibility/ranking/abstention versions |
| R19 | Taxonomy/reference data | AR-10, AR-11, AR-14 | Architecture §§7–8,A8; server replay | F03-R19 | 151–157 | D/A | Versioned taxonomy/enums/currency/unit references |
| R20 | Projector/canonicalizer | AR-01, AR-07, AR-09, AR-11, AR-14 | Architecture §§2,5–8,A2–A8; server projection | F03-R20 | 120–124,133–138,151–157,173–175 | D/A; O for restoration | Independent implementation, golden vectors and pinned projector build |
| R21 | Feature/normalization definitions | AR-10, AR-11, AR-14 | Architecture §§7–8,A8; server replay | F03-R21 | 151–157 | D/A | Exact formulas, units, rounding and normalization versions |
| R22 | Configuration/deployment | AR-11, AR-14, AR-15 | Architecture §§8,10,A8; server deployment/config | F03-R22 | 166–172,151–157 | D/A; O/A operational | Signed configuration and deployment parameter register; operational config also maps O-03 |
| R23 | External data consumed | AR-01, AR-11, AR-14 | Architecture §§2,8,A2,A8; server replay | F03-R23 | 151–157 | D/A | Exact response bytes, source identifiers, retrieval times and transformations |
| R24 | Model provenance | AR-11, AR-12, AR-14 | Architecture §8,A8; server historical reconstruction | F03-R24 | 151–157,181 | D/A | Actual consumed model output and metadata; no fresh model call substitution |
| R25 | Human inputs/approvals | AR-02, AR-10, AR-11, AR-14 | Architecture §§3,7–8,A2,A8; server actor context | F03-R25 | 166–172,186–187,151–157 | D/A | Exact edits/overrides/approval identities and signed context |
| R26 | Reconciliation/quarantine | AR-08, AR-09, AR-14 | Architecture §6,A5–A7; server recovery/quarantine | F03-R26 | 37–52,111–115,133–138,182–185 | L/C/D/O/A | Gap/fork/outage/quarantine/release evidence |
| R27 | Independent audit | AR-08, AR-09, AR-14, AR-15 | Architecture §6,A5–A7; server audit/roles | F03-R27 | 30–36,166–172,186–187 | L/C/D/O/A | Raw logs, reviewer evidence and independent verifier artifacts |
| R28 | Recovery manifest/run | AR-07, AR-08, AR-09, AR-14 | Architecture §§5–6,A5–A7; server restore | F03-R28 | 37–52,111–115,133–138,182–185 | L/C/D/O/A | Signed denominator, expected IDs/counts/digests and retrieval outcomes |
| R29 | Key custody/recovery | AR-08, AR-14 | Architecture §6,A5–A7; server crypto/key recovery | F03-R29 | 30–36,166–172,186–187 | L/C/D/O/A | HSM backup, quorum, custody approvals and key audit; external custody review required |
| R30 | Retention/legal basis | AR-01, AR-14, AR-15 | Architecture §10,A11; server privacy/retention | F03-R30 | 151,178–181 | C/D/O/A (scope-dependent) | Approved legal basis, retention schedule, holds and erasure policy; legal sign-off is non-testable review obligation |

### 12.1 Operational dependency crosswalk

| Operational class | Proposed requirement mapping | F-03 test | Profile | Core test linkage | Evidence |
|---|---|---|---|---|---|
| O-01 Identity/IAM/authorization | AR-06, AR-14, AR-15 | F03-O-01 | O/A | 166–172,186–187 | Grant/role exports, assertion verification, break-glass audit |
| O-02 Network/DNS/TLS | AR-14, AR-15 | F03-O-02 | O/A | New F-03 test; no direct existing core test | DNS/routing/cert/TLS evidence |
| O-03 Deployable runtime/build | AR-11, AR-14, AR-15 | F03-O-03 | O/A | 151–157; new F-03 test | Reproducible build, image digest, SBOM |
| O-04 Secrets/HSM/KMS | AR-08, AR-14 | F03-O-04 | O/A | 30–36,166–172,186–187 | HSM key IDs, quorum, custody and audit |
| O-05 Queues/workers/integrations | AR-06, AR-07, AR-14 | F03-O-05 | O/A | 115–124,158–165,173–175; new F-03 test | Offsets, idempotency, retries and side-effect reconciliation |
| O-06 Monitoring/time/audit | AR-08, AR-14, AR-15 | F03-O-06 | O/A | 30–36,48–52,97–109; new F-03 test | Trusted time, alert, log and audit-export evidence |
| O-07 Projection/API/cache/downstream | AR-07, AR-09, AR-10, AR-14 | F03-O-07 | O/A | 111–124,133–138,145–148,182–185 | Current watermark, cache invalidation, 202/actionability gate |
| O-08 Cutover/rollback/writer fencing | AR-06, AR-08, AR-09, AR-14 | F03-O-08 | O/A | 37–52,101–109,166–172,182–185; new F-03 test | Old-writer disablement, single-writer proof and service-owner gate |

### 12.2 Profile-level acceptance traceability

| Profile requirement | Required test(s) | Objective pass evidence | Fail-closed result |
|---|---|---|---|
| FULL-L — ledger integrity | F03-PROFILE-L; F03-ANCHOR-01/02/03; F03-R01–R05; F03-R11–R14 as required | Genesis-to-head receipt chain, exact Spanner receipt representations, S3 exact-version envelope bindings, independent expected-truth coverage, signatures and measured RPO/RTO | No FULL-L; ledger UNAVAILABLE/PARTIAL/BLOCKED |
| FULL-C — content recovery | FULL-L plus F03-PROFILE-C, F03-R06–R08, F03-SCOPE-01 | All lawfully retained in-scope payloads and lineage/tombstones verify against approved object/key model | No FULL-C; content PARTIAL/UNAVAILABLE/ERASED_BY_AUTHORITY |
| FULL-D — decision-history recovery | F03-PROFILE-D, F03-R09–R25, F03-SCOPE-01 | Snapshots, finalization receipts, inputs, rules, runtime and actual model outputs verify/replay | No FULL-D; decision history PARTIAL/UNAVAILABLE |
| FULL-O — operational restoration | F03-PROFILE-O; F03-O-01–08; F03-R17/R22/R27/R29 as applicable | Clean environment restoration, IAM/network/runtime/HSM/queue/monitoring/projection/cutover evidence, independent verifier and service-owner gate | No FULL-O; service stays disabled |
| FULL-A — complete approved scope | All applicable profile tests, F03-PROFILE-A, F03-SCOPE-01, F03-R01–R30 and F03-O-01–08 | Signed pre-disaster denominator and every mandatory class/dependency, all profile evidence, approved scope and measured RPO/RTO | No FULL-A; explicit limited/partial/unavailable outcome |

All mappings in §12 are proposed. Independent review must validate both positive mappings and any missing/over-broad AR associations. Where the core v4 plan has no equivalent test ID, the F-03 test is an additive test, not a renumbering or replacement of the core suite.


### 12.3 Accepted bounded anchor-publication policy — AUD-XD-06 (additive; 2026-11-16)

**Decision status:** Option 2 ACCEPTED. Client/API success does not wait for independent expected-truth anchor publication. This is distinct from projection gating: HTTP success still requires verified receipt-bound projection under the existing core contract. The anchor is an asynchronous, independent completeness control.

| Requirement / control | Normative source | Regression test(s) | Required assertion / evidence | Fail-closed result |
|---|---|---|---|---|
| Bounded asynchronous publication | F-03 practical recovery specification §27.6; inventory §7.5 | F03-ANCHOR-04 | Spanner commit and projection-verified client success proceed before anchor coverage within approved finite `ANCHOR_MAX_PUBLICATION_LAG`; anchor remains PENDING and completeness never extends past last published position | No false anchor-covered status; no FULL beyond anchored range |
| Publication deadline / breach | F-03 §27.6 | F03-ANCHOR-05 | Approved numeric lag, trusted measurement clock, deadline, alert/escalation and degraded/fail-closed mode; raw publisher/commit evidence retained | Alert and stop/throttle further unanchored acceptance before approved exposure bound is exceeded |
| Rollback after anchor prefix | F-03 §27.6 | F03-ANCHOR-03, F03-ANCHOR-06 | Recover last independently anchored position; enumerate every committed-but-uncovered sequence, count, receipt commitment and time bound | No FULL-L/C/D/O/A may include uncovered committed interval; PARTIAL/UNAVAILABLE or explicit limited statement |
| Circular post-disaster anchoring | F-03 §27.6 | F03-ANCHOR-07 | Reject an anchor reconstructed solely from rolled-back Spanner, recovered manifest, mutable logs or operator output | No retroactive completeness proof |
| Monotonicity / conflicting anchor | F-03 §§26.2, 27.6 | F03-ANCHOR-01, F03-ANCHOR-02 | Reject stale, replayed, regressed, conflicting, compromised or unverifiable anchor | BLOCKED/quarantine; no FULL |
| RPO / lag compatibility | F-03 §27.6 | F03-RPO-01, F03-RTO-01 | Signed numeric lag and RPO/RTO targets; measured tail and recovery against trusted time and sequence evidence | Missing numeric parameter or trusted time = BLOCKED |
| Anchor trust and administration | F-03 §27.6; inventory §6.4/§7.5 | F03-ANCHOR-05 plus independent trust-boundary review | Approved identity relationship to core checkpoint, owner/writer, trust root, administrative domain, source independence, retention and recovery path | Implementation and F-03 acceptance BLOCKED until approved |

**Normative implementation parameters still outstanding:** finite numeric `ANCHOR_MAX_PUBLICATION_LAG`; anchor identity relative to the core checkpoint; legal owner/writer; trust root and administrative boundary; source/provider independence criteria; retention and recovery path; publisher implementation; signed RPO/RTO alignment. The accepted Option 2 policy choice itself is no longer provisional. No numeric provider count or lag is fabricated.

**Reviewer checklist:** verify that client/API success is projection-gated but not anchor-gated; publication is bounded and monotonic; late publication does not retroactively undo a valid Spanner commit/client result; bound breach triggers approved fail-closed acceptance behavior; after rollback, all committed positions beyond the last independently verified anchor are explicitly enumerated and excluded from every completeness-qualified FULL profile; and a post-disaster self-generated anchor cannot close the gap.

All mappings remain PROPOSED / PROVISIONAL pending independent review. The added regression tests are DEFINED / NOT RUN.
