# ICW F-04 — Cryptographic Key Custody and Compromise Plan

**Record date:** 2026-11-15  
**Status:** Design selected for evaluation; no HSM, key or custodian configured.  
**Disposition:** F-04 remains OPEN / NOT DEMONSTRATED.

## 1. Key domains

Never reuse keys across receipt signing, ADS assertions, encryption, TLS or artifact signing.

| Key class | Purpose | Proposed custody | Recovery/verification |
|---|---|---|---|
| ICW receipt key | Sign receipts and epoch records | AWS CloudHSM in dedicated ICW trust account; non-exportable private key; quorum control | HSM backup/restore; historical public keys in two immutable stores |
| ADS assertion key | Sign request-bound assertions | Separate ADS HSM/key domain, separate administrators and credentials | Historical public keys/JWKS and revocation records retained independently |
| Envelope encryption keys | Encrypt payloads at rest | Separate per trust domain/provider | Key IDs and decryption availability tracked; destruction requires legal approval |
| TLS/service identity | Service channel authentication | Separate managed certificate lifecycle | Certificate and revocation history retained |
| Trust-root/policy keys | Approve issuer registry, policy, verifier releases and epoch transitions | Offline or separately administered HSM-backed approval keys; 2-of-3 human custody | Public fingerprints and approvals pinned offline and in WORM stores |
| Recovery-manifest key | Authenticate recovery manifests/approval | Separate from production signing keys; quorum-controlled | Public verification material retained with exercise evidence |

## 2. Provisional HSM selection

AWS CloudHSM is the provisional ICW signing HSM candidate. Official documentation describes M-of-N quorum authentication for selected key/user operations, periodic encrypted cluster backups containing users, keys, certificates and configuration, and cross-region backup copying/restoration. AWS states the HSM encrypts backup data before transfer and AWS cannot decrypt that HSM-encrypted layer.

Sensitive key use, administration, backup restore and policy changes must require 2-of-3 named human custodians. CloudHSM documentation notes a requesting HSM user can contribute one approval; therefore at least one additional independent custodian must approve, and no individual may control all quorum identities. ADS must use a distinct key domain and separate operators.

## 3. Lifecycle controls

### Generation and activation
- Generate keys inside the HSM using approved algorithms/parameters and documented entropy source.
- Record key ID, public key, certificate, algorithm, creation time, custodian approvals, HSM firmware/service version and ceremony transcript.
- Independently fingerprint and pin public key in offline trust-root register and both immutable stores.
- Prohibit export of private signing keys.
- Activate only after backup checkpoint, independent public-key pinning and known-answer test.

### Use
- Distinct service identities for signing requests and key administration.
- Signing service validates canonical payload and key purpose before HSM invocation.
- Two-person approval for sensitive use, policy changes, restore, revocation and destruction.
- App/DB admins receive neither HSM admin roles nor signing permissions.
- Alert and retain audit for every sign, quorum action, policy change, backup, restore, disable and deletion request.

### Rotation
- Create a new key ID; never mutate historical key record.
- Pin new public key/certificate before activation; record activation and first signature.
- Retain old public keys, certificate chains and revocation history for lifetime of every dependent receipt/assertion.
- Verification may accept historical keys according to signed validity history; signing uses one explicitly active key.
- Test cross-rotation known-answer vectors.
- AWS KMS automatic rotation does not apply to asymmetric keys; if used for asymmetric signing, rotate by creating and activating a replacement key.

### Compromise procedure
1. Suspend affected signer and new appends/assertions immediately.
2. Preserve HSM audit, CloudTrail/Okta logs, network telemetry, deployment artifacts, trusted time and receipts.
3. Establish detection time, earliest plausible compromise, last independently verified signature and first suspect signature.
4. Quarantine every receipt/assertion in the uncertainty interval.
5. Independently investigate using HSM audit, quorum records, deployments, key history, timestamps and provider logs.
6. If authenticity cannot be re-established, stop trust at last verified receipt; mark tail UNVERIFIABLE and create a new epoch only with explicit signed discontinuity/incident record.
7. Revoke compromised key/issuer; create replacement under new ceremony; update trust registry with two-person approval.
8. Re-enable only after independent cryptographic review and explicit authorized approval. New key never retroactively validates old uncertain signatures.

## 4. Backup and disaster recovery

CloudHSM backups are periodic (at least every 24 hours according to AWS docs), so a recent key change may not exist in the latest backup. Force/verify a suitable backup checkpoint before production use; record backup ID. Copy backups to a recovery Region and retain public key/certificate history outside HSM. Perform isolated restore and verify key IDs, fingerprints, quorum policy and signing vectors.

HSM backup is provider-controlled encrypted recovery, not customer-exportable private-key escrow. If private-key restore fails, do not recreate a key under the old ID; use a new key/epoch and document discontinuity.

## 5. Residual trust

CloudHSM, AWS control plane, hardware/firmware, backup process, account root and provider support remain residual dependencies. Quorum alone does not guarantee independent human custody if all custodians are controlled by one person. Public-key verification does not prove real-world operator identity. Matching digests do not prove source truth. Locked retention can conflict with erasure; legal/privacy approval must define payload deletion, key destruction and tombstone policy.

## 6. Closure evidence

HSM config/inventory/firmware and non-exportability; named custodians and 2-of-3 quorum/IAM exports; generation ceremony and offline fingerprints; rotation/revocation/backup/restore/compromise runbooks; backup IDs and restore transcript; known-answer vectors; app/DB-admin denial evidence; historical verification across all keys; compromise interval/quarantine report; independent cryptographic review.

## 7. Official sources reviewed

- CloudHSM quorum: https://docs.aws.amazon.com/cloudhsm/latest/userguide/quorum-authentication.html
- CloudHSM key-operation quorum: https://docs.aws.amazon.com/cloudhsm/latest/userguide/key-quorum-auth-chsm-cli.html
- CloudHSM backups: https://docs.aws.amazon.com/cloudhsm/latest/userguide/manage-backups.html
- Backup security: https://docs.aws.amazon.com/cloudhsm/latest/userguide/data-protection-backup-security.html
- Cross-region backup: https://docs.aws.amazon.com/cloudhsm/latest/userguide/copy-backup-to-region.html
- KMS asymmetric rotation: https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html

**F-04 status: OPEN / NOT DEMONSTRATED.** No key ceremony, HSM configuration, custodian group, restore or compromise exercise has occurred.


---

## 8. Binding documentary amendment — cryptographic policy v1 (2026-11-15)

This amendment resolves the algorithm and custody-model choices left open in the original plan. The original six key classes and their separation are unchanged. This amendment is normative for the v4.2 documentation baseline; it does not create keys or authorize HSM provisioning.

### 8.1 Cryptographic suite

Adopt policy identifier `DF-ICW-CRYPTO-v1`:
- Signatures: ECDSA P-256 with SHA-256 (ES256 profile), unique key per purpose.
- Signature encoding: fixed 64-byte IEEE-P1363 `r || s`, 32-byte big-endian components, low-S form; reject DER/variable/high-S encodings.
- Digests: SHA-256.
- JSON: RFC 8785 JCS, UTF-8; reject duplicate names, invalid Unicode, NaN/Infinity and unsafe numeric values. Encode money and large/exact integers as integer minor units or canonical decimal strings.
- Domain separation: unique versioned ASCII context per signed object type, NUL separator, then canonical bytes.
- Payload encryption: AES-256-GCM, unique 96-bit nonce per encryption under each key, per-object DEK wrapped by a separately administered KEK; bind tenant/object/schema/digest as AAD.
- Transport: TLS 1.3 and separate X.509 service identity keys/certificates.
- Timestamp: RFC 3161 tokens from two independent TSA operators for checkpoints, key lifecycle events, trust-root changes and recovery/incident manifests. ICW sequencing, not timestamp values, establishes ledger order.

AWS CloudHSM SDK 5 documents ECDSA; AWS documents Ed25519 only for non-FIPS clusters in its OpenSSL provider. ES256 is selected as the compatible baseline for the FIPS-capable CloudHSM candidate. Exact module/service configuration and signing encoding remain subject to pre-ceremony compatibility testing. RFC 8785 and NIST FIPS 186-5 are the documentary bases; see the companion F-04 test specification for the source references and required vectors.

### 8.2 Custody model

- ICW receipt signing: non-exportable ES256 private key in a dedicated AWS CloudHSM trust account, separate from the AWS S3 archive account and the application account; independent account-root and HSM custodians.
- ADS assertion signing: separate HSM/key domain and separate administrators from ICW; ADS operator must not administer the ICW receipt key. Tenant TAR remains tenant-controlled as defined by F-02.
- Trust-root/policy signing: offline or separately administered HSM-backed approval keys; tenant TAR is not replaced by a DealFlow operator key.
- Recovery-manifest signing: separate key and custody from production receipt signing.
- Envelope encryption: per-object AES-256-GCM DEKs wrapped by a separately administered KEK; no signing-key reuse.
- TLS/service identity: independent managed certificate lifecycle; no signing or trust-root use.

The 2-of-3 human quorum applies to HSM administration and lifecycle operations (user/policy changes, key generation/activation, restore, disable/revoke and destruction). Routine machine receipt/ADS signing is performed by a constrained service identity and is audited; it is not manually approved for every transaction. HSM-enforced quorum must be verified for each protected operation. The requester may count as one approval, so a second distinct custodian is mandatory.

### 8.3 Explicitly unresolved operational assignments

The model is selected, but actual named custodians, tenant owner/second approver, ADS legal operator, TSA providers, account owners, legal retention basis, HSM region/firmware, backup/restore objectives and numeric timestamp-disagreement policy are not available in the source record. These are evidence/ownership blockers, not reasons to revert to unspecified cryptographic algorithms. F-04 remains OPEN / NOT DEMONSTRATED.

No HSM, key, certificate, TSA subscription or provider account has been created or purchased.
