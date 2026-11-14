# DealFlow — Server-side Evidence Lifecycle Implementation Specification (v3)

**Status:** Proposed server-side contract for review only. No implementation or database changes are authorized.  
**Parent architecture:** \`EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v3.md\`  
**Decision basis:** D-01 through D-06, including approved amendments to D-02, D-04 and D-06.  
**Reference technology:** PostgreSQL-style relational semantics are used to make constraints precise; the production database/provider remains undecided. Any alternative must demonstrate equivalent guarantees.

## 1. Purpose and conformance

This specification translates the v3 lifecycle architecture into server/database responsibilities, transaction boundaries, API outcomes, persistence invariants, cryptographic contracts, checkpoint recovery and historical snapshot behavior.

A conforming implementation MUST satisfy the architecture invariants. A service that performs application-level prechecks but lacks database-enforced constraints, durable idempotency, independent checkpointing or immutable snapshot protection is non-conforming.

This document is not executable code, a schema migration, a deployment decision or implementation authorization.

## 2. Logical components

1. **Authenticated API boundary:** validates credentials and derives tenant, actor and permissions.
2. **Lifecycle command service:** accepts only typed create, supersede, revoke and withdraw commands.
3. **Transactional persistence boundary:** executes append procedures, locking, constraints, sequence allocation, batch publication and idempotency.
4. **Ledger projector/verifier:** deterministically validates a complete committed prefix and derives lifecycle state.
5. **Eligibility evaluator:** evaluates evidence separately for a decision and evaluation time.
6. **Checkpoint publisher/verifier:** signs and anchors committed ledger positions independently.
7. **Restore/reconciliation controller:** isolated workflow for validating backups and recovering ledger tails.
8. **Recommendation snapshot service:** records immutable decision-time context, integrity hash and independent anchor.
9. **Independent verification utility:** verifies records, batches, checkpoints and snapshots without relying solely on production helper functions.

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

Every mutation request includes:
- request ID/idempotency key;
- typed operation payload;
- expected committed watermark where optimistic concurrency is required;
- authenticated credentials supplied outside request JSON.

Tenant and actor IDs are derived from verified authentication context. Client-supplied tenant, actor, sequence, hash, recordedAtServer or lifecycle status values are rejected or ignored with explicit validation errors; they are never authoritative.

### 3.2 Response semantics

Success is returned only after durable commit and includes committed operation/batch ID, batch ending sequence, head hash, event IDs and projection version.

Typed failures:
- \`401\`: unauthenticated/invalid credentials;
- \`403\`: authenticated but unauthorized, with no cross-tenant existence disclosure;
- \`404\`: non-disclosing missing/out-of-scope resource;
- \`409\`: stale watermark, terminal-state conflict, duplicate lineage, idempotency digest conflict or invalid intermediate watermark;
- \`422\`: invalid schema, claim identity, reason, payload or operation semantics;
- \`503\`: bounded retry exhaustion or required dependency unavailable.

A timeout after commit is resolved by retrying the same key. A failure response must never imply that a partial transaction committed.

## 4. Transaction and concurrency contract (D-02)

### 4.1 Isolation and lock order

Reference implementation uses a serializable transaction and explicit row-level locks. A database using a different isolation model must demonstrate equivalent serializable behavior for all lifecycle invariants.

Mandatory lock order:
1. idempotency key reservation/lookup under unique constraint;
2. tenant/ledger/epoch head row;
3. predecessor evidence/lifecycle row;
4. any additional lineage/claim rows in deterministic sorted identifier order.

Every mutation procedure uses the same lock order. Locks remain held through commit/rollback. The procedure rechecks actor authorization, tenant, predecessor state, claim identity, expected watermark and lineage after locks are acquired.

### 4.2 Sequence and batch allocation

There is one authoritative \`last_sequence\` per ledger epoch. Under the ledger-head lock, allocate the next contiguous sequence range. Never maintain parallel \`next_sequence\` and \`head_sequence\` counters.

Create/revoke/withdraw normally produce a one-event batch. Supersession produces exactly two ordered events:
1. replacement creation;
2. predecessor supersession.

A batch record binds batch ID, first/last sequence, event count, batch hash and ledger scope. The transaction inserts all dependent rows, validates exact coverage, updates \`last_sequence\` and head hash, stores idempotency result, then commits. Batch rows are not published as valid watermarks before commit.

### 4.3 Database constraints

Required constraints/indexes:
- primary/unique key on tenant + ledger + epoch + sequence;
- unique event ID in tenant/ledger/epoch;
- one creation event per evidence ID;
- at most one terminal event per evidence ID across superseded/revoked/withdrawn;
- unique predecessor and unique replacement in supersession lineage;
- composite foreign keys for tenant/ledger/epoch consistency;
- unique idempotency scope key;
- batch ranges contiguous, non-overlapping and complete;
- snapshots and lifecycle rows protected from ordinary UPDATE/DELETE;
- no snapshot/checkpoint at an interior batch sequence.

Use partial unique indexes where supported. Use deferred constraints or final validation inside the append procedure for invariants that depend on all rows in a batch. A service-side precheck is never sufficient.

### 4.4 Atomic supersession algorithm

Within one transaction:
1. reserve/check idempotency key and digest;
2. lock ledger head;
3. lock predecessor and re-check it is active at current locked projection;
4. verify actor may supersede this record;
5. validate replacement ID is new, claim identity matches exactly, tenant/ledger/epoch match, no cycle/fork/merge exists;
6. allocate two consecutive sequence numbers;
7. insert replacement immutable evidence envelope;
8. insert batch header;
9. insert replacement creation event at first sequence;
10. insert lineage edge;
11. insert predecessor supersession event at second sequence;
12. compute and validate event and batch hashes;
13. verify event count, range and graph constraints;
14. update ledger last_sequence/head_hash;
15. persist idempotency response;
16. commit.

If any statement, constraint, deferred validation, hash check or commit fails, the whole transaction rolls back. No predecessor terminal event, replacement record, lineage edge, sequence advancement, batch or idempotency success response may remain partially committed.

### 4.5 Concurrent requests and retries

- Concurrent supersessions of one predecessor: one transaction may commit; the other must observe terminal state/unique conflict and fail without side effects.
- Concurrent revoke versus supersede: one serialized terminal transition wins; the loser returns a typed conflict.
- Same idempotency key and same digest: one logical operation; retries return original committed response only after current authorization recheck.
- Same key and different digest: 409 integrity conflict; no second write.
- Deadlock/serialization failure: rollback complete transaction; bounded retry using same idempotency key.
- Network timeout after commit: same-key retry returns original result.
- Retry exhaustion: typed retryable unavailable response; no partial state.
- Expired key: retained digest tombstone prevents silent reuse for the approved recovery horizon.

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

A restored database remains isolated until:
1. latest trusted anchor and checkpoint signature verify;
2. restored prefix matches trusted ledger/epoch/batch/head;
3. missing committed tail is recovered from independently retained source;
4. complete chain, batch ranges, lineage, counts and dependent snapshots verify;
5. post-recovery checkpoint is independently anchored;
6. restore audit record and approvals are complete.

A shorter backup, same-sequence/different-hash fork, missing event or unverified tail is rejected. If missing history cannot be recovered, keep the ledger quarantined. Never infer that absent revocations did not occur.

A new epoch requires a signed restore manifest linked to the last trusted checkpoint and a fully reconciled history. It cannot erase or bypass an unrecovered gap.

### 7.4 Operational thresholds

Before production, approve numeric values for maximum checkpoint age, maximum unanchored tail, checkpoint publication delay, clock skew, recovery point/time objectives and retention. Enforce below/at/above threshold tests. No hidden fallback values.

### 7.5 Threat and residual risk

The design detects database-only rollback and rewrite relative to an independent anchor. It does not guarantee integrity if the attacker controls database, anchor, signing authority and immutable backups together. Suspected signing-key compromise requires quarantine from the last independently trusted position, key incident response and re-anchoring under a reviewed trust root.

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

Alert on sequence gaps, batch mismatch, hash/checkpoint mismatch, anchor regression, signature failure, stale checkpoint, excessive unanchored tail, cross-tenant attempts, unauthorized DML, idempotency digest conflict, repeated serialization failure, restore/fork events and unexpected abstention changes.

Runbooks are required for key rotation/compromise, checkpoint verification, restore, fork quarantine, ledger unavailability, tenant offboarding, privacy erasure, schema upgrade and incident response.

## 13. Deployment choices requiring approval

The hosting provider, database/version, authentication provider, tenant/RLS model, KMS/HSM, checkpoint/anchor service, WORM storage, backup/WAL archive, numeric checkpoint thresholds, recovery objectives, retention/privacy policy and operational ownership remain undecided. This specification does not silently choose them.

## 14. Conformance and authorization

Conformance requires database constraints and concurrency behavior, fault-injected atomic rollback, independently verified checkpoint recovery, independent snapshot verification, legacy namespace isolation, privacy review and the complete migration/regression plan.

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
