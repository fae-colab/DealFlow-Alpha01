# ICW v4.2 — Cross-Document Consistency Audit 02

**Audit date:** 2026-11-16  
**Audit ID:** ICW-AUD-XDOC-02  
**Audited repository:** `fae-colab/DealFlow-Alpha01`  
**Audited PR:** #34  
**Audited branch:** `review/icw-v4-2-copilot-dr-review`  
**Audited head commit:** `f2c0176d6e8d3955e7836ee9d17e7b87f8b0fc72`  
**Prior audit:** ICW-AUD-XDOC-01, audited head `38e202907a4825a64fdb2553e5e54af2bed325db`  
**Audit type:** Documentary cross-document consistency audit. No provider-backed execution, operational recovery, implementation or production validation.

## 1. Executive result

**RESULT: FAIL — MATERIAL DOCUMENTARY CONTRADICTIONS CORRECTED, BUT TWO HIGH-SEVERITY ARCHITECTURE DECISIONS REMAIN OPEN.**

The correction sequence was applied to the normative F-01/F-03 records and the core traceability/test documents. Findings AUD-XD-01 through AUD-XD-04, AUD-XD-08 through AUD-XD-10 have documentary corrections. AUD-XD-05 and AUD-XD-11 now have a versioned supplemental crosswalk and profile-level test mapping; the mappings are explicitly provisional pending independent review.

**AUD-XD-06 and AUD-XD-07 remain OPEN / DESIGN AUTHORITY DECISION REQUIRED.** They cannot be closed by wording edits or by this audit. Consequently, the integrated document set is not yet ready for a clean independent reassessment or implementation authorization. Do not request reviewer retesting yet.

This audit does not close F-01, F-02, F-03 or F-04. Overall disposition remains **HOLD — NOT ACCEPTED**.

## 2. Exact audited baselines

Git blob SHAs are Git object identifiers, not SHA-256 file digests.

| Document | Blob SHA at audited head |
|---|---|
| `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md` | `abeb744503968f3d79e82b898bcfb8e164120616` |
| `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` | `560aaad460664a3007192275f01aebacae503087` |
| `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` | `e15d1c3a9aab98777822302665d17da1c588ba68` |
| `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md` | `2adb0f1c7cc17e400af44f2c5ce9513c76dc6bf3` |
| `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md` | `f84efc8c96b700baf3d4ca1ba436e37d99251544` |
| `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md` | `809be6a2c6af514668c935b8dfd14ae29f96a48b` |
| `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md` | `99dcbb3fbdbd628d949622a21e47d2d6973a7939` |
| `reviews/ICW_V4_2_NORMATIVE_RECONCILIATION_AND_OBJECTIVE_CLOSURE.md` | `bd7bc7980bc8955e1225811ebc68669281204711` |

The four core v4 specification files were re-read and their blobs remain unchanged from the prior audit. The F-03 practical specification is v1.1.1 and binds to inventory v1.1.1 blob `e15d1c3a9aab98777822302665d17da1c588ba68`. The v1.0 inventory baseline remains preserved in Git history.

## 3. Finding-by-finding disposition

### AUD-XD-01 — Commit acknowledgement versus API success

**Disposition: DOCUMENTARY CORRECTION APPLIED.**

F-01 now distinguishes (1) Spanner witness commit, (2) internal commit-result resolution through idempotency lookup, and (3) client/API success after the complete projection transaction is applied and verified. A committed-but-projection-pending operation returns typed HTTP 202 and is not decision-serving/actionable. F-03 §27.1 repeats the distinction. Core v4 architecture/server projection semantics remain consistent. No live behavior is demonstrated.

### AUD-XD-02 — S3 archive versus Spanner receipt authority

**Disposition: DOCUMENTARY CORRECTION APPLIED.**

F-01 and F-03 now explicitly state that Spanner stores the exact canonical signed receipt bytes (or a formally defined exact canonical representation), receipt record, idempotency identity and authoritative head transition. S3 stores the exact-version canonical batch envelope only. A second receipt archive requires a separate versioned decision and is not assumed.

### AUD-XD-03 — Legacy unqualified FULL vocabulary

**Disposition: DOCUMENTARY CORRECTION APPLIED.**

The legacy §6 aggregation labels are explicitly descriptive intermediate states only. F-03 §27.3 expressly supersedes legacy §6 and prohibits unqualified FULL. Only FULL-L, FULL-C, FULL-D, FULL-O and FULL-A are complete-profile claims, subject to mandatory denominator and evidence gates.

### AUD-XD-04 — R03 exact receipt-byte recovery

**Disposition: DOCUMENTARY CORRECTION APPLIED.**

F-03 R03 recovery now reads the exact signed receipt bytes/representation from the committed Spanner row using independently issued recovery credentials. It verifies commit/transaction identity, receipt identity, sequence, head transition, idempotency, signature and chain binding. The expected-truth anchor is defined as a completeness oracle, not an alternate receipt authority. “Independent witness copies” is removed as a recovery requirement.

### AUD-XD-05 — R01–R30 to AR/test crosswalk

**Disposition: SUPPLEMENTAL CROSSWALK ADDED; PROVISIONAL PENDING INDEPENDENT REVIEW.**

Traceability matrix §12 now contains 30 individual R01–R30 rows, proposed AR mappings, architecture/server loci, F-03 test IDs, existing core test references, profile membership, objective evidence and mapping caveats. O-01–O-08 and FULL-L/C/D/O/A profile-level rows are also mapped. No existing AR or core test IDs were renumbered or replaced. The mapping is explicitly PROPOSED / PROVISIONAL; independent reviewers must validate over-broad, missing or incorrect mappings before treating this finding as fully accepted.

### AUD-XD-06 — Expected-truth anchor update/acknowledgement contract

**Disposition: OPEN — DESIGN AUTHORITY DECISION REQUIRED.**

No decision was silently invented. The documents explicitly leave open:
- whether the F-03 expected-truth anchor is the core monotonic checkpoint anchor, a separate source or a composite;
- owner/writer, trust root and independent administrative domain;
- publication protocol, cadence, freshness and monotonicity;
- whether client-visible success waits for independent anchor coverage, or a bounded interval is accepted with completeness-qualified FULL prohibited for uncovered commits after rollback;
- binding to the threat model and approved numeric RPO/RTO.

The threat is unchanged: a rollback can erase committed history after the last independently published expected-truth position. Until an approved versioned contract resolves this, completeness for the uncovered interval cannot be claimed.

### AUD-XD-07 — R06 payload placement and lawful erasure

**Disposition: OPEN — ARCHITECTURE AND PRIVACY DECISION REQUIRED.**

No storage or legal exception was silently selected. The documents leave open whether R06 bytes are embedded in R04 or separately stored as encrypted immutable objects, and require a future decision to bind exact locators/versions/digests/key references, per-object/subject key lifecycle, Object Lock/retention compatibility, erasure/tombstone evidence and profile downgrade consequences. R06 content recovery is BLOCKED wherever those details are required. Ledger integrity is not represented as content reconstruction.

### AUD-XD-08 — O-01–O-08 operational test coverage

**Disposition: TEST SPECIFICATION ADDED; EXECUTION NOT RUN.**

F-03 §27.4 now defines F03-O-01 through F03-O-08 with fault injection, detection, isolation, recovery, independent verification and negative assertions for identity/IAM, network/DNS/TLS, runtime/build, secrets/HSM, queues/workers, monitoring/time/audit, projection/API/cache/downstream gating, and cutover/rollback/old-writer fencing. FULL-O and FULL-A gates require these dependencies to pass or be independently approved NOT_APPLICABLE. Core migration test plan §22 links these tests without renumbering existing tests. All are TESTS DEFINED / NOT RUN; operational restoration is not proven.

### AUD-XD-09 — Inventory version provenance

**Disposition: DOCUMENTARY CORRECTION APPLIED.**

The F-03 practical specification now states that the v1.0 inventory blob is preserved in Git history, inventory v1.1.1 is the current normative companion, and original R01–R30 class definitions remain unchanged. The practical specification header and §8 bind to the exact v1.1.1 inventory blob.

### AUD-XD-10 — Stale topology and historical procedure wording

**Disposition: DOCUMENTARY CORRECTION APPLIED.**

The inventory distinguishes candidate selection from provisioning: Spanner/S3 is selected at documentary candidate level only; no provider service is provisioned. Current object manifests use one authoritative locator/version and an optional separately approved replica locator, not presumed primary/secondary stores. Legacy MRSC/two-store/both-stores procedures are explicitly HISTORICAL / SUPERSEDED — NOT EXECUTABLE. C01 now states that a committed Spanner R03 receipt exists but its exact referenced S3 R04 VersionId is missing/unavailable.

### AUD-XD-11 — Profile-level acceptance and RPO/RTO traceability

**Disposition: PROFILE TEST/CROSSWALK ADDED; EXECUTION NOT RUN.**

Traceability matrix §12.2 and F-03 §27.5 define FULL-L/C/D/O/A gates, denominator integrity, scope-narrowing rejection, anchor rollback/replay/conflict tests, and measured RPO/RTO tests. Missing approved numeric targets or trusted time makes RPO/RTO acceptance BLOCKED. The crosswalk is provisional pending independent review.

## 4. Cross-document consistency checks

The following documentary invariants were rechecked against F-01, both F-03 v1.1.1 documents and all four core v4 specifications:

1. Spanner is the sole logical receipt/head/idempotency commit authority in the selected candidate.
2. S3 exact-version envelope upload/read-back/digest verification precedes Spanner commit.
3. An S3 object without a committed Spanner receipt is an orphan, not accepted history.
4. The exact receipt representation is stored in Spanner; S3 is not implicitly a second receipt archive.
5. Witness commit, internal commit result and client/API success are distinct; projection-pending is typed 202 and non-actionable.
6. R03 recovery does not depend on unspecified independent witness copies.
7. Legacy unqualified FULL is retired; profile-qualified FULL-L/C/D/O/A alone express complete recovery.
8. All R01–R30 classes remain represented; the supplemental crosswalk does not renumber existing identifiers.
9. O-01–O-08 have individual test definitions and profile gates; test execution remains NOT RUN.
10. Legacy MRSC/two-store procedures are historical/superseded, and selected topology is not described as provisioned.
11. RPO/RTO targets must be approved before execution; missing targets/time evidence block acceptance.
12. AUD-XD-06 and AUD-XD-07 remain explicit decision gates rather than assumed design facts.

The four core v4 documents were not edited in this correction sequence. Their unchanged baseline blobs were inspected as compatibility references. This is not a proof of provider semantics, cryptographic assurance, actual recovery, legal compliance or service restoration.

## 5. Remaining blockers and required next steps

1. Obtain an explicit architecture-authority decision for AUD-XD-06, then update and version all affected normative documents and tests.
2. Obtain an explicit architecture/privacy/legal decision for AUD-XD-07, then update and version all affected normative documents and tests.
3. Have independent reviewers validate the proposed R01–R30/AR/core-test/profile mappings.
4. After those decisions, rerun a focused cross-document audit and then commission independent reviewer reassessment.
5. Separately obtain provider-backed tests, independent expected-truth evidence, approved RPO/RTO, cryptographic/key-custody evidence and operational recovery evidence before any F-01–F-04 closure.

## 6. Governance and authorization

- Audit 02 is documentary only.
- No F-01, F-02, F-03 or F-04 finding is closed by this audit.
- F-01 through F-04 remain **OPEN / NOT DEMONSTRATED**.
- Overall disposition remains **HOLD — NOT ACCEPTED**.
- No provider provisioning, procurement, infrastructure spend, implementation, migration, evidence ingestion, deployment, live recovery exercise, production authorization or PR merge is authorized.
- PR #34 remains **OPEN / DRAFT / UNMERGED**.
- Do not request independent reviewer reassessment until AUD-XD-06 and AUD-XD-07 have explicit approved decisions and the provisional crosswalk has been independently validated.
