# DealFlow — Append-only Evidence Lifecycle Architecture (v4)

**Status:** Revised v4 architecture for independent review. Documentation only; implementation is not authorized.  
**Decision basis:** D-01 through D-06 individually approved by the user on 14 November 2026. D-02, D-04 and D-06 include mandatory amendments.  
**Supersedes:** The normative design content of \`EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v2.md\` where this v4 document differs. The v2 and v3 files remain preserved as historical review material.  
**Repository baseline:** PR #32 draft, based on the PR #30 adversarial evidence-eligibility work.  
**Scope:** Authoritative evidence lifecycle, eligibility, atomic supersession, ledger integrity, recovery, historical recommendation accountability, migration boundaries, security and operations.

## 1. Purpose and governing principles

DealFlow must be able to establish not only which evidence is currently eligible, but also whether the evidence history is trustworthy and exactly what was known when a recommendation was made.

The architecture has three distinct layers:

1. **Authoritative lifecycle history:** immutable evidence records and append-only lifecycle events.
2. **Decision-time eligibility:** a separate, versioned evaluation of whether evidence is suitable for a particular decision at a particular evaluation time.
3. **Historical recommendation record:** an immutable snapshot of the evidence, eligibility assessments, inputs, rules, assumptions and uncertainty that produced a recommendation.

A failure in one layer must not be hidden by another. An active lifecycle state is not proof of eligibility. A successful database restore is not proof of ledger integrity. A stored recommendation hash is not proof of historical verifiability unless its trust anchor is independent of the mutable database.

### 1.1 Normative safety invariants

The following are mandatory architecture requirements:

1. Evidence payloads and authoritative lifecycle events are immutable after commit.
2. The lifecycle event vocabulary is closed: \`evidence_created\`, \`evidence_superseded\`, \`evidence_revoked\`, and \`evidence_withdrawn\`.
3. No reactivation, generic status setter, or deletion of authoritative lifecycle history is permitted.
4. Legacy records are quarantined by default. Mutable legacy status is never proof that an item was never revoked or superseded.
5. Supersession is one atomic committed batch. Its predecessor transition and replacement creation are never visible separately.
6. ICW-enforced lifecycle validation, atomic compare-and-swap and durable idempotency establish authoritative supersession order; database constraints and transactional projection controls provide defense in depth; application checks alone are insufficient.
7. The authoritative ledger has one sequence authority and valid watermarks are committed batch boundaries only.
8. Every committed batch must have an independently durable ICW receipt and retained batch envelope; checkpoints are independently protected verified-prefix accelerators, not commit proof.
9. Recovery must reconcile restored database projection against the complete accepted ICW receipt history before the ledger can serve decisions.
10. Lifecycle state and evidence eligibility are separate evaluations.
11. Every finalized recommendation has an immutable, content-addressed historical snapshot with independently verifiable integrity and a versioned dependency manifest; full recomputation is conditional on lawful retention and availability of every required dependency.
12. Subsequent evidence revocation, supersession, expiry, policy change or correction never silently rewrites an earlier recommendation snapshot.
13. Corrections create new linked records/events; they do not mutate the original snapshot.
14. Any unverifiable lifecycle prefix, checkpoint, snapshot or required dependency results in an explicit unavailable/abstain outcome, not a fallback to mutable status, stale cache or a partial ledger.
15. These requirements apply to authoritative lifecycle and recommendation history, not indiscriminately to every operational record in the application database.

## 2. Scope, terminology and trust boundaries

### 2.1 Evidence ledger

Each tenant has one or more explicitly identified ledgers. A ledger is scoped by immutable \`tenantId\`, \`ledgerId\`, and \`ledgerEpoch\`. It has a genesis hash, schema version, one monotonic \`lastSequence\`, a head hash and committed batch boundaries.

Every event, evidence record, lineage edge, checkpoint, projection, snapshot reference, unique constraint and read query is scoped to the tenant and ledger. Tenant identity is derived from authenticated server context and is never trusted from request JSON.

### 2.2 Evidence record

An evidence record is an immutable envelope containing:
- evidence ID;
- tenant, ledger and epoch;
- versioned canonical claim identity;
- immutable evidence payload and provenance;
- source reference/type and source owner where known;
- observed value and relevant units/currency;
- source observation, source-check and capture timestamps where applicable;
- validity interval;
- schema and canonicalizer versions;
- content hash.

There is no authoritative mutable \`active\`, \`status\`, \`revoked\`, or \`supersededId\` field on the evidence record. Any status exposed to the application is a read-only projection derived from validated events.

### 2.3 Lifecycle event

Every event contains:
\`eventId, tenantId, ledgerId, ledgerEpoch, sequence, batchId, eventType, evidenceId, claimIdentityHash, recordedAtServer, effectiveAt, actorId, actorType, reasonCode, reasonText, requestId, payloadHash, previousEventHash, eventHash, schemaVersion\`.

Supersession additionally contains the replacement evidence ID and replacement content hash. Server-generated fields cannot be supplied or overridden by clients.

- \`recordedAtServer\` is assigned by the trusted persistence boundary inside the successful transaction.
- \`effectiveAt\` is an optional asserted business time. It never changes ledger order or rewrites earlier decisions.
- Sequence and committed batch boundary define durable order; timestamps do not replace them.
- Actor identity and tenant come from authenticated context.
- Revocation, withdrawal and supersession require an authorized actor and controlled reason code. Reason text is bounded and must not contain unnecessary sensitive personal information.
- \`requestId\` is an idempotency key scoped to tenant, authenticated actor/client scope and operation.

### 2.4 Trust boundaries

The architecture distinguishes:
- request-serving application/API;
- authoritative transactional database;
- independent checkpoint/anchor service and immutable retention store;
- signing-key service (KMS/HSM or equivalent);
- backup and recovery environment;
- recommendation snapshot store;
- independent verification tooling.

The database, checkpoint anchor and signing authority must not share a single ordinary administrator or credential boundary. If they do, the design must explicitly document that reduced assurance and must not claim protection against compromise of the shared control plane.

## 3. Lifecycle state machine and irreversible transitions

The only accepted lifecycle events are:

| Current derived state | Event | Result |
|---|---|---|
| absent | \`evidence_created\` | active |
| active | \`evidence_superseded\` | superseded |
| active | \`evidence_revoked\` | revoked |
| active | \`evidence_withdrawn\` | withdrawn |
| terminal | any lifecycle event | reject |

Terminal states are irreversible for a given evidence ID. A new correction or corroborating item receives a new evidence ID and provenance. It may link to the prior record for audit, but it cannot reactivate it.

Expiry is orthogonal to lifecycle. An active record may be expired and ineligible at an evaluation time without receiving a terminal lifecycle event.

### 3.1 Supersession graph

Supersession forms a one-to-one directed lineage chain within one tenant, ledger, epoch and exact canonical claim identity.

Mandatory conditions:
- predecessor and replacement IDs differ;
- predecessor is active at the locked transaction state;
- replacement is new and created in the same transaction;
- predecessor has at most one outgoing supersession edge;
- replacement has at most one incoming predecessor edge;
- no cycle, fork, merge, cross-tenant, cross-ledger or claim-identity mismatch;
- replacement is not already terminal or already used as a predecessor in a conflicting way;
- the predecessor supersession and replacement creation are committed together;
- any failed validation or write rolls back the entire batch.

A later supersession of the replacement extends the chain. A revoked or withdrawn predecessor cannot be superseded to conceal its terminal state.

## 4. D-02 — Atomic supersession, concurrency and idempotency

**Approved with amendment.** Lifecycle commit authority is the Independent Commit Witness (ICW), defined in the v4 normative amendment A2–A4. The relational database is a transactional projection, not the commit authority.

### 4.1 Single authoritative batch

A supersession is one ICW-accepted batch containing exactly two ordered lifecycle events:
1. replacement `evidence_created`;
2. predecessor `evidence_superseded`.

The ICW batch envelope includes the replacement evidence envelope, both events, lineage edge, idempotency identity, canonical request digest, prior receipt reference and complete batch digest. The ICW accepts or rejects the entire batch atomically. After receipt acceptance, the relational projection applies every dependent row and advances its cursor in one database transaction. The projection is wholly before or wholly after the batch.

A committed supersession must never leave the predecessor terminal without its valid replacement, both items eligible, duplicate successors, an orphan lineage edge or a visible partial projection. If ICW acceptance succeeds but projection application fails, the operation is committed-but-pending and the ledger is unavailable until exact replay completes.

### 4.2 Concurrency and serialization

The ICW performs the authoritative expected-head compare-and-swap and validates lifecycle semantics against its accepted history. Competing appends from the same previous receipt cannot both succeed. A loser reloads the accepted receipt history and revalidates its intent; it must not blindly retry a stale precomputed batch.

Do not hold a database transaction or row locks across the ICW network call. Before append, database reads are advisory only. After receipt acceptance, the projection transaction uses one deterministic lock order:
1. ledger projection cursor/head;
2. immutable predecessor evidence row, where applicable;
3. additional claim/lineage graph rows in sorted identifier order.

The projection transaction verifies the ICW receipt and applies the entire batch atomically. Database locks protect projection consistency; the ICW CAS protects authoritative cross-instance serialization.

### 4.3 Database and ICW invariants

The ICW enforces event vocabulary, creation uniqueness, terminal-transition uniqueness, active predecessor, exact claim identity, lineage uniqueness, no fork/merge/cycle, tenant/ledger/epoch consistency, contiguous sequence allocation and idempotency.

The relational projection additionally enforces:
- unique tenant/ledger/epoch/sequence;
- unique event ID;
- one creation event per evidence ID;
- at most one terminal event per evidence ID;
- unique predecessor and replacement lineage;
- composite foreign keys for tenant/ledger/epoch;
- contiguous, non-overlapping, complete batch ranges;
- no projection cursor at an interior batch sequence;
- no request-serving direct DML over authoritative projection tables.

Declarative constraints and narrowly scoped procedures are defense in depth. They do not replace ICW validation.

### 4.4 Idempotency and retries

Idempotency scope is tenant + authenticated actor/client scope + operation + request ID. The ICW is authoritative for idempotency and stores the canonical request digest and original receipt identity.

- Same key + same digest: return the original receipt after current authorization recheck.
- Same key + different digest: integrity conflict; no second receipt.
- Concurrent duplicates: exactly one accepted ICW receipt.
- Timeout after ICW acceptance: retry discovers the original receipt.
- ICW accepted but projection failed: operation remains committed/projection-pending; replay applies the original envelope.
- Failure before ICW acceptance: no authoritative commit exists; retry may append once.
- ICW outage or retry exhaustion: typed unavailable; no database-only fallback.
- Expired keys retain compact digest tombstones for the approved recovery/incident horizon.

Missing/stale/future/interior expected watermark, terminal predecessor and graph conflict have distinct typed outcomes. Error responses do not disclose cross-tenant existence.

## 5. Batch boundaries and authoritative sequence

The ICW is the sole authoritative sequence allocator per tenant/ledger/epoch. It assigns contiguous sequence ranges as part of its atomic append and binds them to the previous accepted receipt. The relational database stores only a projection cursor (`last_sequence`) representing the last ICW sequence successfully applied; it is never an allocator or independent authority.

Every accepted lifecycle mutation has a batch ID, first/last sequence, ordered event count, batch digest, ledger scope and signed ICW receipt. A supersession has two consecutive sequences in one batch. Valid read, decision, checkpoint, export and replay watermarks must identify an ICW receipt and a committed batch ending boundary. An interior sequence is invalid and returns `INVALID_INTERMEDIATE_WATERMARK`.

Before any evidence-dependent decision or current-state read is served, the service obtains the current ICW head or a signed freshness token within the approved maximum age, and verifies that the projection cursor/head and batch digests match that head. If the ICW head cannot be established within policy, the service abstains/unavailable; it must not serve a cached prior head or stale database backup as current. Historical snapshot retrieval is a separate operation that verifies the snapshot's fixed receipt/watermark and must not be represented as current state. A reader sees the complete state before or after an accepted batch; it never serves an intermediate or lagging projection as current.

## 6. D-04 — Independent checkpoints, rollback detection and recovery

**Approved with amendment.** A database backup is a recovery artifact, not an authority for current lifecycle truth.

### 6.1 Checkpoint contents and independent trust

A signed checkpoint manifest binds:
- tenant, ledger ID and epoch;
- committed batch ID and ending sequence;
- ledger head hash and batch hash;
- record/event/batch counts;
- schema and canonicalization versions;
- previous checkpoint reference/hash;
- checkpoint creation time;
- signing algorithm and key ID;
- manifest version and integrity hash.

The signature is over a precisely specified canonical manifest byte sequence with a domain separator. Verification keys and algorithm identifiers are retained for the full audit-retention period.

The latest accepted checkpoint position must also be recorded in an independently protected monotonic anchor/registry. A valid old signature is not sufficient: recovery must establish that the checkpoint is the latest trusted position, not merely a previously valid one.

### 6.2 Independence requirements

The checkpoint anchor and immutable checkpoint copy must be protected from ordinary database rollback and ordinary database-administrator credentials. Minimum separation:
- separate security account or equivalent trust domain;
- separate IAM roles and credentials;
- separate administrative ownership/approval path;
- signing key protected by KMS/HSM or equivalent;
- immutable/WORM retention for checkpoint objects and audit records;
- independently retained verification keys and key-rotation history;
- alerting for deletion, overwrite, disablement, key-policy changes and checkpoint regression.

A hash chain stored only in the same database is insufficient. A signature generated and stored only under the same compromised database control plane is also insufficient.

### 6.3 Checkpoint freshness and projection lag

Before production, explicit values must be approved for:
- maximum age of latest independently anchored checkpoint;
- maximum permitted projection lag measured against the ICW head (there is no unanchored committed event/batch tail);
- maximum checkpoint publication delay;
- clock-skew tolerance;
- recovery point and recovery time objectives.

No undocumented defaults are permitted. Exceeding the projection-lag limit or being unable to verify the ICW receipt chain makes the affected ledger unavailable for evidence-dependent recommendations. Exceeding checkpoint-age/publication targets alone triggers an alert and full receipt-chain verification without a checkpoint shortcut; it does not invalidate otherwise verifiable ICW history. Healthy unrelated tenants/ledgers remain available.

### 6.4 Restore and reconciliation protocol

A database backup is a projection recovery accelerator, never the source of lifecycle truth.

1. Isolate the restored environment from decision-serving and mutation traffic.
2. Authenticate to the ICW using recovery credentials independent of database credentials.
3. Retrieve the latest trusted ICW head, contiguous receipt chain and complete retained batch envelopes.
4. Verify receipt signatures, receipt-chain continuity, assigned sequences, object digests, idempotency identities and checkpoint references.
5. Compare the restored projection against ICW receipts at every batch boundary; reject any altered, missing, extra, forked or substituted batch.
6. Replay missing accepted ICW envelopes into the projection in receipt order, atomically and idempotently.
7. Verify evidence payloads, lifecycle events, lineage, batch digests, projections, snapshots and snapshot provenance.
8. Confirm the rebuilt projection cursor/head exactly matches the current ICW head.
9. Record an immutable recovery report and require approved authorization before re-enabling the ledger.

A locally valid database tail without matching ICW receipts is rejected, even if it extends a trusted checkpoint. A missing/altered ICW object or receipt makes the affected history unverifiable; quarantine the ledger. Recovery must never create or sign an ICW receipt from database contents. There is no unanchored committed tail to reconstruct: every committed batch already has an ICW receipt.

### 6.5 Epoch transition

A new epoch is a controlled recovery boundary, not a way to discard unknown history. Its signed restore manifest must identify the prior ledger/epoch, last trusted checkpoint, recovered sequence/head, recovery sources, missing-range disposition, operator approvals and reason.

A new epoch may be opened only after the prior trusted prefix and all required intervening committed batches are recovered and reconciled, or the ledger remains explicitly quarantined/unavailable. The new epoch must not silently claim continuity across an unrecovered gap. Historical snapshots remain bound to their original epoch and checkpoint.

### 6.6 Threat boundary and residual risk

This design is intended to detect accidental rollback, stale backup restoration, database-only tampering, sequence regression, fork substitution and compromise of ordinary database administrator credentials.

It cannot honestly claim protection if an attacker simultaneously controls the database, independent anchor, signing authority and immutable backup administration, or compromises the trust root before checkpoints are anchored. Such incidents require key-compromise response, quarantine from the last independently trusted position, forensic review and explicit re-establishment of trust. The architecture must disclose this residual risk rather than claim absolute immutability.

## 7. D-05 — Lifecycle state and eligibility are separate

Lifecycle answers: what irreversible lifecycle events have been committed for this evidence ID?

Eligibility answers: is this evidence acceptable for this specific decision at this evaluation time?

Eligibility is independently evaluated using:
- validated lifecycle projection at a committed batch watermark;
- immutable payload and provenance integrity;
- source authority and authorization;
- source freshness and source-check time;
- validity interval and evaluation timestamp;
- claim identity and contradiction policy;
- supersession/revocation/withdrawal history;
- applicable versioned evidence and decision rules.

An active but expired record is lifecycle-active and currently ineligible. Expiry does not create a terminal event. A later revocation excludes evidence from subsequent evaluations but does not alter an earlier as-known snapshot.

Material contradictions remain unresolved/ineligible unless a separately designed, versioned adjudication process is approved. Recency alone is not adjudication.

If required lifecycle, checkpoint, provenance or eligibility data cannot be verified, DealFlow must abstain for decisions depending on that evidence. It must not silently drop a problematic record and continue with a misleading partial portfolio.

## 8. D-06 — Immutable, independently verifiable recommendation snapshots

**Approved with amendment.** A finalized recommendation snapshot is a historical decision record, not a live view of current evidence.

### 8.1 Required snapshot content

Every snapshot preserves:
1. unique snapshot and recommendation IDs;
2. creation and evaluation timestamps;
3. tenant, ledger ID and epoch;
4. exact committed batch ID, ending sequence, head hash and independently verifiable checkpoint reference;
5. exact evidence identifiers, versions and immutable content hashes considered;
6. lifecycle state of each item at the decision watermark;
7. eligibility assessment for each item, including inclusion/exclusion, reason codes and policy version;
8. decision input values, units, normalization and source;
9. candidate opportunity/action set and material constraints used by the decision;
10. rule, policy, taxonomy, projector and engine versions;
11. relevant assumptions, confidence/evidence-quality assessments and uncertainty;
12. calculation outputs and recommendation/abstention result;
13. sufficient context and retained versioned dependencies to independently verify or reconstruct the historical evaluation;
14. canonical snapshot schema/version and tamper-evident integrity hash;
15. snapshot signing/anchoring reference where required for independent trust.

Do not store unnecessary personal data in snapshots. The snapshot should retain the minimum decision context necessary for audit, subject to approved retention and legal requirements.

### 8.2 Hash and independent verification

The snapshot is serialized using a versioned canonical format. Its hash uses a domain-separated cryptographic digest over the complete immutable snapshot payload, excluding only its own hash/signature fields.

The hash must not be trusted merely because it is stored beside the payload in the same mutable database. The snapshot hash (or a Merkle root covering a batch of snapshot hashes) must be signed and independently anchored in the checkpoint trust domain or an equivalent separately controlled immutable receipt store.

An independent verifier must be able to:
- retrieve the original snapshot bytes;
- validate canonicalization and schema version;
- recompute the snapshot hash independently;
- verify signature/anchor and key history;
- verify the referenced ledger checkpoint and batch watermark;
- verify evidence identifiers/content hashes and historical lifecycle states;
- load the exact rule/engine/projector artifacts and input context required for reconstruction;
- report missing or legally unavailable dependencies explicitly.

### 8.3 Historical immutability and corrections

Historical snapshots are never updated or deleted to reflect subsequent evidence revocation, supersession, expiry, rule changes or corrections.

A correction creates a new immutable correction record or linked event containing:
- correction ID;
- original snapshot ID/hash;
- new snapshot or correction payload ID/hash;
- correction type and reason;
- actor and authorization context;
- recorded timestamp;
- affected fields/claims;
- link to any later evidence or adjudication;
- its own integrity hash and independent anchor.

The original snapshot remains preserved and independently identifiable. The corrected record does not masquerade as the original recommendation. A later retrospective evaluation is a new snapshot with a new watermark and explicit retrospective mode.

### 8.4 Historical reconstruction versus recomputation

Historical reconstruction means verifying what the original system recorded and the exact evidence/rules/inputs it used. Recalculation means running logic again. These are not interchangeable.

For deterministic components, retain exact versioned artifacts and inputs needed to reproduce outputs. For nondeterministic/model-assisted components, preserve the actual structured model output used, model/provider identifier, version where available, parameters, prompt/template hash and relevant response metadata; do not claim that rerunning a remote model will reproduce identical output. If a required artifact or evidence payload is unavailable, mark reconstruction incomplete/unavailable rather than silently substituting a newer version.

## 9. Hashing and canonicalization

Use RFC 8785 JSON Canonicalization Scheme or a fully specified equivalent, UTF-8, validated typed schemas, and exact representations for money/quantities (integer minor units or canonical decimal strings). Reject duplicate JSON keys, invalid Unicode and non-finite values.

Every digest has a domain separator and byte-exact preimage specification. Hash values are decoded to 32 raw bytes before concatenation. Epoch/sequence encodings are unsigned base-10 ASCII without leading zeros. Persisted digest display is lowercase 64-character hex.

Independent golden vectors are required for record, event payload, event, batch, genesis, checkpoint manifest/signature and recommendation snapshot. The verifier must not call the production canonicalization/hash helper to generate its expected result.

A hash chain is tamper-evident relative to a trusted head; it is not, by itself, proof against a privileged actor who can rewrite the entire database and recompute the chain.

## 10. Security, tenant isolation and privacy

- Lifecycle mutation is available only through authorized server-side procedures.
- Ordinary request-serving credentials have no direct DML privileges over authoritative evidence, event, batch, lineage, checkpoint or snapshot tables.
- Database roles follow least privilege. RLS is defense in depth; procedures must validate authenticated tenant context and must not bypass RLS unintentionally.
- Administrative, migration, checkpoint and restore permissions are separate, time-limited and audited; sensitive recovery should use dual approval.
- Operational application records may remain mutable where appropriate; authoritative lifecycle and finalized recommendation history are protected.
- Encrypt in transit and at rest; protect signing keys and secrets in managed security services.
- Minimize PII, redact logs, and define retention, legal hold, export and erasure policies before real-agent data.
- Legal erasure must use a separately reviewed policy. It must not silently rewrite a recommendation snapshot or pretend erased evidence remains independently reconstructable. If legally required erasure removes a dependency, retain permitted integrity metadata and explicitly mark reconstruction as content-limited/unavailable.

## 11. Migration boundary

Migration is quarantine-first and one-way into a new ledger namespace. Every legacy item is imported as a quarantined envelope with source bytes/hash, source manifest reference, original status snapshot marked untrusted, provenance, migration mapping and reason codes.

No legacy record becomes active because its last mutable status says active. Historical lifecycle events may be reconstructed only from independently verifiable source records and explicit review; migration must never fabricate an event to imply a known history. Re-attestation creates a new evidence ID through the normal authenticated create pathway. The old legacy envelope remains quarantined and cannot be referenced by eligible-evidence projections.

Migration must be deterministic, restartable and idempotent. It must preserve source artifacts, record counts, hashes, lineage anomalies, PII classification and operator approvals. A dry run and independent review precede any future execution.

## 12. Availability, abstention and incident handling

Fail closed for the affected ledger/epoch when:
- sequence gaps, hash mismatch, invalid signature, checkpoint regression or fork is detected;
- batch completeness or committed watermark cannot be verified;
- projection/schema/canonicalizer version is unsupported;
- restored history cannot be reconciled to the latest trusted checkpoint;
- a required snapshot/evidence dependency cannot be verified.

An unauthorized write attempt is rejected and audited; it does not automatically disable unrelated healthy tenants/ledgers. A read denied for the requesting tenant returns unavailable/abstain without revealing cross-tenant existence. An integrity failure is scoped to the affected ledger/epoch unless evidence indicates a broader trust-domain compromise.

No local cache or mutable legacy status may be used as an authoritative fallback.

## 13. Unresolved deployment-specific choices

This architecture deliberately does not invent production infrastructure choices. Before implementation authorization, the following must be selected and reviewed:
- hosting and database provider/version;
- authentication provider and actor/tenant claim model;
- tenant isolation and RLS configuration;
- encryption and key-management provider;
- checkpoint anchor and immutable/WORM storage trust domain;
- checkpoint signing algorithm, key rotation and compromise process;
- backup, WAL/event archive and disaster-recovery design;
- checkpoint-age and maximum projection-lag limits; ICW receipt coverage is continuous at commit time;
- recovery objectives and operational ownership;
- retention, legal hold, privacy erasure and audit-retention policy;
- outage behavior and service-level objectives.

Any choice that weakens an approved invariant requires a documented design amendment and explicit user approval.

## 14. Review and authorization status

This document resolves the approved design requirements but does not prove implementation behavior. It is a design contract for later server specification and test planning.

**Authorized now:** documentation, architecture analysis, specification drafting and review.  
**Not authorized:** application/engine/UI/database code changes, schema changes, migrations, migration execution, test execution against production systems, PR #30 merge, PR #32 readiness/merge, real-agent evidence intake or evidence ingestion.

PR #30 remains open and unmerged. PR #32 remains a draft for review; the v4 contract is maintained on a separate documentation branch pending review. A later implementation requires a separate explicit authorization after the design, server specification and migration test plan have all been critically reviewed.


## 15. Critical-review closure addendum (normative)

This addendum resolves three precision issues identified during cross-document review. It is normative and must be read as part of this architecture.

### 15.1 Lifecycle state used by a mutation

The evidence record remains immutable; it does not gain a mutable authoritative status field. The ICW serializes lifecycle transitions against its accepted receipt history using expected-head CAS and semantic validation. After receipt acceptance, the database projection transaction locks the ledger projection cursor/head, then the immutable predecessor evidence row (stable projection lock target), then graph rows in deterministic order. It validates the projection against the receipt-bound history before applying the batch. No database lock is held across the ICW network call.

A materialized current-state/guard projection may be maintained transactionally to improve lookup performance, but it is rebuildable derived data, never the source of truth. It must be updated in the same transaction as the batch and ledger head, reconciled against the event history before use, and must fail closed if inconsistent. No stale or caller-supplied projection can authorize supersession.

### 15.2 Monotonic checkpoint-anchor publication

The independent anchor is not merely an archive of signed checkpoints. It maintains the latest accepted checkpoint pointer per ledger/epoch and enforces monotonic compare-and-swap publication.

A checkpoint publisher must:
- read the current trusted anchor;
- verify that the proposed checkpoint is a strict valid extension of the anchored prefix;
- reject lower sequence, same-sequence/different-head, forked predecessor reference or unknown epoch;
- atomically advance the anchor pointer only if its expected prior anchor still matches;
- treat an identical already-anchored checkpoint as an idempotent success;
- reject a new-epoch publication unless it carries an authorized restore manifest satisfying the recovery rules in §6.5.

The signing service must not sign or anchor a stale database head merely because its local hash chain is internally consistent. If the independent anchor cannot be read or its compare-and-swap cannot be completed, no new checkpoint is considered independently anchored.

### 15.3 Recommendation finalization depends on independent anchoring

A snapshot payload is immutable from its first durable write. Its publication/verification state is recorded separately and append-only.

A recommendation is not represented as finalized, verified or actionable until:
- the snapshot payload and hash are durably stored;
- the snapshot hash (or a Merkle root containing it) is signed and independently anchored;
- the ICW snapshot-finalization receipt binds the snapshot hash to its exact ledger/epoch/batch watermark and exact accepted ledger receipt; a checkpoint is an optional verification accelerator only;
- the snapshot hash is independently anchored in an ICW receipt that explicitly binds that watermark and resolves the exact accepted ledger receipt; a checkpoint alone is never a substitute for this snapshot receipt.

If anchoring is pending or unavailable, the system may retain the immutable snapshot in a pending state for retry, but must return an explicit pending/unavailable result rather than a finalized actionable recommendation. A later successful anchor changes only the separate publication event/status; it does not mutate the snapshot payload. An anchor failure or invalid receipt leaves the recommendation non-final and unavailable.

Corrections follow the same rule: a new correction record must be independently anchored before it is treated as a verified correction. The original snapshot remains unchanged.


---

# v4 normative amendment — Independent commit-witness architecture

**Precedence:** This section is normative and supersedes any conflicting v3 wording about database sequence authority, checkpoint intervals, unanchored tails, commit durability, restore sources, or snapshot-to-ledger provenance. Earlier sections remain applicable where consistent.

## A1. The checkpoint is not the commit authority

A periodic checkpoint authenticates a previously accepted prefix. It does not, by itself, authenticate later database commits. A local hash chain extending a trusted checkpoint proves only internal consistency of the presented tail; it does not prove that the tail is the history that was actually committed.

Accordingly, DealFlow MUST NOT treat a database commit occurring after the latest independent checkpoint as authoritative merely because its local sequence and hashes extend that checkpoint. Maximum tail length, frequent checkpointing, signatures created after the fact, database backups, and local WAL are not substitutes for independent commit evidence.

## A2. Independent Commit Witness (ICW)

Introduce an **Independent Commit Witness (ICW)** as the durable, linearizable commit authority for lifecycle batches. The ICW is a separately administered trust domain, not a second table or service credential controlled by the ordinary database administrator.

For every accepted lifecycle batch, the ICW MUST atomically retain:
- the complete canonical batch envelope, or an immutable content-addressed object containing the complete envelope;
- tenant, ledger, epoch, batch ID, first/last sequence and event count;
- the exact ordered canonical event bytes and all authoritative evidence/lineage payload bytes needed to reconstruct the batch;
- the previous accepted witness receipt ID/hash and previous ledger position;
- the resulting batch digest and resulting ledger head digest;
- idempotency scope and canonical request digest (never a reusable raw secret);
- authenticated actor/client identity reference and a signed, scoped authorization assertion (tenant, actor, permitted operation/resource scope, request digest, audience, expiry and unique assertion ID);
- schema, canonicalization and digest-algorithm versions;
- witness acceptance time, unique witness transaction/receipt ID and signed receipt.

A hash-only receipt is insufficient. The independent trust domain must preserve the complete event and batch content, or a durable immutable object reference whose bytes, retention, access controls and availability are independently verified. An object is written and confirmed immutable before the ICW publishes a receipt that commits to it. Orphan objects without a receipt are uncommitted garbage and cannot become lifecycle history.

The ICW MUST cryptographically validate the authorization assertion against a trust key/issuer not controlled by ordinary application administrators, and bind it to the canonical request digest. It then validates the proposed batch against its authoritative lifecycle state before accepting it, including closed event vocabulary, exactly one creation event per evidence ID, no second terminal transition, active predecessor requirement, exact claim-identity match, unique predecessor/replacement lineage, no fork/merge/cycle and tenant/ledger/epoch consistency. It MUST enforce a per-tenant/ledger/epoch atomic compare-and-swap append:
- supplied expected previous receipt/head must equal the current ICW head;
- the next sequence range must be exactly contiguous;
- the batch must be complete and internally valid;
- the same idempotency scope/key plus same request digest returns the original receipt;
- the same key with a different digest is rejected;
- a competing append from the same prior head cannot also commit;
- an identical receipt retry is idempotent;
- lower sequence, reused sequence, fork, gap, epoch confusion or stale predecessor is rejected.

The ICW receipt is the **linearization point and authoritative commit record**. No lifecycle batch is considered committed, eligible for projection, or reportable as successful until the ICW has durably accepted the complete batch and returned a verifiable receipt. A database transaction without that receipt is not a committed lifecycle operation.

## A3. Commit and projection protocol

The relational database becomes a transactional, rebuildable projection of the ICW log. Its local `last_sequence`, head hash and status projections are cursors/cache state, not independent sequence authorities.

For each mutation:
1. Authenticate and authorize the actor; derive tenant and actor only from trusted server context.
2. Canonicalize and validate the typed request; calculate its request digest.
3. Read the current ICW head and verify the local database projection is exactly caught up to that head. If not, reconcile before accepting another mutation.
4. Prepare the complete proposed batch against the ICW head, including all event and evidence bytes. Do not hold a database transaction or row locks across the external ICW network call. A preflight read is advisory only; the ICW revalidates lifecycle semantics and expected-head CAS atomically.
5. Ask the ICW to atomically append the complete batch using expected previous receipt/head and idempotency scope. The ICW is the serialization authority; a stale-head loser reloads the new receipt history and revalidates.
6. Only after receiving and verifying the ICW receipt, apply the complete batch to the relational projection in one database transaction. The projection transaction inserts all records/events/lineage/batch data, advances its cursor to the receipt position and commits atomically.
7. Verify the resulting projection head and batch digest against the ICW receipt.
8. Return success only when the receipt is durable and the database projection is caught up and verified.

The ICW append occurs before projection application. If the process crashes or the database transaction fails after ICW acceptance, the operation is **committed in the authoritative log but projection-pending**. The server MUST NOT pretend it rolled back, MUST NOT issue a conflicting second mutation, and MUST NOT expose the lagging projection as current. Recovery replays the accepted receipt and full batch envelope idempotently into the database. Until reconciliation completes, the affected ledger is unavailable for evidence-dependent decisions and mutations.

If the ICW rejects or cannot durably acknowledge the append, no database projection mutation may commit. An ICW outage therefore blocks new lifecycle commits; there is no database-only fallback, queue that is later described as committed, or offline mode that weakens the invariant.

This protocol deliberately distinguishes:
- **authoritative commit:** ICW receipt accepted;
- **projection applied:** relational transaction committed and verified against receipt;
- **operation response complete:** authoritative commit and projection application both confirmed;
- **projection pending:** authoritative commit exists but the database view is not yet caught up.

The ICW is authoritative for idempotency and sequence allocation. The database may keep unique constraints and a local idempotency projection for efficiency, but those are not substitutes for ICW enforcement.

## A4. Supersession atomicity across the trust boundary

A supersession is one ICW append containing exactly two ordered lifecycle events—replacement creation followed by predecessor supersession—and the replacement evidence envelope and lineage edge. The ICW must accept or reject the complete batch atomically.

The database projection applies that accepted batch in one transaction. A crash can leave the projection wholly before or wholly after the batch, never halfway through. While projection-pending, the ledger is unavailable; neither predecessor nor replacement may be served from a partially updated projection.

After ICW acceptance, the projection transaction locks the ledger projection cursor/head row, then the immutable predecessor evidence row, then other graph rows in deterministic sorted order. It applies the complete receipt-bound batch and advances the projection cursor atomically. No database lock is held while waiting for ICW. The ICW CAS is the cross-instance serialization authority; database locks alone cannot authorize a batch whose ICW expected-head CAS fails.

## A5. Checkpoints become verified-prefix accelerators

Periodic checkpoints remain useful for efficient verification, export and recovery, but they are not the only evidence of committed history and they do not define whether a post-checkpoint batch was committed.

A checkpoint MUST identify the exact contiguous ICW receipt prefix it summarizes and bind:
- ICW trust-domain and log/ledger identifiers;
- start/genesis and ending receipt IDs/hashes;
- ending batch ID, sequence and ledger head;
- receipt count and batch count;
- a Merkle root or equivalent independently verifiable commitment to every included receipt;
- schema/canonicalization versions, signer/key ID and prior checkpoint reference.

The independent anchor must prevent checkpoint regression and forks. A checkpoint can be accepted only if its receipt range is fully present and verifiable in the ICW. A checkpoint signature over a database-reconstructed tail without corresponding ICW receipts is invalid.

There is no permitted "unanchored committed tail": every committed batch has an ICW receipt at commit time. A checkpoint interval may leave more receipts to verify, but it does not leave committed events unauthenticated.

## A6. Restore and recovery source of truth

A database backup is only a projection recovery accelerator. Recovery MUST:
1. Isolate the database from decision and mutation traffic.
2. Authenticate to the ICW using recovery credentials independent of database credentials.
3. Retrieve the latest trusted ICW head and receipt chain, including full batch envelopes.
4. Verify receipt signatures, receipt-chain continuity, sequence continuity, object hashes/retention, idempotency identities and checkpoint references.
5. Compare the restored projection with the ICW at every batch boundary; reject any altered, missing, extra, forked or substituted batch.
6. Rebuild or repair the projection from the last verified projection point using ICW-retained batch envelopes.
7. Verify all evidence payloads, lifecycle events, lineage, projections, snapshots and their provenance.
8. Confirm the rebuilt database cursor/head exactly matches the current ICW head.
9. Record an immutable recovery report and require the approved authorization before re-enabling the ledger.

A database tail that extends a checkpoint but lacks matching ICW receipts is rejected even if its local hash chain is valid. A receipt whose payload object is missing, altered or unavailable is not reconstructable; quarantine the affected ledger rather than infer history. The recovery process cannot create, backfill or sign a missing ICW receipt from database contents.

A new epoch cannot bypass missing ICW receipts or erase a prior ledger's unresolved history. It requires an authorized recovery manifest and a fully verified prior history, or the prior ledger remains quarantined.

## A7. Threat model and residual risk

The ICW must have separate administrative ownership, IAM roles, credentials, audit trail, durable storage/retention controls and key management from the transactional database. Ordinary database administrators, database owners and application administrators MUST NOT be able to alter, delete, reorder, fabricate or suppress ICW receipts or batch envelopes.

The guarantee covers database-only rollback, rewrite, tail substitution, local hash recomputation, projection corruption, stale backup restoration and compromise of ordinary database-administrator credentials, assuming ICW controls and cryptographic trust roots remain uncompromised.

It does not cover simultaneous compromise of the ICW's independent administrative/control plane and its signing/trust roots, nor a malicious authorized actor submitting false source evidence. Such incidents require quarantine from the last independently verified ICW position, incident response and explicit trust re-establishment. The system must not claim absolute immutability.

## A8. Snapshot provenance and reconstruction contract

Snapshot integrity and ledger provenance are separate assertions.

A finalized snapshot requires:
- canonical immutable snapshot bytes and digest;
- exact tenant/ledger/epoch and committed ICW receipt ID/hash at the snapshot watermark;
- proof that the referenced receipt is in the ICW's contiguous accepted history from genesis;
- exact batch boundary, sequence and ledger head represented by that receipt;
- a separate ICW snapshot-finalization receipt binding snapshot digest, snapshot object digest/location, ledger receipt ID/hash, watermark, schema/canonicalization version, algorithm/key ID and finalization time.

A snapshot receipt that merely signs a claimed sequence/head is insufficient. The ICW must resolve the referenced ledger receipt and prove its inclusion in the accepted receipt chain. A snapshot cannot cite a later checkpoint that does not cover its watermark as the sole proof. If the snapshot is finalized through a direct receipt, that receipt must bind the exact accepted ICW ledger receipt and the ICW must retain the snapshot bytes or immutable object reference.

Define two independent outcomes:
- **Historical integrity verification:** original snapshot bytes/hash and finalization receipt verify; its exact recorded inputs, result and dependencies are identified.
- **Historical recomputation:** the original evaluation is rerun using exact retained artifacts and inputs and satisfies the specified deterministic comparison contract.

Verification can succeed while recomputation is incomplete because a legally erased or unavailable dependency is missing. Never label that outcome "fully reconstructed."

The reconstruction package MUST include immutable identifiers and digests for engine/runtime artifacts, policy, taxonomy, projector, canonicalizer, feature/normalization definitions, model/provider metadata and actual model output, prompts/templates where applicable, configuration, random seeds where relevant, external lookup responses actually consumed, exact normalized inputs, numerical precision/rounding rules and execution semantics. Retention and lawful-erasure policy must state which components can be retained, redacted or rendered unavailable.

For deterministic components, the pass oracle is exact equality of canonical structured outputs and recommendation/abstention result, with any explicitly specified numeric tolerance limited to fields proven to be platform-dependent. For nondeterministic/model-assisted components, verify the preserved actual output and downstream deterministic computation; do not require a remote model rerun to reproduce identical output.

## A9. Deployment parameter register

Before implementation authorization, a signed deployment parameter register must select concrete values for checkpoint interval/age and alert thresholds, maximum projection lag, ICW availability behavior, recovery point/time objectives, clock tolerance, receipt/object retention, idempotency tombstone retention, legal hold/erasure, key rotation and service-level objectives. Checkpoint-age thresholds are operational/verification-mode controls, not substitutes for ICW receipts or automatic integrity failures. These values are configuration inputs, not undocumented code defaults.

Tests MUST load the exact versioned register and exercise below/at/above boundaries. A missing, unsigned, stale or incomplete register makes the corresponding test BLOCKED and prevents implementation authorization. A test cannot pass by choosing its own convenient threshold.

## A10. Normative consequence

Any v3 statement that treats a database transaction as the sole authoritative commit, the database as sequence authority, a periodic checkpoint as the only proof of later commits, or a database tail as recoverable without ICW receipts is superseded. The ICW receipt is the sole authoritative commit proof for lifecycle batches; the relational database is a verified projection.

## A11. v4 review-closure clarifications

1. **Lifecycle validation at the commit authority.** The ICW validates event vocabulary, creation uniqueness, terminal-state irreversibility, predecessor activity, claim identity, lineage uniqueness and graph acyclicity against its accepted history. It does not accept a semantically invalid batch merely because the application server proposed it. The relational constraints remain defense in depth.
2. **No database locks across witness network calls.** Database preflight reads do not reserve sequence or authorize a transition. The ICW expected-head CAS and lifecycle-state validation resolve races. The database projection transaction starts only after receipt acceptance, locks projection cursor/head then evidence and graph rows in the documented deterministic order, and applies the complete batch.
3. **Concrete mutation watermark rule.** Every new lifecycle command (`createEvidence`, `supersedeEvidence`, `revokeEvidence`, `withdrawEvidence`) MUST include an expected ICW receipt ID/hash and ending sequence equal to the current ICW head at append time. Missing watermark is a validation error; stale, future, interior-batch or mismatched receipt is a conflict and creates no receipt. An exact same-key/same-digest idempotent replay is resolved to its original receipt after current authorization is rechecked, even if the ledger head has since advanced. A different digest under the same key is an integrity conflict.
4. **Privacy-preserving payload retention.** The ICW envelope binds all authoritative lifecycle metadata and content digests. Evidence content containing personal or legally erasable data is stored as an encrypted immutable object under a separately controlled per-object or per-subject key. Lawful erasure may destroy the relevant decryption key or remove the content object only under the approved erasure policy; the receipt, permitted non-PII metadata and content digest remain where lawful. Integrity/provenance verification may then remain possible while content reconstruction is explicitly PARTIAL/UNAVAILABLE. The system must never claim the erased payload was reconstructed.
5. **Checkpoint and tail terminology.** A committed batch is never "unanchored": it has an ICW receipt. The only permitted lag is a projection backlog or a checkpoint that has not yet summarized already witnessed receipts. Thresholds and tests must use those precise terms.


## A12. Decision-serving freshness gate

Every current-state evidence read, eligibility evaluation and recommendation must be bound to the latest ICW head established for that request, or to a signed ICW head/freshness token whose age is within the explicitly approved deployment limit. The service verifies that the relational projection cursor and head digest exactly match the established ICW head before serving a current recommendation. A cache may reuse a result only if it also validates the bound ICW head token and freshness expiry.

If the ICW head cannot be read, the token is expired, or the projection is behind/mismatched, current-state reads and recommendations return explicit unavailable/abstain. No cached previous head, stale backup or checkpoint age assumption may stand in for current-head verification. Historical snapshot verification is allowed against its fixed immutable receipt, but it must be labelled historical and cannot assert current evidence state.


## A13. Authorization assertion at the commit witness

The ICW MUST NOT trust a plain actor ID, role name, authorization-decision reference or unsigned application claim. Each append request carries a signed, short-lived authorization assertion issued by a separately controlled identity/authorization authority. It binds tenant, actor/client, permitted lifecycle command and resource/claim scope, canonical request digest, ICW audience, expiry and unique assertion ID. The ICW verifies issuer, signature, audience, expiry, scope and request-digest match before accepting the batch. Assertion IDs are replay-protected except for exact idempotent retries bound to the same request digest and original receipt.

The signing/issuance authority and its administrative credentials are outside ordinary application-administrator and database-administrator control. If a deployment cannot provide this separation, it must disclose the reduced threat boundary and cannot claim that application-administrator compromise is resisted.
