# ICW v4.2 — Distributed Systems and Infrastructure: Independent Technical Review

**Register ID:** ICW-REV-DSI-01  
**Reviewer:** Gemini  
**Role / specialization:** Distributed Systems and Infrastructure Reviewer  
**Review date:** 2026-11-16  
**Source status:** Structured archival transcription of the review supplied by the owner in conversation. It is not represented as byte-for-byte source-file preservation or independently hash-verified.

## 1. Executive Verdict

- **Final Outcome:** **CONDITIONAL PASS** (for architectural design progression and test planning).
- **Production Deployment Status:** **WITHHELD / BLOCKED**.
- **Summary Evaluation:** The ICW v4.2 architecture is conceptually rigorous, structurally sound, and represents a major distributed-systems hardening over prior versions by cleanly separating the immutable witness ledger from application projection databases. However, because all core components—including transactional witness consensus, independent authority coordination, clean-room recovery, and cryptographic key custody—remain strictly at a documentary and specification stage with zero operational execution, live provisioning, or cryptographic ceremonies performed, approval is limited exclusively to independent review progression and test framework validation.

## 2. Scope, Baseline, and Review Limitations

- **Review Scope:** Independent technical assessment of the ICW v4.2 frozen document package (ICW_v4_2_Frozen_Review_Package.pdf, converted from archive ICW_V4_2; source archive SHA-256: `da076ad6b46d51152b262619b71e4238f58252757d3de629447c94167ec580ba`).
- **Normative Baseline:** Comprises 12 core documents, including provider evaluation records, topology reconciliation decisions, independent authority trust models, recovery test specifications (R01–R30), cryptographic trust policies (`DF-ICW-CRYPTO-v1`), master closure registers, and review charters.
- **Review Limitations:** The review is strictly documentary. No provider accounts, cloud IAM policies, HSM clusters, live APIs, or cryptographic keys exist. All evaluations of durability, fault tolerance, and recovery are classified as *Specified* or *Assumed* rather than *Demonstrated*.

## 3. Reconstructed System Architecture

- **Topology:** A multi-cloud split architecture utilizing **Google Cloud Spanner** (multi-region Enterprise Plus) as the transactional witness ledger and authoritative head sequencer, paired with **AWS S3 Object Lock Compliance Mode** as the immutable, separately administered envelope/receipt object archive.
- **Trust & Operational Boundaries:** Clear segregation established between DealFlow application/relational database operators, the Authorization Decision Service (ADS) security control plane, the tenant authorization root (TAR), and the ICW witness ledger.
- **Critical Execution Paths:**
  1. Canonicalization and SHA-256 digestion of batch envelopes under `DF-ICW-CRYPTO-v1`.
  2. Upload of immutable bytes to AWS S3 with Object Lock Compliance retention, pinning exact `VersionId` and digests.
  3. Independent authorization verification via signed, request-bound ADS assertions.
  4. Execution of a single Spanner serializable read-write transaction validating expected head, inserting receipt/idempotency records, and advancing the head atomically.
  5. Client acknowledgement issued strictly post-commit.

## 4. Component and Dependency Assessment

| Component / Service | Primary Responsibility | Trust & Operational Boundary | Critical Dependencies |
|---|---|---|---|
| **ICW Witness Ledger** | Serializable isolation, atomic receipt insertion, and authoritative head advancement. | Google Cloud Spanner multi-region project (dedicated witness domain). | Google Cloud control plane, TrueTime, multi-region replication. |
| **Envelope Archive** | WORM retention of immutable batch envelopes under Compliance mode. | AWS S3 dedicated bucket in a separate AWS account. | AWS S3 control plane, Object Lock service, KMS. |
| **Authorization Decision Service (ADS)** | Evaluation of versioned policies and issuance of signed, request-bound assertions. | Separately administered security control plane outside application/DB. | Policy store, HSM signing keys, Identity Provider. |
| **Upstream Identity Provider (Okta)** | Principal authentication and session context provision (OIDC). | Upstream workforce/tenant identity domain. | Okta Custom Auth Server, JWKS endpoints. |
| **Key Custody & HSM** | Securing ES256 signing keys under 2-of-3 human quorum. | AWS CloudHSM dedicated trust account. | CloudHSM cluster, FIPS modules, AWS IAM root. |

- **Single Points of Failure (SPOFs) & Shared Dependencies:** Cloud provider control planes (Google Cloud and AWS), DNS resolution, IAM identity subsystems, and NTP time sources. Shared administrative super-admins across cloud organizations represent a critical cross-provider risk.

## 5. Consistency and State-Management Assessment

- **Consistency Guarantees:** Spanner external consistency ensures commit order matches observable client order, exceeding standard linearizability.
- **State Synchronization & Atomicity:** Eliminates distributed two-phase commits between cloud providers by writing the S3 envelope first (leaving harmless orphans on abort) and executing a single Spanner transaction for receipt/head binding.
- **Concurrency & Race Conditions:** Serializable isolation prevents double-commit from the same expected head. Idempotency is enforced by querying Spanner receipt history using the request's idempotency identity.
- **Source of Truth:** The ICW append-only ledger and immutable object archive are the sole sources of truth; relational databases hold unprivileged projections only.

## 6. Independent Authority Coordination

- **Authority Ownership:** The customer tenant is the ultimate authority for its own grants and Tenant Authorization Root (TAR).
- **ADS Role:** ADS is a delegated decision service, not the ultimate authority. It cannot create tenant roots or exceed delegated scope.
- **Coordination & Revocation:** Monotonic versioned revocation prevents acceptance of stale policy or revoked grants. Fail-closed behavior is mandatory during ADS outages or revocation uncertainty.

## 7. Failure-Mode and Resilience Analysis

1. **S3 Unavailable Before Commit:** Fails closed; no Spanner transaction occurs, leaving an unreferenced orphan object.
2. **Spanner Transaction Abort:** Fails closed; application receives abort error, S3 orphan is left unreferenced.
3. **Network Partition / Authority Unreachable:** Fail closed; unverified assertions or unreachable ADS prevent mutation commit.
4. **Retry Storms / Duplicate Execution:** Idempotency lookup resolves original receipt without allocating duplicate sequences.

## 8. Infrastructure and Provider Dependency Assessment

- **Provider Concentration:** Reliance on Google Cloud (Spanner) and AWS (S3, CloudHSM).
- **Administrative Separation:** Requires distinct legal owners, separate cloud organizations/accounts, isolated IAM hierarchies, and independent audit export.
- **Cost Profile:** Published Spanner multi-region compute floor estimated at approximately USD 270.47/month (100-PU Asia 1 floor), excluding storage, replication, network, S3, HSM, and operational overhead.

## 9. Recovery Architecture Assessment

- **Recovery Inventory:** 30 standardized recovery classes (R01–R30) spanning genesis, epochs, receipts, envelopes, payloads, cryptographic policies, and runtime artifacts.
- **Clean-Room Recovery:** Mandates restoration from immutable storage without relying on production relational database backups.
- **Verification Discipline:** Independent verifier must validate receipt chains from R01 genesis without skipping gaps or accepting unanchored tails.

## 10. Findings Register Ordered by Severity

| ID | Severity | Document & Section | Claim / Design Decision | Technical Problem & Scenario | Evidence Class | Corrective Action & Closure Criteria |
|---|---|---|---|---|---|---|
| **F-01-01** | **P1** | `ICW_F01_PROVIDER_EVALUATION_PRELIMINARY.md` (Sec. 9) | Two cloud vendors (Google Cloud + AWS) guarantee administrative independence. | Using two vendors does not prevent a shared super-admin or compromised root recovery path from breaching both domains. | Assumed | Provide named legal account owners, IAM role exports, and independent audit export proofs. |
| **F-02-01** | **P1** | `ICW_F02_INDEPENDENT_AUTHORITY_MODEL.md` (Sec. 12) | Tenant Authorization Root (TAR) and ADS prevent app-admin escalation. | Unassigned operational ownership leaves tenant bootstrap and key enrollment vulnerable to unverified paths. | Specified | Enroll real tenant roots with out-of-band verification and second-person approval. |
| **F-03-01** | **P2** | `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` (Sec. 7) | 30-class inventory covers all recovery prerequisites. | Live exercise is completely unexecuted; recovery claims are untested against real fault injections. | Missing | Execute clean-room recovery exercise across all R01–R30 classes in an isolated test environment. |
| **F-04-01** | **P2** | `ICW_F04_CRYPTOGRAPHIC_TRUST_AND_KEY_CUSTODY_TEST_SPECIFICATION.md` (Sec. 9) | `DF-ICW-CRYPTO-v1` and CloudHSM satisfy key custody requirements. | No HSM is provisioned, no FIPS mechanism testing has occurred, and custodians are unassigned. | Specified | Provision CloudHSM, appoint 2-of-3 named human custodians, and execute known-answer tests. |

## 11. Cross-Document Contradictions and Missing Architectural Decisions

- **Contradictions Resolved:** The provisional conflict between DynamoDB MRSC and Spanner was formally resolved by selecting Google Cloud Spanner multi-region + AWS S3 Object Lock Compliance as the sole primary candidate baseline.
- **Missing Architectural Decisions:**
  - Actual legal tenant owners and second approvers remain unassigned.
  - Designated HSM custodians and TSA operators are unappointed.
  - Concrete deployment parameters, exact cryptographic SDK/firmware configurations, and data retention schedules remain undefined.

## 12. Required Corrective Actions

1. Establish named legal account owners and verify physical/organizational administrative separation between Google Cloud and AWS.
2. Provision non-production test harnesses and execute fault-injection suites for crash-after-ack, network partitions, and transaction aborts.
3. Finalize TSA provider contracts, configure FIPS-compliant CloudHSM clusters, and execute independent vector verification.

## 13. Closure Tests and Acceptance Criteria

- Execution of recovery test specification (R01–R30) in an isolated clean room with zero reliance on production databases.
- Verification of known-answer cryptographic vectors across two independent implementations under `DF-ICW-CRYPTO-v1`.
- Successful demonstration of fail-closed behavior during mock ADS and witness outages.

## 14. Residual Risks and Unresolved Questions

- Cross-provider super-admin compromise or collusion.
- Irreversible S3 Object Lock compliance retention creating lawful erasure and mistaken-retention hurdles.
- Key loss or custodian unavailability without quorum recovery.

## 15. Final Recommendation

- **Outcome Selected:** **CONDITIONAL PASS** (for architecture design progression and test specification review, subject to mandatory pre-implementation conditions).
- **Production Deployment Approval:** **WITHHELD** until all closure evidence (F-01 through F-09) is independently demonstrated.
