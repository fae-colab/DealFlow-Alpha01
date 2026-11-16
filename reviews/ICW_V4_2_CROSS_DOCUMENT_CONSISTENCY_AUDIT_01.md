# ICW v4.2 — Cross-Document Consistency Audit 01

**Audit date:** 2026-11-16  
**Audit ID:** ICW-AUD-XDOC-01  
**Audited repository:** `fae-colab/DealFlow-Alpha01`  
**Audited PR:** #34  
**Audited branch:** `review/icw-v4-2-copilot-dr-review`  
**Audited head commit:** `38e202907a4825a64fdb2553e5e54af2bed325db`  
**Base commit:** `e5e087524d0b0a96cec25bf61c35701af0ce78b1`  
**PR disposition at audit start:** OPEN / DRAFT / UNMERGED  
**Audit type:** Documentary cross-document consistency review; no implementation or operational test execution.

## 1. Executive result

**RESULT: FAIL — DOCUMENTARY CONSISTENCY NOT YET ACCEPTABLE FOR INDEPENDENT REASSESSMENT.**

The F-03 v1.1.0 amendments substantially improve the selected Spanner/S3 protocol, orphan/lost-acknowledgement semantics, expected-truth requirements and recovery profile definitions. The core v4 architecture and server specification are broadly compatible with the selected transactional-witness pattern.

However, the integrated document set still contains material ambiguities and contradictions. Most importantly:

1. F-01/F-03 wording does not consistently distinguish the internal Spanner commit acknowledgement from the API's successful completion response after projection.
2. F-01 still describes S3 as an “envelope/receipt object archive”, while F-03 v1.1.0 expressly does not require a second S3 receipt-byte archive.
3. The earlier F-03 aggregate status section still defines unqualified FULL, conflicting with the v1.1.0 profile-qualified FULL contract.
4. F-03's R03 recovery instruction still refers to “independent witness copies”, inconsistent or at least ambiguous under the single Spanner transactional witness.
5. There is no R01–R30 to AR-01–AR-15 / core test-ID crosswalk in the v4 requirement traceability matrix.
6. The expected-truth anchor's update/acknowledgement contract and its relationship to the core checkpoint anchor/F-01 trust boundaries remain undefined.
7. R06 content-payload placement, exact-version binding and lawful-erasure mechanics are not fully reconciled with the selected S3 envelope design.
8. The newly defined O-01–O-08 operational dependencies have no corresponding test cases and acceptance matrix in the practical recovery test specification.

These findings must be resolved before asking reviewers to reassess F-03. No F-01–F-04 finding is closed by this audit.

## 2. Exact audited baselines

| Document | Git blob SHA at audited head |
|---|---|
| `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md` | `51c1bf7f11e3d0452d0e9db1ad1f567f0baf8a1a` |
| `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` | `5d76a8e91a88ab9a5377da52bdca1f8e14d2f2a4` |
| `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` | `948082dadac5aa0c3deb18a46da0821136071267` |
| `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md` | `2adb0f1c7cc17e400af44f2c5ce9513c76dc6bf3` |
| `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md` | `f84efc8c96b700baf3d4ca1ba436e37d99251544` |
| `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md` | `6b3e93e45c11c5897c9bc85e6d27cf07b26f56ac` |
| `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md` | `7a98725dc6b098cf2f9e19ce8c75e365b461b707` |

Git blob SHAs above are repository object identifiers, not SHA-256 file digests.

## 3. Findings

### AUD-XD-01 — Commit acknowledgement versus API success is ambiguous

**Severity:** HIGH  
**Affected sources:**
- F-01 §4 steps 7–9: Spanner commit is the logical commit point; “Acknowledge only after commit.”
- F-03 practical recovery specification v1.1.0 §26.1 step 6: “Acknowledge only after commit.”
- Core architecture v4 amendment §A3: authoritative ICW commit and projection application are distinct; return success only after receipt durability and projection verification.
- Server implementation specification §3.2: success only after durable ICW commit AND verified projection application; HTTP 202 is used when committed but projection-pending.

**Conflict:** “Acknowledge” is used without identifying the recipient or acknowledgement layer. It can mean (a) the Spanner/ICW transaction's authoritative commit result, (b) the service's internal receipt of that result, or (c) the client-facing API success response. The core contract distinguishes these. F-01/F-03 wording could be read as allowing client success as soon as Spanner commits, even if the projection is pending.

**Required correction:** Define separately:
1. **Witness commit:** successful Spanner transaction atomically inserts receipt/idempotency and advances head.
2. **Internal commit result:** the ICW caller learns the transaction committed; lost response is resolved by Spanner idempotency lookup.
3. **Client/API result:** success only after projection is applied and verified; if committed but projection-pending, return typed 202 and prohibit decision-serving/actionability.

F-01 and F-03 must use these exact terms consistently. Do not change the logical commit point.

**Status:** OPEN — wording correction required.

### AUD-XD-02 — S3 archive description conflicts with receipt authority decision

**Severity:** HIGH  
**Affected sources:**
- F-01 §2 calls S3 the “immutable envelope/receipt object archive”.
- F-01 §4 steps 4–6 describes a signed receipt candidate and insertion of an immutable receipt in the Spanner transaction.
- F-03 inventory v1.1.0 §6.1 and §6.5 says committed receipt/head/idempotency are authoritative in Spanner and the baseline does not require a second independently committed S3 receipt-byte archive.
- F-03 specification v1.1.0 §26.1 makes the same distinction.

**Conflict:** The phrase “envelope/receipt object archive” implies that S3 stores receipt objects as an archive, but the binding F-03 protocol says it does not require an S3 receipt-byte archive. The rest of F-01 appears to make Spanner the committed receipt authority. This terminology leaves the placement of exact signed receipt bytes unclear.

**Required correction:** Change F-01's description to “immutable canonical batch-envelope object archive”. Explicitly state that Spanner stores the exact committed signed receipt bytes/receipt record and is authoritative for receipt, head and idempotency. S3 stores the exact-version envelope object referenced by that receipt. Any second receipt-byte archive requires a separately versioned architecture decision.

**Status:** OPEN — terminology and receipt-byte placement must be made explicit.

### AUD-XD-03 — Legacy unqualified FULL status remains in the F-03 test specification

**Severity:** HIGH  
**Affected sources:**
- F-03 practical recovery specification §6 “Status aggregation” defines unqualified FULL.
- F-03 v1.1.0 §26.3 prohibits unqualified FULL and permits only FULL-L, FULL-C, FULL-D, FULL-O or FULL-A after all mandatory profile requirements pass.
- F-03 inventory v1.1.0 §6.2 defines the L/C/D/O/A profile mapping.

**Conflict:** The v1.1.0 supersession clause addresses topology and receipt-copy language, but does not explicitly retire the earlier §6 aggregate status vocabulary. A reader can encounter two different normative definitions of FULL.

**Required correction:** Add an explicit precedence statement that v1.1.0 §26.3 supersedes §6 “Status aggregation”. Retire unqualified FULL. Define any legacy labels (LEDGER_RECOVERED, CONTENT_RECOVERED, DECISION_HISTORY_RECOVERED) as descriptive intermediate states only; they must not imply profile acceptance unless mapped to the corresponding profile's full mandatory criteria. Only FULL-L/C/D/O/A may be used as successful complete recovery claims.

**Status:** OPEN — precedence and status mapping required.

### AUD-XD-04 — R03 exact receipt-byte recovery does not match the selected single-witness authority model

**Severity:** HIGH  
**Affected sources:**
- F-03 inventory v1.1.0 §6.1 row R03: Spanner committed receipt rows and authoritative head; no second S3 receipt archive.
- F-03 practical recovery specification §3, R03: “Fetch exact receipt bytes ... from independent witness copies”.
- F-01 §4 steps 4–6: receipt candidate is signed, then inserted in the Spanner transaction.
- Core architecture v4 §A2: each accepted batch has a unique witness transaction/receipt ID and signed receipt.

**Conflict:** The test says “independent witness copies” but the selected design has one logical Spanner witness, replicated within its provider service, and no independent receipt-byte archive. The inventory identifies Spanner rows as authoritative but does not expressly state that the exact signed receipt byte sequence is retained there. The recovery oracle for expected receipt completeness is also not the same thing as a second receipt store.

**Required correction:** Specify that the exact canonical signed receipt bytes (or a formally defined canonical serialization sufficient to reproduce those exact bytes) are stored in the Spanner committed receipt row. Recovery fetches them from Spanner using independent recovery credentials and verifies signature, row/transaction commit, sequence/head/idempotency and chain binding. Independent expected-truth anchors verify expected inventory/completeness; they are not alternative receipt authorities. Do not require “independent witness copies” unless a new architecture decision adds them.

**Status:** OPEN — receipt-byte representation and recovery path must be explicit.

### AUD-XD-05 — No R01–R30 to core requirement/test crosswalk

**Severity:** HIGH  
**Affected sources:**
- F-03 inventory v1.1.0 §6.2 maps R01–R30 to L/C/D/O/A profiles.
- F-03 practical recovery specification has class-specific R01–R30 tests and acceptance criteria.
- Core v4 requirement traceability matrix §2 maps AR-01–AR-15 to architecture/server obligations and test IDs; it contains no R01–R30 identifiers or crosswalk.
- Core test plan contains numbered tests but no explicit R01–R30 mapping.

**Gap:** The F-03 class inventory/profile matrix is not traceable to the core architecture requirements and their test oracles. It is therefore not possible to audit, from one matrix, whether each recovery class supports the relevant architecture guarantee, server obligation and test, or whether a class has no corresponding core requirement.

**Required correction:** Add a supplemental, versioned R01–R30 crosswalk to the traceability matrix or a linked companion matrix. For each class include: original class ID/label; relevant AR-01–AR-15 requirement(s); core architecture/server sections; F-03 class test section; core migration-test IDs where applicable; profile membership; objective evidence; and any gap/new requirement. Preserve R01–R30 definitions and existing AR/test identifiers. Mark proposed mappings as provisional until independently reviewed.

**Status:** OPEN — integrated traceability gap.

### AUD-XD-06 — Expected-truth anchor is not bound to a concrete update/acknowledgement protocol

**Severity:** HIGH / DESIGN DECISION REQUIRED  
**Affected sources:**
- F-03 specification v1.1.0 §26.2 and inventory §6.4 require an independent pre-disaster expected-truth anchor binding expected head, receipt inventory and S3 VersionIds. They defer owner, cadence, trust root and numeric independence criteria to the trust/parameter register.
- Core architecture v4 §§A5–A7 and §6.1 require an independently protected monotonic checkpoint anchor, but do not define this F-03 expected-truth package as the same artifact or a separate anchor.
- F-01 §5 lists trust roots, verifier and audit separation but does not identify the expected-truth anchor's owner, system, publication path or acknowledgement dependency.

**Gap:** The documents do not state whether the F-03 expected-truth anchor is the core monotonic checkpoint anchor, a separate source, or a composite. More importantly, its update cadence is not bound to acknowledgement semantics. If it is updated periodically after Spanner commits, a Spanner rollback could erase commits acknowledged after the last anchor. In that case the verifier cannot establish completeness relative to all acknowledgements since that anchor.

**Required correction / decision:** Define the anchor artifact, owner, writer, trust root, independent administrative domain, publication protocol and freshness/monotonicity rules. Explicitly decide whether a client-visible success acknowledgement waits for independent anchoring or whether the design accepts a bounded unanchored-to-oracle interval and therefore prohibits completeness-qualified FULL for that interval after a rollback. Bind the decision to approved RPO/RTO and threat model. Do not assume a numeric number of anchor providers without approval.

**Status:** OPEN — cannot be resolved by wording alone; architecture/threat-model decision required.

### AUD-XD-07 — R06 payload placement, envelope binding and lawful erasure are under-specified

**Severity:** HIGH / DESIGN DECISION REQUIRED  
**Affected sources:**
- Core architecture v4 §A2 requires the complete batch envelope or immutable object reference, including authoritative evidence/lineage payload bytes needed to reconstruct the batch.
- Core architecture v4 §A11 item 4 permits sensitive evidence content to be stored as encrypted immutable objects under separately controlled keys and lawfully erased by key destruction or approved object removal.
- F-01 §4 defines the S3 canonical-envelope archive but does not fully define separate R06 payload placement.
- F-03 inventory v1.1.0 §6.1 row R06 says “under approved storage design” without naming its authoritative locator, versioning, encryption/key binding or exact relation to the R04 envelope.
- F-03 profile matrix excludes R06 from L but requires it for C and scope-dependent D/A.

**Gap:** It is unclear whether R06 payload bytes are embedded in the R04 S3 envelope, stored as separate encrypted immutable objects, or both. The documents do not fully define which exact object/version/digest/key references the Spanner receipt commits to, how lawful erasure interacts with S3 Object Lock Compliance, or whether missing R06 content can leave L verified while preserving R04 batch reconstruction.

**Required correction / decision:** Define the object model: envelope metadata and ciphertext versus separately stored content objects; authoritative store and exact version for each; receipt-bound digests/locators; per-object/subject key lifecycle; erasure/tombstone proof; and which profile is downgraded by each missing object. Preserve the distinction between ledger integrity and content recovery without weakening the complete-batch requirement in core v4 §A2.

**Status:** OPEN — architecture and privacy/retention semantics required.

### AUD-XD-08 — O-01–O-08 operational profile has no corresponding test specification

**Severity:** HIGH  
**Affected sources:**
- F-03 inventory v1.1.0 §6.3 defines O-01–O-08 as mandatory for O/A and lists minimum evidence.
- F-03 practical recovery specification v1.1.0 §26.3 defines O — Operational restoration and refers to the inventory.
- The F-03 practical test specification's class-by-class tests cover R01–R30; its compound scenarios C01–C08 do not exercise the O-01–O-08 operational dependencies.
- Core v4 migration test plan and requirement traceability matrix focus on lifecycle, projection, checkpoint, snapshot and restore tests; they do not supply a complete O-profile clean-environment service restoration/cutover test suite.

**Gap:** The inventory requires O-01–O-08, but there is no per-class failure injection, detection, isolation, recovery, independent verification and objective acceptance criteria. A FULL-O or FULL-A claim would therefore be based on dependency listing rather than tested operational restoration.

**Required correction:** Add O-01–O-08 test cases, including identity/authorization bootstrap, network/DNS/TLS, reproducible runtime/build, secrets/HSM access, queues/workers and idempotency, monitoring/trusted time/audit export, projection/API/cache/downstream gating, cutover/rollback/old-writer fencing. Define negative assertions and a service-owner re-enable gate. Map each test to profile O/A and the traceability matrix.

**Status:** OPEN — operational recovery test coverage absent.

### AUD-XD-09 — F-03 practical specification inaccurately says the inventory source remains unchanged

**Severity:** MEDIUM  
**Affected source:** F-03 practical recovery specification §8 says the original inventory file “remains unchanged” and describes it as the preserved source, while the actual inventory file has been amended to v1.1.0 in this PR.

**Conflict:** The v1.0 baseline is preserved in Git history, but the current source inventory file is no longer unchanged. This also obscures which version controls the practical test specification.

**Required correction:** State that the v1.0 source blob is preserved in Git history, the current inventory file is v1.1.0, original R01–R30 class definitions remain unchanged, and the v1.1.0 inventory is the current normative companion. Update any version/hash binding accordingly.

**Status:** OPEN — documentary provenance correction.

### AUD-XD-10 — Stale topology wording remains outside the explicit supersession boundary

**Severity:** MEDIUM  
**Affected sources:**
- F-03 inventory §1 says “no selected/provisioned witness, dual-store object repository” despite the documentary candidate having been selected (though not provisioned).
- F-03 inventory §3 requires “primary and secondary exact object version/generation” fields.
- F-03 inventory §4 still contains MRSC metadata and “both stores” execution steps.
- F-03 practical specification §7 still says “dual-store object repository”.
- F-03 practical specification §6 compound scenario C01 describes R04 as missing “in one store”.

**Conflict:** Some historical procedure text is superseded by v1.1.0, but other wording is not clearly historical and continues to imply multiple object stores or a second copy. “Selected” is also conflated with “provisioned”.

**Required correction:** Distinguish: documentary candidate selected; no provider service provisioned; Spanner is transactional witness; S3 is exact-version envelope archive. Replace “primary/secondary” with authoritative locator plus optional separately approved replica locator. Rewrite C01 as “committed Spanner R03 receipt exists but the exact S3 R04 VersionId is missing/unavailable”. Mark legacy MRSC/both-store procedure text explicitly HISTORICAL / SUPERSEDED, not executable.

**Status:** OPEN — stale wording cleanup required.

### AUD-XD-11 — Profile-to-test and RPO/RTO traceability is incomplete

**Severity:** MEDIUM  
**Affected sources:** F-03 v1.1.0 profile definitions and test specification; core traceability matrix §§2, 4–7; core migration test plan.

**Gap:** The new L/C/D/O/A profile criteria, independent-anchor negative tests, O-profile restoration claims and measured RPO/RTO acceptance are not represented as explicit profile-level rows in the core traceability matrix. A test can pass at the individual class level without proving every mandatory dependency and profile aggregation rule.

**Required correction:** Add profile-level requirements and tests for FULL-L/C/D/O/A, denominator integrity, post-disaster scope-narrowing rejection, anchor rollback/replay/disagreement, and measured RPO/RTO. Tie each to exact F-03 test cases and required evidence. Keep BLOCKED/NOT RUN distinct from PASS.

**Status:** OPEN — profile acceptance crosswalk required.

## 4. Positive consistency results

The following areas are internally compatible at the documentary level:

1. **Transactional authority:** Core v4 §§A2–A3 and the F-01/F-03 candidate protocol consistently use one logical ICW/Spanner transaction for expected-head validation, receipt/idempotency insertion and head advancement.
2. **Object-before-commit ordering:** Core v4 §A2 requires an immutable object before receipt publication; F-01 §4 and F-03 v1.1.0 require S3 upload, exact-VersionId read-back and digest verification before Spanner commit.
3. **Abort/orphan behavior:** Core v4 §A2 and F-01/F-03 v1.1.0 agree that an object without a successful receipt commit is not accepted history.
4. **Projection semantics:** Core v4 architecture/server specification distinguishes authoritative witness commit from projection application. HTTP 202 is the correct pending state; client success requires verified projection.
5. **No database-only fallback:** Core architecture, server specification, test plan and traceability matrix consistently reject database-only reconstruction or re-signing.
6. **Lawful erasure distinction:** Core v4 and F-03 distinguish integrity/provenance verification from payload reconstruction; erased plaintext is not claimed as recovered.
7. **No operational acceptance claim:** F-01–F-04 remain open; the F-03 exercise is blocked/not run; no provider deployment or live recovery evidence is claimed.

## 5. Required correction order

Resolve in this order before reviewer reassessment:

1. AUD-XD-01 through AUD-XD-04: commit/API acknowledgement semantics, S3/Spanner receipt authority, FULL vocabulary, exact R03 receipt bytes.
2. AUD-XD-06 and AUD-XD-07: expected-truth anchor publication contract and R06 payload/erasure object model. These require explicit architecture/threat-model decisions; do not silently choose.
3. AUD-XD-05 and AUD-XD-11: R01–R30 / AR / test / profile traceability crosswalk.
4. AUD-XD-08: O-01–O-08 executable test specification and objective FULL-O/FULL-A gates.
5. AUD-XD-09 and AUD-XD-10: version provenance and stale historical wording cleanup.
6. Re-run this audit against a new immutable head and verify every finding's disposition. Only then commission independent reviewer retest.

## 6. Governance and authorization

- This audit is documentary analysis only.
- No finding is closed by this audit.
- F-01, F-02, F-03 and F-04 remain OPEN / NOT DEMONSTRATED.
- Overall disposition remains **HOLD — NOT ACCEPTED**.
- No implementation, procurement, infrastructure spend, migration, ingestion, deployment, live exercise, production authorization or PR merge is authorized.
- PR #34 must remain OPEN / DRAFT / UNMERGED.
- Any decision required by AUD-XD-06 or AUD-XD-07 must be explicitly approved and versioned before changing normative architecture text.
- The audit report itself does not amend or supersede any normative specification.
