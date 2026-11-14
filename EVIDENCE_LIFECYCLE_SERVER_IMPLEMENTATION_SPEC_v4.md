# DealFlow — Server-side Evidence Lifecycle Implementation Specification (v4)

**Status:** Proposed v4 server-side contract for review only. No implementation or database changes are authorized.  
**Parent architecture:** \`EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md\`  
**Decision basis:** D-01 through D-06, including approved amendments to D-02, D-04 and D-06.  
**Reference technology:** PostgreSQL-style relational semantics are used to make constraints precise; the production database/provider remains undecided. Any alternative must demonstrate equivalent guarantees.

## 1. Purpose and conformance

This specification translates the v4 lifecycle architecture into server/database responsibilities, transaction boundaries, API outcomes, persistence invariants, cryptographic contracts, checkpoint recovery and historical snapshot behavior.

A conforming implementation MUST satisfy the architecture invariants. A service that performs application-level prechecks but lacks ICW-enforced append/idempotency, database-enforced projection constraints, independent checkpointing or immutable snapshot protection is non-conforming.

This document is not executable code, a schema migration, a deployment decision or implementation authorization.

## 2. Logical components

1. **Authenticated API boundary:** validates credentials and derives tenant, actor and permissions.
2. **Lifecycle command service:** accepts only typed create, supersede, revoke and withdraw commands.
3. **Independent Commit Witness (ICW):** validates lifecycle semantics, performs linearizable append/CAS, allocates authoritative sequence, retains complete batch envelopes and issues signed commit receipts.
4. **Transactional projection boundary:** applies receipt-backed batches atomically with database constraints, locks and projection cursor updates.
5. **Ledger projector/verifier:** deterministically validates a complete committed prefix and derives lifecycle state.
6. **Eligibility evaluator:** evaluates evidence separately for a decision and evaluation time.
7. **Checkpoint publisher/verifier:** signs and anchors committed ledger positions independently.
8. **Restore/reconciliation controller:** isolated workflow for validating backups and recovering ledger tails.
9. **Recommendation snapshot service:** records immutable decision-time context, integrity hash and independent anchor.
10. **Independent verification utility:** verifies records, batches, checkpoints and snapshots without relying solely on production helper functions.

No browser or ordinary client receives database credentials or direct lifecycle write access.

## 3. Command API contract

Only these lifecycle mutation commands exist:
- \`createEvidence\`
- \`supersedeEvidence\`
- \`revokeEvidence\`
- \`withdrawEvidence\`

Separate read/administrative capabilities:
- read verified ledger prefix;
- verify ledger/checkpoint;
- create/verify recommendation snapshot;
- export validated backup manifest;
- controlled restore/reconciliation;
- inspect quarantine and migration reports.

There is no generic status setter, reactivation command, direct event insert endpoint or client-controlled sequence/hash/timestamp field.

### 3.1 Required request controls

Every new mutation request includes:
- request ID/idempotency key;
- typed operation payload;
- expected ICW receipt ID/hash and ending sequence equal to the current ICW head at append time. Missing, stale, future, interior-batch or mismatched watermarks are rejected. An exact same-key/same-digest replay is resolved to its original receipt after current authorization is rechecked, even if the head has advanced.
- authenticated credentials supplied outside request JSON.

Tenant and actor IDs are derived from verified authentication context. Client-supplied tenant, actor, sequence, hash, recordedAtServer or lifecycle status values are rejected or ignored with explicit validation errors; they are never authoritative.

### 3.2 Response semantics

Success is returned only after durable ICW commit and verified projection application; it includes ICW receipt ID/hash, operation/batch ID, batch ending sequence, head hash, event IDs and projection version. If ICW commit exists but projection is pending, return a typed pending response (HTTP 202 or equivalent), not success or rollback.

Typed failures:
- \`401\`: unauthenticated/invalid credentials;
- \`403\`: authenticated but unauthorized, with no cross-tenant existence disclosure;
- \`404\`: non-disclosing missing/out-of-scope resource;
- \`409\`: stale watermark, terminal-state conflict, duplicate lineage, idempotency digest conflict or invalid intermediate watermark;
- \`422\`: invalid schema, claim identity, reason, payload or operation semantics;
- \`503\`: bounded retry exhaustion or required dependency unavailable.

A timeout after commit is resolved by retrying the same key. A failure response must never imply that a partial transaction committed.

## 4. Transaction, ICW append and projection contract (D-02)

### 4.1 Authority and lock order

The ICW is the authoritative sequence allocator, idempotency authority and lifecycle commit point. Do not hold a database transaction or row locks across the ICW network call.

The request path is: authenticate and validate; read current ICW head; verify projection is caught up; prepare canonical batch; ICW validates semantics and performs expected-head CAS; after receipt acceptance, apply the batch to the database projection in one transaction.

Projection lock order is fixed:
1. ledger projection cursor/head row;
2. immutable predecessor evidence row, where the command has a predecessor;
3. additional claim/lineage graph rows in deterministic sorted identifier order.

A stale ICW CAS loser reloads the accepted receipt history and revalidates. It never blindly retries a stale prepared batch.

### 4.2 Sequence and batch allocation

The ICW assigns the next contiguous sequence range atomically and returns it in a signed receipt. The database `last_sequence` is only the last successfully applied ICW sequence. It is not an allocator. No database-only sequence or batch can become authoritative.

Create/revoke/withdraw normally produce one-event batches. Supersession produces exactly two ordered events: replacement creation then predecessor supersession. The complete canonical batch envelope, including evidence and lineage payloads, is retained in the ICW trust domain or immutable object storage referenced by the receipt.

### 4.3 ICW semantic validation

Before receipt acceptance, the ICW validates closed event vocabulary, evidence creation uniqueness, terminal transition uniqueness, predecessor active state, exact claim identity, tenant/ledger/epoch scope, unique predecessor/replacement lineage, no fork/merge/cycle, contiguous sequence and complete batch digest. Invalid batches do not advance the ICW head or create receipts.

### 4.4 Projection constraints

The relational database applies only receipt-backed batches. Its projection transaction verifies receipt signature, envelope digest, previous receipt/head, assigned sequence range and batch digest before writing. It inserts all dependent records/events/lineage/batch metadata and advances the projection cursor in one transaction.

Database uniqueness, composite foreign keys, terminal-event constraints, lineage constraints and batch completeness remain mandatory defense in depth. The request-serving role has no direct DML. A projection mismatch causes ledger isolation; the DB cannot override the ICW.

### 4.5 Supersession and failure handling

A supersession is one ICW append with the two ordered events and replacement payload. ICW acceptance is the logical commit. The subsequent database transaction applies the entire batch or none of it. If projection fails after receipt acceptance, the operation is committed-but-pending; recovery replays the same envelope. The server must not report rollback, allocate another sequence or serve the stale projection.

### 4.6 Idempotency and retries

The ICW enforces tenant + authenticated actor/client scope + operation + request ID and canonical request digest. Same key/same digest returns the original receipt after current authorization recheck; same key/different digest is an integrity conflict. Timeout after acceptance returns the original receipt on retry. ICW outage before acceptance blocks all new lifecycle commits. Projection retry is idempotent and cannot create a second row/event/batch.

## 5. Persistence responsibilities and privileges

Logical tables/entities:
- tenants;
- evidence_ledgers;
- evidence_records;
- evidence_batches;
- evidence_events;
- evidence_lineage;
- idempotency_records;
- ledger_checkpoints;
- recommendation_snapshots;
- recommendation_correction_events;
- audit_security_events;
- legacy_quarantine_envelopes and migration manifests.

The schema must include tenant, ledger and epoch in composite keys/FKs wherever applicable. Exact DDL is deferred until provider/version and deployment choices are approved.

### 5.1 Database roles

- Request-serving API role: execute explicitly granted procedures; no direct INSERT/UPDATE/DELETE on authoritative lifecycle, batch, lineage, checkpoint or finalized snapshot tables.
- Procedure owner: narrowly scoped, non-superuser role; fixed search path; no unreviewed dynamic SQL; PUBLIC execute revoked; tenant context validated against authenticated server context and RLS.
- Read/projector role: read-only, tenant-scoped, cannot mutate lifecycle.
- Checkpoint publisher: narrowly scoped permission to request/sign/anchor checkpoint manifests; cannot rewrite ledger rows.
- Migration/restore role: isolated, time-limited, dual-authorized, fully audited; cannot bypass quarantine policy.
- Auditor/verifier role: read/verify only, with access constrained by approved privacy policy.

RLS is defense in depth, not a substitute for composite keys and explicit tenant checks. Test connection-pool reuse and procedure-owner behavior to prevent tenant context leakage or RLS bypass.

### 5.2 Append-only scope

Database triggers/privileges must prevent unauthorized update/delete of authoritative lifecycle records/events and finalized recommendation snapshots. Other operational application records may remain mutable. Any legally required privacy erasure is a separately approved controlled process and must not silently rewrite historical recommendation content; affected reconstruction status must be updated through a new linked audit record.

## 6. Projector and eligibility contract

Projector input is a complete verified prefix identified by tenant, ledger, epoch, committed batch ID, ending sequence and head hash. It validates contiguous sequence, batch coverage, hash links, event vocabulary, one creation, terminal uniqueness, graph constraints, schema/canonicalizer versions and tenant scope.

The projector rejects interior sequence watermarks. A materialized projection/cache is non-authoritative and is keyed by ledger, epoch, committed batch boundary, batch hash and projector version. It may be used only after validation against the required trusted prefix.

Eligibility is a separate versioned evaluation of:
- lifecycle state at the selected watermark;
- evidence payload/provenance integrity;
- authority;
- freshness;
- validity interval at evaluation time;
- canonical claim identity and contradiction policy;
- applicable evidence taxonomy and policy versions.

If a required ledger prefix/checkpoint cannot be verified, return ABSTAIN/unavailable for dependent decisions. Do not silently remove the problematic evidence and continue with a partial portfolio.

## 7. Checkpoint and recovery service contract (D-04)

### 7.1 Manifest and signature

Checkpoint manifest includes tenant, ledger, epoch, committed batch ID, ending sequence, head hash, batch hash, counts, schema/canonicalizer versions, prior checkpoint hash/reference, creation time, manifest version, signing algorithm and key ID.

Canonical manifest bytes are domain-separated and signed with a key protected by KMS/HSM or equivalent. Algorithm identifiers and verification keys are retained for audit lifetime. The signature is not stored solely in the same database as the ledger.

### 7.2 Independent anchor

The latest checkpoint position is recorded in a monotonic independently protected anchor. Checkpoint object, anchor and signing authority use separate credentials/admin boundaries from the transactional database. Use immutable/WORM storage and alert on checkpoint deletion/overwrite, anchor regression, IAM changes and signing-key policy changes.

A previously valid but stale signed checkpoint cannot be accepted as current. The verifier must compare it with the latest trusted anchor.

### 7.3 Recovery state machine

Ledger recovery states:
- \`AVAILABLE\`: complete ledger verified through policy-compliant anchored position;
- \`RECOVERY_ISOLATED\`: restore or integrity incident under validation; no decisions served;
- \`QUARANTINED\`: gap, fork, signature failure, rollback or unresolvable integrity issue;
- \`RECOVERY_VERIFIED\`: restored prefix and tail reconciled; pending authorized re-enable;
- \`UNAVAILABLE\`: required checkpoint/anchor/verification dependency unavailable beyond approved policy.

A restored database remains isolated until the ICW receipt chain and referenced batch envelopes verify; the projection matches/replays through the current ICW head; lineage, counts and dependent snapshots verify; the recovery audit record and approvals are complete. A checkpoint may accelerate this verification but cannot replace ICW receipt coverage.

A shorter backup, same-sequence/different-hash fork, missing event or unverified tail is rejected. If missing history cannot be recovered, keep the ledger quarantined. Never infer that absent revocations did not occur.

A new epoch requires a signed restore manifest linked to the latest trusted ICW head and any relevant checkpoint, plus a fully reconciled history. It cannot erase or bypass an unrecovered gap.

### 7.4 Operational thresholds

Before production, approve numeric values for maximum checkpoint age alert threshold, maximum database projection lag, checkpoint publication delay alert threshold, clock skew, recovery point/time objectives and retention. There is no unanchored committed tail because every commit has an ICW receipt. Enforce below/at/above threshold tests. No hidden fallback values.

### 7.5 Threat and residual risk

The design detects database-only rollback and rewrite relative to the independent ICW receipt log and its trust roots. It does not guarantee integrity if the attacker simultaneously controls the ICW administrative/control plane, signing authority and immutable receipt/object retention roots. Suspected signing-key compromise requires quarantine from the last independently trusted position, key incident response and re-anchoring under a reviewed trust root.

## 8. Recommendation snapshot service contract (D-06)

### 8.1 Snapshot payload

A finalized snapshot must include:
- snapshot/recommendation IDs and timestamps;
- tenant/ledger/epoch;
- committed batch ID, ending sequence, head hash and trusted checkpoint reference;
- exact evidence IDs/versions/content hashes;
- lifecycle state at decision time;
- per-evidence eligibility inclusion/exclusion and reason codes;
- decision inputs, units, normalization, source and evaluation time;
- opportunity/action candidates and material constraints;
- rule, engine, projector, taxonomy and policy versions;
- assumptions, uncertainty and evidence-quality/confidence assessments;
- calculation outputs and recommendation/abstention result;
- replay mode and sufficient context/versioned dependencies for independent reconstruction;
- canonical schema version, snapshot hash, signature/anchor reference.

### 8.2 Hash and anchor

Serialize a validated typed snapshot using the versioned canonicalization contract. Compute a domain-separated digest over the full payload excluding only its own hash/signature fields. Anchor the snapshot hash or a Merkle root of snapshot hashes in the independent checkpoint trust domain or equivalent separately controlled immutable receipt store.

A hash stored only beside the payload in the same database is insufficient against database rewrite. Independent verification recomputes the digest with a separate verifier, validates the signature/anchor, validates the ledger checkpoint/watermark and resolves exact evidence and rule artifacts.

### 8.3 Immutable corrections

Finalized snapshot rows/payloads are not updated or deleted by ordinary roles. Subsequent revocation, supersession, expiry, engine changes or correction cannot alter the original.

A correction creates a new immutable record in a separate recommendation-correction stream, linked to original snapshot ID/hash and any replacement snapshot. It records correction reason/type, actor, authorization, timestamp, affected fields, new payload/hash and independent anchor. Original and corrected records remain separately identifiable.

### 8.4 Reconstructability

Retain exact versioned engine, projector, policy, taxonomy and configuration artifacts; exact decision inputs and normalized values; evidence references/content hashes and permitted payload access; and any model-assisted structured output actually consumed.

For nondeterministic model calls, store model/provider/version metadata, relevant parameters, prompt/template hash and actual structured output. Do not claim a future rerun will produce byte-identical output. If an artifact or evidence dependency is legally erased or unavailable, verify remaining integrity and mark reconstruction as incomplete/unavailable; do not substitute current content.

## 9. Canonical hash byte contract

Use RFC 8785 JCS or fully specified equivalent. Reject duplicate keys, invalid Unicode and non-finite numbers. Money/quantities use integer minor units or canonical decimal strings.

Required domain-separated digests:
- immutable evidence record;
- event payload (excluding payloadHash, previousEventHash and eventHash);
- event (bind ledger, epoch, sequence, previous hash raw bytes and payload hash raw bytes);
- committed batch (bind batch ID, range and ordered event hashes);
- genesis;
- checkpoint manifest/signature;
- recommendation snapshot.

Epoch/sequence encodings are unsigned base-10 ASCII without leading zeros. Hex digests are validated lowercase 64-character values and decoded to 32 raw bytes before concatenation. Publish independent golden vectors and an independent verifier that does not call production hash helpers.

## 10. Legacy quarantine and migration interfaces

Legacy import creates only a quarantined envelope and manifest entry. It does not create an authoritative active evidence record or infer missing historical events. The legacy namespace must be structurally isolated from normal eligible-evidence foreign keys and Decision Desk queries.

Re-attestation uses the ordinary authenticated create flow and a new evidence ID with current provenance/source-check time. The old legacy ID remains quarantined. Migration and restore procedures are separate, time-limited, audited and dual-authorized.

## 11. Privacy, retention and operational controls

Before real-agent evidence:
- classify and minimize personal data;
- define retention, legal hold, erasure, export and access-audit rules;
- define permitted reason-text content;
- redact logs and telemetry;
- define encrypted backup and WORM retention;
- test legal deletion against historical snapshot integrity and reconstruction claims.

No production data intake is authorized by this specification.

## 12. Observability and incident response

Alert on sequence gaps, batch mismatch, hash/checkpoint mismatch, anchor regression, signature failure, stale checkpoint, excessive projection lag, cross-tenant attempts, unauthorized DML, idempotency digest conflict, repeated serialization failure, restore/fork events and unexpected abstention changes.

Runbooks are required for key rotation/compromise, checkpoint verification, restore, fork quarantine, ledger unavailability, tenant offboarding, privacy erasure, schema upgrade and incident response.

## 13. Deployment choices requiring approval

The hosting provider, database/version, authentication provider, tenant/RLS model, ICW provider and durability/linearizability guarantees, KMS/HSM, checkpoint/anchor service, WORM storage, backup/projection replay design, numeric checkpoint/projection-lag thresholds, recovery objectives, retention/privacy policy and operational ownership remain undecided. This specification does not silently choose them.

## 14. Conformance and authorization

Conformance requires ICW linearizable append and semantic validation, database projection constraints and concurrency behavior, fault-injected commit/projection recovery, independently verified checkpoint/receipt recovery, independent snapshot provenance and verification, legacy namespace isolation, privacy review and the complete migration/regression plan.

**Documentation only.** No implementation, schema change, migration, migration execution, PR #30 merge, PR #32 readiness/merge or real-agent evidence acceptance is authorized.


## 15. Critical-review closure addendum (normative)

### 15.1 Stable lock target and lifecycle-state validation

The immutable evidence row is the stable row-lock target; it is not mutated to store lifecycle state. After acquiring the ledger-head lock and predecessor row lock, the procedure validates the predecessor state from the committed event/batch history at the locked watermark. If an internal current-state guard projection is used, it is derived, rebuildable, updated atomically with the event batch, and reconciled against the authoritative event history. It may not independently authorize a transition when stale or inconsistent.

All lifecycle writers acquire locks in the same order. The serializable transaction plus explicit locks and database uniqueness constraints are cumulative controls. Tests must prove behavior under the selected database's actual isolation and failover semantics.

### 15.2 Monotonic external anchor API

The independent anchor must expose an atomic compare-and-swap operation over the current trusted checkpoint pointer. The proposed checkpoint is accepted only if it extends the exact currently anchored checkpoint and its sequence/batch position is strictly monotonic within the epoch.

Reject:
- lower sequence or batch position;
- same sequence with a different head or batch hash;
- mismatched previous-checkpoint reference;
- forked or non-contiguous extension;
- unrecognized epoch;
- new epoch without an authorized, verified restore manifest.

An identical checkpoint retry is idempotent. Concurrent checkpoint publishers cannot overwrite one another: only one compare-and-swap succeeds; the loser reloads and revalidates. The signing service must verify extension from the latest anchor before signing/anchoring; it must not sign an arbitrary locally valid but stale head. Failure to read or advance the anchor means the checkpoint is not anchored.

### 15.3 Snapshot finalization gate

Snapshot payload insertion is immutable. Store publication state separately as append-only events, for example \`snapshot_anchor_pending\`, \`snapshot_anchor_confirmed\`, and \`snapshot_anchor_failed\`.

The recommendation API must not return a finalized/actionable recommendation until a signed independent receipt confirms the exact snapshot hash and binds it to:
- snapshot ID and schema version;
- tenant, ledger and epoch;
- committed batch ID, ending sequence and head hash;
- checkpoint ID/hash covering that watermark, or a separately anchored snapshot receipt;
- signing algorithm and key ID.

If the anchor is pending/unavailable, persist the immutable snapshot as pending and return explicit pending/unavailable status. Do not silently downgrade to a same-database hash or issue an actionable recommendation. Retrying anchor publication is idempotent. Confirmation appends a publication event; it never edits the snapshot payload. A failed/invalid receipt leaves the recommendation non-final and triggers review.

### 15.4 Recovery cannot republish a stale checkpoint

After restore, the checkpoint publisher must compare the restored head to the independent anchor before it can issue any new signature or anchor update. A locally valid hash chain that is shorter than, equal-but-divergent-from, or otherwise not a strict extension of the latest trusted checkpoint is rejected. Missing events must be recovered and verified first; a new epoch cannot be used to bypass the gap.



---

# v4 normative amendment — Server protocol for independent commit witness

**Precedence:** This section supersedes conflicting v3 server requirements for sequence authority, commit ordering, checkpoint-only recovery, unanchored tails and snapshot provenance.

## S1. Required ICW interface

The implementation MUST provide a separately administered Independent Commit Witness (ICW) with these logical operations:

- `readLedgerHead(tenant, ledger, epoch)`: returns the latest accepted receipt ID/hash, sequence, batch ID and head digest with a verifiable signed response.
- `appendBatch(expectedPreviousReceipt, canonicalBatchEnvelope, idempotencyScope, requestDigest)`: performs a linearizable, atomic compare-and-swap append; stores the complete envelope or immutable content-addressed object; returns the signed commit receipt.
- `readReceipt(receiptId)`: returns the immutable receipt and complete retained envelope/object reference.
- `readReceiptRange(fromReceipt, toReceipt)`: returns a contiguous verifiable range or explicit missing/corrupt status.
- `appendSnapshotFinalization(expectedLedgerReceipt, snapshotEnvelope, snapshotDigest)`: durably stores/retains the snapshot and atomically issues a receipt binding its digest to the exact ledger receipt/watermark.
- `verifyReceiptChain(ledger, epoch, watermark)`: returns independently verifiable continuity/inclusion material to genesis or a trusted checkpoint plus the exact requested watermark.

The actual transport/API may differ, but it must provide equivalent semantics. An eventually consistent object listing, non-atomic file append, database table under shared DBA control, or hash-only external timestamp is not equivalent.

## S2. ICW acceptance and receipt contract

A successful `appendBatch` receipt MUST bind all fields in architecture §A2, including complete batch-envelope digest, prior receipt, assigned contiguous sequence range, resulting head, idempotency identity/digest, witness transaction ID, acceptance time, algorithm/key ID and witness signature. Receipt IDs are globally unique within the witness trust domain. The witness's durable-acknowledgement contract and failure model must be documented and tested.

The witness enforces idempotency and sequence allocation. If the same key/digest is retried, it returns the exact original receipt. Same key/different digest is a typed integrity conflict. Concurrent requests from one expected previous receipt produce at most one accepted append; losers reload and revalidate. The server never invents a receipt or assigns a sequence independently.

## S3. Required mutation state machine

The server tracks append-only operation states:
- `PREPARED`: validated request; no authoritative commit exists.
- `WITNESS_COMMITTED`: ICW receipt exists; lifecycle operation is committed even if the database projection is behind.
- `PROJECTION_PENDING`: receipt accepted but projection transaction not yet verified.
- `APPLIED_VERIFIED`: projection transaction committed and exactly matches the receipt.
- `REJECTED`: ICW rejected request; no authoritative batch exists.
- `INTEGRITY_BLOCKED`: receipt/object/projection mismatch; ledger unavailable and incident raised.

A process crash must not convert `WITNESS_COMMITTED` or `PROJECTION_PENDING` into `REJECTED`. Recovery discovers accepted receipts by idempotency identity and replays the exact retained envelope. No later mutation or decision is served from a ledger whose projection cursor is behind the ICW head.

## S4. API response semantics

- Return ordinary mutation success only in `APPLIED_VERIFIED`, including the ICW receipt ID/hash and projection watermark.
- If ICW commit succeeded but projection is pending, return a typed pending response (HTTP 202 or equivalent) with operation ID and receipt reference; explicitly state that the mutation is committed but not yet decision-readable. It is not a rollback and cannot be resubmitted with a new key.
- If ICW is unavailable before append, return typed unavailable (503 or equivalent); no DB-only mutation may commit.
- If projection disagrees with a receipt, return integrity-blocked/unavailable; do not return a success or a stale recommendation.
- Same-key retries resolve the original state and receipt. They do not allocate a new sequence or create a second batch.
- Read, export, cache and downstream APIs must enforce the same verified-head/finalization state; no consumer may promote pending data to actionable.

## S5. Projection transaction and constraints

The relational database is a projection. Its transaction must apply the entire accepted ICW batch, all dependent evidence/events/lineage rows, local batch metadata and projection cursor atomically. It must verify the ICW receipt and recomputed batch digest before commit. Unique constraints, composite foreign keys, terminal-event constraints and graph constraints remain mandatory defense in depth.

The projection's `last_sequence` is the last successfully applied ICW sequence, not a sequence allocator. Direct writes by request-serving roles remain prohibited. Even a database owner/superuser cannot make a forged projection authoritative because every current-state read/recommendation must establish the current ICW head (or a signed freshness token within the approved maximum age) and verify the projection cursor/head and batch digests against it. A mismatch or unavailable/expired head token causes ledger isolation/abstention.

## S6. Snapshot finalization and downstream gates

The snapshot payload is stored immutably before finalization. The ICW finalization operation must bind snapshot digest and immutable object digest to the exact accepted ledger receipt ID/hash and watermark. The ICW verifies that the ledger receipt belongs to its contiguous accepted chain. Snapshot-finalization receipts are recorded in a separate witness namespace and do not advance the lifecycle ledger sequence. A checkpoint may accelerate verification only if it covers the exact watermark and its receipt inclusion proof verifies.

A snapshot publication state is append-only: `DRAFT`, `ANCHOR_PENDING`, `FINALIZED_VERIFIED`, `FINALIZATION_FAILED`. Snapshot-finalization receipts use a separate witness receipt namespace and do not allocate lifecycle ledger sequence numbers. Reconstruction status is a separate field (`FULL`, `PARTIAL`, `UNAVAILABLE`) and is never a publication state. A snapshot is actionable only in `FINALIZED_VERIFIED` and only if its ledger projection remains verified at least through its bound watermark. Pending/failed states return no actionable recommendation, ranking or executable action through API, cache, export, notification or downstream integration. A read-only audit endpoint may expose status and non-actionable metadata.

A retry after timeout uses the same snapshot ID, digest and idempotency identity. A conflicting payload under that identity is rejected. Corrections use the same protocol and cannot alter the original snapshot or its receipt.

## S7. Historical verification and recomputation API

The verifier returns separate typed fields:
- `integrity_status`: VERIFIED / FAILED / UNAVAILABLE;
- `ledger_provenance_status`: VERIFIED / FAILED / UNAVAILABLE;
- `reconstruction_status`: FULL / PARTIAL / UNAVAILABLE;
- `recomputation_status`: MATCH / MISMATCH / NOT_DETERMINISTIC / UNAVAILABLE;
- exact missing dependency IDs and reasons.

A successful integrity result does not imply successful recomputation. Deterministic replay compares canonical structured outputs, all decision-relevant eligibility states, recommendation/abstention outcome and ordering exactly; numeric tolerances are allowed only where a versioned execution contract explicitly defines them. Nondeterministic model calls are verified using the preserved actual structured output and deterministic downstream result, not a fresh remote model call.

## S8. Crash recovery and publication ordering

For lifecycle batches, durable immutable batch content is written to the ICW trust domain before its signed receipt becomes visible. The ICW receipt append is the commit point. Projection application follows. A crash:
- before durable ICW acceptance: no committed operation; retry may append once;
- after durable acceptance but before response: operation is committed; same-key retry returns original receipt;
- after acceptance but before projection: operation is committed/projection-pending; replay applies it;
- during projection transaction: database rollback leaves projection wholly before; replay applies full batch;
- after projection commit but before response: receipt and projection verify; retry returns original success.

For checkpoints, immutable checkpoint object creation precedes anchor CAS. Crash before CAS leaves an unanchored object that is not trusted and may be safely retried. Crash after CAS but before local metadata update leaves an accepted checkpoint; retry discovers the exact anchor receipt and repairs local metadata. Missing object behind an advanced anchor is an integrity incident and blocks verification; it is never silently replaced. Conflicting content under the same publication ID is rejected.

## S9. Privileged roles and threat boundary

The deployment role matrix must enumerate request-serving role, procedure owner, database owner/superuser, application administrator, ICW operator, ICW storage administrator, signing-key administrator, recovery operator and independent auditor. For each, specify credentials, allowed actions, dual-control requirements, audit source and compromise impact.

Ordinary DB administrators, database owners and application administrators must have no ICW write/delete/admin capability. ICW operators cannot rewrite the relational projection and cannot silently alter signing keys. Key rotation is append-only and historical verification keys remain available for the defined retention period. Combined compromise of ICW administrative control and trust roots is a declared residual risk, not a covered scenario.

## S10. Parameterized deployment contract

The signed deployment parameter register is mandatory before implementation authorization. It must specify exact numerical thresholds and retention values, owner, approval date, version and digest. Every test reads this immutable register; no default or test-local substitute is allowed.

## S11. v4 review-closure clarifications

### S11.1 Lifecycle validation and lock protocol

The ICW, not a database preflight query, validates event vocabulary, creation uniqueness, terminal-state irreversibility, active predecessor, exact claim identity, lineage uniqueness, no fork/merge/cycle and tenant/ledger/epoch scope against its accepted receipt history. A CAS loser reloads the new head and revalidates; it must not retry a stale precomputed batch unchanged.

Do not hold a database transaction or row locks across the ICW network call. The order is: authenticate/validate; read current ICW head; prepare request; ICW atomic validation + CAS append; then begin the projection transaction. The projection transaction locks ledger cursor/head, then immutable evidence rows, then graph rows in deterministic order, applies the entire accepted batch and advances the cursor. If the projection is behind, no new mutation or decision is served until reconciliation catches up.

### S11.2 Command watermark matrix — binding rule

All four new mutation commands require an expected ICW head receipt ID/hash and ending sequence:
- exact current head: eligible for ICW validation and CAS;
- missing: typed validation error, no receipt;
- stale ancestor: typed conflict, no receipt; caller must reload and intentionally resubmit with a new request identity if the business intent is still valid;
- future, interior-batch or mismatched receipt/sequence: typed conflict, no receipt;
- same idempotency key and same digest already accepted: return original receipt after current authorization recheck, irrespective of later head advancement;
- same idempotency key and different digest: integrity conflict, no receipt.

The command contract applies equally to create, supersede, revoke and withdraw. The expected watermark is not optional for any new mutation.

### S11.3 Privacy and retention semantics

The ICW receipt must bind immutable digests for sensitive evidence payload objects, but plaintext personal data need not be duplicated in the witness log. Sensitive payloads are encrypted before immutable storage; the independent receipt binds ciphertext/object digest, canonical plaintext digest where permitted, key/object identity and retention policy version. Legal erasure may destroy the decryption key or remove content only under the approved policy, leaving permitted integrity metadata. Verification and reconstruction results remain separate; a destroyed key makes payload reconstruction PARTIAL/UNAVAILABLE, never FULL.


## S12. Current-state read freshness contract

Before any current-state evidence read, eligibility evaluation or recommendation is served, the service obtains the latest ICW head or a signed freshness token whose age is within the approved parameter register. It verifies that the projection cursor/head and batch digests exactly match the established head. If the ICW cannot be contacted and no valid freshness token exists, or if the projection is behind/mismatched, the service returns unavailable/abstain. A cache may be reused only when bound to the same valid head token and its expiry. Historical snapshot verification uses its fixed receipt and must be labelled historical, not current.
