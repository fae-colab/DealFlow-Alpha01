# DealFlow — Evidence Lifecycle Migration, Recovery and Verification Test Plan (v4)

**Status:** Proposed test plan for review. No tests against a production system, migration execution or implementation are authorized.  
**Parent documents:** \`EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md\` and \`EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md\`.  
**Decision basis:** D-01 through D-06, including amendments to D-02, D-04 and D-06.  
**Protected baseline:** Preserve the successful 18-case post-fix regression result and all its frozen inputs/oracle/report/artifact unchanged.

## 1. Objectives and non-goals

Prove, once implementation is separately authorized, that:
- legacy records cannot resurrect;
- supersession is atomic under concurrency, retry and injected failure;
- authoritative lifecycle history is append-only and tenant-isolated;
- restore cannot accept an older but apparently valid evidence history;
- checkpoint freshness and independence are enforced;
- lifecycle state and eligibility remain separate;
- recommendation snapshots are immutable and independently verifiable;
- later revocation/supersession/correction never rewrites historical recommendations;
- every integrity uncertainty produces explicit abstention/unavailability.

This plan does not authorize implementation, schema changes, migration execution, real-agent intake or PR merge.

## 2. Test environments and evidence

Required environments after implementation authorization:
- deterministic unit tests for state machine, projector, canonicalization and snapshot verification;
- production-equivalent relational database version/configuration for transactions, constraints, RLS and privileges;
- concurrent integration tests with separate database sessions;
- fault injection for process termination, connection loss, serialization failure and ambiguous network responses;
- isolated restore lab with signed backup, independent checkpoint anchor and immutable checkpoint objects;
- independent verifier environment that does not reuse production hash/canonicalization helpers.

Every run records commit SHA, schema/provider version, DB isolation configuration, fixture/source hashes, checkpoint and signing-key test IDs, test-run ID, runner version, configuration and artifact digests. Use synthetic fixtures only. Do not use real-agent evidence.

## 3. Migration source inventory and quarantine

Before any future migration:
1. freeze source artifact and compute source hash;
2. inventory every record, mutable status field, source timestamp, provenance field, supersession link, duplicate ID, tenant mapping and PII category;
3. compare available audit logs/backups to identify lifecycle history gaps;
4. produce an anomaly report for missing, conflicting, malformed and contradictory history;
5. dry-run into an isolated empty namespace;
6. require independent review of counts, hashes, quarantine decisions and lineage anomalies.

Every legacy record is quarantined by default. A legacy status of active is not proof that the record was never revoked. Do not fabricate historical lifecycle events from mutable status or unverified links. Re-attestation creates a new evidence ID with current provenance through the normal authenticated create path. The legacy ID remains quarantined and structurally excluded from eligibility queries.

## 4. D-02 — Supersession concurrency, atomicity and idempotency tests

The following are mandatory acceptance groups.

### 4.1 Atomic transaction visibility
1. Successful supersession commits exactly one batch with two ordered events: replacement creation then predecessor supersession.
2. Reader during transaction sees only the complete pre-transaction state or complete post-transaction state.
3. No intermediate sequence watermark can project both predecessor and replacement as active.
4. Snapshot/checkpoint/export at an interior sequence is rejected with \`INVALID_INTERMEDIATE_WATERMARK\`.
5. Batch header, replacement record, both events, lineage, batch hash, ledger head and idempotency result commit together.

### 4.2 Concurrent conflicting operations
6. Two concurrent supersessions of the same predecessor: exactly one commits; the other fails with a typed conflict and no side effects.
7. Concurrent revoke versus supersede: exactly one terminal transition commits; the loser observes the committed terminal state.
8. Concurrent duplicate create requests with same key/payload produce one logical record/event.
9. Concurrent different writes against the same expected watermark serialize or one receives a stale-watermark conflict; no lost or duplicate sequence.
10. Concurrent graph mutations cannot create a fork, merge, cycle or second successor.
11. Lock-order stress test demonstrates bounded deadlock handling and no partial transaction.

### 4.3 Fault injection and rollback
12. Inject failure after each write: idempotency reservation, ledger lock, replacement insert, batch insert, first event, lineage insert, predecessor event, hash validation, head update, idempotency result and commit response.
13. For every pre-commit failure, assert full rollback: original remains active, no replacement/lineage/event/batch/sequence/idempotency-success row remains.
14. Simulate connection loss during commit; retry same key and establish whether one full transaction committed or none did.
15. Serialization failure/deadlock retry uses the same idempotency key and cannot duplicate sequence or event.
16. Retry exhaustion returns unavailable/retryable result and leaves no partial state.

### 4.4 Idempotency and authorization
17. Same key + same digest, sequential and concurrent: same committed response.
18. Same key + different digest: integrity conflict; no second write.
19. Timeout after commit then retry: original result returned.
20. Idempotency replay after actor role revocation does not disclose stored response without current authorization.
21. Expired idempotency key cannot be silently reused within the approved recovery horizon.
22. Client-supplied tenant, actor, sequence, timestamp or hash cannot override trusted server values.

### 4.5 Database enforcement
23. Unique constraint rejects second creation event for an evidence ID.
24. Partial unique constraint rejects second terminal event across superseded/revoked/withdrawn.
25. Unique lineage constraints reject second successor and second predecessor for the same replacement.
26. Composite foreign keys reject cross-tenant/ledger/epoch references.
27. Batch range constraints reject gaps, overlaps, missing events, wrong event count or missing batch hash.
28. Request-serving DB role cannot directly INSERT/UPDATE/DELETE lifecycle records, events, batches, lineage, snapshots or checkpoints.
29. Application-level prechecks removed/disabled in a test harness do not bypass database invariants.

## 5. D-04 — Rollback, checkpoint independence and recovery tests

### 5.1 Checkpoint trust and signature
30. Valid checkpoint signature, manifest and latest monotonic anchor verify.
31. Invalid signature, unknown key ID, unsupported algorithm, malformed canonical bytes or altered manifest fails closed.
32. Previously valid but stale checkpoint is rejected when the independent anchor identifies a later position.
33. Deleting, overwriting or rolling back the ordinary database checkpoint table cannot roll back the independent anchor.
34. Checkpoint object and anchor access controls are proven separate from ordinary DB administrator credentials.
35. Signing-key rotation preserves historical verification; suspected key compromise quarantines from the last independently trusted position.
36. Full database rewrite with recomputed local hash chain but no matching external signed anchor is rejected.

### 5.2 Backup rollback and fork scenarios
37. Restore backup older than latest trusted checkpoint: isolate; no decisions served.
38. Restore same sequence with different head hash: fork quarantine.
39. Restore shorter sequence: reject rollback.
40. Restore with missing sequence, batch, record, lineage row or hash: reject/quarantine.
41. Restore exact verified prefix and strict extension: accept only after independent verification.
42. Missing tail is recovered from independently retained event archive/replica; every recovered batch verifies.
43. Missing tail cannot be recovered: ledger remains quarantined; no eligibility is inferred from backup.
44. Different ledger/epoch import is isolated; no automatic merge.
45. Recovery process cannot reset sequence within the same epoch.
46. New epoch manifest binds previous trusted checkpoint, recovered head, recovery source, approvals and reason; it cannot bypass an unrecovered gap.
47. Restored database cannot serve recommendations before explicit recovery verification and authorized re-enable.

### 5.3 Thresholds and dependency outages
48. Test checkpoint age and unanchored-tail limits below, at and above configured boundaries.
49. Missing/unavailable anchor, KMS, WORM object store or checkpoint publisher causes ledger unavailability when policy cannot verify current integrity.
50. Checkpoint publication delay beyond policy threshold prevents unsafe fast-path recommendations.
51. Healthy unrelated tenant/ledger remains available when one ledger is quarantined, unless a broader trust-domain incident is established.
52. Database backup alone never passes lifecycle-integrity acceptance.

## 6. D-06 — Historical recommendation snapshot integrity tests

### 6.1 Snapshot completeness
53. Snapshot contains exact evidence IDs/versions/content hashes and lifecycle state at decision watermark.
54. Per-evidence eligibility assessment records included/excluded status and reason codes.
55. Snapshot binds tenant, ledger, epoch, committed batch ID, ending sequence, head hash and independently verifiable checkpoint.
56. Snapshot records decision input values, units, normalization, assumptions, uncertainty, rule/engine/projector/taxonomy versions, evaluation time and replay mode.
57. Snapshot retains sufficient versioned context/artifacts to independently reconstruct the original evaluation.
58. Nondeterministic/model-assisted output actually consumed is preserved with model/provider/version metadata, parameters and prompt/template hash; a rerun is not falsely claimed to be deterministic.

### 6.2 Hash and independent verification
59. Snapshot hash is recomputed by an independent verifier that does not call production canonicalization/hash helpers.
60. Single-byte mutation, field deletion/addition, evidence substitution, changed rule version or changed input is detected.
61. Snapshot hash or Merkle root is independently signed/anchored; same-database hash alone is not accepted as independent proof.
62. Invalid/missing signature, stale anchor, wrong checkpoint or mismatched ledger watermark makes snapshot unverified.
63. Canonicalization golden vectors cover Unicode, ordering, nulls, arrays, decimal strings, escaping, duplicate keys and invalid numeric values.
64. Original snapshot bytes remain retrievable and content-addressed under approved retention policy.

### 6.3 Immutability and corrections
65. Ordinary application and administrator roles cannot UPDATE/DELETE finalized snapshot payloads or hashes.
66. Revocation after snapshot creation does not change the original snapshot bytes/hash.
67. Supersession after snapshot creation does not change the original snapshot bytes/hash.
68. Expiry, policy change or engine upgrade does not change the original snapshot.
69. Correction creates a new linked correction record/event with actor, reason, timestamp, affected fields and new integrity hash.
70. Original and corrected snapshots remain separately identifiable; correction never masquerades as original.
71. Retrospective evaluation creates a new snapshot with later watermark and explicit retrospective mode.
72. If legal erasure removes a dependency, integrity verification remains distinct from content reconstruction; snapshot is marked reconstruction-limited/unavailable rather than silently substituted.

### 6.4 Historical reconstruction
73. Independent reviewer retrieves exact versioned rules/engine/projector/taxonomy artifacts and verifies their digests.
74. Replaying deterministic evaluation at original time and original committed watermark reproduces the recorded result within the specified deterministic contract.
75. Later evidence is excluded from AS_KNOWN_AT_DECISION replay.
76. RETROSPECTIVE_WITH_LATER_EVIDENCE uses a new watermark and never modifies the original.
77. Missing artifact, evidence payload or checkpoint is explicitly reported; no current version is substituted.
78. Independent reviewer can trace each recommendation score/abstention to preserved input values, eligibility decisions and assumptions.

## 7. D-01, D-03 and D-05 cross-cutting tests

79. Legacy active status with known revocation remains quarantined.
80. Legacy active status without reliable lifecycle history remains quarantined.
81. Missing, unknown, malformed or contradictory legacy status remains quarantined.
82. Legacy lineage links are untrusted metadata and cannot create authoritative supersession events by themselves.
83. Re-attestation creates a new evidence ID; old ID remains quarantined.
84. Legacy quarantine namespace cannot be referenced by eligible-evidence foreign keys or Decision Desk projection queries.
85. Direct client DML and unauthorized delete/update attempts fail and are audited.
86. Operational mutable records remain mutable where allowed; lifecycle immutability is not misapplied to all application data.
87. Active but expired evidence remains lifecycle-active but is ineligible after expiry.
88. Revoked/superseded evidence remains terminal regardless of expiry.
89. Contradictory material claims are marked conflicted/ineligible; recency alone cannot resolve them.
90. Unsupported schema/canonicalizer/policy version produces explicit unavailable/abstain.
91. Unauthorized mutation attempt is rejected/audited without disabling unrelated healthy ledgers.
92. Cross-tenant read/write attempts do not disclose existence or payload.
93. RLS and connection-pool reuse tests prove tenant context cannot leak across requests.

## 8. Migration determinism and restartability

Migration run records immutable migration ID, source manifest hash, target ledger/epoch, migration code version, operator identity, start/end time and state.

- Stable mapping key: source hash + source record ID + migration version.
- Same migration ID and same source hash/version returns prior result without duplicates.
- Same migration ID with different source manifest hash fails as integrity conflict.
- Each source record and its quarantine envelope/manifest entry/checkpoint commit atomically.
- Restart resumes from durable per-record checkpoint.
- Migration never overwrites an existing ledger or advances a head using stale expected watermark.
- Original source backup remains unchanged and preserved.
- Dry-run and final report include counts, hashes, quarantine reasons, duplicates, lineage anomalies, PII findings and unresolved records.

## 9. Future migration acceptance procedure

Only after separate explicit migration authorization:
1. Freeze source snapshot and calculate source digest.
2. Run read-only inventory and independent anomaly review.
3. Run dry-run in isolated environment.
4. Compare source/output counts, hashes, quarantine list, duplicate IDs, lineage graph and PII classification.
5. Obtain evidence-steward approval of any proposed re-attestation; no bulk activation.
6. Execute into a new empty ledger namespace with dual authorization.
7. Verify every legacy record is quarantined and no legacy item is eligible.
8. Verify ledger hashes, batch boundaries, tenant scope, idempotency and checkpoint.
9. Execute full adversarial suite and isolated restore rehearsal.
10. Publish signed migration report and preserve original source artifact.
11. Any unexplained mismatch, unexpected eligible item, unresolved fork, failed test or missing checkpoint blocks cutover.

## 10. Regression preservation and CI

The successful 18-case post-fix regression is a protected historical result. Preserve its exact frozen input, already-unsealed oracle, expected outcomes, execution report, artifact and hashes. Do not edit or regenerate it to accommodate lifecycle changes.

For any future implementation PR:
- run the protected 18-case suite against the same frozen input/oracle/runner contract;
- label it post-fix regression, not blind;
- run lifecycle and migration suites independently;
- record tested commit SHA, fixture/oracle hashes, runner version, database version/configuration and artifact digest;
- investigate every changed output; never auto-update expected outcomes;
- passing CI does not authorize PR #30 merge.

## 11. Stop conditions and failure triage

Immediately stop the affected test/migration/recovery and quarantine the ledger if:
- any legacy record becomes eligible without re-attestation;
- terminal evidence becomes active;
- supersession partially commits or has multiple successors;
- sequence is lost, duplicated, gapped or regressed;
- a reader observes an interior batch;
- tenant isolation is breached;
- local hash chain passes but independent checkpoint/anchor fails;
- stale backup is accepted;
- missing history is treated as proof that no revocation occurred;
- historical snapshot changes after later evidence events;
- snapshot integrity cannot be independently verified;
- an unverifiable dependency is silently substituted;
- a projection failure still emits a recommendation;
- PII is exposed outside approved policy.

Capture sanitized logs, exact build/config, fixture hashes, request IDs, ledger/batch watermark, checkpoint IDs and reproduction steps. Preserve source and failed artifacts. Never “fix” a test by changing expected outcomes before root-cause review.

## 12. Required evidence before implementation authorization

- Approved v3 architecture and server specification.
- This test plan reviewed as one contract with those documents.
- Database/provider and isolation strategy selected.
- Executable test cases mapped to each acceptance requirement.
- Independent hash/checkpoint/snapshot verifier design reviewed.
- Security, tenant isolation, privacy and retention review.
- Dry-run and restore rehearsal design accepted.
- Protected 18-case regression inputs/oracle/report/artifact hashes preserved.
- Explicit separate user authorization to begin implementation.

## 13. Current authorization boundary

This plan is documentation only. It does not authorize implementation, database/schema changes, migration execution, real-agent evidence intake, PR #30 merge or PR #32 readiness/merge.

PR #30 remains open and unmerged. PR #32 remains a draft for review. All current evidence fixtures remain synthetic.


## 14. Critical-review closure tests (additive)

94. Lock-target test: lifecycle mutation locks the immutable evidence row and ledger head, then validates lifecycle state from the committed event history at the locked watermark; no mutable evidence status field is required.
95. Stale derived-guard test: deliberately corrupt or lag a materialized lifecycle guard projection; mutation detects mismatch against authoritative event history and fails closed without supersession.
96. Lock-order concurrency test: all mutation procedures follow the documented lock order under concurrent create/revoke/supersede load; deadlocks/serialization failures roll back completely and bounded retries do not duplicate writes.
97. Monotonic anchor test: publisher rejects a lower checkpoint sequence/batch position even when its signature is valid.
98. Same-position fork test: publisher rejects same-sequence/different-head or different-batch-hash checkpoint.
99. Previous-anchor test: publisher rejects a checkpoint whose previous-checkpoint reference does not equal the current trusted anchor.
100. Anchor compare-and-swap race: concurrent publishers cannot overwrite/regress the anchor; one valid extension wins and the other reloads/revalidates.
101. Stale restored-head test: after restoring a locally valid but older database backup, checkpoint signing/anchoring refuses to publish it as current.
102. New-epoch gate test: new epoch publication without a fully verified restore manifest and recovered history is rejected.
103. Snapshot publication gate: recommendation API does not return a finalized/actionable recommendation before the exact snapshot hash has a valid independent anchor receipt.
104. Anchor outage test: immutable snapshot may remain pending, but the recommendation is returned as pending/unavailable; no same-database hash fallback is accepted.
105. Snapshot receipt binding test: receipt binds snapshot hash, tenant, ledger, epoch, batch ID, ending sequence, head hash, checkpoint reference, algorithm and key ID; any field substitution fails verification.
106. Snapshot anchor retry test: retry after timeout is idempotent and cannot create multiple finalization receipts or alter snapshot bytes.
107. Correction anchor test: correction record remains non-final until its own hash is independently anchored; original snapshot remains byte-identical.
108. Snapshot watermark coverage test: a checkpoint that does not cover the snapshot watermark cannot serve as its sole external anchor.
109. Recovery publisher test: a restored ledger must extend the latest independent anchor before any new checkpoint can be signed/anchored.

## 15. Inherited v2 acceptance suite — retained

The 115 numbered acceptance cases in \`EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v2.md\` remain an inherited mandatory baseline. They are not deleted or waived by this v3 plan. The v3 cases above strengthen and clarify the following coverage; where both versions address the same behavior, the stricter requirement applies.

| Inherited v2 cases | Coverage retained in v3 |
|---|---|
| V2-001–008 | Legacy quarantine, re-attestation and no resurrection: §§3, 7 |
| V2-009–021 | Event schema, terminal transitions and lineage: §§4.5, 7 |
| V2-022–030 | Atomic rollback, concurrency, idempotency and retry: §4 |
| V2-031–038 | Authentication, authorization, tenant isolation and audit: §§7, 11 |
| V2-039–048 | Hash vectors, checkpoint verification, rollback/fork and restore: §5 |
| V2-049–057 | Time semantics, replay, expiry and fail-closed eligibility: §§6, 7 |
| V2-058–064 | PII, privacy, legal hold, erasure and backup retention: §§3, 8, 11 |
| V2-065–070 | Load, checkpoint-tail, outage, restart and pagination: §§2, 5 |
| V2-071–080 | Sequence authority, database uniqueness, recovery epoch and key verification: §§4, 5 |
| V2-081–087 | Atomic batches, reader visibility and valid watermark boundaries: §4 |
| V2-088–093 | Canonical preimages, independent golden vectors and verifier: §6 |
| V2-094–097 | Claim identity, contradiction and canonicalizer versioning: §7 |
| V2-098–101 | Authorization scope, idempotency authorization and epoch recovery: §§4, 5, 7 |
| V2-102–109 | Quarantine namespace, procedure-only writes, batch completeness and parser safety: §§3, 4, 7 |
| V2-110–115 | Expiry and historical evaluation-time behavior: §§6, 7 |

The v2 plan's migration acceptance procedure, regression-preservation requirements, stop conditions and implementation authorization gates also remain mandatory unless explicitly replaced by a stricter v3 requirement. The protected 18-case post-fix regression remains unchanged.



---

# v4 normative amendment — Independent commit-witness acceptance suite

**Precedence:** These tests are additive and mandatory. They supersede any v3 test interpretation that permits a database-only tail, checkpoint-only commit proof, or snapshot receipt without ledger provenance. All tests run in an isolated disposable environment using synthetic data and a pinned signed deployment parameter register.

## 14. ICW commit authenticity and unanchored-tail elimination

For every case, the oracle is the independently retained ICW receipt/envelope, not the database's own hash chain.

110. **ICW durable commit:** submit one valid lifecycle batch. PASS only if the complete canonical envelope is durably retained in the independent trust domain and a valid signed receipt binds its digest, previous receipt, assigned sequence range, batch ID and resulting head. A hash-only receipt fails.
111. **Database-only forged tail:** create a valid ICW receipt at sequence N; apply legitimate later batches N+1..N+k; as database owner, rewrite one or more post-N projected events/payloads and recompute every local hash. Restore and attempt serving. PASS only if the altered projection is rejected against ICW receipts and the ledger is isolated; any recommendation is FAIL.
112. **Unreceipted database append:** directly append a syntactically valid event and recompute local chain without ICW append. PASS only if it is rejected, excluded from authoritative history and detected by reconciliation.
113. **Receipt missing/object missing:** remove or make unavailable an ICW batch envelope/object referenced by a durable receipt in a controlled fault fixture. PASS only if the ledger is unavailable/quarantined and no database copy is silently promoted as authoritative.
114. **ICW object substitution:** replace a batch object with different bytes under the same object reference. PASS only if object digest/signature verification fails and ledger is quarantined.
115. **ICW sequence gap:** request append with non-contiguous sequence or wrong expected previous receipt. PASS only if ICW rejects and head/receipt count remain unchanged.
116. **Concurrent ICW append:** issue two valid batches against the same expected previous receipt. PASS only if at most one receipt is accepted; loser reloads/revalidates and no fork or duplicate sequence exists.
117. **ICW idempotency same digest:** retry same scope/key/digest sequentially and concurrently. PASS only if exactly one receipt exists and all successful retries return its identical receipt ID/hash.
118. **ICW idempotency different digest:** reuse scope/key with different canonical request digest. PASS only if typed integrity conflict occurs and no new receipt is created.
119. **Witness outage before append:** make ICW unavailable before durable acceptance. PASS only if no database projection mutation commits and API returns unavailable.
120. **Crash after witness acceptance:** accept batch at ICW, terminate service before projection/response. PASS only if same-key retry/recovery discovers the original receipt, applies exactly one full projection batch and returns the original operation; it must not report rollback or allocate another sequence.
121. **Crash during projection:** inject failure after each projection write. PASS only if DB transaction leaves all batch components absent or all present; replay converges to exactly one complete projection matching receipt.
122. **Crash after projection before response:** commit projection then drop response. PASS only if retry returns original receipt/result without duplicate event, batch, sequence or lineage.
123. **Projection lag gate:** deliberately pause projection after ICW commit. PASS only if ledger mutations and evidence-dependent reads/recommendations are unavailable or explicitly pending; no stale projection is served as current.
124. **Projection digest mismatch:** alter one projected row while preserving local cursor. PASS only if recomputed batch/projection digest disagrees with ICW and ledger becomes integrity-blocked.
125. **DB owner compromise boundary:** grant attacker database-owner/superuser access but no ICW credentials. Attempt rewrite, truncate, restore, fabricate receipt metadata and recompute local chain. PASS only if ICW history remains unchanged and every affected projection fails verification.
126. **ICW receipt chain continuity:** delete, reorder, duplicate or fork receipt references in a test replica. PASS only if independent chain verification fails at the exact first invalid receipt and no later watermark verifies.
127. **Witness durable acknowledgement:** crash/restart witness nodes/storage immediately after a reported durable acceptance. PASS only if acknowledged receipt and complete envelope remain retrievable under the documented durability contract; otherwise the witness durability claim fails.
128. **No offline downgrade:** disconnect ICW and attempt every mutation pathway, including administrative, migration and restore. PASS only if none creates an authoritative lifecycle batch outside ICW.

## 15. Checkpoint and recovery protocol tests

129. **Checkpoint object before CAS:** crash after immutable object write but before anchor CAS. PASS only if no trusted checkpoint is reported; retry is idempotent and may publish the same verified object.
130. **Crash after anchor CAS:** crash after successful CAS but before local metadata update. PASS only if retry discovers the exact accepted anchor receipt and repairs metadata without duplicate/regressed checkpoint.
131. **Advanced anchor, missing object:** make object unavailable after anchor CAS. PASS only if ledger verification/recovery blocks; no substitute object is accepted.
132. **Checkpoint receipt coverage:** attempt checkpoint creation with an omitted, duplicated, reordered or non-contiguous ICW receipt. PASS only if publication is rejected.
133. **Stale database tail:** restore a locally valid database backup whose tail differs from ICW receipts. PASS only if rebuild uses ICW envelopes and rejects every substituted batch.
134. **ICW-based restore:** restore an older projection and replay all missing ICW receipts. PASS only if final projection matches exact current ICW head, counts, lineage and batch digests.
135. **No ICW receipt recovery:** present a locally valid batch absent from ICW. PASS only if it is not imported or re-signed and the ledger is quarantined if it was previously served.
136. **Recovery interrupted:** crash at every restore/replay stage. PASS only if ledger remains isolated until the entire replay and verification succeeds; restart is idempotent.
137. **New epoch gate:** attempt epoch transition with missing ICW receipt/object or unresolved prior history. PASS only if rejected and old epoch remains quarantined.
138. **ICW unavailable during recovery:** PASS only if recovery remains isolated; database backup alone cannot authorize re-enable.

## 16. Snapshot provenance, finalization and reconstruction tests

139. **Snapshot binds accepted receipt:** finalize snapshot at watermark W. PASS only if ICW receipt binds snapshot digest and immutable object digest to exact ledger receipt ID/hash, tenant, ledger, epoch, batch, sequence and head.
140. **Snapshot nonexistent watermark:** request finalization against a sequence/head without an accepted ICW receipt. PASS only if rejected.
141. **Snapshot forked receipt:** supply a receipt from another tenant, ledger, epoch or fork. PASS only if rejected without cross-tenant disclosure.
142. **Snapshot ledger-chain proof:** independently verify snapshot's referenced receipt back to genesis or a verified checkpoint. PASS only if every receipt is contiguous and authentic; a signed claimed sequence alone fails.
143. **Snapshot beyond checkpoint:** finalize a snapshot whose watermark is later than the latest checkpoint. PASS only if direct ICW snapshot receipt binds an already accepted ledger receipt and its complete receipt-chain proof; a stale checkpoint alone fails.
144. **Intervening event tamper:** mutate an event between checkpoint and snapshot watermark while leaving snapshot bytes/receipt unchanged. PASS only if ledger provenance fails.
145. **Snapshot pending exposure:** while `DRAFT` or `ANCHOR_PENDING`, call recommendation, ranking, cache, export, notification and downstream action APIs. PASS only if no actionable recommendation/ranking/action is exposed; status-only audit metadata may be returned.
146. **Snapshot finalization failure:** make ICW finalization fail or return invalid receipt. PASS only if state remains non-final and all consumers deny actionability.
147. **Snapshot timeout retry:** drop response after successful ICW finalization, retry same snapshot ID/digest/key. PASS only if same receipt is returned and bytes are unchanged.
148. **Snapshot payload conflict:** reuse snapshot identity/idempotency key with different bytes. PASS only if integrity conflict and no overwrite occurs.
149. **Correction finalization:** create correction and fail its anchoring. PASS only if correction remains non-final and original snapshot bytes/hash/receipt remain unchanged.
150. **Original snapshot mutation:** change one byte/field or substitute a dependency. PASS only if snapshot digest or receipt verification fails.
151. **Historical integrity vs recomputation:** remove a legally erasable dependency while retaining permitted integrity metadata. PASS only if integrity and ledger provenance may remain VERIFIED while reconstruction/recomputation explicitly becomes PARTIAL or UNAVAILABLE; no "fully reconstructed" status.
152. **Complete deterministic reconstruction:** provide all pinned artifacts and original inputs. PASS only if canonical decision outputs, eligibility states/reasons, recommendation/abstention result and decision ordering exactly match the stored result, except only explicitly versioned tolerances.
153. **Artifact substitution:** replace engine, policy, projector, taxonomy, feature, normalization or configuration artifact with a newer version. PASS only if digest mismatch is detected and current artifact is not substituted.
154. **Nondeterministic model record:** preserve actual structured model output and metadata. PASS only if verifier checks preserved output and deterministic downstream computation without requiring a remote model rerun to match.
155. **Missing artifact oracle:** remove one required artifact. PASS only if exact missing dependency is reported and recomputation is not marked MATCH.
156. **Later evidence exclusion:** add events after original watermark. PASS only if AS_KNOWN_AT_DECISION replay excludes them and original snapshot remains unchanged.
157. **Retrospective mode:** run later-evidence evaluation. PASS only if new snapshot has new ID, later receipt/watermark and explicit retrospective mode; original remains byte-identical.

## 17. API precondition and lifecycle lock tests

158. **Command watermark matrix:** for create, supersede, revoke and withdraw, test missing, exact-current, stale, interior-batch and future watermarks against the approved command matrix. PASS only if each yields the specified typed result and no unintended receipt.
159. **Idempotent replay after later writes:** retry an already committed command with its original key after ledger head advances. PASS only if original receipt is returned after current authorization check; no new sequence is allocated.
160. **Actor revoked before replay:** revoke actor permission after commit, then retry. PASS only if receipt existence is not disclosed beyond permitted policy and no mutation occurs.
161. **Evidence row missing:** remove/corrupt stable projection lock target while ICW history says it exists. PASS only if reconciliation detects inconsistency and mutation fails closed.
162. **Projection stale:** lag lifecycle guard projection while ICW receipt history is ahead. PASS only if projection is rebuilt or mutation blocked; stale state cannot authorize supersession.
163. **Projection disagrees with event history:** inject active projection for terminal evidence. PASS only if mutation is rejected and ledger is isolated.
164. **Incomplete authoritative history:** omit an event from database projection while receipt exists. PASS only if no transition is authorized until replay repairs the projection.
165. **Lock-order stress:** concurrently create/revoke/supersede overlapping claim graphs. PASS only if all procedures follow the single documented lock order, ICW CAS prevents forks, and bounded retries leave no partial projection.

## 18. Privileged-role and threat-model tests

166. **Role capability matrix:** attempt each prohibited action under request API, procedure owner, database owner, application administrator, ICW operator, ICW storage administrator, key administrator, recovery operator and auditor identities. PASS only if observed permissions exactly match the approved role matrix.
167. **DB owner cannot alter ICW:** database owner/superuser rewrites all local rows, sequences and hashes. PASS only if ICW receipts/envelopes remain unchanged and tampering is detected.
168. **Application admin cannot append history:** application administrator without authenticated actor authority cannot create an ICW receipt. PASS only if denied and audited.
169. **ICW operator cannot rewrite projection:** ICW operator attempts direct database lifecycle/projection mutation. PASS only if denied.
170. **Dual-control recovery:** one recovery operator attempts re-enable without required independent approval. PASS only if blocked.
171. **Key rotation history:** rotate signing key and verify all historical receipts/checkpoints/snapshots using retained public verification history. PASS only if all valid historic artifacts still verify.
172. **Key compromise response:** simulate compromised signing key. PASS only if affected trust range is quarantined according to policy and a new trust root is established without silently rewriting history.

## 19. Deterministic test oracle and deployment parameter register

Every test record MUST contain: requirement ID; exact document/section; fixture digest; initial ICW and projection heads; actor/role; operation/request bytes; expected typed API result; expected ICW receipt delta; expected database row/cursor delta; expected ledger availability state; exact negative assertions; runner/build/database/ICW versions; signed parameter-register version/digest; observed output and artifact digest.

Pass/fail semantics:
- **PASS:** every positive and negative assertion matches exactly.
- **FAIL:** any expected assertion is violated, any forbidden state/action occurs, or an unexpected receipt/projection mutation exists.
- **BLOCKED:** a required service, signed parameter, fixture, independent oracle or verifier is unavailable. BLOCKED is not PASS and blocks authorization.
- **NOT RUN:** no execution evidence exists. NOT RUN is not PASS.

The signed deployment parameter register must provide exact numeric values for all threshold-dependent tests before implementation authorization. Tests 48 and 21 from the inherited suite, plus all threshold tests, load those values from the same pinned register. Test-local defaults are prohibited.
