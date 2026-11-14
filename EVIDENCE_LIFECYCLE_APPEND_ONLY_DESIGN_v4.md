# DealFlow — Append-only Evidence Lifecycle Architecture (v4)

**Status:** Revised v4 architecture for independent review. Documentation only; implementation is not authorized.  
**Decision basis:** D-01 through D-06 individually approved by the user on 14 November 2026. D-02, D-04 and D-06 include mandatory amendments.  
**Supersedes:** The normative design content of \`EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v2.md\` where this v3 document differs. The v2 and v3 files remain preserved as historical review material.  
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
6. Database-level concurrency controls, uniqueness constraints and durable idempotency enforce the supersession invariant; application checks alone are insufficient.
7. The authoritative ledger has one sequence authority and valid watermarks are committed batch boundaries only.
8. A trusted checkpoint must be independently protected from ordinary database rollback and ordinary database-administrator control.
9. Recovery must reconcile restored state against the latest independently trusted lifecycle position before the ledger can serve decisions.
10. Lifecycle state and evidence eligibility are separate evaluations.
11. Every finalized recommendation has an immutable, content-addressed historical snapshot with independently verifiable integrity and enough retained context to reconstruct the original evaluation.
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

**Approved with amendment.** The following controls are cumulative; no one control substitutes for the others.

### 4.1 Single transactional unit

A supersession is one database transaction and one committed ledger batch containing exactly two ordered lifecycle events:
1. replacement \`evidence_created\`;
2. predecessor \`evidence_superseded\`.

The batch includes the replacement record, both events, lineage row, batch manifest/hash, ledger-head update and idempotency result. All components commit or roll back together.

A committed supersession must never leave:
- the predecessor terminal without a valid replacement;
- both predecessor and replacement eligible because only one side committed;
- two valid replacements for one predecessor;
- a lineage edge without its corresponding events;
- a visible partial batch.

### 4.2 Concurrency protocol

The reference relational design uses a serializable transaction plus explicit row-level locks (or a demonstrated equivalent):

1. Authenticate actor and derive tenant before tenant-scoped access.
2. Validate request shape and compute canonical request digest.
3. Acquire or resolve the durable idempotency key under its unique constraint.
4. Lock the ledger-head row for the tenant/ledger/epoch.
5. Lock the predecessor evidence/lifecycle projection row.
6. Lock any additional graph rows in deterministic sorted identifier order.
7. Re-check authorization, expected watermark, predecessor state, claim identity and graph constraints under the locks.
8. Allocate the next sequence range from the sole \`lastSequence\` value.
9. Insert the replacement, ordered events, lineage and batch.
10. Validate batch completeness and hash.
11. Advance the ledger head and store the idempotency result in the same transaction.
12. Commit before returning success.

The lock order must be consistent across all mutation procedures to reduce deadlocks. A database deadlock or serialization failure aborts the complete transaction; retry is bounded and reuses the same idempotency key and canonical request. No sequence or partial row may survive a rolled-back attempt.

### 4.3 Database-enforced invariants

At minimum:
- unique \`(tenantId, ledgerId, epoch, sequence)\`;
- unique event ID within tenant/ledger/epoch;
- exactly one creation event per evidence ID;
- at most one terminal event per evidence ID across superseded/revoked/withdrawn;
- unique predecessor in lineage;
- unique replacement in lineage;
- composite foreign keys enforce tenant/ledger/epoch consistency;
- batch ranges are contiguous, non-overlapping and complete;
- deferred constraints or a narrowly scoped append procedure verify that all batch components exist before commit;
- no valid projection watermark may point inside a multi-event batch.

Where a declarative constraint cannot express a cross-row invariant, one narrowly scoped database procedure must enforce it under the locks above. It must be backed by concurrent integration tests. A preflight application query is not an invariant.

### 4.4 Idempotency and retries

Idempotency scope: tenant + authenticated actor/client scope + operation + request ID.

The request digest is computed from a validated, canonical typed request. The idempotency record and committed result are stored in the same transaction as the batch.

- Same key + same digest: return the original committed result after re-checking that the current authenticated actor remains authorized to receive it.
- Same key + different digest: reject with an integrity conflict; do not write.
- Concurrent duplicate requests: one logical operation commits; others receive the same committed result or a bounded retryable response.
- Timeout after commit: retry returns the original result.
- Failure before commit: no operation is recorded; retry may execute once.
- Expired idempotency keys are not silently recycled. Retain a compact key/digest tombstone for at least the maximum retry, backup-restore and incident-recovery horizon.
- Retry exhaustion returns a typed retryable failure and leaves no partial state.

Stale expected watermark, terminal predecessor, graph conflict and authorization failure have distinct typed outcomes. Error responses must not reveal cross-tenant existence.

## 5. Batch boundaries and authoritative sequence

There is exactly one mutable ledger sequence field: \`lastSequence\`. Earlier illustrative names such as \`next_sequence\` and \`head_sequence\` must not be implemented as parallel counters.

Each committed mutation has a batch:
- batch ID;
- first and last sequence;
- ordered event count;
- batch hash;
- server acceptance time;
- ledger ID and epoch.

Single-event operations have a one-sequence batch. Supersession has two consecutive sequences in one batch. A decision snapshot, checkpoint, export or replay watermark must identify the batch ID and ending sequence.

An interior sequence is invalid and returns \`INVALID_INTERMEDIATE_WATERMARK\`. A reader sees either the pre-transaction state or the complete committed batch, never an intermediate state.

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

### 6.3 Checkpoint freshness and unanchored tail

Before production, explicit values must be approved for:
- maximum age of latest independently anchored checkpoint;
- maximum unanchored event/batch tail;
- maximum checkpoint publication delay;
- clock-skew tolerance;
- recovery point and recovery time objectives.

No undocumented defaults are permitted. If a configured boundary is exceeded, or the independent anchor is unavailable such that current integrity cannot be established within policy, the affected ledger becomes unavailable for evidence-dependent recommendations. Healthy unrelated tenants/ledgers remain available.

### 6.4 Restore and reconciliation protocol

Restoration is not complete merely because the database starts and its local hash chain validates.

1. Isolate the restored environment from decision-serving traffic.
2. Load the latest independently trusted checkpoint and monotonic anchor.
3. Verify signature, algorithm, key ID, manifest hash and anchor position.
4. Compare restored ledger ID, epoch, batch boundary, sequence, head hash, counts and prefix against the trusted checkpoint.
5. Reject shorter history, sequence regression, same-sequence/different-hash, missing batches, gaps, forks or mismatched prefixes.
6. Recover missing committed batches from independently retained event archives/replicas where available.
7. Verify every recovered batch and the complete prefix from genesis through the latest trusted checkpoint and recovered tail.
8. Verify all affected evidence projections, supersession lineage, snapshots and checkpoint references.
9. Create a new independently anchored checkpoint only after verification.
10. Record an immutable restore/reconciliation audit record and require authorized, preferably dual-controlled approval before re-enabling the ledger.

If the restored database predates the latest trusted checkpoint, it must not serve decisions until the missing tail is recovered and verified. If missing history cannot be recovered, quarantine the affected ledger. Do not infer that absent events never occurred; do not reconstruct eligibility from the backup's older state.

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
- checkpoint-age and unanchored-tail limits;
- recovery objectives and operational ownership;
- retention, legal hold, privacy erasure and audit-retention policy;
- outage behavior and service-level objectives.

Any choice that weakens an approved invariant requires a documented design amendment and explicit user approval.

## 14. Review and authorization status

This document resolves the approved design requirements but does not prove implementation behavior. It is a design contract for later server specification and test planning.

**Authorized now:** documentation, architecture analysis, specification drafting and review.  
**Not authorized:** application/engine/UI/database code changes, schema changes, migrations, migration execution, test execution against production systems, PR #30 merge, PR #32 readiness/merge, real-agent evidence intake or evidence ingestion.

PR #30 remains open and unmerged. PR #32 remains a draft for review. A later implementation requires a separate explicit authorization after the design, server specification and migration test plan have all been critically reviewed.


## 15. Critical-review closure addendum (normative)

This addendum resolves three precision issues identified during cross-document review. It is normative and must be read as part of this architecture.

### 15.1 Lifecycle state used by a mutation

The evidence record remains immutable; it does not gain a mutable authoritative status field. To serialize a transition, the mutation procedure locks the immutable predecessor evidence row (which serves as a stable lock target) after locking the ledger head. It then derives/validates the predecessor's lifecycle state from the committed event/batch history at that locked ledger watermark.

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
- the anchor receipt binds the snapshot hash to its exact ledger/epoch/batch watermark and the relevant checkpoint;
- the checkpoint covers the snapshot's ledger watermark, or the snapshot hash is independently anchored in a receipt that explicitly binds that watermark.

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
- authenticated actor/client identity reference and authorization-decision reference;
- schema, canonicalization and digest-algorithm versions;
- witness acceptance time, unique witness transaction/receipt ID and signed receipt.

A hash-only receipt is insufficient. The independent trust domain must preserve the complete event and batch content, or a durable immutable object reference whose bytes, retention, access controls and availability are independently verified. An object is written and confirmed immutable before the ICW publishes a receipt that commits to it. Orphan objects without a receipt are uncommitted garbage and cannot become lifecycle history.

The ICW MUST enforce a per-tenant/ledger/epoch atomic compare-and-swap append:
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
4. Prepare the complete proposed batch against the ICW head, including all event and evidence bytes. Enforce stable database lock order while preparing; do not publish a database-only sequence allocation.
5. Ask the ICW to atomically append the complete batch using expected previous receipt/head and idempotency scope.
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

The stable database lock targets remain the ledger projection cursor/head row and immutable predecessor evidence row, with all other graph locks in deterministic order. The ICW CAS is the final cross-instance serialization authority. Database locks alone cannot authorize a batch whose ICW expected-head CAS fails.

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

Before implementation authorization, a signed deployment parameter register must select concrete values for checkpoint interval/age, maximum projection lag, ICW availability behavior, recovery point/time objectives, clock tolerance, receipt/object retention, idempotency tombstone retention, legal hold/erasure, key rotation and service-level objectives. These values are configuration inputs, not undocumented code defaults.

Tests MUST load the exact versioned register and exercise below/at/above boundaries. A missing, unsigned, stale or incomplete register makes the corresponding test BLOCKED and prevents implementation authorization. A test cannot pass by choosing its own convenient threshold.

## A10. Normative consequence

Any v3 statement that treats a database transaction as the sole authoritative commit, the database as sequence authority, a periodic checkpoint as the only proof of later commits, or a database tail as recoverable without ICW receipts is superseded. The ICW receipt is the sole authoritative commit proof for lifecycle batches; the relational database is a verified projection.