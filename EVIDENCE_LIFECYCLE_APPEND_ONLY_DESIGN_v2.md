# DealFlow — Append-only evidence lifecycle design (v2)

**Status:** Revised design for independent review; implementation is not authorized.
**Baseline:** PR #30 head `787729f6e8ab5b9ea79d3fb8d5fa5bae40d397c6`.
**Scope:** Evidence lifecycle authority, historical replay, migration, integrity, concurrency, security, privacy, and operational recovery.
**Compatibility:** Documentation-only branch. Does not alter engine code, fixtures, PR #30, PR #31, or Alpha 01.2. PR #30 remains open and unmerged.

## 1. Decision and safety invariants

The system MUST enforce these invariants at the persistence boundary, not merely in UI code:

1. Evidence payloads and lifecycle events are immutable after commit.
2. Current eligibility is derived only from a validated lifecycle projection plus independent freshness/authority checks. Caller-provided or legacy status is never authoritative.
3. No migration may infer that a legacy record was never revoked merely because its latest mutable status says active.
4. Terminal lifecycle transitions are irreversible for a given evidence ID.
5. A supersession operation commits replacement creation and predecessor retirement atomically.
6. Sequence allocation, uniqueness, idempotency, authorization, and tenant isolation are enforced transactionally by the server database.
7. Any integrity, authorization, schema, projection, or ledger availability failure causes fail-closed abstention; no fallback to mutable status or cached eligibility.
8. Historical decisions are reproducible from immutable snapshots and their exact ledger watermark; later evidence does not rewrite the past.
9. Hash chains provide tamper evidence, not absolute immutability. Stronger guarantees require independently controlled checkpoints and storage controls.
10. Legacy records are quarantined until independently re-attested; no ambiguous history becomes eligible by default.

## 2. Domain model

### 2.1 Ledger and tenant scope

Each tenant has one or more explicitly identified evidence ledgers. A ledger has immutable `ledgerId`, `tenantId`, `ledgerEpoch`, schema version, genesis hash, monotonically increasing sequence, and current head hash. A ledger epoch changes only through a controlled restore/re-key procedure and is never silently reset.

Every database key, unique constraint, query, event, checkpoint, and snapshot is scoped by tenant and ledger. Tenant identity is derived from authenticated server context, never accepted from request JSON.

### 2.2 Immutable evidence record

An evidence record contains:
- `evidenceId` (UUID/ULID; globally unique or unique within tenant with documented global collision resistance);
- `tenantId`, `ledgerId`;
- canonical `claimIdentity` with schema version (subject/entity, claim predicate, jurisdiction, normalized units/currency, relevant interval, semantic version);
- immutable evidence payload and provenance (source type/reference, source owner where known, observed value, source observation time, source-check time, capture time, validity interval);
- `contentHash` computed from canonical immutable payload;
- `createdAtServer` assigned by persistence boundary;
- `schemaVersion`.

No writable `status`, `active`, `supersededId`, or mutable lifecycle fields are stored on the record. Compatibility projections may expose derived status read-only.

### 2.3 Lifecycle events

Event vocabulary is intentionally closed:
- `evidence_created`
- `evidence_superseded`
- `evidence_revoked`
- `evidence_withdrawn`

No reactivation, generic status update, delete, or arbitrary event type is accepted. Unknown event types/schema versions fail closed.

Required event fields:
`eventId, tenantId, ledgerId, ledgerEpoch, sequence, eventType, evidenceId, claimIdentityHash, recordedAtServer, effectiveAt, actorId, actorType, reasonCode, reasonText, requestId, payloadHash, previousEventHash, eventHash, schemaVersion`.
For supersession, require `replacementEvidenceId` and `replacementContentHash`. For other event types these fields are null.

- `recordedAtServer` is assigned by the server/database and cannot be client-supplied.
- `effectiveAt` is an optional actor-asserted business time, stored separately, validated against allowed skew/policy, and never used to reorder ledger events or retroactively change current eligibility.
- `actorId` comes from authenticated identity/service principal; display labels are metadata only.
- Revocation, withdrawal, and supersession require a controlled reason code and bounded, sanitized reason text. Do not place sensitive PII in reason text.
- `requestId` is an idempotency key, scoped to tenant + operation endpoint/client identity.
- Sequence and hash fields are generated server-side only.

## 3. Lifecycle state machine

A valid `evidence_created` event establishes an evidence record as lifecycle-active. Exactly one creation event is allowed. At most one terminal event is allowed.

| Current state | Event | New state | Result |
|---|---|---|---|
| absent | created | active | accept if immutable record and claim hash validate |
| active | superseded | superseded | accept only with atomic new replacement and graph checks |
| active | revoked | revoked | accept with authorized actor and reason |
| active | withdrawn | withdrawn | accept with authorized actor and reason |
| terminal | any event | unchanged | reject |

Terminal means superseded, revoked, or withdrawn. Expiry is orthogonal: `expired` is derived from validity fields at evaluation time and does not mutate lifecycle state. A terminal record cannot be reopened. A correction after revocation/withdrawal is a new evidence ID with fresh provenance and an explicit `derivedFrom`/audit reference where appropriate; it does not reactivate the old ID.

### 3.1 Supersession graph constraints

The graph is a directed one-to-one lineage chain within one tenant, ledger, and exact canonical claim identity:
- predecessor and replacement IDs must differ;
- replacement ID must not exist before the transaction and must be inserted in the same transaction;
- predecessor must be active at the transaction's locked watermark;
- predecessor may have at most one outgoing supersession edge;
- replacement may have at most one incoming predecessor edge;
- replacement cannot already be a predecessor or terminal record;
- no self-link, cycle, fork, merge, cross-tenant, cross-ledger, or claim-identity mismatch;
- replacement must have exactly one creation event in the same transaction;
- predecessor supersession event and replacement creation are committed atomically;
- if any check or write fails, the whole transaction rolls back.

A replacement may later itself be superseded, yielding a linear chain. Revoked/withdrawn evidence is never superseded as a way to erase its terminal state; new corroborating information is a new record linked for audit only.

## 4. Projection and decision contract

A deterministic projector consumes a ledger prefix identified by `ledgerId + ledgerEpoch + sequence + headHash`. It validates:
- contiguous sequence starting from genesis;
- unique event IDs and sequence numbers;
- exactly one creation event per evidence record;
- event references, state transitions, tenant/ledger scope, claim hashes, replacement graph;
- event content hashes and previous-hash links;
- schema compatibility and canonical payload hashes.

It returns derived lifecycle state plus lineage and integrity metadata. It MUST NOT use mutable status fields or a partially valid prefix.

Decision eligibility is the conjunction of:
1. lifecycle projection is active at the requested watermark;
2. record has valid immutable payload and provenance;
3. freshness policy passes using required source timestamps;
4. source authority/confidence policy passes;
5. claim identity and contradiction policy pass;
6. evaluation time falls within validity interval.

If any ledger integrity check fails, Decision Desk abstains for all decisions whose evidence depends on that ledger. Do not silently drop one bad event and continue with a partial portfolio. Do not use local cache as an authoritative fallback.

Every decision snapshot records tenant/ledger/epoch, sequence, head hash, event schema version, projector version, policy version, evaluation time, replay mode, exact evidence IDs/content hashes, derived lifecycle state, and reason codes.

Replay modes:
- `AS_KNOWN_AT_DECISION`: use exactly the ledger prefix and evidence snapshot used at original decision time.
- `RETROSPECTIVE_WITH_LATER_EVIDENCE`: explicitly evaluate using a later watermark; never overwrite the original result.
Snapshots must be immutable and content-addressed. If the required prefix/checkpoint is unavailable or mismatched, replay is unavailable and must be reported as such—not approximated.

## 5. Time semantics

- `recordedAtServer`: when DealFlow durably accepted the event.
- `effectiveAt`: optional claimed real-world effective time; informational/policy input only.
- `observedAt`: when the source says the fact was observed.
- `sourceCheckedAt`: when the source was last independently checked.
- `capturedAt`: when an agent/system captured the item, if meaningful.

All timestamps are RFC 3339 UTC instants normalized to millisecond precision; reject invalid dates, ambiguous local timestamps, unsupported offsets, and impossible future timestamps beyond configured skew. The server clock is monitored. Ledger sequence is authoritative for event order; timestamps never replace sequence. Missing required source timestamps reduce confidence or make the evidence ineligible according to evidence taxonomy. Never infer a source-check timestamp from capture time.

Backdated `effectiveAt` does not retroactively affect a decision already made. A newly recorded revocation excludes the evidence from all subsequent decisions immediately, while prior as-known snapshots remain unchanged. A retrospective review may separately show the impact of later knowledge.

## 6. API and transaction boundary

Only authenticated, typed operations are exposed:
- create evidence;
- supersede evidence;
- revoke evidence;
- withdraw evidence;
- read/project ledger prefix;
- create/verify checkpoint;
- export/import via controlled restore workflow.

There is no generic status setter or direct client write access to event/record tables.

Every mutation:
1. authenticates actor and resolves tenant from server session/token;
2. authorizes action against tenant, role, source ownership, and record state;
3. validates request schema, claim identity, reason code, timestamp policy, payload size, and idempotency key;
4. starts a serializable transaction (or equivalent row-lock/CAS strategy);
5. locks ledger head row; verifies expected sequence/head when supplied;
6. checks durable idempotency row and payload digest;
7. validates predecessor/replacement graph and uniqueness;
8. allocates next sequence and server timestamp;
9. inserts immutable evidence/event rows and hash links;
10. updates ledger head with compare-and-swap in same transaction;
11. stores idempotency result in same transaction;
12. commits, then returns committed event ID, sequence, hash, and projection version.

No success response before commit. On transaction retry, idempotency guarantees one logical operation. Same idempotency key + same canonical request returns original response; same key + different digest returns 409 integrity conflict. Stale expected watermark returns 409 concurrency conflict with current watermark. A terminal-state or graph conflict returns typed 409/422; authorization failure returns 403 without leaking cross-tenant existence.

## 7. Persistence schema and database constraints

Minimum relational schema (PostgreSQL reference; equivalent transactional database acceptable):

- `tenants(tenant_id PK,...)`
- `evidence_ledgers(ledger_id PK, tenant_id FK, epoch, schema_version, next_sequence, head_sequence, head_hash, status, created_at, UNIQUE(tenant_id, ledger_id))`
- `evidence_records(tenant_id, ledger_id, evidence_id, claim_identity_hash, content_hash, canonical_payload, schema_version, created_at_server, PRIMARY KEY(tenant_id, ledger_id, evidence_id))`
- `evidence_events(tenant_id, ledger_id, sequence, event_id, evidence_id, event_type, replacement_evidence_id, actor_id, actor_type, reason_code, reason_text, recorded_at_server, effective_at, request_id, payload_hash, previous_event_hash, event_hash, schema_version, PRIMARY KEY(tenant_id, ledger_id, sequence), UNIQUE(tenant_id, ledger_id, event_id))`
- `idempotency_records(tenant_id, actor_scope, operation, request_id, request_digest, response_json, event_id, created_at, expires_at, PRIMARY KEY(tenant_id, actor_scope, operation, request_id))`
- `evidence_lineage(tenant_id, ledger_id, predecessor_id, replacement_id, claim_identity_hash, created_sequence, PRIMARY KEY(tenant_id, ledger_id, predecessor_id), UNIQUE(tenant_id, ledger_id, replacement_id))`
- `ledger_checkpoints(tenant_id, ledger_id, epoch, sequence, head_hash, canonical_manifest_hash, signature, signing_key_id, external_anchor_ref, created_at, PRIMARY KEY(tenant_id, ledger_id, epoch, sequence))`
- `decision_snapshots(snapshot_id PK, tenant_id, ledger_id, epoch, sequence, head_hash, projector_version, policy_version, evaluation_at, replay_mode, snapshot_hash, payload, created_at)`
- `audit_security_events(...)` separate from user-visible evidence event log.

Database roles: application mutation role INSERT-only on evidence/event tables, no UPDATE/DELETE; ledger-head updates narrowly permitted through a stored procedure/transaction service; read roles tenant-filtered; migration/restore role isolated, time-limited, dual-approved, audited. Constraints/triggers enforce allowed event vocabulary and terminal uniqueness; application checks alone are insufficient. Where a constraint cannot be expressed declaratively, enforce in one stored procedure under transaction locks and cover with concurrent tests.

## 8. Hashing, checkpoints, and integrity guarantees

Canonicalization MUST use RFC 8785 JSON Canonicalization Scheme (JCS) or a fully specified equivalent, UTF-8, normalized field schema, no floating-point ambiguity for money/quantities (use integer minor units or canonical decimal strings). Reject duplicate JSON keys and non-finite numbers.

- Record hash: SHA-256(JCS(immutable record envelope)).
- Event payload hash: SHA-256(JCS(event fields excluding eventHash)).
- Event hash: SHA-256(domain separator || ledgerId || epoch || sequence || previousEventHash || payloadHash).
- Genesis hash: deterministic domain-separated hash of ledger ID + epoch + schema version.
- Checkpoint manifest binds tenant/ledger/epoch, sequence, head hash, record/event counts, schema versions, and prior checkpoint.
- Checkpoint signatures use a server-held KMS/HSM key; signing keys are rotated with key IDs and verification history.

Hash chain detects tampering relative to a trusted head/checkpoint. It cannot prevent a privileged attacker from rewriting the full database and recomputing hashes. Independently store signed checkpoint roots in a separate security account/service and retain immutable/WORM backups. Verify checkpoints on startup, append, export, restore, and scheduled audit. If latest trusted checkpoint is missing, regressed, forked, or signature-invalid, quarantine ledger and abstain pending recovery.

## 9. Authorization, tenant isolation, and privacy

Authentication is mandatory for hosted use. Derive actor ID, tenant, roles, and service identity from validated credentials. Enforce RBAC and least privilege:
- agent/source owner may submit or request withdrawal of own contribution;
- designated evidence steward/reviewer may revoke based on documented authority;
- service accounts have narrow machine scopes;
- only authorized administrators can perform restore/migration, preferably dual control.
A user-supplied `recordedBy` string is never identity evidence.

Every query includes tenant scope; use database row-level security as defense in depth. Prevent IDOR through non-disclosing errors. Encrypt in transit and at rest; secrets and signing keys in managed secret/KMS services. Minimize personal data in evidence payloads and reason text; redact logs; define retention, legal hold, deletion/erasure, export, and access-audit policies before real-agent data. Hashes of low-entropy personal data may leak equality; do not hash raw PII as a privacy substitute. Where deletion is legally required, use a reviewed tombstone/crypto-shredding policy that preserves audit integrity without retaining prohibited content.

## 10. Backup, import, restore, and fork recovery

Normal import is read-only validation, not merge/overwrite. A backup manifest includes ledger ID/epoch, tenant, schema versions, sequence/head hash, counts, checkpoint references, and content hashes.

Import rules:
- same ledger/epoch and exact known prefix: accept only a strict extension whose prefix hashes match; never truncate or replace local history;
- same sequence but different head hash: fork/conflict; quarantine;
- shorter sequence: rollback attempt; reject;
- different ledger/epoch: separate ledger, not implicit merge;
- missing sequence, invalid hash, missing record, duplicate ID, unknown schema, invalid lineage: reject and quarantine;
- restore from backup requires trusted signed checkpoint and authorized restore workflow; record a restore audit event in a new controlled epoch or append-only recovery record. Never silently reset sequence.
A fork is resolved by preserving both artifacts, identifying last common trusted checkpoint, and an authorized reconciliation plan. No automatic “last write wins.”

## 11. Idempotency, retries, and failure behavior

Idempotency key scope is tenant + actor/client scope + operation + request ID. Persist canonical request digest and committed response atomically with the event. Retention exceeds maximum client retry horizon and operational recovery window. Expired idempotency keys cannot be silently reused; keep a compact tombstone/digest for the ledger retention period.

Failures:
- serialization/unique constraint/sequence conflict: rollback and return retryable conflict;
- same key/different payload: integrity conflict, security audit;
- unknown actor/tenant or forbidden action: reject;
- invalid chain/projection/hash/checkpoint/schema: quarantine ledger, abstain;
- partial service/dependency outage: do not use stale cache to recommend; return unavailable/abstain with safe diagnostic;
- failed commit/ambiguous network response: client retries same idempotency key and receives original result if committed.

## 12. Observability and operations

Emit structured, privacy-minimized audit logs for actor, tenant, operation, request ID, ledger watermark, result code, and correlation ID. Alert on sequence gaps, hash/checkpoint mismatch, cross-tenant access attempts, repeated idempotency digest conflicts, unauthorized mutation attempts, restore/fork events, and elevated abstention rates. Never log raw sensitive evidence or credentials.

Operational runbooks required: key rotation, checkpoint verification, restore, fork quarantine, compromised actor, tenant offboarding, privacy deletion, schema upgrade, incident response, and ledger unavailability. Monitor clock skew and database transaction retries.

## 13. Rollout gates and non-goals

No real-agent data or production eligibility until:
- independent review approves this design and the server specification;
- implementation is complete behind a feature flag;
- migration is dry-run, reconciled, and independently signed off;
- all adversarial/concurrency/security/privacy/restore tests pass;
- security review verifies DB permissions, tenant isolation, auth, KMS, backups, and audit controls;
- Decision Desk fail-closed behavior is verified end-to-end.

Non-goals: this lifecycle proves neither truth nor source reliability; it does not resolve contradictions automatically; it does not replace freshness/evidence taxonomy; a hash chain alone is not absolute immutability.

## 14. Review decision requested

Review the state machine, quarantine-first migration, relational constraints, transaction contract, authorization model, checkpoint model, privacy/retention policy, and fail-closed behavior. This is a design proposal only. **No implementation is authorized by this document.**

## 15. Normative precision addendum

The following details are normative and resolve ambiguity in the preceding schema/algorithm descriptions:

- Ledger sequence has one counter only: `last_sequence`. Genesis is sequence 0; the first committed event is sequence 1; every later event is exactly the prior committed sequence + 1. Do not maintain independently mutable `next_sequence` and `head_sequence` counters.
- The event table stores `ledgerEpoch`, `claimIdentityHash`, and, for supersession, `replacementContentHash`. Every foreign key across evidence, event, and lineage rows includes tenant and ledger scope.
- Database partial unique indexes enforce exactly one `evidence_created` event per evidence ID and at most one terminal event (superseded/revoked/withdrawn) per evidence ID. Lineage uniqueness enforces one predecessor and one successor per edge. These are database constraints, not merely service checks.
- Hash encoding is byte-exact: UTF-8 domain label, one NUL byte, then the specified canonical fields. Epoch and sequence are unsigned base-10 ASCII with no leading zeros; hash inputs are 32 raw bytes, not their hexadecimal text. Stored hashes are lowercase 64-character hex. Record/event JCS envelopes and excluded fields are defined in the server specification.
- A decision snapshot and its immutable payload are database-protected against update/delete. Privacy erasure, if legally required, is a separately approved controlled procedure and cannot silently mutate the historical decision record.
- Production checkpoint policy must set and monitor a maximum trusted-checkpoint age and maximum unanchored tail length. Exceeding either threshold makes the ledger unavailable for decisions until a fresh independently anchored checkpoint is verified.

## 16. Authorization and epoch recovery clarifications

- An unauthorized mutation is rejected and security-audited; it does not by itself disable unrelated valid decisions. A decision request that cannot authenticate/authorize its ledger read, or cannot verify the required ledger prefix, returns ABSTAIN/unavailable. This distinction prevents an isolated denied write from causing portfolio-wide denial of service.
- A restore must never reset sequence within the same ledger epoch. If recovery requires a new epoch, create a new ledger epoch/namespace with a signed restore manifest that names the prior ledger ID, epoch, trusted checkpoint, recovered sequence/head, operator approvals, and reason. The new epoch begins at its own genesis and is not an implicit continuation or merge. Historical snapshots remain bound to the original epoch.
- Checkpoint signatures must identify an explicit supported asymmetric algorithm and key ID. The signed bytes are the UTF-8 domain label `DF-EVIDENCE-CHECKPOINT-v1`, one NUL byte, and UTF-8 JCS of the manifest. Verification keys and algorithm identifiers are retained for the full audit-retention period.
- Genesis hash bytes are exact: UTF-8 `DF-EVIDENCE-GENESIS-v1`, NUL, UTF-8 ledger ID, NUL, unsigned base-10 epoch ASCII without leading zeros, NUL, UTF-8 schema version. SHA-256 result is stored as lowercase hex.
