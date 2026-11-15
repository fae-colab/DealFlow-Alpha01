# ICW v4.2 — Trust Closure Execution Status

**Date:** 2026-11-15  
**Branch:** docs/icw-v4-2-evidence-closure  
**Parent:** docs/icw-v4-1-trust-closure  
**Status:** Documentation and public-source evaluation only. No implementation, production deployment, real evidence ingestion or live infrastructure test performed.

## 1. Work completed

| Finding | Work product | Current result | Closure state |
|---|---|---|---|
| F-01 | Provider comparison + topology reconciliation decision | Spanner multi-region + S3 Object Lock Compliance is the sole primary candidate carried forward for review; DynamoDB MRSC + S3 + GCS is explicitly superseded as primary and retained as historical alternative. No procurement or implementation approval. | CANDIDATE SELECTED FOR REVIEW / OPEN — NOT DEMONSTRATED |
| F-02 | Independent authority design and component selection | Dedicated ADS selected as sole issuer; Okta Custom Authorization Server selected as upstream identity provider. | OPEN / NOT DEMONSTRATED |
| F-03 | Original recovery inventory + practical test specification | Original R01–R30 source preserved unchanged; companion spec maps all 30 classes to failure injection, detection, isolation, recovery, independent verification and acceptance, plus end-to-end and compound scenarios. Live exercise still requires actual stores, ledger, credentials and independent verifier. | SPECIFICATION DEFINED / LIVE EXERCISE BLOCKED — NOT RUN |
| F-04 | Existing key custody plan + cryptographic trust policy v1 | Six key domains preserved. DF-ICW-CRYPTO-v1 selects ES256/P-256/SHA-256, SHA-256 digests, RFC 8785 JCS, domain separation, AES-256-GCM, TLS 1.3 and dual RFC 3161 TSA evidence. 2-of-3 human quorum for HSM lifecycle/admin; constrained service identity for routine signing. | DOCUMENTARY POLICY SELECTED / OPERATIONAL ACCEPTANCE BLOCKED — NOT DEMONSTRATED |
| Independent review | Full v4.2 independent review charter created; complete document set and review questions defined. Candidate firms previously screened: NCC Group, Trail of Bits, Bishop Fox. No reviewer contacted or appointed; no fee approved. | REVIEW PACKAGE READY / EXTERNAL ENGAGEMENT NOT YET EXECUTED |

## 2. Work not performed

- No cloud account, project, provider contract, Okta tenant, ADS or HSM has been provisioned.
- No actual configuration exports, IAM policies, named administrators or custodians have been examined.
- No receipt, envelope, signed assertion, HSM key, backup or recovery object exists in this evidence pack.
- No acceptance tests 188–220 or F-04 specification tests F04-T01–T12 have been executed.
- No clean-room recovery exercise has been conducted; the new F-03 specification is not execution evidence.
- No independent reviewer has been appointed or engaged.
- No guarantee of rollback resistance, independent authorization, full reconstructability or cryptographic trust is claimed.

## 3. Required next gates

1. Confirm whether the proposed PoC topology is acceptable for evaluation; then obtain provider pricing, regional availability, service contracts, data residency/privacy review and account ownership model.
2. Establish genuine independent human administration for app, witness, ADS, identity, HSM and review domains. If this cannot be achieved, revise the trust claim.
3. Provision non-production test infrastructure only after explicit authorization and signed deployment parameter register.
4. Execute F-01 fault tests and capture raw evidence.
5. Provision ADS/Okta and run F-02 assertion/revocation/outage tests.
6. Resolve F-01/F-02 prerequisites and approved retention/legal scope; build the recovery package and separately reviewed verifier; then run the F-03 clean-room exercise against all R01–R30 classes.
7. Validate the selected F-04 crypto suite against the actual HSM/FIPS/SDK configuration, assign named independent custodians and TSA operators; only after explicit authorization perform HSM key ceremony, backup restore, rotation and compromise/quarantine exercises.
8. Apply the F-01 topology reconciliation decision as the sole documentary candidate baseline; confirm the F-04 HSM account and ADS key-domain boundaries against it.
9. Obtain owner approval for reviewer identity, fee, confidentiality and disclosure; appoint an external independent reviewer under the new charter.
10. Provide the reviewer the immutable complete document baseline; resolve findings and commission retest.
11. Only then present a separate implementation-authorization decision to the user.

## 4. Governance

PR #33 remains the original v4 draft PR and is not changed by this branch. The v4.1 baseline is preserved. This v4.2 branch is a documentation supplement; it is not merged and does not authorize implementation, migration, evidence ingestion, deployment or tests.

**Overall disposition: F-01–F-04 remain OPEN. Implementation authorization remains WITHHELD.**
