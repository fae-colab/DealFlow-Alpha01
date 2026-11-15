# ICW v4.2 — Independent Architecture, Cryptography and Recovery Review Charter

**Date:** 2026-11-15  
**Review status:** READY TO ISSUE / REVIEWER NOT YET ENGAGED  
**Baseline branch:** `docs/icw-v4-2-evidence-closure`  
**Purpose:** Commission a genuinely independent, evidence-based review of the complete v4.2 system contract before any implementation authorization.

## 1. Independence requirement

The reviewer must be an external individual or firm with demonstrated expertise in distributed systems consistency, cloud security/IAM, applied cryptography/key management, immutable storage, disaster recovery and secure software architecture.

The reviewer must:
- have had no authorship or material design influence over the reviewed documents;
- disclose financial, vendor, employment and personal conflicts;
- not be the implementer, provider salesperson or person responsible for the design decisions;
- receive the exact immutable baseline commit and document hashes;
- conduct their own analysis rather than rely on prior AI reviews or summaries;
- provide a signed report identifying reviewer identity, qualifications, scope, methods, evidence inspected, limitations and findings.

A review performed by the design author, ChatGPT, a cloud provider's sales team or an implementer alone does not satisfy this requirement.

## 2. Review baseline — complete document set

The reviewer must read the following documents as one integrated contract, not as isolated documents:

### Core v4 system contract
1. `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md`
2. `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md`
3. `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md`
4. `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md`

### Trust closure and governance
5. `ICW_MASTER_CLOSURE_REGISTER_BASELINE_01.md`
6. `ICW_V4_2_TRUST_CLOSURE_EXECUTION_STATUS.md`
7. `ICW_F01_PROVIDER_EVALUATION_PRELIMINARY.md`
8. `ICW_F01_PROVIDER_EVALUATION_AND_PROVISIONAL_TOPOLOGY.md` (historical proposal; read with supersession notice)
9. `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md`
10. `ICW_F02_INDEPENDENT_AUTHORITY_MODEL.md`
11. `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md`
12. `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md`
13. `ICW_F04_KEY_CUSTODY_AND_COMPROMISE_PLAN.md`
14. `ICW_F04_CRYPTOGRAPHIC_TRUST_AND_KEY_CUSTODY_TEST_SPECIFICATION.md`

The reviewer must identify any other normative v4.2 document or referenced artifact in the branch that materially affects these guarantees. Historical v2/v3 artifacts may be consulted to understand change history, but v4 is the normative architecture where supersession is stated.

## 3. Mandatory review questions

### A. System contract and commit correctness
- Is there one unambiguous logical commit point?
- Are receipt, head, idempotency identity and exact envelope references atomically bound?
- Are all retry, timeout, duplicate, concurrency, partial failure and crash-after-ack cases safe?
- Can a malicious or accidental rollback produce an apparently valid history?
- Does an independently anchored checkpoint authenticate only its stated prefix, and is every post-checkpoint commit independently authenticated?
- Can any unanchored tail, DB-only fallback, stale checkpoint or locally reconstructed receipt be accepted?

### B. F-01 topology
- Does Spanner + S3 exactly satisfy the current contract, including transaction retries and external signing side effects?
- Are exact S3 VersionIds, Object Lock Compliance retention, orphan objects, idempotency and recovery handled correctly?
- Are provider/account/organization/root/support/break-glass paths genuinely independent?
- Are costs, contractual limits, data residency, retention and legal erasure honestly represented?
- Is any residual provider-control-plane compromise outside the stated threat model?

### C. F-02 authority
- Is tenant ownership the ultimate authority?
- Can ADS or the upstream identity provider expand tenant grants or bypass revocation?
- Are TAR enrollment, rotation, delegation, assertion freshness, audience, replay and recovery sufficiently specified?
- Are the proposed legal and human roles independently controlled?

### D. F-03 recovery
- Are original R01–R30 classes all preserved and complete?
- Does each class have meaningful injection, detection, isolation, recovery, independent verification and objective acceptance criteria?
- Are compound failure scenarios and the clean-room boundary sufficient?
- Does the report distinguish ledger, content, provenance, semantic reconstruction and recomputation?
- Are missing, erased and unavailable objects handled without falsely declaring FULL recovery?

### E. F-04 cryptographic trust and custody
- Is `DF-ICW-CRYPTO-v1` internally correct and compatible with the proposed HSM and signature formats?
- Are ES256/P-256/SHA-256, fixed-width low-S encoding, RFC 8785 JCS, domain separation and AES-256-GCM correctly specified?
- Are two RFC 3161 TSA tokens used with defensible validation, revocation and disagreement handling?
- Does HSM quorum cover the intended administrative actions without requiring manual approval for each routine receipt?
- Are ICW, ADS, tenant TAR, trust-root/policy and recovery-manifest keys properly separated?
- Are key rotation, historical verification, compromise intervals, backup/restore and key destruction internally consistent?
- Does the actual CloudHSM service/firmware/SDK support every selected mechanism and required quorum control?

### F. Cross-document consistency and claims
- Find contradictory normative statements, stale provider choices, undefined terms, circular dependencies, missing ownership or test oracles.
- Check every security claim against explicit assumptions and observable evidence.
- Separate design resolution, vendor documentation, synthetic tests, live tests and independently verified results.
- Identify any claim that must be narrowed or withdrawn.

## 4. Required review method and deliverables

The reviewer must provide:
1. A document-by-document finding matrix with exact file, section and line references.
2. A system-level threat model and trust-boundary diagram.
3. A protocol-level walkthrough of commit, retry, recovery, key rotation and compromise.
4. A testability assessment of every normative guarantee and F-01 through F-04 closure test.
5. A contradiction/omission register with severity and affected claim.
6. An explicit list of blocking findings, non-blocking findings, assumptions and residual risks.
7. A recommended disposition for each F-01–F-04 finding: ACCEPTED, ACCEPTED WITH LIMITATIONS, OPEN or REJECTED.
8. A signed overall conclusion: suitable for implementation planning, requires documentary revision, or not suitable.
9. A retest report after any amendments.

No finding may be marked closed solely because the document says it is closed. No operational guarantee can be accepted without operational evidence.

## 5. Reviewer access and evidence boundary

At this stage, only the documentation baseline and public vendor/standards references exist. No provider accounts, IAM exports, keys, receipts, HSM backups, recovery environment or live test logs exist. The reviewer must explicitly state which conclusions are documentary only and which require later live validation.

Do not provide credentials, private keys, personal data or production secrets. No infrastructure access is available or authorized.

## 6. Procurement and authorization gate

No reviewer has been contacted or appointed under this charter. No budget or fee is approved. The owner must approve the reviewer, scope, fee, confidentiality terms and any disclosure beyond the repository before an engagement is entered.

Candidate firms previously screened at a preliminary public-service-description level: NCC Group, Trail of Bits and Bishop Fox. This is not a ranking, endorsement, availability check or evidence that any firm has agreed to perform the work. Obtain comparable written scopes and fees before selection.

**Commissioning status: REVIEW PACKAGE PREPARED; EXTERNAL ENGAGEMENT NOT YET EXECUTED.**
