# DealFlow — Evidence lifecycle migration and verification test plan

**Status:** Test plan proposal for review; no migration or implementation authorized.
**Applies to:** Lifecycle design v2 and server implementation specification.
**Baseline:** PR #30 head `787729f6e8ab5b9ea79d3fb8d5fa5bae40d397c6`.
**Safety rule:** Preserve source data and the successful 18-case v1.1 regression result. No merge of PR #30. No real-agent data.

## 1. Goals and non-goals

Prove that migration cannot resurrect retired/ambiguous evidence; lifecycle events are immutable and ordered; supersession is atomic and linear; concurrency, authorization, tenant isolation, idempotency, hashing, backup/restore, privacy, and historical replay are correct; and Decision Desk abstains on every integrity failure.

This plan does not establish factual truth of evidence, commercial impact, or permission to run a real-agent pilot.

## 2. Test environments and immutable inputs

- Unit tests: pure projector/state machine with deterministic clock and IDs.
- Integration tests: production-equivalent PostgreSQL version, migrations, triggers, RLS, transaction isolation.
- API tests: authenticated test tenants, roles, service principals, expired/revoked credentials.
- Fault injection: transaction aborts, process kill, network timeout, DB failover, KMS/checkpoint outage.
- Restore tests: isolated environment using signed backup and independently stored checkpoint.
- Performance tests: representative ledger sizes and append/read concurrency.

Record exact code commit, DB version/config, schema version, test seed, fixture hashes, clock configuration, and test-run ID. Never use production/real-agent evidence in tests.

## 3. Migration source inventory and quarantine-first policy

### 3.1 Inventory before transformation

Read source backup in read-only mode. Produce a deterministic manifest containing:
- source file/object hash and size;
- schema version and extraction tool version;
- total records and unique IDs;
- duplicate IDs, missing IDs, malformed records;
- all legacy status values and frequency;
- supersedes links and graph anomalies;
- timestamp fields and parse/meaning confidence;
- source/provenance completeness;
- PII classification and retention flags.

Preserve original bytes in encrypted, access-controlled, immutable staging. Do not mutate source backup.

### 3.2 Mandatory quarantine rules

**Every legacy record is non-eligible by default after migration.** Migration creates a quarantined envelope, not an active record. A legacy `status: active` is not evidence that it was never revoked; a status reset may have erased history. Legacy `revoked`, `withdrawn`, `superseded`, unknown, or malformed values remain quarantined with the snapshot preserved as untrusted metadata.

Eligibility requires a separate, authenticated re-attestation event by an authorized evidence steward after source re-check. Re-attestation creates a fresh evidence ID with current source verification/provenance and links to the legacy ID for audit. It does not activate or rewrite the legacy record. No old mutable record may be made eligible by merely translating status.

Existing `supersedesId` links are imported as untrusted lineage metadata. Do not emit authoritative supersession events from legacy links alone. A reviewer may validate and reconstruct a lineage relation for audit, but it does not change eligibility. Any fork, cycle, merge, dangling link, claim mismatch, or duplicate successor is reported and blocks that lineage from approval.

### 3.3 Migration output

For each source record, create:
- immutable legacy envelope with original bytes/hash and `legacyStatusSnapshot`;
- lifecycle status `QUARANTINED_LEGACY` in a separate migration/quarantine table (not a lifecycle event and never treated as active);
- migration manifest entry and reason codes;
- optional proposed re-attestation task.

Do not create `evidence_created` events that imply historical active eligibility. A newly re-attested record is a genuinely new record with current server timestamp and normal creation event.

## 4. Determinism, idempotency, and restartability

Migration run has immutable `migrationId`, source manifest hash, target ledger ID/epoch, migration code version, operator identity, start/end times, and state. Each source record has stable deterministic mapping key (source hash + source record ID + migration version) and a unique database constraint.

- Re-running same migration with same source hash/version returns prior result; no duplicate records/events.
- Same migration ID with different source manifest hash fails as integrity conflict.
- Restart resumes from durable per-record checkpoint; no partially migrated record can be marked complete.
- Each batch transaction writes envelope, quarantine metadata, manifest entry, and checkpoint atomically.
- Migration never overwrites existing ledger or advances a head based on stale expected sequence.
- Dry-run output and final run output are deterministic for same input and configuration, excluding server timestamps explicitly listed as variable.
- Migration is one-way into a new ledger namespace; original backup remains unchanged.

## 5. Core functional and adversarial test matrix

### A. Resurrection and quarantine
1. Legacy record with status active but known prior revocation in external audit -> quarantined; never eligible.
2. Legacy record with status active and no lifecycle history -> quarantined; never assumed never revoked.
3. Legacy record with status revoked/withdrawn -> quarantined; status snapshot preserved; no false historical event fabricated.
4. Legacy status superseded with valid/invalid link -> quarantined; lineage review only.
5. Legacy status missing, unknown, corrupted, or contradictory -> quarantined.
6. Attempt to set migrated legacy envelope active through API, import, UI, or direct application DB role -> rejected.
7. Re-attestation creates new evidence ID, current source-check timestamp, actor and provenance; legacy ID remains quarantined.
8. Failed/expired re-attestation leaves both legacy and proposed record ineligible.

### B. Event schema and projection
9. Exactly one create event yields active for newly created non-legacy record.
10. Duplicate event/evidence IDs, missing create event, duplicate create, unknown evidence reference -> reject.
11. Unknown event type/schema, malformed timestamp, missing actor/reason, bad content hash -> fail closed.
12. Duplicate/gapped sequence, reorder, broken previous hash, altered payload, incorrect genesis -> ledger quarantine.
13. Event array permutation cannot change canonical projection; persisted sequence is authoritative.
14. Projector upgrade preserves deterministic results for supported schema versions; unknown version abstains.
15. Event and record immutable triggers reject UPDATE/DELETE using application role.

### C. Terminal transitions and lineage graph
16. Active -> revoked, withdrawn, superseded each succeed only with authorized role and required reason.
17. Any terminal -> any further transition, including active/reactivation, rejected.
18. Supersession to self, missing replacement, pre-existing replacement, cross-tenant, cross-ledger, claim mismatch -> reject.
19. Two predecessors to one replacement; one predecessor to two replacements; cycle; fork; merge -> reject.
20. Replacement later superseded creates a linear chain; original predecessor remains terminal.
21. Revoked/withdrawn predecessor cannot be superseded to hide terminal state.
22. Inject failure after replacement insert, creation event, lineage insert, predecessor event, head update, and idempotency insert: full rollback; no half-pair visible.
23. Concurrent attempts to supersede same predecessor: exactly one commits.

### D. Concurrency and idempotency
24. Two concurrent creates with same expected watermark: serialized; no lost event or duplicate sequence.
25. Concurrent revoke vs supersede on same record: one transaction wins; other receives terminal/watermark conflict; no inconsistent graph.
26. Same request ID + same canonical payload, sequential and concurrent: one logical event; same response.
27. Same request ID + different payload: integrity conflict; no second write; audit emitted.
28. Network timeout after commit then retry same key returns original response.
29. Stale expected sequence/head returns 409; client refresh does not mutate prior request.
30. Database failover/serialization retry cannot duplicate event or sequence.

### E. Authorization and tenant isolation
31. Unauthenticated request, expired token, invalid signature, wrong audience/issuer -> reject.
32. Agent cannot revoke another actor's source-owned evidence without reviewer authority.
33. Agent cannot impersonate actorId/tenantId by request-body fields.
34. Cross-tenant record ID probing returns non-disclosing 404.
35. Connection-pool reuse cannot leak prior tenant RLS context.
36. Application DB role cannot update/delete event/record tables or disable triggers.
37. Restore/checkpoint/erase require dedicated permission, step-up auth, and dual approval where policy requires.
38. Every privileged attempt is audited without logging evidence PII.

### F. Hashes, checkpoints, and backups
39. Golden JCS hash vectors cover Unicode, key ordering, decimal strings, nulls, arrays, escaping, duplicate keys, invalid numbers.
40. Single-byte mutation, deletion, insertion, reorder, truncation, wrong previous hash -> detected.
41. Full rewrite with recomputed chain but no valid external signed checkpoint -> rejected/quarantined.
42. Valid checkpoint signature and matching manifest verify; invalid signature/key ID fails.
43. Missing/stale checkpoint or unavailable independent anchor causes ledger unavailable/abstention per policy.
44. Backup shorter than trusted local prefix -> reject rollback.
45. Same sequence/different head hash -> fork quarantine.
46. Strict extension with exact matching prefix -> accept in staged read-only validation.
47. Different ledger/epoch -> separate namespace; never merge automatically.
48. Restore requires trusted checkpoint, authorized operator, audit record, and verified post-restore watermark.

### G. Time, freshness, snapshots, and decisions
49. Distinguish recordedAtServer, effectiveAt, observedAt, sourceCheckedAt, capturedAt.
50. Missing sourceCheckedAt where required -> ineligible/low-confidence per taxonomy; never infer from capturedAt.
51. Invalid timezone, malformed RFC3339, future timestamp beyond skew -> reject.
52. Backdated effectiveAt does not rewrite prior as-known snapshot.
53. Snapshot at sequence N remains identical after revocation at N+1.
54. Retrospective run at N+1 excludes newly revoked record and labels mode retrospective.
55. Snapshot hash/watermark mismatch or missing ledger prefix -> replay unavailable, not approximate.
56. Caller-supplied status active cannot override revoked/quarantined projection.
57. Any projection/hash/checkpoint/database failure -> Decision Desk ABSTAIN; no stale cache or mutable-status fallback.

### H. Privacy and retention
58. PII classification and minimization validation on write/import.
59. Reason text rejects or redacts prohibited sensitive fields.
60. Logs, metrics, traces, and error messages contain no raw evidence payloads, credentials, or unnecessary identifiers.
61. Export/access/deletion requests are authorized and audited.
62. Legal hold prevents scheduled erasure where required.
63. Approved crypto-shredding removes protected content/key while preserving only legally permitted audit metadata; verify hash/retention semantics.
64. Backup expiry and deletion propagate to replicas/WORM lifecycle according to approved retention schedule.

### I. Performance and resilience
65. Load-test append/read/projection under realistic tenant sizes and concurrent writers.
66. Checkpoint-to-tail verification latency remains within agreed SLO; no unverified fast path.
67. DB outage, KMS outage, checkpoint store outage, and network partition all fail closed.
68. Crash/restart during every migration batch resumes idempotently.
69. Clock skew and sequence contention alert thresholds verified.
70. Large ledger pagination cannot omit events or accept a partial prefix as complete.

## 6. Migration acceptance procedure

1. Freeze source snapshot and calculate source SHA-256.
2. Run read-only inventory and independent review of manifest anomalies.
3. Run dry-run migration in isolated environment.
4. Compare counts, hashes, quarantined IDs, duplicate IDs, lineage anomalies, and PII findings.
5. Obtain evidence-steward sign-off on re-attestation policy; no bulk activation.
6. Run migration into a new empty ledger namespace with two-person authorization.
7. Verify all records are quarantined and no legacy item is eligible.
8. Verify event/record hashes, checkpoints, tenant scope, and idempotency.
9. Run full matrix and restore rehearsal.
10. Publish signed migration report and retain original source artifact.
11. Any unexplained count/hash mismatch, unexpected eligible item, unresolved fork, or failed test blocks cutover.

## 7. Regression preservation and CI requirements

The successful 18-case v1.1 post-fix regression is a protected historical result, not a mutable target. Preserve its exact input, already-unsealed oracle, expected-outcome file, execution report, artifact, and hashes. Do not edit expected outcomes or rewrite its CI artifact to accommodate lifecycle changes.

For every lifecycle implementation PR:
- run the 18-case suite against the same frozen implementation/fixture/oracle versions as a compatibility regression, clearly label it post-fix regression (not blind);
- run lifecycle and migration suites independently;
- record tested commit SHA, fixture/oracle hashes, runner version, DB version, and artifact digest;
- compare outputs exactly; investigate any change rather than auto-updating expected results;
- require zero false recommendations and zero false abstentions for the preserved 18-case suite unless a separately reviewed policy change explicitly changes a case and is documented as a new benchmark version;
- no merge of PR #30 is implied or permitted by passing CI.

## 8. Failure triage and stop conditions

Immediate stop/quarantine if: any legacy record becomes eligible without re-attestation; any terminal record becomes active; any lost/duplicate sequence; partial supersession; cross-tenant read/write; hash/checkpoint mismatch; restore rollback/fork accepted; projection failure emits recommendation; PII leak; or regression result changes without approved explanation.

For every failure capture sanitized logs, exact commit/config, database snapshot, request IDs, ledger watermark, and reproduction steps. Preserve both source and failed artifacts; never “fix” a test by changing expected outcomes before root-cause review.

## 9. Required evidence before implementation authorization

- Reviewed design v2, server spec, and this plan.
- Executable test cases mapped to every acceptance item.
- DB schema/constraints and isolation behavior proven in staging.
- Security/privacy/retention review signed off.
- Dry-run and restore evidence independently checked.
- Full lifecycle suite passes and protected 18-case regression remains unchanged.
- Separate explicit user approval to begin implementation; this document itself grants none.

## 10. Additional database-invariant tests

71. Genesis is sequence 0, first event is 1, and the sole ledger counter advances contiguously under concurrent writers; no off-by-one, duplicate, or skipped sequence is possible.
72. Database partial unique index rejects a second creation event for one evidence ID.
73. Database partial unique index rejects a second terminal event for one evidence ID, regardless of terminal event type.
74. Composite foreign keys reject cross-tenant and cross-ledger evidence/event/lineage references.
75. Snapshot UPDATE/DELETE attempts using the application role are rejected.
76. A ledger exceeding the configured maximum trusted-checkpoint age or unanchored-tail length becomes unavailable for decisions; a verified independent checkpoint restores availability only after full verification.
