# ICW F-01 Provider Evaluation — Preliminary Evidence Review

**Date:** 2026-11-15  
**Status:** Preliminary documentary evaluation only; no provider selected, no account created, no paid service or trial authorized.  
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
