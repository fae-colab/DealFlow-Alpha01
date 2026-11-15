# ICW F-01 Provider Evaluation — Preliminary Evidence Review

**Date:** 2026-11-15  
**Status:** Documentary provider evaluation; Spanner + S3 selected as the sole primary candidate for independent review only. No production provider approved, no account created, no paid service or trial authorized.  
**Related control:** ICW Master Closure Register — Baseline 01.  
**Scope:** Evaluate public provider semantics relevant to atomic witness commits and immutable complete-batch retention. This is not a security certification or implementation authorization.

## 1. F-01 acceptance requirement

The ICW must establish one unambiguous logical commit point. For every accepted batch:
- the complete canonical envelope is already durably retained;
- one authoritative operation atomically advances the ledger head and records the corresponding signed receipt/idempotency identity;
- two writers cannot both commit from the same expected head;
- a successful acknowledgement survives the failure modes covered by the approved durability contract;
- ordinary application/database administrators cannot rewrite the witness history;
- independent recovery can enumerate the receipt chain and retrieve every referenced envelope.

A storage product that only provides immutable objects is not, by itself, a commit sequencer. A database that only provides strong consistency is not, by itself, an immutable evidence archive.

## 2. Candidate A — Google Cloud Spanner as ICW + AWS S3 Object Lock for envelopes

### Documented capabilities

- Spanner read-write transactions default to serializable isolation. Transactions execute atomically, and Spanner documents external consistency: commit order matches the order in which clients observe commits. Google explicitly describes external consistency as stronger than linearizability for transaction processing.
- Spanner multi-region configurations use replicas across multiple regions and provide automatic leader failover. Google documents a 99.999% monthly availability SLA for multi-region and dual-region configurations. Multi-region configurations are an Enterprise Plus feature.
- S3 Object Lock supports WORM retention. In Compliance mode, a protected object version cannot be overwritten or deleted by any user, including the AWS account root user, during its retention period.

### Candidate commit protocol (must be validated, not yet approved)

1. Canonicalize and hash the complete batch envelope.
2. Upload it under a unique immutable object key to an AWS S3 bucket with Object Lock Compliance retention. Record the exact object version ID and verify the returned checksum/digest by readback.
3. Construct and sign a receipt binding tenant/ledger/epoch, expected prior receipt/head, next sequence, batch digest, envelope object key/version/digest, request/idempotency identity, and schema/canonicalizer versions.
4. Execute one Spanner serializable read-write transaction. It reads and validates the current head, confirms the expected receipt/hash/sequence, inserts the immutable receipt row, and advances the head row in the same transaction.
5. A successful Spanner commit is the logical ICW commit point. The receipt references an envelope already retained in the separate AWS trust domain. A failed/aborted transaction leaves an orphan envelope, which is not an accepted lifecycle batch.
6. A retry resolves the original idempotency identity by traversing/querying the Spanner receipt history; it must not create a second receipt or sequence.

### Strengths

- The receipt and authoritative head can be changed atomically within one serializable Spanner transaction; this avoids trying to perform a distributed transaction between two cloud providers.
- External consistency is a particularly good match for the ordered receipt-head semantics.
- The envelope archive is in a separate cloud provider, allowing separate cloud accounts, administrators, billing and audit domains.
- S3 Compliance mode provides a strong object-version retention primitive.

### Material limitations and open questions

- Spanner multi-region availability has a higher cost profile; Enterprise Plus is required for multi-region configurations. No cost model has been prepared.
- The Spanner SLA is an availability commitment, not proof that this particular application protocol meets every durability, retention, recovery or threat-model requirement.
- The S3 envelope must be written and verified before the Spanner transaction. Orphaned objects are expected and need a safe, retention-aware accounting process; they must never be mistaken for accepted receipts.
- S3 Object Lock protects a specific object version. The design must pin and verify the exact version ID and digest. New versions/delete markers must not change what a receipt resolves to.
- Receipt signing and Spanner transaction retries must be separated carefully. Do not perform non-idempotent external signing side effects inside an automatically retried transaction callback. A CAS loser must rebuild and re-sign against the new head.
- The ICW semantic validator, signed authorization assertion, key custody, replay protection, independent verification tool and recovery procedure still need separate design and testing.
- Google organization administrators and AWS account administrators remain powerful actors in their respective domains. Independent ownership, MFA, break-glass, audit export and credential separation must be demonstrated, not inferred from using two vendors.
- Cross-cloud latency, temporary S3 unavailability, Spanner transaction aborts, partial failures and recovery from an acknowledged commit require fault-injection tests.

### Preliminary disposition

**Best current candidate for a transactionally atomic receipt/head design, subject to cost and threat-boundary review. Not selected or accepted.**

## 3. Candidate B — AWS DynamoDB MRSC as ICW + immutable object archive

### Documented capabilities

- DynamoDB Multi-Region Strong Consistency (MRSC) synchronously replicates item changes to at least one other Region before a successful write response. Strongly consistent reads return the latest item version, and conditional writes evaluate against the latest item version.
- MRSC requires exactly three Regions, configured as three replicas or two replicas and one witness.
- DynamoDB MRSC does not support transaction operations. AWS also documents that multi-account global tables support MREC only, not MRSC.
- S3 Object Lock Compliance mode can protect immutable object versions against deletion or overwrite during retention.

### Assessment

A single-item conditional update of a ledger-head record is a plausible CAS primitive. A complete envelope could be written to immutable object storage before that CAS, leaving harmless orphan objects when a CAS loses.

However, MRSC's lack of transactions means the design cannot casually assume atomic updates across a receipt row, head row and idempotency row. A viable protocol would need to keep the acceptance decision in one CAS-controlled item or prove another single-item protocol that preserves:
- receipt-to-head binding;
- idempotent replay after the head has advanced;
- contiguous sequence assignment;
- receipt discovery after a lost client response;
- bounded item growth and DynamoDB's item-size limit;
- no accepted head that points to a missing or unretained envelope.

MRSC's multi-account limitation also constrains the desired administrative separation. A dedicated ICW AWS account can be separate from the application account, but multi-account MRSC replication itself is not available.

### Preliminary disposition

**Technically plausible for a carefully constrained single-item head protocol, but not a drop-in fit for the current multi-record receipt contract. Do not select without a revised protocol and explicit proof of the idempotency/receipt model.**

## 4. Candidate C — Google Cloud Spanner + Google Cloud Storage Bucket Lock

Google Cloud Storage Bucket Lock can permanently lock a bucket retention policy. Once locked, the retention period cannot be reduced or removed; objects cannot be deleted or replaced until the retention period expires. The lock is irreversible.

This combination retains Spanner's transaction semantics but does not provide the same cross-provider administrative separation as Spanner plus AWS S3. Separate projects and IAM roles can reduce ordinary operator overlap, but they remain within one cloud-provider organization/control plane unless ownership is deliberately separated. Bucket/object metadata and generation behavior also need explicit controls.

**Preliminary disposition:** viable as a single-provider option where operational simplicity is prioritized, but weaker against a shared cloud-provider administrative compromise. Not selected.

## 5. Preliminary comparison

| Criterion | Spanner + S3 Object Lock | DynamoDB MRSC + object archive | Spanner + GCS Bucket Lock |
|---|---|---|---|
| Atomic receipt + head | Yes, in one Spanner transaction | No multi-item transactions; single-item protocol required | Yes, in one Spanner transaction |
| Strong ordering | External consistency | Strong conditional writes on latest item | External consistency |
| Multi-region behavior | Multi-region Spanner; Enterprise Plus | MRSC across exactly three Regions | Multi-region Spanner; Enterprise Plus |
| Immutable envelope | S3 Object Lock Compliance | S3 or GCS lock, depending on archive | GCS Bucket Lock |
| Cross-cloud admin separation | Yes, if independently owned | Yes with GCS archive, but MRSC itself is single AWS account | No |
| Main concern | Cost and cross-cloud failure protocol | No transactions; multi-account MRSC unavailable | Shared provider control plane |
| Current status | Preferred candidate for deeper review | Alternative requiring protocol redesign | Lower-independence alternative |

## 6. Recommendation and next evidence required

Do not make a production provider selection yet.

Carry **Candidate A (Spanner + S3 Object Lock)** forward as the primary F-01 candidate because it most naturally supports an atomic receipt/head transaction while placing the complete batch envelope in a separately administered cloud. Keep Candidate B as an alternative only if the ICW protocol is redesigned around a single-item MRSC CAS. Do not call either design rollback-proof.

Before any selection:
1. Obtain an actual cost estimate for the smallest suitable Spanner multi-region configuration and the expected S3 retention/storage/egress profile.
2. Confirm the selected Spanner multi-region configuration, commit semantics, recovery/export capabilities and applicable contractual terms.
3. Confirm S3 Object Lock Compliance-mode behavior, exact version pinning, retention configuration, account ownership and independent audit.
4. Specify the signed receipt and transaction retry protocol, including crash points before/after S3 upload, Spanner commit, and client acknowledgement.
5. Define the threat model for Google organization admins, AWS account admins, identity administrators, key administrators and provider personnel.
6. Produce a deterministic failure matrix and independent verifier before any paid proof-of-concept is considered.
7. Obtain explicit user authorization before creating accounts, enabling services, incurring charges or running live tests.

## 7. Primary vendor documentation reviewed (2026-11-15)

- Google Cloud Spanner transactions: https://docs.cloud.google.com/spanner/docs/transactions
- Spanner TrueTime and external consistency: https://docs.cloud.google.com/spanner/docs/true-time-external-consistency
- Spanner instance configurations and multi-region behavior: https://docs.cloud.google.com/spanner/docs/instance-configurations
- Spanner SLA: https://cloud.google.com/spanner/sla
- AWS DynamoDB global-table consistency modes and MRSC limitations: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html
- AWS DynamoDB constraints and transaction limitations: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html
- AWS S3 Object Lock: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- Google Cloud Storage Bucket Lock: https://docs.cloud.google.com/storage/docs/bucket-lock

**Evidence boundary:** This review establishes that the documented provider primitives are plausible candidates. It does not establish the selected configuration's real-world behavior, independent administrative ownership, application-level correctness, durability under all failures, or rollback resistance. Those require configuration evidence, contract review and independent fault-injection testing.


## 8. Cost assessment — published-price floor, not a quote (2026-11-15)

### Spanner multi-region compute floor

The published Spanner pricing page currently shows **USD 3.705 per node-hour** for the displayed Asia 1 multi-region Enterprise Plus configuration, including its replicas. Spanner defines 1 node as 1,000 processing units and permits capacity in 100-PU increments. On that displayed rate:

- 100 PU = 0.1 node.
- 0.1 × USD 3.705 = **USD 0.3705/hour**.
- 730-hour planning month × USD 0.3705 = **USD 270.47/month**.

This is a published-rate arithmetic estimate for a 100-PU configuration, not a verified bill or quote. Regional configuration prices vary; the eventual region and configuration are not selected. Confirm that the selected configuration supports the required 100-PU floor and obtain a calculator estimate before any account is provisioned.

Spanner also bills for actual database storage, backup storage, replication and applicable network traffic. Multi-region data storage is billed across replicas; storage and compute prices vary by configuration. These costs are excluded from USD 270.47.

### S3 envelope storage and access

S3 has no fixed minimum monthly charge, but charges depend on storage class, retained bytes, PUT/GET/LIST requests, lifecycle transitions, retrieval, data transfer, replication and enabled management/analytics features. The object count, envelope size, retention period, storage class, access frequency, region and restore/export pattern are not yet specified. Therefore a defensible S3 monthly amount cannot yet be stated.

Object Lock must be enabled with versioning and the exact retained version ID pinned in each receipt. Compliance retention is irreversible for the locked version during the retention period; this protects against ordinary deletion/overwrite but creates a corresponding privacy, lawful-erasure and mistaken-retention risk that must be resolved before real data is stored.

### Total-cost interpretation

| Cost component | Current estimate/status |
|---|---|
| Spanner 100-PU multi-region compute, displayed Asia 1 price | **USD 270.47/month floor estimate** |
| Spanner database storage | Not estimated; workload and selected region absent |
| Spanner backup storage | Not estimated; backup policy absent |
| Spanner replication/network | Not estimated; workload and region topology absent |
| S3 envelope storage | Not estimated; bytes, class and retention absent |
| S3 PUT/GET/LIST and retrieval | Not estimated; request volume absent |
| Cross-cloud egress/transfer | Not estimated; traffic pattern absent |
| KMS/HSM, audit logs, monitoring, alerts, support, recovery tooling | Not estimated; key and operational architecture not selected |
| Engineering/on-call and independent audit | Not included; non-cloud operating cost |

**Budget conclusion:** Candidate A is not a near-zero-cost production architecture. The minimum published compute component alone is roughly USD 270/month at the displayed multi-region rate. A real deployment budget will be higher. Do not promise a fixed monthly total until region, topology, data volume, retention, backup, request and egress assumptions are pinned in a cost worksheet.

A regional free-trial Spanner instance is useful only for learning and schema/transaction prototyping. It is not a substitute for multi-region acceptance: it has no SLA, cannot use multi-region configuration, lacks backup/restore and CMEK support, and is not recommended for production, load testing or ongoing development. It cannot prove the proposed multi-region witness durability or recovery properties.

## 9. Administrative independence — required ownership design

Using Google and AWS is **provider diversity**, not automatically administrative independence.

Candidate A is acceptable for further evaluation only if the following are implemented and evidenced:

| Control plane | Required independent ownership/control |
|---|---|
| DealFlow application and relational DB | Application operator may submit commands but has no Spanner IAM admin, S3 bucket admin, Object Lock bypass, ADS signer, or trust-root authority. |
| ICW / Spanner | Dedicated Google Cloud organization/project and billing owner; separate named administrators; hardware-backed MFA; no shared app-admin identities; audit export controlled outside the app project. |
| Envelope archive / S3 | Dedicated AWS account, not merely another bucket in the application account; separate root email/phone/recovery custody; separate IAM admins and billing owner; no cross-cloud federation that lets app admins assume archive roles. |
| Google/AWS organizational super-admins | Explicitly identified as residual privileged trust roots. If one person or one organization can administer both cloud organizations, the architecture does not resist compromise/collusion of that shared top-level authority. |
| Break-glass and recovery | Two-person approval, separately stored recovery credentials, time-bounded elevation, immutable external audit and tested revocation. |
| Security monitoring | Logs exported to a third, separately controlled audit destination or customer-controlled archive; neither application nor ICW operators can erase all copies. |

### Threat boundary decision

The proposed design can target resistance to compromise of an ordinary application administrator or relational database administrator, assuming the ICW and envelope archive accounts and their trust roots remain uncompromised.

It does **not** establish resistance to:
- compromise of the Google Cloud organization super-admin and AWS account/root recovery paths;
- collusion between administrators controlling both provider domains;
- simultaneous compromise of ICW, ADS and cryptographic trust roots;
- provider-wide compromise outside the contractual threat model;
- malicious authorized evidence submission.

For a stronger organizational independence claim, the Google ICW environment and AWS archive must be controlled by distinct legal entities or genuinely independent custodians, not merely separate projects administered by the same super-admin. If that level of separation is unavailable, state the narrower threat model honestly.

### Administrative acceptance evidence

Before F-01 can be ACCEPTED, collect:
1. Named legal account owners and service owners for both providers.
2. Organization/account IDs and ownership evidence (redacted in review artifacts).
3. IAM role and trust-policy exports proving no app-admin path into either trust domain.
4. MFA, root recovery, break-glass and two-person approval evidence.
5. Cross-account and cross-cloud federation map.
6. Independent audit-log destination and retention proof.
7. Object Lock bucket configuration, versioning state, retention mode and sample version-level retention evidence.
8. Spanner configuration, edition, region topology, compute capacity and contractual SLA.
9. Independent export and restore test from ICW receipts and S3 envelopes.
10. Documented residual risk for provider super-admin and cross-organization collusion.

No such live ownership/configuration evidence is currently available. This is an explicit blocker, not a presumed pass.

## 10. F-01 decision record

**Decision:** Carry Google Cloud Spanner + AWS S3 Object Lock Compliance mode forward as the preferred *candidate architecture* for the receipt/head + complete-envelope split. Do not select it as the production provider pair yet.

**Reason:** Spanner provides the cleanest documented atomic transaction boundary for receipt insertion plus authoritative-head advancement; S3 Object Lock provides a separate-provider immutable object-version retention primitive. The protocol can avoid a distributed transaction by retaining and verifying the envelope first, then atomically committing the receipt and head in Spanner.

**Rejected as drop-in:** DynamoDB MRSC is not selected for the current multi-record receipt contract because MRSC does not support transactions and its multi-account limitation complicates the desired administrative separation. It may be reconsidered only with a revised single-item CAS/idempotency design and proof.

**F-01 status remains BLOCKED.** The public documentation and cost floor are assessed, but actual provider selection, region, contracts, independent legal ownership, IAM evidence, retention/legal policy, fault injection and recovery evidence are still missing. No cloud account or paid service has been created.

## 11. Additional primary documentation reviewed

- Spanner pricing: https://cloud.google.com/spanner/pricing
- Spanner compute capacity and 100-PU increments: https://docs.cloud.google.com/spanner/docs/compute-capacity
- Spanner free trial limitations: https://docs.cloud.google.com/spanner/docs/free-trial-instance
- Spanner SLA: https://cloud.google.com/spanner/sla
- S3 pricing components: https://aws.amazon.com/s3/pricing/
- S3 Object Lock retention/version semantics: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- S3 Object Lock considerations, including encryption-key loss: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html


---

## 9. Binding topology reconciliation amendment (2026-11-15)

The conflicting provisional topology in `ICW_F01_PROVIDER_EVALUATION_AND_PROVISIONAL_TOPOLOGY.md` has been reconciled by the separate decision record `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md`.

**Sole primary candidate carried forward:** Google Cloud Spanner multi-region as transactional ICW + AWS S3 Object Lock Compliance as immutable envelope/receipt archive.

DynamoDB MRSC + S3 + GCS is retained as historical alternative only, not the selected baseline. Its single-item head-CAS protocol requires a separate architecture redesign and proof because MRSC does not support multi-item transactions. The Spanner + S3 candidate best fits the current atomic receipt/head/idempotency contract.

This is a documentary candidate selection for independent review only. It does not select a production provider, authorize accounts/trials/spend, approve a retention schedule, or establish operational independence. The published-rate compute estimate and exclusions in this document remain applicable. F-01 remains OPEN / NOT DEMONSTRATED.
