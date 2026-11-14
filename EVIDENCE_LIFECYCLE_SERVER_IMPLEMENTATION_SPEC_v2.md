# DealFlow — Server-side evidence lifecycle implementation specification

**Status:** Implementation-ready proposal pending independent review; no implementation authorized.
**Design authority:** `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN.md` v2.
**Baseline under review:** PR #30 head `787729f6e8ab5b9ea79d3fb8d5fa5bae40d397c6`.
**Scope:** Hosted server-side persistence and API. Does not modify the decision engine in this documentation phase.

## 1. Architecture and trust boundaries

Components:
1. Authenticated API gateway: validates token/session, resolves tenant and actor, rate-limits, validates request size.
2. Evidence lifecycle service: sole application writer; owns state machine, canonicalization, authorization, idempotency, transaction orchestration.
3. Transactional relational database (PostgreSQL reference): immutable record/event tables, ledger head, idempotency, lineage, snapshots, checkpoints.
4. KMS/HSM: signing keys for checkpoint roots; private keys never leave key service.
5. Independent checkpoint store/WORM backup: separately administered trust domain.
6. Decision service adapter: reads validated projection at an explicit watermark; no direct status writes.
7. Audit/monitoring pipeline: privacy-minimized security and operational events.

Browser/client is untrusted. It may propose content and an expected watermark but cannot choose tenant, actor, sequence, recorded timestamp, event hash, lifecycle status, or authorization scope.

## 2. Database schema and constraints

Implement the tables and indexes defined in design v2. Additional required constraints:
- foreign keys include tenant_id + ledger_id composite scope;
- `UNIQUE(tenant_id, ledger_id, evidence_id)`;
- `UNIQUE(tenant_id, ledger_id, sequence)`;
- `UNIQUE(tenant_id, ledger_id, event_id)`;
- partial unique index: one terminal event per evidence ID;
- `UNIQUE(tenant_id, actor_scope, operation, request_id)` on idempotency;
- lineage predecessor unique and replacement unique;
- CHECK event_type in the four approved values;
- NOT NULL on server timestamps, actor, request digest, payload hashes, sequence, and previous hash;
- immutable-table triggers reject UPDATE/DELETE except controlled, audited retention/crypto-shredding procedure;
- row-level security enabled and forced for tenant-scoped tables;
- application DB role has no direct UPDATE/DELETE privilege on records/events.

The exact SQL migration must be reviewed against the selected PostgreSQL version. Do not claim portability until equivalent isolation/constraint behavior is proven for another database.

## 3. API contract

All endpoints require authentication, CSRF protection where cookie sessions are used, tenant resolution from credentials, schema validation, and request correlation ID.

### 3.1 Create evidence
`POST /v1/ledgers/{ledgerId}/evidence`
Request: immutable claim identity, evidence payload/provenance, `expectedSequence`, `idempotencyKey`.
Server: authorize create; canonicalize; calculate record hash; transactionally insert record + created event + idempotency result + ledger head update.
Response 201: evidence ID, event ID, sequence, recordedAtServer, content hash, event hash, watermark.

### 3.2 Supersede
`POST /v1/ledgers/{ledgerId}/evidence/{evidenceId}/supersede`
Request: replacement payload/provenance, reason code/text, effectiveAt optional, expected watermark, idempotency key.
Server: verify caller can contribute replacement and has authority to supersede predecessor; lock ledger and predecessor; validate active state and exact claim identity; ensure replacement ID is new; insert replacement record + creation event + lineage row + predecessor supersession event in one transaction; update head and idempotency.
Response 201: predecessor/replacement IDs, both event IDs, final sequence/head hash, projected states.

### 3.3 Revoke / withdraw
`POST /v1/ledgers/{ledgerId}/evidence/{evidenceId}/revoke` and `/withdraw`.
Request: reason code/text, effectiveAt optional, expected watermark, idempotency key.
Server: authorize by role and source ownership policy; lock evidence and ledger; verify projected active state; append terminal event; update head and idempotency atomically.
Response 201: event ID, sequence, recorded time, head hash, derived terminal state.

### 3.4 Read / project
`GET /v1/ledgers/{ledgerId}/projection?sequence=N`
Resolve exact prefix; verify checkpoint and all events since checkpoint; return projection, watermark, integrity status, projector version. If invalid/unavailable return 503/409 and an abstention-safe machine code. Do not return partial eligible records.

### 3.5 Checkpoint / export / import
Checkpoint creation is an internal privileged operation, not a public agent endpoint. Export returns signed manifest + immutable payloads. Import validates and stages only; restore requires separate admin workflow and approval.

## 4. Transaction algorithms

All mutation algorithms use a SERIALIZABLE transaction or explicit ledger-row lock plus unique constraints and compare-and-swap. The chosen isolation mode must be documented and load-tested.

Pseudocode:
1. Authenticate/authorize before data-dependent response; bind tenant from auth context.
2. Begin transaction.
3. Lock ledger row FOR UPDATE; verify ledger status healthy and expected sequence/head.
4. Check idempotency key. If matching digest exists, return saved response after transaction commit; if digest differs, audit and reject.
5. Lock target evidence row(s) in deterministic ID order.
6. Rebuild/verify relevant lifecycle projection from trusted checkpoint to head (or verified materialized projection with event watermark/hash); never trust mutable projection cache alone.
7. Validate operation, state transition, claim identity, graph constraints, actor authorization.
8. Generate event IDs, sequence(s), server timestamp(s), canonical payload and hash chain in sequence order.
9. Insert immutable rows, lineage, idempotency result; update ledger head using old sequence/hash predicate.
10. Commit. Only after commit return success.

Supersession uses a single transaction with two sequence positions: replacement `evidence_created`, then predecessor `evidence_superseded`. Neither is visible unless both commit. If any insert/constraint/hash operation fails, rollback all rows and head changes. Event order is deterministic and documented.

Concurrency: ledger row lock serializes sequence allocation. Stale clients receive 409 with current watermark and must refresh. Database uniqueness remains the final guard if application locking is bypassed. Never implement compare-then-write in localStorage or separate non-transactional calls.

## 5. Authorization and tenant isolation

- JWT/session claims are validated (issuer, audience, expiry, signature, key rotation).
- Tenant and actor are derived server-side; ignore/reject tenant/actor fields in request bodies.
- RBAC permissions: evidence:create; evidence:supersede; evidence:revoke; evidence:withdraw; ledger:read; ledger:checkpoint; ledger:restore; privacy:erase.
- Policy binds source ownership and reviewer/steward authority; privileged revoke/restore actions require step-up authentication and may require dual approval.
- Every query uses tenant scope and database RLS; test pooled-connection tenant context reset to prevent leakage.
- Cross-tenant IDs return non-disclosing 404; authorization denials are audited without exposing record contents.
- Service identities use narrow scopes and short-lived credentials.

## 6. Canonicalization and cryptographic rules

Use RFC 8785 JCS over a validated schema. UTF-8 only; reject duplicate keys, NaN/Infinity, ambiguous numeric encodings. Store commission/money and measured quantities as integer minor units or canonical decimal strings.

Record hash: `SHA-256("DF-EVIDENCE-RECORD-v1\0" || JCS(recordEnvelope))`.
Event payload hash: `SHA-256("DF-EVIDENCE-EVENT-PAYLOAD-v1\0" || JCS(eventWithoutHashes))`.
Event hash: `SHA-256("DF-EVIDENCE-EVENT-v1\0" || ledgerId || "\0" || epoch || "\0" || sequence || "\0" || previousHash || "\0" || payloadHash)`.
Genesis hash is domain-separated and binds ledger ID, epoch, and schema version.

Hash test vectors must be checked into the implementation PR, including Unicode, decimal strings, nulls, field ordering, and malformed JSON. Hashes are verified on read/replay, append, export, and restore.

Checkpoint service periodically creates manifest and signs root via KMS. Store signed checkpoint independently in a separate security account and immutable backup. Key rotation preserves public verification keys and key IDs. A chain without independently trusted checkpoint is not proof against a full privileged rewrite.

## 7. Projection, snapshots, and Decision Desk

Projection is deterministic, versioned, pure, and replayable. It validates the full required prefix or a trusted checkpoint plus contiguous suffix. Cache entries are keyed by tenant/ledger/epoch/sequence/head hash/projector version and are disposable; cache corruption invalidates the read.

Decision service receives only a verified projection and explicit evaluation watermark. It must not accept client lifecycle status. If projection is missing, invalid, stale beyond configured consistency bound, or ledger unavailable, return ABSTAIN with reason `EVIDENCE_LEDGER_UNAVAILABLE_OR_INVALID`. No recommendation may be emitted using partial evidence.

Snapshot fields: tenant/ledger/epoch, sequence/head hash, projector and policy versions, evaluation instant, replay mode, exact evidence IDs/content hashes, source timestamp fields, derived lifecycle state, action/decision result, snapshot hash. Snapshot storage is immutable. Historical replay verifies snapshot and watermark before evaluating.

## 8. Backup, restore, and privacy

Backups are encrypted, immutable, access-logged, and stored in a separate security boundary. Restore is staged and verified against signed checkpoint; no in-place truncation or last-write-wins. Forks are quarantined; recovery preserves source artifacts and records a reviewed reconciliation decision.

Before production data: approve retention schedule, lawful basis/consent where applicable, data minimization, subject access/export, legal hold, deletion/erasure, crypto-shredding, key retention, and audit retention. Avoid raw PII in reason text/logs and avoid unsalted hashes of low-entropy personal fields. Erasure procedure must be designed with privacy/legal review and preserve only what may lawfully remain.

## 9. Error contract

Stable machine codes:
- `LEDGER_WATERMARK_CONFLICT` (409)
- `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (409; security audit)
- `EVIDENCE_ALREADY_TERMINAL` (409)
- `INVALID_SUPERSESSION_LINEAGE` (422)
- `CLAIM_IDENTITY_MISMATCH` (422)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404; no cross-tenant disclosure)
- `LEDGER_INTEGRITY_FAILURE` (503; ledger quarantined)
- `LEDGER_UNAVAILABLE` (503)
- `UNSUPPORTED_SCHEMA_VERSION` (503/422 per API boundary; always fail closed)
- `VALIDATION_ERROR` (422)

A network timeout after commit is resolved by retrying the same idempotency key. Never generate a new key automatically for uncertain outcomes.

## 10. Observability and operational runbooks

Metrics: append success/conflict rates, transaction retries, projection latency, checkpoint age, verification failures, abstention rate, restore/fork counts, auth denials, RLS violations. Alerts for hash mismatch, sequence gap, missing checkpoint, clock skew, cross-tenant access, key compromise, and suspicious idempotency conflicts.

Required runbooks: compromised credential, tenant isolation incident, KMS key rotation/compromise, checkpoint failure, restore/fork resolution, privacy erasure, schema migration, ledger outage, backup recovery. Logs must exclude evidence payloads and secrets.

## 11. Delivery sequence (after approval only)

1. DB schema and constraints + migration tests.
2. Auth/RBAC/RLS and audit pipeline.
3. Canonicalization/hash vectors and checkpoint service.
4. Lifecycle service and transactional API.
5. Projection and snapshot integration.
6. Decision Desk fail-closed adapter.
7. Migration/restore tooling.
8. Security review, load/race tests, full CI, independent review.
No UI status wiring or pilot before server-side guarantees pass.

## 12. Acceptance gates

- All constraints and transaction semantics proven against actual selected DB.
- Multi-writer race tests show no duplicate sequence, fork, or lost event.
- Terminal state and supersession graph cannot be bypassed by direct API/DB writes using application credentials.
- Same idempotency key behaves deterministically under retries and ambiguous network outcomes.
- Cross-tenant tests, auth expiry/rotation, least privilege, RLS pool reuse pass.
- Hash vectors and signed checkpoint restore tests pass.
- Corrupt/missing ledger causes end-to-end abstention.
- Snapshot historical replay reproduces original watermark.
- Privacy, retention, deletion, backup, incident runbooks reviewed.
- No production or real-agent data until all gates pass and separate authorization is given.

**Implementation authorization:** Not granted by this specification. Await independent review and explicit user approval.

## 13. Normative precision addendum

- Use one ledger counter, `last_sequence`; genesis = 0, first event = 1, and each transaction appends a contiguous sequence. No second independently updated sequence counter is permitted.
- Event rows include `ledger_epoch`, `claim_identity_hash`, and `replacement_content_hash` for supersession. Composite foreign keys bind every referenced record and lineage row to the same tenant and ledger.
- Required partial unique indexes: one creation event per evidence ID; at most one terminal event per evidence ID. The lineage table separately enforces unique predecessor and unique replacement. A DB-level CHECK restricts event vocabulary.
- Byte-level hash encoding: UTF-8 domain label + NUL + UTF-8 JCS or explicitly defined canonical fields; epoch/sequence are unsigned base-10 ASCII without leading zeros; previous/event payload hashes are 32 raw bytes; persisted hash text is lowercase 64-character hex. Genesis is sequence 0; first event is sequence 1. Add golden test vectors for each domain-separated hash.
- Before production, set a maximum trusted-checkpoint age and maximum unanchored tail length as explicit configuration values with alerting. Exceeding either threshold disables decision eligibility for that ledger until a new independently anchored checkpoint is verified.
- Snapshot payloads are immutable at the database layer. Any privacy erasure exception must be implemented as a separately reviewed controlled procedure with an auditable tombstone/crypto-shredding design; ordinary application roles cannot update or delete snapshots.

## 14. Authorization and recovery clarifications

Unauthorized writes are rejected and security-audited; they do not disable unrelated decisions. A decision request that cannot authenticate/authorize ledger read access or verify the required prefix must return ABSTAIN/unavailable. This is the only authorization failure that blocks decision computation.

A restore never resets sequence inside an existing ledger epoch. If a new epoch is required, create a new ledger namespace with a signed restore manifest binding prior ledger ID/epoch/checkpoint/head, recovered content hash, operator approvals, and reason. The new epoch has a new genesis; it is not an implicit merge. Existing snapshots remain bound to their original epoch.

Checkpoint signing must use an explicit supported asymmetric algorithm (for example, ECDSA P-256 with SHA-256 where supported by the selected KMS), store the algorithm identifier and key ID, and sign UTF-8 bytes consisting of domain label `DF-EVIDENCE-CHECKPOINT-v1`, NUL, and UTF-8 JCS(manifest). Retain verification keys and algorithm metadata for the full audit-retention period. Genesis bytes are exactly: domain label `DF-EVIDENCE-GENESIS-v1`, NUL, ledger ID UTF-8, NUL, epoch as unsigned base-10 ASCII without leading zeros, NUL, schema version UTF-8; hash with SHA-256.
