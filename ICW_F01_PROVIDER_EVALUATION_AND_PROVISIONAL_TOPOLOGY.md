# ICW F-01 — Provider Evaluation and Provisional Topology

**Record date:** 2026-11-15  
**Status:** Desk evaluation of official primary documentation only. No account, contract, tenant, configuration export or fault test inspected.  
**Disposition:** Provisional PoC topology selected; F-01 remains OPEN / NOT DEMONSTRATED.

## 1. Provisional selection

Preferred proof-of-capability topology:
- Amazon DynamoDB Global Tables in Multi-Region Strong Consistency (MRSC) mode for authoritative ledger-head/sequence compare-and-set metadata, in exactly three AWS Regions and a dedicated trust account.
- Amazon S3 general-purpose buckets with Versioning and Object Lock Compliance mode for immutable receipt and batch-envelope objects, in an account separate from DealFlow application/DB.
- Google Cloud Storage with a locked bucket retention policy as a second, independently administered envelope copy.
- Append protocol writes and verifies complete envelope and receipt bytes in both cloud stores first; only then conditionally advances the DynamoDB MRSC ledger head. A durable acknowledgement is returned only after all required writes and the conditional head update succeed.

This is a candidate topology for a controlled PoC, not a production selection or demonstrated guarantee.

## 2. Provider comparison

| Candidate | Publicly documented capability | F-01 limitation | Disposition |
|---|---|---|---|
| DynamoDB MRSC | Exactly three Regions; synchronously replicates changes to at least one other Region before successful write response; strong reads and conditional writes evaluate latest state; RPO 0 is documented. | Multi-account global tables support MREC only, not MRSC. The MRSC table must sit in one dedicated trust account. Table consistency does not protect payload bytes. | Preferred ledger-head CAS candidate. |
| S3 Object Lock Compliance | Protected object versions cannot be overwritten/deleted during retention, including by account root; S3 PUT is strongly read-after-write consistent; standard storage spans at least three AZs. | Compliance retention is not a ledger. Simple DELETE can create a delete marker; use exact VersionIds. Account deletion remains a documented exception. Cross-region replication is asynchronous. | Preferred AWS envelope store. |
| Google Cloud Storage Bucket Lock | Locked bucket retention policy cannot be removed or shortened; successful regional writes are stored redundantly across at least two AZs. | Cross-region replication is asynchronous. Default replication target is 99.9% within one hour and 100% within 12 hours; Turbo Replication target is 15-minute RPO, not zero. | Preferred second-cloud envelope copy; do not claim zero-RPO cross-region replication. |
| Google Cloud Spanner multi-region | Multi-region strong consistency; serializable transactions and external consistency. | Separate WORM object storage still required; exact configuration and failure behavior need live proof. | Credible alternative, not selected for initial PoC. |
| Azure Cosmos DB Strong | Strong consistency uses global-majority writes; multi-region strong consistency documents RPO 0. | Multiple write regions cannot use Strong; immutable Blob is separate from ledger. | Credible alternative, not selected for initial PoC. |

## 3. Proposed append protocol

1. Canonicalize the complete batch envelope and calculate its versioned digest.
2. Write identical bytes to S3 with Compliance retention; capture exact object VersionId.
3. Write identical bytes to GCS under a locked retention policy; capture exact generation.
4. Read back both exact versions and verify byte length and digest.
5. Write the immutable receipt object to both stores, binding previous receipt/head, sequence range, batch, envelope refs/digests, retention IDs and idempotency key.
6. Conditionally update the DynamoDB MRSC ledger head from the expected prior head to the new receipt. The MRSC conditional write must evaluate against the latest state.
7. Only after success return durable acknowledgement. If a response is lost after successful CAS, resolve by exact idempotency lookup.
8. If either store or MRSC is unavailable, fail closed: no success response and no projection mutation.

Concurrent losers may leave prewritten orphan objects; these are not accepted ledger entries and must never be promoted by sequence guessing. Every accepted object reference must pin exact S3 VersionId and GCS generation, not a mutable object name.

## 4. Threat-model boundaries

- Two clouds reduce single-provider and single-region loss risk, but do not eliminate simultaneous compromise, compromised client credentials, malicious canonicalization or provider control-plane compromise.
- Acknowledgement means both cloud object writes and MRSC head CAS completed; it does not mean all possible future provider failures are impossible.
- A region outage before both object writes complete blocks acknowledgement. A region outage after both writes complete should leave the other provider copy available, subject to live test.
- Compliance retention and legal/privacy erasure may conflict. No retention duration or irreversible lock may be approved until legal basis, retention schedule, data minimization and erasure design are approved.
- Account separation is insufficient if one unrestricted human/admin identity controls every account. Named independent administrators and role evidence are required.

## 5. Closure evidence still required

- Signed provider capability/consistency statements and applicable contracts/support terms.
- AWS and Google account/project ownership, region, network and IAM diagrams; named independent administrators.
- DynamoDB MRSC live configuration export proving three-region mode and conditional-write/strong-read behavior.
- S3 Versioning/Object Lock Compliance configuration, exact versions, retention metadata and denied-role tests.
- GCS locked-retention configuration, object generations, IAM and denied-role tests.
- Signed deployment parameter register with RPO/RTO, region IDs, retention, failure exclusions, recovery roles and idempotency rules.
- Independently witnessed tests 188–196 with raw logs, timestamps, receipts, exact object versions/generations, digests and verifier output.
- Immediate post-ack process termination, AZ/region failure, single-cloud outage and app/DB-admin denial exercises.
- Independent infrastructure/security reviewer report.

## 6. Official sources reviewed

- DynamoDB MRSC semantics: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html
- DynamoDB multi-account limitation: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-global-table-design.html
- S3 consistency: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
- S3 durability and AZ placement: https://docs.aws.amazon.com/AmazonS3/latest/userguide/DataDurability.html
- S3 Object Lock: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- Google Cloud Storage durability/replication: https://docs.cloud.google.com/storage/docs/availability-durability
- Google Bucket Lock: https://docs.cloud.google.com/storage/docs/bucket-lock
- Google Spanner multi-region: https://docs.cloud.google.com/spanner/docs/instance-configurations
- Azure Cosmos DB consistency: https://learn.microsoft.com/azure/cosmos-db/consistency-levels
- Azure immutable Blob: https://learn.microsoft.com/azure/storage/blobs/immutable-time-based-retention-policy-overview

**F-01 status: OPEN / NOT DEMONSTRATED.** Public documentation supports a plausible PoC; no live configuration, provider contract or fault test has been inspected.
