# ICW F-01 — Topology Reconciliation Decision Record

**Decision date:** 2026-11-15  
**Branch:** `docs/icw-v4-2-evidence-closure`  
**Status:** DOCUMENTARY CANDIDATE SELECTION FOR INDEPENDENT REVIEW — NOT APPROVED FOR PROCUREMENT OR IMPLEMENTATION  
**Decision authority:** Architecture decision recorded for the user; final provider acceptance remains subject to independent review and explicit authorization.

## 1. Conflict being resolved

Two documents described incompatible candidate designs:

1. `ICW_F01_PROVIDER_EVALUATION_PRELIMINARY.md` recommended carrying Google Cloud Spanner + AWS S3 Object Lock Compliance forward as the strongest fit for the current atomic receipt/head contract.
2. `ICW_F01_PROVIDER_EVALUATION_AND_PROVISIONAL_TOPOLOGY.md` proposed DynamoDB MRSC + S3 Object Lock + Google Cloud Storage Bucket Lock, with a single-item head CAS after writing object copies to both stores.

These are different protocols. They cannot both be the selected PoC topology.

## 2. Binding documentary decision

**Select Candidate A — Google Cloud Spanner multi-region as the ICW transactional witness, plus AWS S3 Object Lock Compliance as the immutable envelope/receipt object archive — as the sole primary topology for continued design review.**

The decision is based on fit to the existing v4 contract:
- The contract requires the receipt row, authoritative head advancement and idempotency identity to be committed atomically at one logical commit point.
- Spanner supports a serializable read-write transaction that can atomically validate the expected head, insert the receipt/idempotency record and advance the head.
- The envelope is uploaded first to S3 and its exact VersionId and digest are pinned. A Spanner transaction failure leaves an orphaned immutable object, not an accepted ledger commit.
- Acknowledgement occurs only after the Spanner transaction commits; the transaction is the logical ICW commit point.
- Two independently administered cloud providers provide a clearer separation between the transaction witness and immutable object archive, subject to actual ownership evidence.

This is a candidate selection for review, not proof of deployment, rollback resistance or production durability.

## 3. Disposition of the conflicting DynamoDB MRSC + S3 + GCS proposal

The topology in `ICW_F01_PROVIDER_EVALUATION_AND_PROVISIONAL_TOPOLOGY.md` is retained as historical design work but is **superseded as the selected primary topology**.

Reasons:
- DynamoDB MRSC does not support multi-item transaction APIs. The earlier document correctly amended its design to rely on a single-item head CAS, but that is a material redesign from the existing transactional receipt/head/idempotency contract.
- The single-item protocol still requires proof for receipt discovery, idempotent retry after lost responses, contiguous sequence assignment, item growth, orphan management, contention and recovery.
- MRSC global tables are constrained to exactly three Regions and do not provide multi-account MRSC replication; this narrows administrative separation at the ledger layer.
- Adding GCS as a second archive copy adds a third-provider write dependency and cross-cloud failure/replication complexity without being required by the selected v4 atomic transaction model.
- The Spanner + S3 candidate better matches the current system contract and has a published compute-cost floor already recorded in the preliminary assessment.

DynamoDB MRSC may be reconsidered only through a separately versioned architecture change that redesigns the receipt/head/idempotency protocol and independently proves the single-item CAS model. It is not part of the selected baseline.

## 4. Normative append protocol for the selected candidate

1. Canonicalize the complete batch envelope under `DF-ICW-CRYPTO-v1`; compute SHA-256 digest.
2. Upload immutable envelope bytes to S3 with Versioning and Object Lock Compliance retention. Capture the exact VersionId, retention metadata, byte length and checksum.
3. Read back that exact VersionId and independently verify bytes/digest.
4. Prepare a receipt binding tenant, ledger, epoch, expected prior receipt/head, candidate sequence/range, batch digest, exact S3 bucket/key/VersionId, envelope digest, idempotency identity, request digest, schema/canonicalization/crypto policy versions, signature algorithm and key ID.
5. Sign outside any automatically retried Spanner transaction callback. A transaction retry must not repeat a non-idempotent signing side effect without a stable precomputed receipt candidate and explicit retry semantics.
6. Execute one Spanner serializable read-write transaction: read and compare the expected head; validate receipt/idempotency uniqueness; insert immutable receipt and idempotency identity; advance the head in the same transaction.
7. The successful Spanner commit is the sole logical acceptance point. A failed/aborted transaction leaves an orphan S3 object, never an accepted receipt.
8. A retry resolves the original idempotency identity against authoritative receipt history and rechecks current authorization. Same identity/digest returns the original receipt; same identity/different digest is an integrity conflict.
9. Acknowledge only after commit. A lost response is resolved by authoritative idempotency lookup; it must not allocate a second sequence or receipt.
10. If Spanner or the required S3 operation is unavailable before commit, fail closed. No projection mutation or success acknowledgement occurs.

## 5. Account and trust-boundary model

Required separation for the selected candidate:
- Google Cloud Spanner project/organization: dedicated ICW transactional witness, with organization ownership and break-glass independent from DealFlow application operators.
- AWS S3 archive account: separate from DealFlow application account; dedicated Object Lock bucket, versioning, exact-version references, retention and independently exported audit.
- AWS CloudHSM account: separate from the S3 archive account and application account; dedicated ICW receipt-key domain. HSM administration and signing service roles are distinct.
- ADS HSM/security plane: separate from ICW receipt-key administration and application/database administration; ADS operator remains independent.
- Trust-root/policy keys and recovery-manifest key: offline or independently administered, with 2-of-3 human custody for sensitive lifecycle operations.
- Independent verifier and audit destination: no common unrestricted administrator or shared identity-recovery path with the application/database.

Using different vendors/accounts is not sufficient by itself. Named legal owners, organization administrators, account-root recovery, IAM, identity providers, break-glass, billing/support access and audit export must be inspected. If a single human or common super-admin can control the trust roots, the independence claim is downgraded.

## 6. Rejected or deferred alternatives

- **DynamoDB MRSC + S3 + GCS:** superseded as primary candidate; single-item protocol redesign required.
- **Spanner + GCS Bucket Lock:** deferred; one provider control plane weakens cross-provider administrative separation.
- **Spanner + S3 + GCS triple archive:** not selected for initial design; extra copy and replication behavior add complexity and no zero-RPO cross-region claim is made.
- **Azure Cosmos DB Strong + immutable Blob:** retained only as a future alternative; not selected in this baseline.

## 7. Cost and legal limits

The preliminary F-01 assessment records a published-rate Spanner 100-PU compute estimate of approximately USD 270.47/month for the displayed Asia 1 multi-region Enterprise Plus rate. This is a planning arithmetic estimate, not a quote. Storage, backup, network, S3, HSM, TSA, logs, monitoring, support and recovery costs are excluded. The candidate is therefore **not cost-approved**.

S3 Object Lock Compliance retention is irreversible for the protected object version during its retention period. No real-data retention duration may be set until legal basis, data minimization, retention schedule, privacy and erasure/key-destruction rules are approved. No account, trial or paid service is authorized by this decision.

## 8. F-01 acceptance remains open

Before F-01 can be accepted:
- obtain actual regional configuration and contract/SLA terms;
- verify Spanner transaction/retry semantics for the implemented receipt/idempotency protocol;
- verify S3 Object Lock exact-VersionId semantics and retention configuration;
- demonstrate distinct legal/account owners and administrator/recovery separation;
- test every pre-upload, post-upload, transaction abort, commit, lost-acknowledgement, region/provider outage and restore failure point;
- independently recover the latest receipt chain and all referenced exact object versions;
- measure RPO/RTO and cost under an approved workload;
- independently review the evidence and all residual trust assumptions.

**Disposition: TOPOLOGY CONFLICT RESOLVED AT DOCUMENTARY CANDIDATE LEVEL. F-01 REMAINS OPEN / NOT DEMONSTRATED.**
