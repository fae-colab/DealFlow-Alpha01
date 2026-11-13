# DealFlow — Server-side evidence lifecycle implementation specification

**Status:** Review draft — not approved for implementation  
**Version:** 1.0  
**Date:** 2026-11-14  
**Related design:** [EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN.md](./EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN.md)  
**Scope:** Server-authoritative evidence lifecycle ledger, decision replay, integrity, privacy, and migration boundary.  
**Explicit constraint:** This document is a specification only. No application code, database schema, infrastructure, deployment, migration, or merge is authorized by its creation.

## 1. Goals and non-goals

### Goals
- Make lifecycle state a deterministic projection of server-committed append-only events.
- Make revocation, withdrawal, and supersession irreversible through supported application and database roles.
- Make supersession atomic.
- Preserve reproducible as-known-at-the-time decision snapshots.
- Fail closed on unavailable, corrupt, incomplete, or unverifiable ledger state.
- Migrate legacy evidence without inventing historical actors, timestamps, or reasons.
- Provide auditable, tenant-isolated, privacy-aware operation and recovery.

### Non-goals
- Prove that evidence content is factually true.
- Guarantee protection against every privileged infrastructure administrator.
- Resolve evidence contradictions or calibrate freshness policy.
- Implement AI agents, CRM integrations, or agent execution workflows.
- Select a vendor or silently assume an existing hosting/database/authentication service.

## 2. Required architecture

Use a server-side application boundary with these logical components:

1. **Authenticated API** — authenticates user/service identity, tenant, and role.
2. **Lifecycle command service** — validates and authorizes create, supersede, revoke, withdraw, and migration commands.
3. **Transactional persistence layer** — commits immutable evidence envelopes and lifecycle events atomically.
4. **Projection/validation service** — reconstructs state at a specified ledger sequence and validates all references and hashes.
5. **Decision snapshot service** — pins evidence IDs, content hashes, lifecycle watermark, head hash, evaluation time, and replay mode.
6. **Checkpoint service** — periodically signs ledger roots and stores them outside the primary database administrative boundary.
7. **Migration service** — dry-runs and commits a deterministic migration plan after explicit authorization.
8. **Audit/operations layer** — logs access and integrity failures without copying sensitive evidence payloads into ordinary logs.

The browser is an untrusted client. It may request commands and display server responses; it must not assign event sequence, committed timestamps, actor identity, lifecycle status, hashes, or tenant ownership.

## 3. Logical persistence model

The following is a logical contract, not a vendor-specific SQL migration.

### 3.1 EvidenceRecord

Required fields:
- `tenant_id`
- `evidence_id` (globally unique opaque identifier)
- `claim_key` (stable canonical claim identity)
- `schema_version`
- `payload_ref` (reference to encrypted evidence payload; avoid sensitive payload in event table)
- `content_hash` (SHA-256 of canonical immutable evidence payload)
- `created_by_actor_id` (authenticated actor ID)
- `created_at_server` (server-assigned)
- optional legacy provenance envelope and source references

Constraints:
- Unique (`tenant_id`, `evidence_id`).
- Immutable after insert. Database role used by the application has INSERT and SELECT only for committed evidence rows.
- No authoritative writable `status` field.
- Payload changes require a new evidence ID.

### 3.2 EvidenceLifecycleEvent

Required fields:
- `tenant_id`
- `ledger_id` (tenant-scoped or explicitly partitioned ledger)
- `sequence` (strictly increasing, unique within ledger)
- `event_id` (globally unique)
- `event_type` (closed enum: created, superseded, revoked, withdrawn)
- `evidence_id`
- `claim_key`
- `recorded_at_server`
- `effective_at` (nullable only when genuinely unknown)
- `effective_at_basis` (source_verified / actor_reported / estimated / unknown)
- `effective_at_source_ref` (opaque reference, optional)
- `effective_at_uncertainty` (optional explanatory text)
- `actor_id` (authenticated principal; system actors use a distinct service identity)
- `reason_code`
- `reason_text` (required for terminal events; avoid personal data)
- `replacement_evidence_id` (required only for superseded)
- `request_id` (idempotency key)
- `canonicalization_version`
- `previous_event_hash`
- `event_hash`

Constraints:
- Unique (`tenant_id`, `ledger_id`, `sequence`).
- Unique `event_id`.
- Unique (`tenant_id`, `actor_id`, `request_id`) or equivalent idempotency scope.
- Unique predecessor successor relationship: a predecessor may be superseded at most once.
- No UPDATE or DELETE permission for normal application roles.
- Foreign-key/reference integrity for evidence IDs and replacement IDs.
- Event type and field combinations validated server-side.

### 3.3 LedgerHead and checkpoints

Maintain a transactional ledger head containing:
- ledger ID and tenant ID;
- current sequence;
- current event hash;
- schema and canonicalization versions;
- latest verified checkpoint sequence/hash.

Updating the ledger head is permitted only as part of the same transaction that appends its event(s). The event rows themselves remain immutable.

A checkpoint contains ledger ID, sequence, head hash, creation time, signing-key identifier, signature, and canonicalization version. Store checkpoint copies in a separately permissioned system. Key rotation and recovery procedures must be documented.

### 3.4 DecisionEvidenceSnapshot

Each recommendation snapshot must store:
- tenant and decision identifiers;
- evaluation timestamp;
- `AS_KNOWN_AT_DECISION` or `RETROSPECTIVE_WITH_LATER_EVIDENCE`;
- ledger sequence and head hash;
- evidence IDs and content hashes actually considered;
- derived lifecycle state at that watermark;
- eligibility result/reason codes and evaluator version.

The snapshot must not copy unnecessary sensitive evidence payloads. Replay at sequence N must not read lifecycle events after N. Retrospective evaluation creates a new labelled snapshot; it never overwrites the original.

## 4. Command API contract

Exact HTTP paths may be chosen after platform selection. The following command semantics are mandatory.

### 4.1 Create evidence
Input: tenant context from authentication, immutable evidence payload/reference, claim key, request ID, optional effective-time provenance.

Server:
- validates actor authorization and payload schema;
- generates evidence ID;
- computes canonical content hash;
- assigns server time and next sequence;
- appends record and `evidence_created` event atomically;
- returns committed IDs, sequence, head hash, and projection.

### 4.2 Supersede evidence
Input: predecessor evidence ID, replacement payload/reference, claim key, reason code/text, request ID, expected ledger sequence.

Server:
- validates same tenant and claim key;
- validates predecessor is active at transaction serialization point;
- verifies no existing successor;
- creates replacement record and creation event;
- appends predecessor supersession event referencing replacement;
- commits the entire operation atomically;
- returns both events and the new ledger watermark.

No client-supplied event timestamps, actor IDs, sequence, hashes, or status are accepted.

### 4.3 Revoke / withdraw evidence
Input: evidence ID, reason code/text, request ID, expected ledger sequence.

Server:
- validates authorization and current active projection;
- appends exactly one terminal event;
- rejects any second terminal transition;
- returns committed watermark and resulting projection.

### 4.4 Idempotency and concurrency
- Canonicalize the command payload and compute a request hash.
- Same request ID + same request hash returns the original committed response.
- Same request ID + different request hash returns an idempotency conflict.
- Expected-sequence mismatch returns a concurrency conflict with current watermark; caller must reload and explicitly decide whether to retry.
- A retry must not create duplicate terminal events or duplicate replacement records.

### 4.5 Read and replay
Read APIs return server-verified projection plus watermark and integrity status. Clients cannot request an unverified fallback.
- Current mode: latest verified committed sequence.
- Historical mode: exact snapshot sequence and expected head hash.
- Retrospective mode: latest selected verified sequence, labelled separately.

If the requested sequence/hash does not match the ledger, return an integrity error; do not substitute the latest state.

## 5. Transaction and state invariants

The implementation must enforce:
1. Exactly one creation event per evidence ID.
2. At most one terminal event per evidence ID.
3. Terminal states are irreversible.
4. Supersession references a distinct replacement with the same tenant and claim key.
5. A predecessor has at most one successor.
6. No cycles or cross-tenant references.
7. Expiry/freshness/contradiction remain separate eligibility dimensions.
8. Event sequence is contiguous within the chosen ledger contract, or any reserved gaps are explicitly represented and verifiable. Prefer no gaps for committed event sequences.
9. Event hash binds all canonical event fields, including tenant, ledger, sequence, actor, request ID, and previous hash.
10. Atomic commands commit all related rows and ledger-head changes or none.
11. A corrupted ledger prevents decision use until integrity is restored and reviewed.
12. No mutable status field can override projection.

## 6. Hashing and external checkpoint contract

- Define canonical JSON (or another deterministic encoding) with a versioned specification: UTF-8, stable field order, normalized numbers, UTC timestamp format, explicit null handling, and no locale-dependent serialization.
- Compute each event hash over the canonical event payload including previous hash, excluding only the event_hash field itself.
- Use SHA-256; never use an unspecified or implementation-default serializer.
- Verify from genesis or the latest trusted checkpoint through the requested watermark.
- Checkpoint signatures use a key held outside the primary database. Restrict signing and verification roles; document key rotation and compromise response.
- A checkpoint is useful only if its storage and signing authority are meaningfully separate from the primary database administrator.
- Alert on hash mismatch, missing sequence, invalid signature, checkpoint rollback, unexpected ledger-head regression, or backup/restore divergence.
- Do not claim that hashes alone prevent privileged rewrite.

## 7. Authorization, privacy, and operational controls

### Authorization
- Authenticate every human and service actor.
- Enforce tenant isolation in the service and database query boundary.
- Define roles for evidence capture, lifecycle revocation/withdrawal, migration approval, checkpoint operations, and audit review.
- Require stronger authorization for migration commit and checkpoint/key administration.
- Record actor ID, role context, and authorization policy version with the audit event or associated security log.

### Privacy
- Keep sensitive evidence payloads encrypted at rest and in transit.
- Keep event metadata minimal; do not include buyer names, phone numbers, email addresses, or sensitive financial details in immutable event rows or general logs.
- Provide controlled access, retention schedules, legal holds where applicable, and an approved erasure/cryptographic-erasure workflow.
- Before real-agent data, obtain a jurisdiction-specific privacy/legal review for relevant UAE and other applicable laws and cross-border hosting.
- Erasure must not be represented as ordinary lifecycle revocation. Document exactly which payloads, keys, metadata, and backups are affected, and what minimal audit residue may lawfully remain.

### Availability and fail-closed behavior
- No local fallback for committed lifecycle state.
- Uncommitted offline commands may be retained only as clearly labelled pending requests.
- A failed ledger read, failed checkpoint verification, stale replica, or unavailable projection prevents a confident recommendation.
- Define read consistency so a successful lifecycle command is visible to subsequent decision requests using the returned watermark.
- Define RPO/RTO, backup cadence, restore drills, incident response, and monitoring before production use.

## 8. Migration service contract

Migration must be separated into dry-run and commit:
1. Acquire source backup and calculate checksum/size.
2. Parse into an isolated staging area without mutating source.
3. Produce deterministic record ID mapping and classification.
4. Validate IDs, statuses, claim keys, provenance, supersession graph, timestamps, and content hashes.
5. Produce report with accepted/quarantined/rejected counts and itemized reasons.
6. Bind plan hash to source checksum, migration version, mapping, and policy version.
7. Require an authorized human commit against that exact plan hash.
8. Commit clean batches transactionally; unresolved graph components remain quarantined.
9. Verify post-commit counts, hashes, sequence, chain, and mappings.
10. Retain report, source checksum, actor approval, migration ID, and recovery instructions.

A rerun with the same migration ID and exact source/plan is idempotent. A changed source or plan requires a new migration ID and explicit approval.

## 9. Failure behavior and error contract

At minimum, distinguish:
- authentication/authorization failure;
- schema validation failure;
- terminal-transition conflict;
- predecessor already has successor;
- claim/tenant mismatch;
- expected-sequence conflict;
- idempotency conflict;
- ledger integrity failure;
- checkpoint verification failure;
- migration quarantine/rejection;
- unavailable persistence/ledger service.

Errors must not disclose another tenant's evidence existence or sensitive payload. Integrity errors should include a trace/correlation ID and alert operations.

## 10. Implementation phases and exit criteria

**Phase 0 — Platform decision (no code):** choose hosting, database with transactional constraints, authentication, encrypted payload storage, checkpoint signing/storage, backup/retention, and privacy jurisdiction. Document threat model and operations owner.

**Phase 1 — Domain contract:** define canonical schemas, transition validator, projection semantics, API contracts, and hash canonicalization. Pure tests pass before storage integration.

**Phase 2 — Server persistence:** implement append-only permissions, atomic commands, concurrency, idempotency, and tenant isolation. Transaction failure injection tests pass.

**Phase 3 — Decision integration:** Decision Desk consumes only verified server projection and records replay watermark. Corruption/unavailability causes abstention.

**Phase 4 — Migration tooling:** dry-run, quarantine, approval, commit, idempotency, verification, and recovery tests pass on copied fixtures.

**Phase 5 — Security/operations validation:** checkpoint signing and independent storage, backup restore drill, access controls, privacy review, incident procedures, and penetration/threat-model review.

**Phase 6 — Controlled validation:** only after separate explicit approval, use synthetic/public test cases first. Real-agent personal data requires privacy and operational readiness sign-off.

No phase is authorized merely by this draft. No merge or deployment is authorized.

## 11. Decisions still required before implementation

The following must be resolved and recorded:
- Hosting provider and deployment boundary.
- Database and transaction/isolation capabilities.
- Authentication provider and actor/role model.
- Tenant model and whether ledgers are per-tenant or partitioned.
- Encrypted payload storage and key management.
- Checkpoint signer, independent storage, key rotation, and recovery owner.
- Backup retention, RPO/RTO, and restore authority.
- Privacy/retention/legal-erasure policy and jurisdictional review.
- Monitoring, incident response, and operational ownership.

If the chosen platform cannot meet a requirement, return to design review; do not silently weaken the contract.
