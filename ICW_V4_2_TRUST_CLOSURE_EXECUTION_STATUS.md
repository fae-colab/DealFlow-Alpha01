# ICW v4.2 — Trust Closure Execution Status

**Date:** 2026-11-15  
**Branch:** docs/icw-v4-2-evidence-closure  
**Parent:** docs/icw-v4-1-trust-closure  
**Status:** Documentation and public-source evaluation only. No implementation, production deployment, real evidence ingestion or live infrastructure test performed.

## 1. Work completed

| Finding | Work product | Current result | Closure state |
|---|---|---|---|
| F-01 | Provider comparison and provisional topology | AWS DynamoDB MRSC + S3 Object Lock Compliance + Google Cloud Storage Bucket Lock selected for controlled PoC evaluation. | OPEN / NOT DEMONSTRATED |
| F-02 | Independent authority design and component selection | Dedicated ADS selected as sole issuer; Okta Custom Authorization Server selected as upstream identity provider. | OPEN / NOT DEMONSTRATED |
| F-03 | Recovery inventory and exercise protocol | 30 object classes and clean-room procedure specified. Live exercise cannot run until stores, ledger, recovery credentials and verifier exist. | OPEN / BLOCKED |
| F-04 | Key custody and compromise plan | AWS CloudHSM selected provisionally for ICW key domain; separate ADS keys; 2-of-3 custodian model. | OPEN / NOT DEMONSTRATED |
| Independent review | Review charter and candidate screen | NCC Group, Trail of Bits and Bishop Fox screened from public service descriptions; no contact/appointment/engagement. | NOT COMMISSIONED |

## 2. Work not performed

- No cloud account, project, provider contract, Okta tenant, ADS or HSM has been provisioned.
- No actual configuration exports, IAM policies, named administrators or custodians have been examined.
- No receipt, envelope, signed assertion, HSM key, backup or recovery object exists in this evidence pack.
- No acceptance tests 188–220 have been executed.
- No clean-room recovery exercise has been conducted.
- No independent reviewer has been appointed or engaged.
- No guarantee of rollback resistance, independent authorization, full reconstructability or cryptographic trust is claimed.

## 3. Required next gates

1. Confirm whether the proposed PoC topology is acceptable for evaluation; then obtain provider pricing, regional availability, service contracts, data residency/privacy review and account ownership model.
2. Establish genuine independent human administration for app, witness, ADS, identity, HSM and review domains. If this cannot be achieved, revise the trust claim.
3. Provision non-production test infrastructure only after explicit authorization and signed deployment parameter register.
4. Execute F-01 fault tests and capture raw evidence.
5. Provision ADS/Okta and run F-02 assertion/revocation/outage tests.
6. Build the recovery package and separately reviewed verifier; run F-03 clean-room exercise.
7. Perform HSM key ceremony, backup restore and compromise/quarantine exercise for F-04.
8. Commission independent reviewers after the evidence pack is complete; resolve findings and repeat review.
9. Only then present a separate implementation-authorization decision to the user.

## 4. Governance

PR #33 remains the original v4 draft PR and is not changed by this branch. The v4.1 baseline is preserved. This v4.2 branch is a documentation supplement; it is not merged and does not authorize implementation, migration, evidence ingestion, deployment or tests.

**Overall disposition: F-01–F-04 remain OPEN. Implementation authorization remains WITHHELD.**
