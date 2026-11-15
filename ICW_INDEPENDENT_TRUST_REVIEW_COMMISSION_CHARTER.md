# DealFlow ICW — Independent Trust Review Commission Charter

**Record date:** 2026-11-15  
**Status:** Commission package prepared; reviewer not appointed or engaged.

## 1. Independence

Reviewer must be independent of DealFlow design/implementation, the people who configured witness/storage/ADS/HSM, and any provider whose service claims are under review. Compensation must not depend on a passing result. Evidence authors may explain but cannot be sole reviewers of their own work.

## 2. Competence

The engagement requires demonstrated expertise in distributed systems consistency and quorum semantics; cloud IAM/account separation and WORM storage; OAuth/OIDC, authorization policy, JWT/JWS/JWKS and identity assurance; HSM/key ceremonies/compromise; clean-room recovery and evidence integrity; privacy, retention and erasure.

A single generalist may not be qualified to sign off all four domains. Appoint an independent lead and domain reviewers as needed.

## 3. Mandatory scope

### F-01
Verify exact configuration's durable-ack semantics; receipt-to-envelope binding; app/DB/admin/provider ability to delete, suppress or reorder; crash/AZ/region/cloud-account/provider failure behavior; contractual RPO/RTO and exclusions.

### F-02
Verify ADS independence; identity proofing and entitlement provenance; whether app admin can obtain/broaden assertion; cryptographic binding of request digest, command, scope, tenant, policy version, audience, expiry and replay; fail-closed revocation/outage.

### F-03
Verify inventory completeness; recovery without DB/backups/cache/app exports; immutable dependency and actual model-output retention; exact missing/erasure semantics; independent verifier's reconstructed head and semantic result.

### F-04
Verify key-domain separation, non-exportability, multi-person custody, historical verification after rotation, compromise interval quarantine and HSM backup restore.

## 4. Required evidence before review starts

Pinned architecture/server/test/traceability docs and hashes; provider contracts and configuration exports; IAM/account ownership diagrams; raw F-01 fault logs and receipt/object digests; Okta/ADS config, policies, assertions and audit; HSM config, custody ceremony, key history, restore and compromise artifacts; F-03 recovery manifest/transcript/verifier/replay/erasure outputs; environment identity, build digests, timestamps and deviations.

Missing evidence must be reported BLOCKED/NOT DEMONSTRATED, never inferred PASS.

## 5. Deliverables

Signed independence/conflict declaration; methodology and threat model; finding-by-finding evidence assessment with artifact hashes and reproducible steps; severity-ranked findings and residual risks; explicit CLOSED/OPEN/BLOCKED/NOT APPLICABLE disposition; reproducibility appendix; recommendation WITHHOLD or ELIGIBLE FOR USER DECISION. Reviewer cannot authorize implementation for the user.

## 6. Commissioning status

**NOT COMMISSIONED.** No named reviewer/firm, conflict check, references, fee, engagement terms, evidence-access agreement or signed acceptance exists. The charter is ready to solicit, not an engagement.

To commission, identify a qualified independent reviewer; verify conflicts and references; agree scope, fee, secure evidence access and deliverables; obtain explicit user approval; then provide the complete evidence pack. The reviewer must not be asked to pass the design before F-01–F-04 evidence exists.

**Current status: READY TO SOLICIT, NOT COMMISSIONED.** No implementation or merge authorization is implied.
