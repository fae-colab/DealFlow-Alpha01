# ICW F-04 — Cryptographic Trust, Key Custody and Compromise Test Specification

**Record date:** 2026-11-15  
**Baseline:** `ICW_F04_KEY_CUSTODY_AND_COMPROMISE_PLAN.md`  
**Baseline blob SHA:** `f3e81f20d00b07c8cdca8b4e6cd06a563bbb3887`  
**Architecture context:** v4 append-only design; F-02 tenant-root/ADS delegation model; F-03 R01–R30 recovery inventory and companion practical test specification.  
**Status:** DOCUMENTARY SPECIFICATION / OPEN / NOT DEMONSTRATED  
**Disposition:** No HSM, key, custodian, algorithm suite, trust root or recovery environment is configured. No implementation, key ceremony, infrastructure spend or live cryptographic test is authorized.

## 1. Purpose and source preservation

This specification turns the existing F-04 key custody and compromise plan into an auditable set of design decisions, test cases and closure evidence. It is a companion document; it does not replace the existing F-04 plan or silently convert provisional selections into deployed facts.

The existing F-04 plan's six key classes are retained exactly:
1. ICW receipt key
2. ADS assertion key
3. Envelope encryption keys
4. TLS/service identity
5. Trust-root/policy keys
6. Recovery-manifest key

The provisional custody model is AWS CloudHSM for the ICW signing key domain, a separate ADS HSM/key domain, and 2-of-3 named human custody for sensitive administration/recovery. This remains a candidate design only. F-01's actual account topology and F-02's actual ADS/tenant trust-root ownership must be evidenced before this plan can be accepted.

## 2. Cryptographic trust model and non-negotiable boundaries

### 2.1 Separate purposes and trust domains

No key may be reused across receipt signing, ADS assertions, envelope encryption, TLS/service identity, trust-root/policy approval or recovery-manifest signing.

The key inventory must record for each key: immutable key ID; purpose/domain; algorithm and parameters; public key/certificate/fingerprint; generation/activation/retirement/revocation/compromise times; HSM/account/region; owner and custodians; authorization policy; backup/restore references; dependent receipts/assertions/objects; and verification-retention end.

The following separation is required:
- ICW receipt signing is separate from ADS assertion signing.
- ADS key administration and policy are separate from DealFlow application/database administration and from ICW receipt-key administration.
- Envelope encryption keys are separate from all signing keys and scoped to approved encryption domains.
- TLS/service identity keys are not accepted as signing or trust-root keys.
- Trust-root/policy approval keys are separate from operational receipt signing.
- Recovery-manifest signing is separate from production receipt signing.

A separate key name or separate IAM role alone does not prove independent control. Record human, account-root, organization, identity-provider, recovery-email, billing, support and break-glass paths that could collapse the boundary.

### 2.2 Tenant authorization root and ADS delegation

F-02 makes the tenant the ultimate authority for its grants and tenant authorization root (TAR). ADS is a delegated assertion service, not the owner of tenant authority. Therefore:
- TAR public-key fingerprint and enrollment evidence must be independently pinned.
- TAR-signed grant, revocation, ADS-key delegation and trust-root changes must be retained.
- ADS key delegation must be scoped by tenant, permitted operation/resource, policy version and validity interval.
- ICW must validate ADS delegation and tenant grant/revocation state independently.
- ADS key compromise must not enable creation or expansion of tenant grants.
- Okta is upstream authentication only; it is not substituted for TAR or the ADS issuer.
- Tenant-root rotation, recovery and compromise must preserve the old trust interval and require out-of-band owner re-verification and second-person approval where the old root is unavailable or suspect.

Actual TAR owners, second approvers, ADS operator, trust-registry owner and HSM custodians are currently unassigned. No real tenant root is enrolled.

### 2.3 Binding cryptographic policy decision — v1 selected

The following version-1 suite is selected as the normative documentary baseline for ICW receipts, ADS assertions, trust-root/policy approvals and recovery manifests. This is not a claim that a live implementation or HSM has been configured.

| Function | Binding v1 selection | Rules |
|---|---|---|
| Asymmetric signatures | ECDSA over NIST P-256 with SHA-256 (ES256 profile) | Unique key per purpose/domain; immutable key ID; no key reuse. |
| Signature encoding | Fixed 64-byte IEEE-P1363 `r || s`, each 32-byte big-endian; low-S form required | Reject DER, variable-length, high-S, malformed and non-canonical encodings. HSM adapter must convert/validate exactly; independent vectors prove equivalence. |
| Content and object digests | SHA-256 | Lowercase 64-character hex for display; raw 32-byte digest in binary structures. |
| JSON canonicalization | RFC 8785 JCS over I-JSON-compatible values, UTF-8 bytes | Reject duplicate property names, invalid Unicode/lone surrogates, NaN/Infinity and unsafe numeric values. Represent money, large integers and exact decimals as canonical decimal strings or integer minor units. Preserve Unicode code points without normalization. |
| Domain separation | Distinct fixed ASCII context prefix per signed object type, followed by NUL and canonical JCS bytes | Versioned distinct contexts for receipt, ADS assertion, TAR grant/delegation, policy, checkpoint, recovery manifest and incident/epoch transition. No cross-purpose signature acceptance. |
| Trusted timestamp | RFC 3161 timestamp tokens from two separately administered TSA operators for checkpoints, key lifecycle events, trust-root changes and recovery/incident manifests | Tokens bind SHA-256 imprint of exact signed bytes/digest; validate TSA chain, policy OID, nonce where used, token signature and historical revocation evidence. TSA time corroborates time; it does not allocate ledger sequence or prove source truth. |
| Transport identity | TLS 1.3; X.509 service certificates using ECDSA P-256/SHA-256 where supported | Separate from application signing keys; managed certificate lifecycle; historical certificate/revocation metadata retained. |
| Payload encryption | AES-256-GCM with a unique 96-bit nonce and 128-bit tag; per-object 256-bit DEK wrapped by a separately administered 256-bit KEK using AES Key Wrap (RFC 3394) | Bind tenant, object ID, schema/version and expected digest as authenticated additional data. Never reuse a nonce with the same key. Separate encryption keys from every signing key. |

**Why ES256 rather than Ed25519:** AWS CloudHSM Client SDK 5 documents ECDSA support; AWS documents Ed25519 in its OpenSSL provider as available only on non-FIPS clusters. P-256 ECDSA is selected as the more compatible baseline for the FIPS-capable CloudHSM candidate. Exact cluster mode, firmware, client SDK and mechanism compatibility must still be verified before key generation. See AWS CloudHSM [PKCS #11 mechanisms](https://docs.aws.amazon.com/cloudhsm/latest/userguide/pkcs11-mechanisms.html), [OpenSSL provider mechanisms](https://docs.aws.amazon.com/cloudhsm/latest/userguide/openssl-provider-mechanisms.html), and [NIST FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final).

RFC 8785 JCS is selected rather than a bespoke canonicalizer. Its I-JSON restrictions, number serialization and Unicode-preservation rules are normative; an implementation-specific “equivalent” serializer is not accepted unless it passes the same independent vectors. See [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html).

**Timestamp interpretation:** the ICW sequencer (selected F-01 candidate: Spanner transaction commit) establishes order. RFC 3161 tokens provide independently verifiable time evidence for designated milestones and checkpoint manifests. If either TSA is unavailable, ledger order remains defined by the ICW but the relevant artifact is marked TIME_ATTESTATION_DEGRADED; the time-attestation acceptance test remains BLOCKED until both tokens are obtained or an independently approved exception is recorded. If the two tokens conflict beyond the approved tolerance, the affected time interval is UNRESOLVED. No local wall clock alone establishes trust.

**Cryptographic policy identifier:** `DF-ICW-CRYPTO-v1`. Each signed receipt/assertion/manifest records this identifier, canonicalization version, digest identifier, signature algorithm identifier and immutable key ID. Algorithm agility requires a new policy version, never silent substitution.
## 3. Key lifecycle controls

### 3.1 Generation and activation

For every signing or trust-root key:
1. Approve purpose, algorithm suite, policy version, custodians and allowed operations before ceremony.
2. Generate inside the designated HSM using approved mechanism and documented entropy source.
3. Prohibit private-key export for signing keys unless a separately reviewed, explicit design exception exists. No exception is currently approved.
4. Record HSM identity/firmware/service version, key ID, public key/certificate, fingerprint, algorithm, parameters, ceremony transcript, operator identities and approvals.
5. Independently compute the public-key fingerprint using a second implementation.
6. Pin fingerprint and key-purpose binding in offline trust register and two independently controlled immutable stores.
7. Create and verify an approved backup checkpoint before production activation.
8. Run known-answer signing and verification vectors from an independent verifier.
9. Activate only after independent reviewer signs the ceremony record and confirms role separation.

Failure at any stage leaves key status GENERATED_NOT_ACTIVE or QUARANTINED; it must not be used for receipt/assertion issuance.

### 3.2 Use and authorization

- Signing service identity and HSM administration identity must be distinct.
- Application and database administrators receive neither HSM administration nor signing permissions.
- Signing service validates key purpose, policy, canonical preimage and request authorization before HSM invocation.
- Sensitive key use, policy change, restore, revocation and destruction require documented quorum/dual control.
- Record every sign, failed sign, admin login, quorum approval, policy change, backup, restore, disable, revoke and destruction request in separately retained audit.
- A successful HSM signature does not itself prove the request was authorized; receipt/assertion must remain bound to independently verified request and policy evidence.
- HSM service, CloudHSM account root, firmware/provider support and backup control plane remain explicit residual dependencies.

### 3.3 Rotation and historical verification

- Rotation creates a new immutable key ID; historical records are never overwritten.
- New public key/fingerprint and delegation/approval must be pinned before activation.
- Record old-key last-signature boundary, new-key first-signature boundary, activation time, overlap policy and approving identities.
- Retain historical public keys, certificates, issuer metadata, revocation and compromise history for the full lifetime of every dependent receipt/assertion.
- Verifier selects key by signed key ID and historically valid trust interval, not by whichever key is currently active.
- Test signatures immediately before/after rotation and during any explicitly approved overlap.
- AWS KMS automatic rotation is not a substitute for rotation of asymmetric signing keys; if an asymmetric KMS key were considered, replacement-key creation and explicit activation would be required.
- Rotation must not retroactively validate signatures made during a compromised or uncertain interval.

### 3.4 Backup, restore and key loss

Existing F-04 plan notes CloudHSM backups are periodic (at least every 24 hours according to the reviewed AWS documentation), so a recent key change may not be in the latest backup. Before activation, record backup ID and verify that the required key and policy are included.

- Copy approved backups to a recovery Region under separately controlled access.
- Preserve backup ID, creation time, source cluster, target region, policy/configuration version and quorum approvals.
- Perform isolated restore before production use and after material HSM/backup-policy changes.
- Verify restored key ID, public fingerprint, key attributes, allowed mechanisms, quorum policy and known-answer signatures.
- If private-key restore fails, do not create a replacement private key under the old key ID. Revoke/retire the unavailable key and use a new key ID and explicitly authorized new epoch/transition, with visible discontinuity.
- Recovery-manifest and public-key verification material must remain available even if the production HSM is unavailable.

## 4. Quorum and human custody

The binding custody policy is 2-of-3 named human custodians for HSM administration and lifecycle actions: user creation/deletion, quorum-policy changes, key generation/activation, key attribute changes, backup restore, key disable/revoke and destruction. The requester may contribute one approval; at least one other distinct custodian must approve, and the HSM-enforced quorum must require two distinct registered users. Routine receipt/ADS signing is performed by a narrowly scoped service identity under HSM key-use policy and is not manually quorum-approved per transaction; every use is audited and rate/role constrained. If the selected HSM cannot enforce the specified quorum for an action, that action requires an independently controlled approval gate outside the HSM. Exact supported operations must be tested before acceptance.

Before acceptance:
- Name all three custodians and their legal/organizational accountability.
- Prove no single individual controls all quorum identities, account roots, identity recovery or break-glass paths.
- Ensure custodians use distinct hardware-backed MFA and separate credentials.
- Define lost-device, unavailable-custodian, departure, coercion, suspected compromise and emergency revocation procedures.
- Require two-person approval for quorum-policy changes, backup restore, signing-key disable/revoke, trust-root changes and key destruction.
- Retain tamper-evident quorum audit and independently review samples.
- Demonstrate app/DB administrators cannot impersonate custodians or bypass quorum through cloud-account administration/support escalation.
- Ensure the quorum group is not merely three credentials controlled by one person or one shared recovery mailbox.

If genuine human/administrative independence cannot be evidenced, downgrade the security claim and keep F-04 OPEN.

## 5. Compromise response and historical uncertainty

### 5.1 Immediate containment

On suspected key, HSM, custodian, issuer or trust-root compromise:
1. Suspend affected signer and stop new receipts/assertions under the suspect key.
2. Fail closed for affected operations; do not use another key as a silent substitute.
3. Preserve HSM audit, CloudTrail/identity logs, ADS/Okta logs, network telemetry, deployment artifacts, trusted-time evidence, backup metadata and immutable receipts.
4. Record detection time, earliest plausible compromise, last independently verified signature and first suspect signature.
5. Identify all dependent receipts/assertions/objects by key ID and time interval.
6. Quarantine the entire uncertainty interval; do not infer that signatures are trustworthy merely because mathematical verification succeeds.
7. Revoke compromised key/issuer and update trust history with two-person approval.
8. Conduct independent investigation and cryptographic review.
9. If authenticity cannot be re-established, stop trust at the last independently verified receipt; mark tail UNVERIFIABLE and create a new epoch only through explicit signed discontinuity/incident record.
10. Re-enable only after independent review and explicit authorized approval.

### 5.2 Key-specific impact

- **ICW receipt key:** receipts in the uncertain interval are not trusted solely because signatures verify; chain is quarantined from last trusted boundary.
- **ADS assertion key:** assertions in the uncertain interval are quarantined; tenant TAR grants and ADS delegation must be revalidated; ADS compromise cannot create new tenant grants.
- **Envelope encryption key:** determine confidentiality exposure and payload availability; key destruction may make content unrecoverable, but must not alter receipt integrity status or erase required tombstone evidence.
- **TLS/service identity:** investigate channel impersonation and credential theft; do not infer historical receipt authenticity from TLS records.
- **Trust-root/policy key:** freeze policy/issuer/trust changes, reconstruct last trusted root and approvals offline; uncertain trust-root changes invalidate dependent trust assertions.
- **Recovery-manifest key:** withdraw affected recovery manifests and rerun verification from raw objects under a newly approved recovery-manifest key; never rewrite the original exercise record.

### 5.3 No retroactive trust

A replacement key cannot retroactively validate old signatures. If compromise time is uncertain, the quarantine interval begins at the earliest plausible compromise, not the first observed malicious action. If trusted time cannot bound the interval, the uncertainty must be widened and reflected in recovery status.

## 6. Test cases and required evidence

Tests below are documentation specifications. Live execution is NOT RUN until an authorized non-production environment, keys, custodians, independent verifier and approved parameters exist.

### F04-T01 — Key-purpose separation
- **Injection:** Attempt to use an ICW receipt key for ADS assertions, TLS or envelope encryption; attempt cross-domain key administration.
- **Detection:** HSM policy and verifier reject wrong-purpose use; audit records denied operation.
- **Isolation:** Disable offending service identity; preserve audit.
- **Recovery:** Restore correct dedicated key domain and policy; no key reuse workaround.
- **Independent verification:** Inspect HSM key attributes, IAM exports and signed test transcript.
- **Acceptance:** Every key is bound to one purpose/domain; cross-use is technically denied, not merely documented.

### F04-T02 — Generation ceremony and fingerprint pinning
- **Injection:** Alter ceremony transcript or public fingerprint; omit one approval; attempt activation before backup/vector verification.
- **Detection:** Independent fingerprint and approval checks fail.
- **Isolation:** Key remains inactive/quarantined.
- **Recovery:** Repeat controlled ceremony with corrected evidence and fresh key ID if integrity is uncertain.
- **Independent verification:** Second implementation recomputes fingerprint and known-answer vectors; reviewer inspects raw HSM audit.
- **Acceptance:** Complete signed ceremony, approvals, offline pinning, backup checkpoint and vectors precede activation.

### F04-T03 — Quorum bypass and custodian compromise
- **Injection:** Attempt sensitive operation with one custodian; compromise one custodian credential; attempt recovery through shared account root or break-glass.
- **Detection:** HSM rejects insufficient quorum; independent audit alerts to bypass paths and credential anomalies.
- **Isolation:** Suspend affected custodian and sensitive operations; rotate/revoke credentials under remaining approved authority.
- **Recovery:** Re-establish quorum with independently verified replacement custodian and documented approval.
- **Independent verification:** Reviewer validates named human separation, MFA, IAM and quorum event logs.
- **Acceptance:** No single human or ordinary app/DB administrator can complete protected operations; all sensitive operations show required independent approvals.

### F04-T04 — Signing authorization boundary
- **Injection:** App/DB admin requests signing; unauthorized service requests signature; signer receives malformed or wrong-purpose preimage.
- **Detection:** Authorization and key-purpose checks reject request before HSM use; denial is audited.
- **Isolation:** Disable compromised service principal; preserve request and audit evidence.
- **Recovery:** Restore approved identity/policy after investigation.
- **Independent verification:** Attempt adversarial role paths using actual IAM; inspect HSM audit to prove no signature was produced.
- **Acceptance:** App/DB roles cannot sign, administer HSM or change trust policy; signer accepts only authorized, canonical, purpose-bound requests.

### F04-T05 — Algorithm, canonicalization and verifier agreement
- **Injection:** Alter algorithm ID/parameters, signature encoding, domain separator, canonical JSON, duplicate keys, Unicode or numeric representation; introduce unsupported algorithm.
- **Detection:** Golden vectors fail; verifier rejects unknown/downgraded policy and ambiguous preimage.
- **Isolation:** Quarantine affected records; no fallback to a different algorithm or canonicalizer.
- **Recovery:** Retrieve exact historical crypto policy and independent verifier build; preserve raw bytes.
- **Independent verification:** Two independently implemented verifiers agree on all positive/negative vectors and exact canonical preimages.
- **Acceptance:** Approved algorithm suite and canonicalization policy are versioned, independently reviewed and pinned. **This test is BLOCKED until exact algorithm parameters are selected.**

### F04-T06 — Rotation and historical verification
- **Injection:** Rotate key; remove historical public key; alter activation/retirement time; try signing with retired key or validating suspect signatures with replacement key.
- **Detection:** Historical key registry and signed rotation events expose invalid interval or wrong key selection.
- **Isolation:** Quarantine signatures in ambiguous interval; reject retired-key signing.
- **Recovery:** Retrieve immutable key history and verify valid pre/post-rotation signatures with their correct keys.
- **Independent verification:** Offline verifier checks all vectors against historical public keys and validity intervals.
- **Acceptance:** Rotation is append-only; old public keys remain available; no signature is silently re-attributed.

### F04-T07 — Backup checkpoint and isolated HSM restore
- **Injection:** Restore an older backup missing the latest key; corrupt/withhold backup; restore into wrong region or with altered quorum configuration.
- **Detection:** Backup metadata, expected key inventory, fingerprints and quorum policy mismatch.
- **Isolation:** Restored HSM cannot sign; production signing remains suspended.
- **Recovery:** Restore the correct backup under quorum; if key is absent/unrecoverable, invoke new-key/new-epoch procedure.
- **Independent verification:** Reviewer checks backup IDs, provider logs, region, key fingerprints, HSM policy and known-answer signature.
- **Acceptance:** Same key identity and approved policy are restored, or a visible new-key discontinuity is correctly recorded. No silent recreation.

### F04-T08 — Compromise interval and quarantine
- **Injection:** Simulate suspected key compromise at a known and an uncertain time; provide valid signatures from inside and outside the uncertainty interval.
- **Detection:** Correlate HSM audit, trust registry, signer logs, trusted time and receipts to determine last safe boundary and earliest plausible compromise.
- **Isolation:** Quarantine all affected receipts/assertions and block downstream verification/recommendations that depend on them.
- **Recovery:** Revoke key, preserve evidence, perform independent investigation, create replacement key and explicit transition only after authorization.
- **Independent verification:** Independent reviewer reproduces affected-object list and verifies that no quarantined signature is promoted.
- **Acceptance:** Uncertain interval remains UNVERIFIABLE unless independently re-established; new key does not retroactively validate it.

### F04-T09 — ADS key compromise versus tenant authority
- **Injection:** Attempt to use compromised ADS key to broaden tenant grants, change TAR, authorize another tenant or bypass revocation.
- **Detection:** ICW rejects missing/invalid TAR-signed grant/delegation and scope mismatch.
- **Isolation:** Revoke ADS key/delegation; quarantine assertions in affected interval.
- **Recovery:** Tenant owner re-verifies and approves new ADS delegation; re-enroll key with append-only history.
- **Independent verification:** Verifier validates TAR chain, grant scope, delegation validity and rejected attack traces.
- **Acceptance:** ADS key alone cannot create/expand tenant authority or cross tenant/resource scope.

### F04-T10 — Envelope encryption key loss and lawful destruction
- **Injection:** Make a test decryption key unavailable or destroy it under an approved erasure fixture; attempt unauthorized key export.
- **Detection:** Key inventory, HSM/KMS audit, tombstone and decryption attempt record show key status.
- **Isolation:** Mark affected payload content PARTIAL/UNAVAILABLE; preserve receipt and permitted tombstone metadata.
- **Recovery:** Restore key only if legally authorized and recoverable; otherwise do not claim plaintext recovery.
- **Independent verification:** Privacy/legal reviewer checks destruction authority; technical verifier checks ciphertext digest, tombstone and content status.
- **Acceptance:** Encryption-key loss never causes false FULL; lawful destruction is evidenced and no erased plaintext is restored.

### F04-T11 — Trusted time, revocation and validity
- **Injection:** Skew or remove time source; alter timestamp; omit revocation record; validate assertion after expiry.
- **Detection:** Time uncertainty and trust-history gaps are detected; policy rejects unverifiable validity.
- **Isolation:** Quarantine signatures/assertions whose validity cannot be bounded.
- **Recovery:** Retrieve independently retained trusted-time evidence and signed revocation history; otherwise widen uncertainty interval.
- **Independent verification:** Reviewer reproduces time bounds and historical validity decision.
- **Acceptance:** No default local clock or current JWKS is used as sole historical authority; unbounded time uncertainty remains explicit.

### F04-T12 — Recovery-manifest key compromise
- **Injection:** Alter or forge recovery manifest using compromised/unauthorized manifest key.
- **Detection:** Offline fingerprint pin and signature validation reject manifest.
- **Isolation:** Withdraw manifest and any dependent recovery acceptance.
- **Recovery:** Re-run manifest creation from verified raw evidence with newly approved manifest key and new run ID; retain compromised manifest as incident evidence.
- **Independent verification:** Reviewer checks new key ceremony, manifest signature and independently recomputed counts/digests.
- **Acceptance:** No compromised manifest is used to declare F-03 recovered; prior record is not overwritten.

## 7. F-03 integration requirements

F-04 must directly support F-03 classes:
- R11 issuer trust metadata and historical JWKS/certificates/revocation;
- R12 witness key history and offline fingerprint pins;
- R13 crypto policy, canonicalization and verifier versions;
- R28 signed recovery manifest and independent verifier output;
- R29 HSM backup IDs, custody approvals, recovery-region restore logs and key audit.

A cryptographic verification PASS does not establish content recovery, semantic replay or decision-history reconstruction. Conversely, recovered bytes without historical key/policy verification do not establish authenticity. F-03 must report integrity, provenance, reconstruction and recomputation separately.

## 8. Closure evidence checklist

F-04 may move to ACCEPTED only after all applicable items exist and are independently reviewed:

1. Approved versioned crypto policy with exact algorithms, parameters, canonicalization, signature encoding, domain separation, trusted-time and deprecation policy.
2. HSM inventory/configuration/firmware or service-version export and documented non-exportability controls.
3. Named human custodians, 2-of-3 quorum configuration, hardware-backed MFA and IAM exports.
4. Evidence that app/DB admins cannot access HSM administration, signing permissions, trust roots, ADS keys or recovery credentials.
5. Signed generation ceremony transcript, independently computed public fingerprints and offline trust-root pins.
6. Positive and negative known-answer vectors verified by two independent implementations.
7. Key rotation, historical verification, revocation and compromise runbooks with tested uncertainty intervals.
8. Backup IDs, cross-region recovery records and successful isolated HSM restore with same key fingerprint and quorum policy.
9. ADS/TAR delegation and compromise tests proving tenant authority cannot be expanded by ADS key compromise.
10. Envelope encryption key recovery/destruction and legal-erasure integration evidence.
11. Recovery-manifest key separation and signature validation evidence.
12. Raw HSM/provider/identity audit, incident timeline and independently signed test reports.
13. Independent cryptographic review identifying tested versions, residual trust, assumptions and unresolved findings.

No test can be marked PASS from a mock HSM, software-generated key stored with the application, local-only verifier or vendor documentation alone where live control behavior is required.

## 9. Open decisions and blockers

The following documentary selections are binding for v1; operational facts remain hard blockers:
- FIPS-capable AWS CloudHSM configuration and exact cluster/client SDK/firmware/mechanism compatibility;
- complete independent golden-vector corpus and two separately implemented verifiers;
- two actual RFC 3161 TSA operators, their policy OIDs, certificates, revocation archives and approved maximum disagreement/response-latency policy;
- certificate issuer/operator and concrete certificate profile/validity/revocation evidence configuration;
- named tenant owners, second approvers, ADS operator, trust-registry owner and three HSM custodians;
- actual AWS account/org ownership and independent root/break-glass administration;
- exact CloudHSM cluster configuration, firmware/service version, quorum policy and recovery region;
- backup interval, acceptable key-loss window, restore objectives and verification schedule;
- operational cryptoperiods and maximum data/signature volume per key, to be approved by the independent cryptographic reviewer using actual workload and risk assessment; no arbitrary calendar interval is imposed;
- historical public-key, certificate, TSA and revocation evidence retention period, covering every dependent record and the legally approved audit-retention period;
- compromise detection/uncertainty policy and maximum acceptable unverified interval;
- named KMS/KEK operator, actual KEK custody and recovery ownership; legal destruction/erasure policy and approved retention schedule;
- independent cryptographic reviewer and review date.

The provisional CloudHSM choice must be re-evaluated against the actual F-01 account topology and the F-02 ADS custody boundary. A single cloud-provider organization or common unrestricted human administrator may defeat claimed independence even if key domains are separate.

## 10. Current disposition

**F-04: CRYPTOGRAPHIC POLICY v1 AND CUSTODY CONTROL MODEL DOCUMENTARILY SELECTED; OPERATIONAL ACCEPTANCE BLOCKED / NOT DEMONSTRATED.**

No HSM, signing key, ADS key, TAR, recovery key, custodian group or live test environment has been configured. No key ceremony, backup restore, rotation or compromise exercise has occurred. No claim of cryptographic trust, key recoverability or compromise resistance is made.

The next action is independent review of the selected v1 suite and custody model, followed by assignment and verification of actual independent human/legal custodians, TSA operators and account ownership. Only after that evidence and explicit authorization may a non-production key ceremony or HSM test be considered.
