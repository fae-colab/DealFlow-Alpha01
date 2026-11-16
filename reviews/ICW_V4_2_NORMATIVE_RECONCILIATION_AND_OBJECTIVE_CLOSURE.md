# ICW v4.2 — Normative Reconciliation and Objective Recovery Closure

**Document ID:** ICW-REV-REC-01  
**Version:** 0.1.0  
**Date:** 2026-11-16  
**Status:** Review/remediation control document; proposed decisions require authorized approval.  
**Parent:** reviews/CONSOLIDATED_INDEPENDENT_FINDINGS_REGISTER.md  
**Scope:** Five named AI review systems: Claude, Copilot, Gemini, ChatGPT and Grok.  
**Disposition:** HOLD — NOT ACCEPTED. No finding is closed by this document.

## 1. Purpose and governing rule

This document reconciles the five named review systems against the actual frozen normative sources and defines evidence that could objectively close the first four cross-review work packages:

1. Complete normative recovery dependency contract.
2. One topology and recovery procedure.
3. Independent expected-truth recovery oracle.
4. Fixed, non-manipulable recovery profiles and FULL semantics.

A reviewer verdict, number of approvals, revised prose, completed checklist, synthetic demonstration, or self-reported successful recovery is not closure evidence by itself.

This document does not amend the normative architecture, select a new provider, change R01–R30, authorize infrastructure or live tests, or authorize implementation/production. Proposed requirements become binding only through an explicitly approved, versioned normative amendment.

## 2. Exact review and normative baselines

### 2.1 Repository state inspected

- Repository: fae-colab/DealFlow-Alpha01
- PR: #34
- PR base branch: docs/icw-v4-2-evidence-closure
- Base commit: e5e087524d0b0a96cec25bf61c35701af0ce78b1
- PR head branch: review/icw-v4-2-copilot-dr-review
- PR head commit at inspection: cc519e2f3fc3ba416f090c1a96d0da5bd2705981

The four core v4 documents are present in the repository base commit. Their absence from the 12-document frozen PDF/archive is a review-package completeness defect, not proof that the repository lacks the documents.

### 2.2 Core v4 normative sources at the inspected base commit

| Source | Git blob SHA |
|---|---|
| EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md | 2adb0f1c7cc17e400af44f2c5ce9513c76dc6bf3 |
| EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md | f84efc8c96b700baf3d4ca1ba436e37d99251544 |
| EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md | 6b3e93e45c11c5897c9bc85e6d27cf07b26f56ac |
| EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md | 7a98725dc6b098cf2f9e19ce8c75e365b461b707 |

### 2.3 Relevant ICW closure sources at the inspected base commit

| Source | Git blob SHA |
|---|---|
| ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md | 51c1bf7f11e3d0452d0e9db1ad1f567f0baf8a1a |
| ICW_F02_INDEPENDENT_AUTHORITY_MODEL.md | 6b77f69758103143de744ff4329479f901a08ebb |
| ICW_F02_INDEPENDENT_AUTHORIZATION_AUTHORITY_DECISION.md | 4d15701fcff0a8507329ca1d65ed1ff5b4de133f |
| ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md | 79d73a5def263ae4393727d9dea8d4708f714916 |
| ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md | 8a1d86fce3cf8c5c78edeb2aa468141a60543bcc |
| ICW_F04_CRYPTOGRAPHIC_TRUST_AND_KEY_CUSTODY_TEST_SPECIFICATION.md | 387f552046bf4e746d1cf3099be267c38d946c33 |
| ICW_F04_KEY_CUSTODY_AND_COMPROMISE_PLAN.md | ee24535dbdde11969bbd752b090c32371faae098 |
| ICW_MASTER_CLOSURE_REGISTER_BASELINE_01.md | 750fc848a2818c10c65fb2ed5500d72c0d179bd7 |
| ICW_V4_2_INDEPENDENT_REVIEW_CHARTER.md | d39b3775aa823dd18d657991913af16edb0f05ac |

These are repository blob identifiers at the stated base commit, not SHA-256 file digests. Do not label Git blob SHAs as SHA-256.

### 2.4 Five-reviewer provenance and limits

| Reviewer system | Preserved source IDs | Repository/source limitation |
|---|---|---|
| Claude | CSC-01–CSC-24; earlier architecture pass P0/P1/P2/P3 IDs | CSC report is an archival transcription of conversation-supplied text, not byte-identical source evidence. The earlier Claude pass is a separate pass, not another independent organization. |
| Copilot | CR-01–CR-05; H-01–H-06 | Source baseline is preserved with Git blob SHA f78419ee14696123dab54782587c0c84ab2c93f7. |
| Gemini | F-01-01–F-04-01 | Structured archival transcription; not a byte-identical source attachment. |
| ChatGPT | Cryptographic assurance report, A01–A12/workstream findings; F-04 OPEN / NOT DEMONSTRATED | The consolidated register refers to ICW-REV-CRYPTO-01_BASELINE.md, but that baseline file is not present in the inspected PR head tree. The complete original report must be added or its exact prior repository location and immutable revision identified before source-level traceability is complete. Do not infer unprovided A01–A11 wording. |
| Grok | ISA-01–ISA-11 | Structured archival transcription; not a byte-identical source attachment. |

The existing register also preserves a DeepSeek review pass. It remains supplementary and must not be silently dropped or miscounted as one of the five named systems. All AI reviews remain distinct from the charter-required qualified external human review.

## 3. Normative hierarchy and reconciliation method

The four core v4 documents define the system contract. The requirement/test traceability matrix is part of that contract. F-01 through F-04 are supporting trust, topology, authority, recovery and cryptographic records; they must conform to the core contract and to one another.

Relevant existing normative requirements already include:

- Architecture v4 §§5–6: ICW is the authoritative sequence/commit source; database is a projection; independent checkpoints and restore/reconciliation are required.
- Architecture v4 §6.4: isolate restored systems, retrieve trusted ICW history, verify receipt signatures/continuity/object digests/idempotency/checkpoints, reconcile/replay projection, verify current head, and require authorized re-enable.
- Server specification §7: independent anchor, recovery state machine, current-head reconciliation and fail-closed behavior.
- Migration/test plan §5: rollback, checkpoint, restore, fork, gap, replay and unavailable-dependency tests.
- Requirement/test traceability AR-08, AR-09 and AR-14: checkpoint independence, restore against latest trusted history, and unavailable/abstain on unverifiable history.
- F-03 practical specification §§1–2: R01–R30 preserved, all classes represented, independent verifier and clean-room role separation.
- F-01 topology decision §§2–5: Spanner + S3 selected as the sole primary candidate for continued design review, not procurement or implementation approval.

Therefore, the correct CR-01 interpretation is not “there is no recovery contract anywhere.” There is a recovery contract distributed across core v4 and F-03. The unclosed defect is that the frozen review package omits the four core v4 sources and no exhaustive, authoritative component/artifact-to-R01–R30-to-requirement-to-test dependency trace has been demonstrated.

## 4. Reconciled finding CRX-01 — Complete normative recovery dependency contract

**Source findings:** Copilot CR-01; Claude CSC-18/CSC-19 and earlier P0-05; Gemini F-03-01; Grok ISA-05/ISA-09/ISA-11. ChatGPT's F-04 cryptographic assurance findings are cross-cutting prerequisites where recovery depends on historical keys, cryptographic policy, verifier independence and HSM restoration. ChatGPT's full source mapping remains incomplete until its baseline is located or added.

**Normative comparison:** Core v4 design §§5–6 and 8; server specification §§6–8; migration/test plan §§2 and 5–6; traceability AR-08/AR-09/AR-14 and review-closure matrix; F-03 inventory R01–R30 and practical specification §§1–3.

**Reconciliation:** The 12-document frozen review archive is not the complete charter-required review baseline. The four core documents exist in the repository base commit, but were not included in the archive reviewed by Copilot/Gemini/Grok. A reviewer confined to that archive could not verify the full dependency chain. The repository's existence of those documents does not retroactively make them part of the frozen PDF or prove they were reviewed.

**Required remediation:**

1. Publish a new immutable review manifest that includes the four core v4 documents, all F-01–F-04 documents, the closure register, review charter/RFP, and every referenced normative companion document.
2. Classify every included source as IN_FORCE, AMENDED, HISTORICAL or SUPERSEDED. Identify one controlling version per normative subject.
3. Build an exhaustive recovery dependency matrix. Every component and persisted artifact named by the core architecture, server contract, deployment model and recovery procedure must map to:
   - producing component and authoritative source;
   - tenant/ledger/epoch and object identity;
   - R01–R30 class, or a separately proposed class requiring explicit approval;
   - receipt, signature, manifest and exact-version binding;
   - prerequisites and restore order;
   - independent verifier and pinned expected inputs;
   - missing/altered/unavailable consequence;
   - normative requirement and existing/proposed test ID;
   - evidence artifact required for PASS.
4. Reconcile every R01–R30 row to the matrix without changing original class IDs, labels, required contents or missing-object consequences.
5. Record unresolved dependencies as OPEN/BLOCKED, never as implicitly covered.

**Objective closure evidence:**

- Immutable manifest with exact repository commit, per-file SHA-256, source classification and second-person reconciliation.
- Machine-readable dependency matrix and human-readable review.
- Automated completeness check showing zero unmapped mandatory components, persisted artifacts, manifest fields, trust roots, recovery tools or service dependencies.
- Every R01–R30 class appears exactly once as a primary mapping, with additional cross-links allowed.
- Every matrix row has a requirement, verifier, failure consequence and acceptance test/evidence reference.
- Independent reviewer confirms the manifest and matrix against the four core v4 sources.

**Acceptance:** PASS only when the complete baseline and matrix are reproducible and independently checked. A document list, source hashes alone, or an AI conditional approval is insufficient.

**State:** OPEN — DOCUMENTARY COMPLETENESS AND TRACEABILITY NOT DEMONSTRATED.

## 5. Reconciled finding CRX-02 — Stale topology and recovery contradiction

**Source findings:** Copilot CR-02; Claude CSC-01/CSC-02/CSC-18 and earlier P1-01; Gemini F-01-01/F-03-01; Grok ISA-03/ISA-04/ISA-05. ChatGPT F-04 key/receipt assurance is relevant to signing and recovery dependencies, but is not treated as an independently established topology finding.

**Normative comparison:**

- F-01 topology decision §2 selects Google Cloud Spanner multi-region as the ICW transactional witness and AWS S3 Object Lock Compliance as the immutable envelope/receipt object archive candidate.
- F-01 §§4–5 describe envelope upload, exact S3 VersionId read-back, and Spanner transaction for expected-head validation, receipt/idempotency insertion and head advancement. The successful Spanner commit is the logical acceptance point.
- F-03 inventory §1 still says to provision F-01 stores and MRSC ledger metadata; its exercise procedure refers to two stores.
- F-03 R03/R04 require receipt and envelope material, including exact object-version and primary/secondary references.
- F-03 practical specification §1 preserves the inventory without reinterpretation.
- Grok ISA-04 identifies that the selected F-01 topology does not unambiguously specify the independent receipt-byte copy required by the F-03 inventory and related claims.
- Claude CSC-01/CSC-02 independently questions whether the Spanner receipt/head and S3 envelope arrangement provides an independently retained receipt chain and rollback/fork detection.

**Reconciliation:** The F-03 procedure is not executable without operator interpretation. “Spanner + S3” does not, by itself, settle whether signed receipt bytes are stored in Spanner only, archived as exact S3 objects, or also retained in a separately controlled receipt archive. The F-01 title/summary calls S3 an envelope/receipt archive, while its write sequence must be reconciled with pre-commit signing, transaction commit, receipt publication and lost-acknowledgement semantics. The phrase “both stores” is not a safe substitute for an object-placement contract.

**Required remediation:**

1. Issue a versioned F-03 amendment; do not rewrite the historical source silently.
2. Replace obsolete MRSC/two-object-store instructions with the approved topology and exact APIs.
3. Publish one object-placement and authority matrix for: canonical envelope, signed receipt candidate, committed receipt, authoritative head, idempotency record, checkpoint, checkpoint anchor, public-key history, recovery manifest and audit export.
4. For each object, identify authoritative copy, immutable/archive copies, writer identity, trust domain, exact version/generation, retention, read-back, recovery source and failure consequence.
5. Resolve whether an independently controlled receipt-byte archive is mandatory. If mandatory, define how it is written, how commit-bound status is proven, maximum archive lag/RPO, lost-acknowledgement behavior, and what happens if the Spanner commit succeeds but archive publication fails. If it is not mandatory, amend every independent-copy/receipt-archive claim and explicitly state the residual rollback risk.
6. Reconcile pre-commit S3 Object Lock and orphan behavior with Grok ISA-08 / REM-22. No irreversible object may have undefined legal or retention status.
7. Align F-01, F-03 inventory, F-03 practical specification, master register, execution status and the core v4 traceability matrix.

**Objective closure evidence:**

- Signed/versioned F-03 amendment and object-placement matrix.
- Automated cross-document search/report proving no operative MRSC, DynamoDB MRSC, GCS dual-store or ambiguous “both stores” instructions remain, except in explicitly marked historical sections.
- Positive and negative protocol tests for pre-upload, exact-version read-back, transaction abort, Spanner commit, lost acknowledgement, retry, receipt archive delay/failure, orphan handling, object substitution and provider outage.
- Raw provider API traces, transaction IDs, object VersionIds, receipt bytes/digests, idempotency records, head before/after, and independently verified outcomes.
- A documented decision on independent receipt archive and an explicit residual-risk statement.
- Independent review confirms that the selected commit point, durable acknowledgement and recovery authority are the same across all controlling documents.

**Acceptance:** PASS only when one topology and one unambiguous commit/receipt protocol are used everywhere and the fault matrix proves the claimed semantics. Candidate selection alone is not operational acceptance.

**State:** OPEN — DOCUMENTARY CONTRADICTION; RECEIPT-ARCHIVE DECISION AND OPERATIONAL EVIDENCE UNRESOLVED.

## 6. Reconciled finding CRX-03 — Independent expected-truth recovery oracle

**Source findings:** Copilot CR-03; Claude CSC-02/CSC-23 and earlier P0-01; Gemini F-03-01; Grok ISA-04/ISA-05/ISA-10. ChatGPT's cryptographic review contributes cross-cutting requirements for independent verification, key history and cryptographic recovery; its exact source IDs must be mapped after the missing baseline is restored.

**Normative comparison:** Architecture v4 §6 requires independently protected monotonic checkpoint anchoring and restore against trusted ICW history. Server specification §7 requires independent anchor and recovery-state enforcement. F-03 practical specification §§2–3 requires a separately reviewed verifier and independently pinned trust material. R01 and R28 require independently pinned genesis/trust roots and a signed recovery manifest. Traceability AR-08/AR-09/AR-14 requires checkpoint independence, reconciliation and fail-closed behavior.

**Reconciliation:** The normative sources require an independent verifier and anchor, but the recovery package does not sufficiently specify how the expected pre-disaster head, receipt inventory, object inventory and dependency graph are obtained independently of the potentially rolled-back witness, manifest, audit source, provider account and recovery tool. A verifier can be a separate executable and still be circular if its expected values are derived from the same compromised source.

**Required remediation:**

1. Define an expected-truth source protocol established before disaster and outside the ordinary ICW/application/recovery control planes.
2. Identify the legal owner, writer, trust root, retention, update cadence, monotonicity and access-control boundary for every anchor.
3. Independently retain expected head/checkpoint commitments, receipt identity/range commitments, inventory/scope digest, and relevant publication/audit evidence.
4. Pin trust roots and verifier build/dependencies outside the recovery package being verified.
5. Specify how anchors are compared, how disagreement is handled, and the last independently proven position when one or more sources are unavailable.
6. Include coordinated rollback of witness head, expected manifest and one audit source; also test conflicting anchors, stale valid checkpoints, missing anchor, compromised anchor key and verifier substitution.
7. Where no independent source can prove completeness relative to prior acknowledgements, prohibit a complete recovery claim and use the prescribed limited statement: “Internally consistent recovery achieved; completeness relative to all prior acknowledgements not proven.”

**Proposed strengthening requiring explicit normative approval:** Copilot CR-03 proposes at least two independently controlled pre-disaster anchors. This count and the required independence criteria must be accepted or rejected by the authorized design owner in a versioned decision; it must not be silently treated as already normative.

**Objective closure evidence:**

- Approved anchor-source and trust-boundary specification.
- Pre-disaster anchor artifacts with immutable IDs, timestamps, signatures, retention evidence and SHA-256 digests.
- Independent verifier source/build/SBOM/dependency digests and known-answer vectors.
- A clean-room test in which recovery operators do not control the expected-truth sources.
- Coordinated rollback test demonstrating that the verifier detects a stale but internally consistent witness/manifest/audit set.
- Negative tests for anchor absence, disagreement, rollback, replay, key compromise and verifier substitution.
- Raw source API responses, audit exports, anchor receipts, verifier transcript and independent reviewer result.

**Acceptance:** PASS only when coordinated rollback cannot produce a false completeness result. If the independent anchor is unavailable, the result must be BLOCKED/UNAVAILABLE or explicitly limited; never FULL.

**State:** OPEN — EXPECTED-TRUTH INDEPENDENCE NOT DEMONSTRATED.

## 7. Reconciled finding CRX-04 — Fixed recovery profiles and FULL semantics

**Source findings:** Copilot CR-04/CR-05; Claude CSC-02/CSC-17/CSC-18; Gemini F-03-01; Grok ISA-04/ISA-05/ISA-10. ChatGPT's F-04 key recovery findings are mandatory dependencies for any profile that claims cryptographic verification or service restoration.

**Normative comparison:** F-03 practical specification §2.4 defines PASS/FAIL/BLOCKED/NOT RUN and PARTIAL/UNAVAILABLE outcomes and requires all R01–R30 classes to appear. It also permits NOT_APPLICABLE only with signed scope and independent acceptance. Copilot CR-04 correctly identifies that representing all classes does not prevent scope narrowing if no mandatory profiles and approval authority are fixed.

**Required remediation:** Define versioned, non-discretionary recovery profiles. The proposed profile family is:

| Profile | Minimum claim |
|---|---|
| L — Ledger integrity | Genesis, epoch continuity, accepted receipts, commit proofs, sequence continuity, current trusted head and required checkpoint/anchor evidence. |
| C — Content | Profile L plus all lawfully retained content and exact receipt-bound envelope/object versions; lawful erasures are represented as verified tombstones, not recovered plaintext. |
| D — Decision history | Profile L plus required snapshots, finalization receipts, evidence/provenance, policy, taxonomy, external inputs, model/runtime and dependency artifacts needed for the declared historical decision claim. |
| O — Operational restoration | Profile L plus the approved service dependencies required to restore and safely operate the service in a clean account/environment, including identities, network/DNS/TLS, runtime, secrets, queues/workers, monitoring, projections, consumer gating, cutover and old-site fencing. |
| A — Complete approved scope | The complete approved production scope, explicitly combining all mandatory ledger, lawful content, decision-history and operational dependencies for the declared tenants, epochs, time/sequence ranges and service capabilities. |

These are proposed minimum definitions. The authorized design owner must approve the exact profile schemas, whether profiles are cumulative, and the mandatory R01–R30 mapping for each profile before they become normative.

For every profile, the approved schema must bind:
- profile ID and version;
- tenant(s), ledger(s), epoch(s);
- date and sequence boundaries;
- mandatory R01–R30 classes and object types;
- provider/account/region locations and exact object versions;
- key IDs, historical key ranges and cryptographic policy versions;
- legal exclusions and signed authority;
- RPO/RTO values and measurement events;
- independently established expected inventory digest;
- omitted-object list and reason;
- coverage calculation and denominator;
- verifier identity/build and evidence package digest.

No operator may narrow a mandatory profile during the exercise. An exception requires a separately authorized, pre-exercise, versioned scope amendment and must not retain the original profile label.

**FULL semantics:**

- Never emit unqualified FULL.
- Use a profile-qualified result such as FULL-L, FULL-C, FULL-D, FULL-O or FULL-A only after every mandatory requirement for that profile passes.
- A missing, altered, unavailable, unverified or unapproved mandatory dependency prohibits FULL for the affected profile.
- NOT_APPLICABLE and ERASED_BY_AUTHORITY remain visible in the manifest and require independent approval/evidence.
- Coverage percentage is calculated against the independently established pre-disaster inventory, not the post-disaster recovered set or an operator-selected denominator.
- A PARTIAL result is not a failed safety control if the system correctly quarantines/abstains; it is not a successful FULL recovery.
- Operational service restoration (O) must not be inferred from successful ledger/content reconstruction.
- Profile A must not be claimed unless all approved A-scope requirements pass.

**Objective closure evidence:**

- Approved, versioned machine-readable schemas for all profiles.
- R01–R30-to-profile coverage matrix, with explicit exclusions and dependency rules.
- Signed pre-exercise scope approval and independently anchored scope hash.
- Negative tests attempting to omit tenants, epochs, time ranges, key generations, content, external data, snapshots, model/runtime dependencies and service components.
- Tests proving that missing mandatory dependencies force PARTIAL/UNAVAILABLE and cannot produce a profile-qualified FULL.
- Independently recomputed inventory denominator, coverage and omission list.
- For O, clean-account service restoration, synthetic business transactions, API/cache/export/downstream gating, duplicate prevention, old-site fencing and authorized cutover evidence.
- For A, independent evidence that every mandatory profile component is covered and that no unapproved exclusions remain.

**Acceptance:** PASS only when a scope-narrowing attack cannot produce a misleading FULL result and every result is bound to an approved profile and independently derived scope.

**State:** OPEN — PROFILE CONTRACT AND ANTI-SCOPE-MANIPULATION EVIDENCE NOT DEMONSTRATED.

## 8. Cross-cutting dependencies from the five reviews

The first four work packages cannot be closed while these dependencies remain unresolved:

- F-02 authority and recovery bootstrap: the recovery operator, ADS, tenant authority, approvers and custodians need distinct, evidenced roles and recoverable credentials.
- F-04 key custody: historical verification keys, recovery-manifest keys, HSM backups, KEK access, rotation and compromise intervals must be available to the independent verifier under approved policy.
- Commit-bound receipt semantics: a pre-commit signature must not be misrepresented as proof of a committed receipt; CAS losers, aborted transactions and lost acknowledgements need deterministic outcomes.
- Lawful erasure: erased plaintext must not be claimed as recovered; tombstones and permitted receipt integrity must remain verifiable without retaining prohibited plaintext or creating a confirmation oracle.
- Service restoration: archival reconstruction does not prove safe service operation; profile O requires its own end-to-end acceptance.
- Verifier independence: separate process/account alone is insufficient if the verifier shares production code, expected values, administrator, signing root or mutable package with the recovery operator.
- Evidence integrity: all runs bind exact baseline commit, test code, fixture, parameter register, provider configuration, verifier build, raw logs and result digest.

The relevant existing checklist workstreams REM-05 through REM-22 remain linked and open. This document adds no closure status to them.

## 9. Proposed test plan and evidence schema

The following are proposed acceptance groups, not claims that tests have run. Assign final test IDs in the authoritative traceability matrix after approval.

| Proposed group | Adversarial scenario | Required safe result |
|---|---|---|
| REC-BL-01 | Omit a core v4 source or required recovery dependency from the review manifest | Baseline/closure blocked |
| REC-TOPO-01 | Execute old MRSC/two-store instructions against the Spanner/S3 candidate | Procedure validation fails |
| REC-TOPO-02 | Spanner abort after S3 upload; lost acknowledgement after commit; archive delay/failure | Deterministic accepted/unaccepted classification; no false receipt |
| REC-TOPO-03 | Substitute S3 object version or receipt bytes | Independent verifier rejects |
| REC-ORACLE-01 | Coordinated rollback of witness head, expected manifest and one audit source | Independent anchor detects rollback |
| REC-ORACLE-02 | Remove, replay, conflict or compromise an anchor | BLOCKED/UNAVAILABLE/quarantine; never FULL |
| REC-ORACLE-03 | Replace verifier or its canonicalization/key history dependencies | Independent verifier trust check fails |
| REC-PROFILE-01 | Omit a mandatory class, tenant, epoch, range or key generation | Profile-qualified FULL prohibited |
| REC-PROFILE-02 | Change denominator or narrow scope after disaster | Scope-hash mismatch; FAIL |
| REC-PROFILE-03 | Report content/decision reconstruction as operational service restoration | O result rejected |
| REC-PROFILE-04 | Claim FULL-A with lawful erasure or mandatory dependency unavailable | FULL-A prohibited; explicit limited result |
| REC-SVC-01 | Restore data but leave stale APIs, caches, consumers or old writers active | O profile FAIL |

Each test record must include:
- test ID and exact requirement/finding IDs;
- immutable source commit and per-file hashes;
- approved profile/scope hash and expected inventory digest;
- initial and expected ledger/head/checkpoint identities;
- exact fixtures and digests;
- actor/role and authorization evidence;
- fault injection method, timestamp and raw provider/API/HSM logs;
- object VersionIds/generations and retention metadata;
- verifier source/build/SBOM/dependency digests and trust pins;
- expected and observed results, forbidden-state assertions and receipt delta;
- all omissions, exclusions and exceptions;
- artifact hashes and independent reviewer result;
- PASS/FAIL/BLOCKED/NOT RUN with timestamp and authorized disposition.

## 10. Closure state machine and gates

Use the existing master-register vocabulary. Do not introduce ambiguous synonyms.

- OPEN: requirement or finding remains unresolved.
- BLOCKED: a required prerequisite, owner, parameter, authority or evidence source is unavailable.
- NOT RUN: no execution evidence exists.
- FAIL: a required safety assertion is violated or a false success/FULL result occurs.
- DESIGN-RESOLVED: normative documentation is internally consistent and approved; this is not implementation evidence.
- PROVISIONAL: candidate direction only.
- ACCEPTED: only after the required evidence and independent retest are complete and the authorized closure authority records acceptance.

Documentary closure and operational closure are separate:

1. Documentary gate: complete immutable baseline, approved amendments, consistent topology, profile schemas, dependency trace and test oracles.
2. Synthetic verifier gate: deterministic fixtures and independent implementations prove verifier mechanics only; cannot close live F-03.
3. Authorized non-production operational gate: only after explicit authorization; provider-backed tests, fault injection, HSM/identity recovery and clean-room recovery.
4. Independent assurance gate: independent human reviewer reproduces evidence and records residual risk.
5. Production authorization: separate explicit decision; not implied by any preceding gate.

No stage may mark F-01 through F-04 ACCEPTED unless its own full evidence criteria are satisfied. No synthetic test closes a provider-backed or operational claim. No AI reviewer approval satisfies the charter's external human-review requirement.

## 11. Current disposition and immediate actions

| Work package | State | Immediate next action |
|---|---|---|
| CRX-01 — Normative recovery dependency contract | OPEN | Freeze the full charter-required baseline and produce component/artifact-to-R01–R30 trace |
| CRX-02 — Topology consistency | OPEN | Decide receipt-byte archive semantics and issue one F-03 topology amendment |
| CRX-03 — Independent oracle | OPEN | Approve external expected-truth sources and coordinated-rollback test |
| CRX-04 — Fixed profiles/FULL semantics | OPEN | Approve L/C/D/O/A schemas and anti-scope-narrowing rules |
| ChatGPT source traceability | BLOCKED | Add the complete ICW-REV-CRYPTO-01 source baseline or exact immutable location |
| Independent human review | BLOCKED / NOT ENGAGED | Complete charter-compliant external reviewer engagement only after documentary remediation |

**Overall: HOLD — NOT ACCEPTED. F-01 through F-04 remain OPEN / NOT DEMONSTRATED. No implementation, infrastructure spend, live exercise, migration, ingestion, deployment, production authorization or PR merge is authorized by this document.**

## 12. Source-to-workstream index

- Copilot CR-01 → CRX-01; CR-02 → CRX-02; CR-03 → CRX-03; CR-04 → CRX-04; CR-05 → CRX-04 plus service-restoration evidence; H-06 → CRX-03 and recovery inventory trace.
- Claude CSC-01/02/09/18/19/23 and earlier P0-01/P0-05/P1-01/P1-10 → CRX-01 through CRX-03 and cross-cutting commit/verifier controls.
- Gemini F-01-01/F-03-01/F-04-01 → CRX-01 through CRX-04 and cross-cutting administration/key dependencies.
- ChatGPT A01–A12 / F-04 assurance report → cross-cutting cryptographic, custody, key-recovery and independent-verification prerequisites. Exact individual mapping remains BLOCKED until the report baseline is present.
- Grok ISA-03/04/05/08/09/10/11 → CRX-01/02/04 and cross-cutting orphan-retention, status, sequencing and integrity-pin controls.


---

## 13. F-03 v1.1.0 normative amendments recorded (2026-11-16)

The F-03 companion documents have now been amended on this PR branch:

- `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` — v1.1.0; prior v1.0 Git blob `79d73a5def263ae4393727d9dea8d4708f714916`; current v1.1.0 Git blob `604b62dfb62eac3e037445d5bafaa629c2c5161f`.
- `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` — v1.1.0; prior v1.0 Git blob `8a1d86fce3cf8c5c78edeb2aa468141a60543bcc`; v1.1.0 content was amended to clarify precedence and the final blob SHA is recorded in the next commit.

The v1.1.0 amendment establishes:
1. Spanner as the sole transactional commit authority for committed receipt/head/idempotency; S3 Object Lock as the exact-version canonical envelope archive; no implied independent S3 receipt-byte archive.
2. Explicit pre-commit, abort, orphan, post-commit S3-loss and lost-acknowledgement semantics.
3. A pre-disaster independent expected-truth anchor contract. The numeric minimum number of anchor providers is intentionally not invented; it must be set by the approved threat model. If completeness relative to prior acknowledgements cannot be proven, no profile-qualified FULL is allowed.
4. Fixed L/C/D/O/A recovery claims, profile-qualified FULL semantics, R01–R30 mapping, supplemental O-01–O-08 operational dependencies and anti-scope-narrowing manifest requirements.
5. Preservation of all R01–R30 IDs and their original class definitions.

**Revised workstream dispositions:**

| Workstream | Documentary state after v1.1.0 | Remaining blocker |
|---|---|---|
| CRX-01 — Normative recovery dependency contract | PARTIALLY ADDRESSED | Complete component/artifact-to-R01–R30 trace across all architecture, service, runtime and operational dependencies; independent review. |
| CRX-02 — Topology consistency | DESIGN-RESOLVED at candidate/document level | Provider-backed transaction, S3 version/retention, abort/lost-ack/orphan tests; independent account/administrator evidence. |
| CRX-03 — Independent expected-truth oracle | CONTRACT DEFINED; NOT ACCEPTED | Approve actual anchor owners, source, count/independence criteria, cadence, trust roots and retention in the threat/parameter register; execute coordinated rollback and negative tests. |
| CRX-04 — Fixed profiles/FULL semantics | DOCUMENTED in v1.1.0; NOT OPERATIONALLY VALIDATED | Independent review of profile mapping; machine-readable schemas, fixtures and anti-scope-narrowing tests; operational O/A proof. |
| ChatGPT source traceability | BLOCKED | Full original report baseline / immutable source mapping remains absent. |
| Independent human review | BLOCKED / NOT ENGAGED | Charter-compliant reviewer not yet engaged. |

**Important:** Documentary topology resolution is not F-01 acceptance. Profile definitions do not prove recoverability. No tests have been executed by this amendment. F-01 through F-04 remain OPEN / NOT DEMONSTRATED; overall disposition remains **HOLD — NOT ACCEPTED**. No implementation, procurement, infrastructure spend, live exercise, migration, ingestion, deployment, production authorization or PR merge is authorized.


## 15. Cross-document correction implementation status (2026-11-16)

Following audit ICW-AUD-XDOC-01, the PR branch now contains documentary corrections for:
- AUD-XD-01: explicit witness commit / internal commit result / client API success separation; committed-but-projection-pending is typed HTTP 202 and non-actionable.
- AUD-XD-02: Spanner is authoritative for exact signed receipt representation, head and idempotency; S3 is the exact-version canonical batch-envelope archive only.
- AUD-XD-03: legacy unqualified FULL aggregation is explicitly superseded; only FULL-L/C/D/O/A are valid complete-profile claims.
- AUD-XD-04: R03 recovery reads exact receipt bytes/representation from the committed Spanner row using independent recovery credentials; the expected-truth anchor is a completeness oracle, not a second receipt authority.
- AUD-XD-05 / XD-11: provisional R01–R30 to AR/test/profile crosswalk and profile-level acceptance rows have been added to the core traceability matrix. All mappings remain provisional pending independent review.
- AUD-XD-08: F03-O-01–O-08 test definitions, negative assertions, FULL-O/FULL-A gates, anchor/scope and RPO/RTO tests have been added. All are TESTS DEFINED / NOT RUN.
- AUD-XD-09 / XD-10: v1.0 inventory provenance is explicit; current v1.1.0 inventory is normative; selected candidate versus unprovisioned provider services is explicit; MRSC/two-store procedure is marked historical/superseded.

**AUD-XD-06 policy decision updated (2026-11-16):** Option 2 ACCEPTED. Client/API success is not delayed for anchor publication; bounded asynchronous publication is mandatory, and any committed-but-uncovered interval after rollback is excluded from every completeness-qualified FULL-L/C/D/O/A result. The normative contract is F-03 practical recovery specification §27.6 (v1.1.2), with inventory §6.4/§7.5, traceability §12.3 and migration test plan §22.3.

**Still OPEN / IMPLEMENTATION PARAMETERS AND DESIGN AUTHORITY APPROVAL REQUIRED:**
- AUD-XD-06: finite numeric `ANCHOR_MAX_PUBLICATION_LAG`, measurement clock/deadline, breach alert and degraded/stop-accepting behavior; anchor identity relative to the core checkpoint, owner/writer/trust root, administrative independence, source/provider independence criteria, retention/recovery path and numeric RPO alignment. The policy choice itself is accepted; implementation and F-03 acceptance remain blocked.
- AUD-XD-07: R06 payload embedding versus separate encrypted objects, exact locators/version/digest/key bindings, retention/Object Lock and lawful-erasure/tombstone model.

No design default has been silently selected for XD-06 or XD-07. F-01–F-04 remain OPEN / NOT DEMONSTRATED. Overall disposition remains HOLD — NOT ACCEPTED. No provider provisioning, implementation, test execution, procurement, deployment, production authorization or PR merge is authorized.


## 14. AUD-XD-06 policy decision amendment (2026-11-16)

The architecture decision authority accepted Option 2: permit bounded asynchronous publication of the independent expected-truth anchor; do not make client/API success wait for anchor coverage. Client/API success remains projection-gated. The maximum publication lag must be a finite numeric value in the signed threat/parameter register. Following rollback, all committed positions after the last independently verified anchor are an uncovered committed interval and cannot be included in FULL-L/C/D/O/A. The exact interval must be reported; post-disaster self-anchoring from recovered sources is prohibited.

Normative implementation and regression requirements are in:
- `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` §27.6, v1.1.2;
- `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` §§6.4 and 7.5, v1.1.2;
- `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md` §12.3;
- `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md` §22.3.

The accepted policy choice is no longer open. Numeric lag, anchor identity/ownership/trust/administrative separation, provider/source independence, publisher implementation, retention/recovery and RPO alignment remain unapproved implementation parameters. AUD-XD-06 is therefore **POLICY RESOLVED / IMPLEMENTATION BLOCKED / NOT DEMONSTRATED**, not closed for F-03 acceptance. AUD-XD-07 remains open.
