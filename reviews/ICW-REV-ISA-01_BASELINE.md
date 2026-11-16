# ICW v4.2 — Documentary Assurance Examination

**Register ID:** ICW-REV-ISA-01  
**Reviewer:** Grok  
**Reviewer number:** Reviewer 05  
**Role / specialization:** Independent Systems Assurance Auditor  
**Review date:** 2026-11-16  
**Verdict:** FAIL  
**Evidence examined:** Frozen 12-document PDF archive conversion  
**Source status:** Structured archival transcription of the complete review supplied by the owner in conversation. It is not represented as a byte-for-byte source-file copy or independently hash-verified.

## 1. Executive verdict and scope

This package does not close F-01, F-02, F-03, or F-04. It also does not satisfy the charter's independence rule: a review by the design author, an implementer, or an AI assistant does not count. This is a documentary assurance examination of the frozen PDF only.

The register's decision to withhold implementation authorization is supported. Several stronger statements are not. The F-02 identity-provider selection is contradicted inside the package. The register still contains the superseded single-item CAS check. The authoritative F-03 procedure still requires DynamoDB MRSC and two object stores. The charter's required reading set is not the 12-document archive.

Candidate selection is not operational acceptance. Specified tests are not executed tests. Design text outside this PDF was not treated as evidence.

## 2. Source-order observations

The PDF is a 12-document archive conversion. The two F-03 files are not in dependency order, and not in the order named by the review charter.

| # | Filename | PDF pages |
|---|---|---|
| 01 | `ICW_F01_PROVIDER_EVALUATION_PRELIMINARY.md` | 2–6 |
| 02 | `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md` | 7–8 |
| 03 | `ICW_F02_INDEPENDENT_AUTHORITY_MODEL.md` | 9–13 |
| 04 | `ICW_F02_INDEPENDENT_AUTHORIZATION_AUTHORITY_DECISION.md` | 14–15 |
| 05 | `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` | 16–24 |
| 06 | `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` | 25–26 |
| 07 | `ICW_F04_CRYPTOGRAPHIC_TRUST_AND_KEY_CUSTODY_TEST_SPECIFICATION.md` | 27–32 |
| 08 | `ICW_F04_KEY_CUSTODY_AND_COMPROMISE_PLAN.md` | 33–34 |
| 09 | `ICW_MASTER_CLOSURE_REGISTER_BASELINE_01.md` | 35–36 |
| 10 | `ICW_V4_2_INDEPENDENT_REVIEW_CHARTER.md` | 37–38 |
| 11 | `ICW_V4_2_INDEPENDENT_REVIEW_RFP.md` | 39–40 |
| 12 | `ICW_V4_2_TRUST_CLOSURE_EXECUTION_STATUS.md` | 41 |

The practical recovery specification is document 05 and ends on page 24. The inventory it calls its baseline is document 06 and occupies pages 25–26. The charter on page 37 lists the inventory first and the practical specification second. The same reversal applies to F-04: the test specification (pages 27–32) precedes the custody plan it cites (pages 33–34). Wrapped PDF headings are line breaks, not different filenames.

No F-01 through F-04 item is demonstrated. None is marked ACCEPTED. That restraint is justified. The package is not internally consistent enough to issue as the review baseline.

## 3. Findings

### ISA-01 — Okta is both selected and unselected
- **Severity:** P1
- **Files:** F-02 authority model; F-02 authorization decision; master closure register; execution status.
- **Locations:** Authority model §12.6 (p.13); decision §§1 and 7 (pp.14–15); register F-02 row (p.35); execution status §1 (p.41).
- **Conflicting statements:** Authority model says Okta remains an unselected upstream identity-provider candidate. The decision says Okta is selected as upstream identity provider and ADS as issuer architecture. The register says Okta is unselected. Execution status says Okta Custom Authorization Server is selected.
- **Defect / impact:** Four controlling records disagree and no supersession line identifies the controlling record. Procurement, assertion-issuer design and the F-02 acceptance gate diverge.
- **State:** CONTRADICTED.
- **Correction:** One controlling amendment must select or leave Okta unselected; align the other three documents. Selection remains documentary until tenant, subscription and configuration export exist.
- **Closure test:** Traceability matrix maps one disposition to all four documents; no second disposition remains; no Okta organization is claimed to exist without an export.

### ISA-02 — Binding authorization contract omits head binding and tenant root
- **Severity:** P1
- **Files:** F-02 authority model; F-02 authorization decision.
- **Locations:** Model §§5 and 12.3–12.5 (pp.10, 12–13); decision §5 (p.14).
- **Defect:** The model requires a canonical request digest including expected current ICW receipt/head; assertion coverage includes tenant/ledger/epoch and expected ICW head; and the tenant root is the ultimate authority. The decision's required claims omit ledger, epoch, expected head, grant reference, TAR delegation and the tenant authorization root. These are different authorization contracts.
- **Impact:** An assertion can satisfy the decision document while failing replay, head and delegated-authority checks.
- **State:** CONTRADICTED.
- **Correction:** Publish one assertion schema. Include ledger, epoch, expected head, grant reference and TAR delegation, or explicitly revoke those requirements and dependent tests.
- **Closure test:** One signed schema hash is cited by both F-02 documents; field-level matrix accounts for every model §5 and §12.5 check.

### ISA-03 — Register reopens provider selection and restores single-item CAS
- **Severity:** P1
- **Files:** Master closure register; F-01 topology reconciliation decision.
- **Locations:** Register §§4–5 and F-01 row (pp.35–36); reconciliation §§2 and 4 (pp.7–8).
- **Defect:** Register §3 carries Spanner as sole primary candidate, while §§4–5 say no provider is selected and instruct reviewers not to assume a multi-item transaction across services. That single-item CAS constraint belongs to the superseded DynamoDB MRSC design. The reconciliation instead selects Spanner's read-write transaction to validate the expected head, insert receipt/idempotency record and advance the head atomically.
- **Impact:** A later review can reject the selected protocol using a superseded constraint or treat topology as undecided.
- **State:** CONTRADICTED.
- **Correction:** Replace register §§4–5 with checks for Spanner read-write transaction, external signing, exact S3 VersionId, orphan envelopes and lost acknowledgement. State explicitly that candidate selection is not production acceptance.
- **Closure test:** Register, reconciliation and F-01 amendment use one candidate and one commit primitive; no remaining instruction prefers single-item CAS for the selected baseline.

### ISA-04 — Authoritative recovery procedure still specifies MRSC and two object stores
- **Severity:** P1
- **Files:** F-03 recovery object inventory/exercise record; F-03 practical recovery test specification; F-01 topology reconciliation.
- **Locations:** Inventory §§1 and 4 (pp.25–26); practical spec §§1 and 7 and R03 (pp.16–17, 24); reconciliation §§2–3 (pp.7–8).
- **Defect:** The authoritative exercise still prepares MRSC and retrieves receipt/envelope versions from both stores, although the topology decision supersedes DynamoDB MRSC + S3 + GCS with Spanner receipts and S3 envelope upload. Inventory says no dual-store object repository exists; practical spec preserves the inventory unchanged. R03 still requires independent witness copies. The selected topology does not specify a second receipt-byte copy.
- **Impact:** A clean-room run following the authoritative procedure provisions the wrong system; following the selected topology leaves the second receipt-byte copy unspecified.
- **State:** CONTRADICTED; second receipt copy missing.
- **Correction:** Issue a versioned inventory amendment replacing MRSC and both-store language with Spanner receipt history plus exact S3 VersionId. Specify an independent receipt-byte copy and its trust boundary, or remove witness-copy and receipt-archive claims.
- **Closure test:** Amended inventory names only Spanner and S3 Object Lock; object-placement matrix specifies receipt bytes, envelope bytes and head row writes/readback/recovery; practical-spec baseline hash recomputed.

### ISA-05 — Frozen archive is not the charter's review baseline
- **Severity:** P1
- **Files:** Review charter; package cover; master closure register.
- **Locations:** Charter §2 (p.37); cover (p.1); register §5 (p.36).
- **Defect:** Charter requires four core v4 contracts/traceability artifacts and the provisional topology document, none present in the 12-document PDF. Charter also omits the F-02 authorization decision that is in the archive and contains the Okta contradiction. Register says consistency review of the normative documents and traceability matrix is still required.
- **Impact:** Reviewer cannot perform the mandated system-contract review from the supplied PDF; following charter can miss the F-02 decision.
- **State:** MISSING.
- **Correction:** Freeze one manifest listing every normative file, hash and in-force/historical/superseded status. Include F-02 decision or withdraw it. Include all required core contracts or stop claiming they were reviewed.
- **Closure test:** Every charter-required file is present, hashed and classified; every archive file is on the manifest; second person reconciles both lists.

### ISA-06 — F-01 and F-02 closure labels differ across controlling records
- **Severity:** P2
- **Files:** F-01 preliminary; reconciliation; register; execution status; F-02 decision.
- **Locations:** Preliminary §§9–11 (pp.4–6); reconciliation §8 (p.8); register §3 (p.35); execution status §1 (p.41).
- **Defect:** Same F-01 file says BLOCKED and OPEN / NOT DEMONSTRATED. Register says CANDIDATE SELECTED FOR REVIEW / BLOCKED — NOT DEMONSTRATED; execution status says CANDIDATE SELECTED FOR REVIEW / OPEN — NOT DEMONSTRATED. Register vocabulary defines DESIGN-RESOLVED, PROVISIONAL, BLOCKED, NOT RUN and ACCEPTED, while OPEN, CANDIDATE SELECTED and SPECIFICATION DEFINED are undefined. F-02 similarly alternates BLOCKED and OPEN / NOT DEMONSTRATED.
- **Impact:** Status dashboard may imply an item is merely open rather than blocked on missing closure evidence.
- **State:** CONTRADICTED; underlying not-demonstrated conclusion is consistent.
- **Correction:** Use only register vocabulary and map every current label once.
- **Closure test:** F-01/F-02 each have one defined status token repeated unchanged across controlling records.

### ISA-07 — F-04 contains stale parameter blocker and ambiguous quorum rule
- **Severity:** P2
- **Files:** F-04 cryptographic trust/key custody test specification; F-04 key custody/compromise plan.
- **Locations:** Test spec §2.3 and F04-T05 (pp.27–28, 30); plan §3 and amendment §8.2 (pp.33–34).
- **Defect:** T05 says blocked until exact algorithm parameters are selected, although §2.3 selects ES256, SHA-256, RFC 8785 and AES-256-GCM as documentary baseline. Plan §3 says two-person approval for sensitive use; amendment §8.2 says routine receipt/ADS signing is not manually approved for every transaction, without explicit supersession.
- **Impact:** Algorithm selection can be misreported unfinished or ordinary receipt signing can be subjected to conflicting quorum interpretations. Live custody evidence remains absent.
- **State:** CONTRADICTED on blocker; live custody missing.
- **Correction:** Change T05 blocker to absence of two independent vector implementations and verified HSM mechanism; explicitly supersede plan §3 signing sentence or restore per-signature dual control.
- **Closure test:** One quorum matrix identifies service-signed versus 2-of-3 operations; T05 no longer says parameters are unselected; execution remains NOT RUN until §8 evidence checklist exists.

### ISA-08 — Irreversible retention is applied before commit point
- **Severity:** P2
- **Files:** F-01 topology reconciliation; F-01 provider evaluation preliminary.
- **Locations:** Reconciliation §4 step 2 and §7 (pp.7–8); preliminary §§2 and 8 (pp.2, 4).
- **Defect:** Envelope bytes are uploaded to S3 with Versioning and Object Lock Compliance retention before Spanner transaction. Failed/aborted transactions leave orphan S3 objects; Compliance retention is irreversible for the locked version during retention. No retention duration may be set until legal basis is approved, but no pre-commit exception, legal-hold distinction, erasure path or orphan disposition is specified.
- **Impact:** Failed retries, rejected batches and mistaken submissions can become undeletable evidence with undefined legal status; this conflicts with F-03 R08/R30.
- **State:** SPECIFIED PROTOCOL; LAWFUL ORPHAN DISPOSITION MISSING.
- **Correction:** Define pre-acceptance object state. Either defer Compliance retention until after Spanner commit or specify reviewed disposition for locked orphans that are not accepted receipts.
- **Closure test:** Failure matrix covers crash-before-upload, crash-after-upload, transaction abort and lost acknowledgement, with lock state, legal classification and plaintext erasure outcome; no irreversible object has undefined legal status.

### ISA-09 — DESIGN-RESOLVED claims and numbered acceptance tests are outside package
- **Severity:** P2
- **Files:** Master closure register; F-02 decision; execution status.
- **Locations:** Register §§1 and 3 (p.35); decision §6 (pp.14–15); execution status §2 (p.41).
- **Defect:** Register says v4 is materially stronger than v3 and marks F-05–F-08 DESIGN-RESOLVED / NOT RUN, including “Object-before-anchor/CAS.” Archive contains no v3 comparison, F-05–F-08 specifications or procedures for tests 188–220. F-02 decision requires tests 197–204; execution status says no tests 188–220 executed.
- **Impact:** Design-resolution claims exceed frozen evidence; F-05 CAS shorthand may refer to superseded primitive but cannot be confirmed from missing source.
- **State:** MISSING / NOT EXAMINABLE IN THIS BASELINE, not demonstrated false.
- **Correction:** Attach cited specifications and test procedures with hashes or mark F-05–F-08 NOT EXAMINABLE IN THIS BASELINE; remove v3 comparison or attach evidence.
- **Closure test:** Every DESIGN-RESOLVED row cites a hashed section; all named tests resolve to procedures and remain NOT RUN until execution record exists.

### ISA-10 — Acceptance gates require evidence their prerequisites forbid producing
- **Severity:** P2
- **Files:** Register; F-01 preliminary; F-03 practical spec; F-04 test spec; execution status.
- **Locations:** Register §6 (p.36); preliminary §6 item 6 (p.3); practical spec §7 (p.24); F-04 §1 (p.27); execution status §3 gates 3 and 11 (p.41).
- **Defect:** Acceptance requires real services and tests; F-03 live run requires F-01 stores, F-02 issuer and F-04 custody; F-04 acceptance requires F-01/F-02 evidence. Execution status allows non-production infrastructure only after explicit authorization, but register and F-01 still tie that stage to prior acceptance or completed verifier.
- **Impact:** Team may stall without lawful evidence path or provision infrastructure by treating documentary candidate as accepted.
- **State:** SPECIFIED GATES; SEQUENCING EXCEPTION CONTRADICTED.
- **Correction:** Authorize a named non-production evidence stage that cannot produce ACCEPTED. Sequence account ownership, crypto compatibility, synthetic verifier, then fault injection. Keep production authorization behind separate gate.
- **Closure test:** Gate diagram is acyclic; each gate states authorization and forbidden status token; F-01–F-04 remain not ACCEPTED after non-production stage absent required live evidence.

### ISA-11 — Per-document integrity pins and section identities are unreliable
- **Severity:** P3
- **Files:** F-03 practical spec; F-04 test spec; F-01 preliminary; package cover.
- **Locations:** Practical spec header (p.16); F-04 header (p.27); preliminary §§9–11 (pp.4–6); cover (p.1).
- **Defect:** Two baseline blob digests are 40 hex characters without stated algorithm; only archive hash is explicitly SHA-256. F-01 has two sections numbered 9 and second follows section 11. Companion documents precede the files they pin.
- **Impact:** Later edits can evade detection and citations can point to ambiguous sections.
- **State:** MISSING VERIFICATION; NO HASH MISMATCH DEMONSTRATED.
- **Correction:** State hash algorithm, pin each source file, renumber F-01 and order each baseline before companion.
- **Closure test:** Recompute every pinned digest from original archive members and record match/mismatch; section numbers unique.

## 4. Cross-document traceability gaps

- F-02 has no supersession pointer between authority model §12 and authorization decision; register follows model while execution status follows decision.
- F-03 practical specification pins inventory, but inventory retains superseded topology; preservation was treated as reason not to amend a contradictory procedure.
- F-04 test spec pins a plan hash while plan includes a later normative amendment; hashed bytes are unspecified.
- F-01 ten-item acceptance list omits separate CloudHSM account and ADS HSM owner required by reconciliation; HSM cost is unestimated.
- Register §5 consistency check against core contracts/traceability matrix has no evidence result.
- Tests 197–204 and 188–220 have no procedure, oracle or artifact in archive.
- F-04 T01–T12 are specified and NOT RUN, not custody evidence.
- Exercise controller, recovery operator, independent verifier, ADS operator, TAR approver and HSM custodian are unassigned; role separation is specified, not evidenced.

## 5. Unresolved questions

1. Which record controls Okta: unselected or selected?
2. Is tenant authorization root mandatory for first implementation, and where is enrollment evidence stored?
3. Are receipt bytes stored only in Spanner or is independent receipt copy required; who administers it?
4. What is Object Lock disposition of envelope whose Spanner transaction aborts?
5. Which AWS accounts exist: application, S3 archive, ICW CloudHSM and separate ADS HSM, or fewer with claimed role separation?
6. Does “sensitive use” include ordinary receipt signing?
7. Where are four core v4 contracts, traceability matrix and superseded topology, and which hashes were offered?
8. Which numeric assertion lifetime, clock skew, RPO/RTO, TSA disagreement tolerance and retention period will be pinned?
9. Who are distinct legal owners/humans for tenant authority, ADS, Spanner, S3, HSM and break-glass; can one super-admin control multiple?
10. Can F-05 “object-before-anchor/CAS” wording survive after Spanner transaction becomes commit primitive?

## 6. Closure judgment

| Item | Package claim | Grok judgment |
|---|---|---|
| F-01 | Candidate selected for review; not demonstrated; labels alternate BLOCKED/OPEN | Non-acceptance justified; candidate selection documentary only; register §§4–5 do not faithfully reflect it |
| F-02 | Ownership model decided; acceptance blocked; Okta selected and unselected | Non-acceptance justified; selection and assertion-contract claims are not |
| F-03 | Specification defined; live exercise not run | Not-run justified; authoritative procedure is not fit to selected topology |
| F-04 | Crypto policy v1 selected on paper; no key/HSM/custodian/test | Non-acceptance justified; stale T05 contradicts selected suite |
| Register | Hold implementation; no finding ACCEPTED | Hold supported; F-05–F-08 DESIGN-RESOLVED and v3 comparison exceed package |
| Execution status | F-01–F-04 open; authorization withheld | Withhold supported; F-02 Okta sentence exceeds register and authority model |

## 7. Final recommendation

**FAIL.** Do not authorize production, procurement, account creation or external review engagement on this archive until ISA-01 through ISA-05 are corrected and the manifest in ISA-05 matches the bytes to be reviewed. Operational closure of F-01 through F-04 is additionally NOT DEMONSTRATED. Correcting contradictions still would not justify ACCEPTED.

## 8. Consolidation metadata and limitations

- Original source identifiers ISA-01–ISA-11 and severities P1/P2/P3 are preserved exactly.
- This is a documentary review of the frozen PDF only; no live provider, account, key, HSM, API or test execution was examined.
- Grok's FAIL is a reviewer disposition, not an independent human assurance opinion and not a production authorization decision.
- Reviewer baseline is an archival transcription of the report supplied in conversation; no byte-identical attachment or source-file hash is claimed.
