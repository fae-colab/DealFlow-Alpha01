# Adversarial Disaster Recovery Review

## Overall disposition

**F-03 should remain OPEN / NOT DEMONSTRATED. No operational recovery claim is supportable from the supplied package.**

The F-03 material is unusually candid about this. It states that the live exercise is blocked and not run, that no recovery object was recovered, and that no clean-room result, RPO/RTO result, or FULL status is claimed. The master register and execution status repeat that no provider-backed infrastructure, receipt set, recovery credentials, HSM backup, independent verifier, or recovery exercise exists. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

The specification is a useful **test design**, but it is not recovery evidence. More importantly, several design defects could still allow an incomplete or compromised recovery to receive an apparently successful result unless corrected before execution.

### Recommended status

- **F-01:** OPEN, operational dependencies unavailable.
- **F-02:** OPEN, authority and identity recovery unavailable.
- **F-03:** OPEN, test specification only, with material revisions required before execution.
- **F-04:** OPEN, key recovery and cryptographic verification unavailable.
- **Implementation or production authorization:** **HOLD.**

---

# Critical findings

## CR-01: The supplied “complete package” does not contain the complete normative recovery contract

The review charter says the reviewer must assess four core v4 documents alongside F-01 through F-04:

- `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md`
- `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md`
- `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md`
- `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md`

Those documents are named by the charter but are not included as source-document sections in [ICW_v4_2_Frozen_Review_Package.pdf](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942&EntityRepresentationId=f24adc49-b674-4d77-a7a7-43a76d5fa886). The PDF contains the closure documents, F-01 through F-04 material, charter, RFP, and status record, but not the core implementation contract that supposedly defines commit behavior, checkpoint behavior, projection rebuilding, consumer gating, and migration. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

### Consequence

It is impossible to establish from the supplied package whether:

- R01-R30 cover every object required by the actual implementation.
- The recovery order matches the actual service bootstrap order.
- Checkpoints and post-checkpoint tails are processed correctly.
- APIs, caches, exports, and downstream consumers enforce recovery state.
- The specified manifest fields are actually emitted by the implementation.
- The recovery procedure agrees with the implementation’s idempotency and transaction behavior.

### Corrective action

Create a **normative recovery dependency trace** with one row for every implemented component and persisted artifact:

1. Producing component.
2. Authoritative source.
3. F-03 recovery class.
4. Receipt or manifest binding.
5. Restore order.
6. Verification oracle.
7. Failure consequence.
8. Required evidence.
9. Corresponding implementation requirement and test ID.

Do not authorize an exercise until the missing core documents are included in the frozen review baseline and every recovery dependency in them maps to R01-R30 or to a formally approved new class.

---

## CR-02: F-03 contains a stale topology contradiction

The original F-03 inventory lists as a precondition: **“Provision actual F-01 stores and MRSC ledger metadata.”** It also instructs retrieval of receipts and envelopes “from both stores.” But the binding F-01 decision supersedes the DynamoDB MRSC topology and carries forward **Spanner multi-region plus S3 Object Lock Compliance** as the sole primary candidate. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

The companion F-03 specification refers more generally to actual stores and a witness, but it says it preserves the original inventory without reinterpretation. This leaves an executable conflict over:

- Which witness metadata must exist.
- Whether there is one envelope archive or two.
- Whether receipt enumeration is from Spanner rows, archived receipt objects, or both.
- Whether “both stores” means Spanner and S3, two object stores, or an obsolete S3/GCS design.
- What evidence constitutes an independent witness copy.

### Consequence

An operator could improvise the topology during the exercise, or mark a required second copy not applicable, while still claiming compliance with the companion specification.

### Corrective action

Issue a signed F-03 amendment that:

- Replaces the MRSC precondition with the selected Spanner/S3 candidate.
- Defines the authoritative location of receipts, heads, idempotency records, envelopes, historical receipt exports, and checkpoints.
- States explicitly whether a separately retained receipt archive is mandatory.
- Defines “independent copy” and “both stores.”
- Identifies every provider API used during recovery.
- Updates all exercise instructions and evidence fields consistently.

Until then, the procedure is **not executable without operator interpretation**.

---

## CR-03: The expected-truth oracle is not independently established

F-03 requires the exercise to pre-pin expected genesis/head, counts, IDs, digests, sequence range, exact object versions, and the dependency graph. R28 then compares recovery enumeration to that manifest. But the package does not define a trustworthy method for producing those expected values independently of the system being recovered. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

If the expected manifest is generated from:

- the current Spanner head,
- an application export,
- a provider-local latest pointer,
- the same compromised account,
- or the same recovery software,

then a rolled-back or truncated history can agree perfectly with the expected manifest.

### False-positive example

1. The last 1,000 accepted receipts are suppressed.
2. A stale but internally valid head and matching manifest are supplied.
3. Recovery obtains a contiguous chain from genesis to that stale head.
4. Every digest and count matches.
5. The procedure declares the ledger recovered, even though acknowledged commits are missing.

### Corrective action

Require at least two independently controlled pre-disaster anchors, such as:

- externally retained signed head/checkpoint manifests;
- independently timestamped head commitments;
- immutable audit exports containing commit identities;
- customer-held or auditor-held head receipts;
- separately controlled archival receipt enumeration.

The exercise must deliberately inject a **coordinated rollback of witness head, expected manifest, and one audit source**. PASS requires discovery through an independent anchor. If no outside anchor exists, the result must state:

> “Internally consistent recovery achieved; completeness relative to all prior acknowledgements not proven.”

---

## CR-04: “PASS for declared scope” permits scope manipulation

The specification allows a recovery exercise to pass “for its declared scope,” and FULL is permitted when every component “required by the declared recovery scope” is complete. Although all 30 classes must be represented, the package does not define non-negotiable minimum recovery profiles or who may narrow scope. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

### Consequence

A test could exclude difficult tenants, time intervals, encrypted payloads, historical keys, external data, or model-assisted decisions and still report a scoped PASS or FULL in a way that users may misinterpret as system-wide recovery.

### Corrective action

Define fixed recovery profiles:

- **Profile L:** ledger integrity only.
- **Profile C:** ledger plus all lawfully retained content.
- **Profile D:** decision history and provenance.
- **Profile O:** operational service restoration.
- **Profile A:** complete approved production scope.

For each profile, define mandatory:

- tenants and epochs;
- date/sequence boundaries;
- R01-R30 classes;
- object types;
- provider locations;
- key ranges;
- legal exclusions;
- RPO/RTO targets.

Prohibit the word **FULL** without a profile identifier, exact scope hash, omitted-object list, and coverage percentage based on the independently established pre-disaster inventory.

---

## CR-05: Clean-room recovery does not include operational service restoration

The F-03 sequence reconstructs receipt, content, provenance, and decision history, but it does not demonstrate that a working service can be brought online safely. The package does not specify restoration of:

- network and DNS control;
- service discovery and endpoints;
- infrastructure-as-code state;
- workload identities;
- certificate issuance;
- runtime secrets;
- queues and background workers;
- monitoring and alerting;
- rate limits and provider quotas;
- consumer gating;
- cache invalidation;
- frozen projection backlogs;
- controlled cutover;
- rollback of the recovery attempt;
- post-recovery business validation.

R22 covers configuration/deployment artifacts, but its acceptance criterion is historical configuration availability, not proof that the complete service can be started safely in a clean account. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

### Consequence

The exercise could prove archival reconstruction while the service remains impossible to operate. That is disaster-recovery evidence for data, not for the business service.

### Corrective action

Add an **Operational Restoration Profile** with objective tests:

1. Deploy into a clean organization/account without reusing production identities.
2. Establish new network, DNS, TLS, monitoring, and workload identities.
3. Restore authoritative history.
4. Rebuild projections only from verified receipts.
5. Demonstrate all APIs reject stale, pending, quarantined, and mismatched state.
6. Run business-level synthetic transactions.
7. Prove duplicate prevention after cutover.
8. Prove old production instances cannot resume writing.
9. Perform authorized re-enablement.
10. Measure service availability from declaration of disaster to approved business service.

---

# High findings

## H-01: Recovery credentials have no demonstrated bootstrap path

The clean room may use “documented recovery credentials,” independently pinned trust roots, and authorized recovery services. F-01, F-02, and F-04 simultaneously require independent administrators, separate identity recovery, quorum custody, and provider account ownership, but none of these people, accounts, identities, or paths exists. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

The procedure does not test recovery when:

- the corporate identity provider is unavailable;
- the primary administrator is compromised;
- recovery email or phone is inaccessible;
- federation between clouds is disabled;
- one custodian is unavailable;
- the cloud support channel is hostile or delayed;
- billing suspension blocks service access;
- break-glass credentials are stale or revoked.

### Testable corrective action

Run a credential-denial matrix:

- normal federated identity unavailable;
- one custodian unavailable;
- one custodian compromised;
- account root credentials unavailable;
- recovery mailbox unavailable;
- hardware token lost;
- organization policy blocks role assumption;
- provider support unavailable;
- cross-cloud federation disabled.

PASS requires access under the documented quorum without use of production application credentials or an unapproved super-admin path.

---

## H-02: Provider unavailability is insufficiently covered

The specification covers missing objects and generic outages, and F-01 calls for region/provider-outage tests. It does not define a recovery result when one of the required providers is entirely inaccessible for an extended period. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

For the selected topology:

- Spanner is required to enumerate authoritative receipt history.
- S3 is required to retrieve exact envelope versions.
- CloudHSM is proposed for restoration of the receipt signing key.
- ADS/Okta and historical trust services are needed for authorization verification.
- Two TSA histories are expected for designated milestones.

A clean room that still requires every original provider is not provider-independent recovery. It is a fresh client of the same providers.

### Corrective action

Define and test three separate claims:

1. **Same-provider regional recovery.**
2. **Same-provider account-loss recovery.**
3. **Provider-exit recovery.**

For each provider, identify the customer-controlled export required to reconstruct and verify history without that provider. If provider-exit restoration is not supported, narrow the portability claim explicitly.

---

## H-03: RPO and RTO are placeholders, not assumptions that can be tested

F-03 correctly says RPO/RTO acceptance is blocked unless numeric targets are approved in advance. No targets are provided. More importantly, the measurement definitions are absent. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

Missing definitions include:

- RPO relative to accepted acknowledgement, envelope upload, Spanner commit, receipt export, or checkpoint publication.
- Whether unrecoverable acknowledged commits are permitted.
- Whether orphaned pre-commit envelopes count as loss.
- RTO start event.
- RTO end event.
- Whether end means bytes retrieved, ledger verified, projections rebuilt, APIs online, or business operations approved.
- Maximum data volume and backlog.
- Recovery throughput and cost assumptions.
- Degraded-mode objectives.

### Corrective action

Set separate objectives:

- **Ledger RPO:** accepted receipts lost.
- **Content RPO:** accepted envelopes unavailable.
- **Verification RTO:** trusted head reconstructed.
- **Content RTO:** retained payload scope restored.
- **Service RTO:** verified business service approved online.
- **Decision-history RTO:** historical decision dependencies reconstructed.
- **Key-recovery RTO:** signing capability restored or explicit new epoch established.

Measure each from immutable timestamps and publish percentile and worst-case results over repeated exercises.

---

## H-04: Backup integrity and restore verification are mostly specifications, not tested controls

R29 and F-04 define HSM backup IDs, fingerprint comparison, quorum approvals, isolated restore, known-answer signatures, and a visible new-key/epoch path. But no HSM, backup, key, restore transcript, or custodian group exists. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

The package also does not demonstrate:

- that the latest activated key is included in a restorable backup;
- that backup copies survive account loss;
- that restored key attributes and policies match;
- that public-key history survives independently;
- that encrypted payload KEKs are recoverable;
- that corruption is detected before a disaster;
- that restore throughput meets any RTO.

### Corrective action

Execute periodic restore tests from randomly selected backup generations, including:

- latest backup;
- previous backup;
- backup immediately before key rotation;
- backup immediately after activation;
- deliberately corrupted or incomplete backup;
- wrong-region restore;
- wrong-account restore attempt;
- missing custodian;
- altered quorum policy;
- restored key with correct fingerprint but wrong allowed operations.

A provider report that a backup exists is not restore evidence.

---

## H-05: No end-to-end compromised-control-plane scenario

Tests address compromised application administrators, ADS keys, HSM custodians, and recovery-manifest keys separately. The procedure lacks a compound scenario where a compromised identity administrator or cloud organization administrator can alter multiple recovery dependencies at once.

### Required scenario

Inject compromise of:

- the identity provider;
- one cloud organization administrator;
- recovery manifest preparation;
- deployment manifest;
- current-head pointer;
- one audit export.

Then require recovery using offline pins, independently controlled anchors, a separate provider account, and two-person approval.

The test must prove that a common super-admin cannot silently:

- substitute trust roots;
- replace verifier builds;
- narrow recovery scope;
- suppress alerts;
- select an older valid manifest;
- or approve re-enablement.

---

## H-06: Checkpoint recovery is referenced but checkpoints are not a clearly enumerated recovery class

Compound scenario C02 requires recovery from an older valid checkpoint and discovery of a complete post-checkpoint tail. Yet R01-R30 do not identify checkpoints, checkpoint anchors, checkpoint inclusion proofs, publication records, or external anchor evidence as a distinct object class. They may be implicitly distributed across R03, R12, R13, R26, or R28, but that is not operationally safe. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

### Corrective action

Either:

- add a new recovery class for checkpoint and anchor artifacts, or
- amend the relevant existing classes with explicit mandatory checkpoint fields and missing consequences.

Test:

1. Valid old checkpoint plus complete tail.
2. Valid old checkpoint plus suppressed tail.
3. New checkpoint with missing prefix.
4. Compromised checkpoint signing key.
5. Checkpoint object present but external anchor absent.
6. Two conflicting valid-looking checkpoints.

---

# Recovery inventory completeness

## Dependencies absent or insufficiently explicit in R01-R30

These may fit inside existing classes, but they are not defined with enough precision to guarantee inclusion:

1. **Infrastructure-as-code and account bootstrap**
   - organizations, projects, accounts, regions, service activation, policies, quotas, network boundaries.

2. **Provider-account ownership and recovery**
   - root identities, recovery mailbox/phone, billing owner, support authorization, organization-level policy.

3. **Identity bootstrap**
   - clean-room identity provider, administrator enrollment, MFA seed/token replacement, federation setup.

4. **Network and name resolution**
   - DNS zones, certificates, routes, firewall rules, private endpoints, egress controls.

5. **Secrets other than cryptographic keys**
   - provider API credentials, service bootstrap tokens, database credentials, webhook secrets, certificate enrollment credentials.

6. **Artifact and dependency availability**
   - source repositories, container registry, package mirrors, compiler/toolchain installation media, licenses.

7. **Independent verifier supply chain**
   - source origin, build system, compiler integrity, signing chain, reproducibility procedure, vulnerability status.

8. **Audit destination restoration**
   - log export configuration, log query capability, retention, time synchronization, read credentials.

9. **Checkpoint and external-anchor artifacts**
   - checkpoint bytes, publication records, TSA tokens, public anchor proofs, customer-held receipts.

10. **Projection and consumer state**
    - projection schema, rebuild cursor, pending queue, cache generation, downstream publication state.

11. **Operational control state**
    - maintenance mode, append-disable flag, quarantine state, cutover authorization, old-site fencing.

12. **Capacity and performance dependencies**
    - provider quotas, throughput assumptions, egress limits, throttling, recovery storage capacity.

13. **Communication and decision records**
    - disaster declaration, authority to invoke recovery, escalation contacts, regulator/customer notification rules.

14. **Recovery tooling**
    - enumerators, downloaders, retry state, resumable manifests, rate-limit handling, secure temporary storage.

15. **Time-source recovery**
    - availability of historical TSA chains, revocation archives, approved clock uncertainty, trusted-time retrieval.

### Required inventory change

Do not merely place these under R22 or R28 as free-form attachments. For each dependency, define:

- stable identifier;
- authoritative owner;
- immutable version;
- integrity binding;
- retrieval method;
- recovery order;
- freshness rule;
- missing consequence;
- negative test;
- required raw evidence.

---

# Recovery ordering and dependency failures

## Current ordering problem

The specification gives a logical reconstruction sequence, but not a machine-enforceable dependency graph.

Several circular or hidden dependencies exist:

- R28 recovery manifest is needed to prove the run, but the run is needed to establish actual recovered objects.
- R27 independent audit is itself a recovery object while also being necessary to validate recovery.
- R11-R13 trust material validates receipts, but trust material itself depends on R01 trust roots and F-04 custody evidence.
- R09-R10 authorization evidence depends on R11 issuer history and F-02 trust roots.
- R15-R16 snapshots depend on R17-R25, but snapshot integrity can verify before semantic reproducibility.
- R29 key recovery may depend on provider identities and network configuration not captured as explicit predecessor objects.
- R30 legal scope must be known before payload retrieval, not merely reconciled near the end.

### Required recovery order

A safer order is:

1. **Authorize and constrain recovery**
   - disaster declaration, legal scope, operator identities, clean-room account.

2. **Establish offline trust**
   - recovery-manifest key pins, tenant roots, witness roots, verifier release pins.

3. **Verify recovery tooling**
   - build digest, SBOM, known-answer vectors, independent build comparison.

4. **Establish provider access without production identity**
   - accounts, network, MFA, quorum, audit capture.

5. **Recover legal and retention controls**
   - R30 and R08 constraints before payload retrieval.

6. **Recover trust histories**
   - R01, R11, R12, R13, R14.

7. **Enumerate ledger**
   - R02 and R03 from genesis and independent anchors.

8. **Retrieve exact envelopes**
   - R04, followed by payload and lifecycle objects.

9. **Reconstruct authorization provenance**
   - R09, R10, R25.

10. **Reconstruct content and semantics**
    - R05-R07 and R17-R24.

11. **Validate finalization**
    - R15-R16.

12. **Reconcile incidents and recovery evidence**
    - R26-R29.

13. **Rebuild projections and operational service**
    - fenced and read-only first.

14. **Independent sign-off and re-enablement**
    - separate authority, with old site fenced.

Every step must have an explicit abort condition. A later successful step must never override an earlier failed trust prerequisite.

---

# Failure injection and negative testing gaps

The class-level tests are strong as documentary examples, but the following scenarios should be mandatory:

## Data and ordering

- Coordinated rollback of head, manifest, and one audit source.
- Receipt chain is contiguous but ends before the latest acknowledged external anchor.
- Envelope bytes verify but point to the wrong tenant or epoch.
- Two valid object versions have the same key but different retention metadata.
- Provider list operation omits objects while direct version retrieval succeeds.
- Pagination token repeats, skips, or changes during enumeration.
- Duplicate receipts appear across export and live enumeration.
- Recovery restarts after partial progress and silently skips prior failures.
- Object retrieval succeeds from cache after source deletion.

## Credentials and control plane

- IdP unavailable.
- IdP compromised.
- One custodian unavailable.
- Recovery-manifest signer compromised.
- Cloud administrator replaces verifier artifact.
- Break-glass account works but audit export is disabled.
- Provider account is suspended for billing or policy reasons.
- Support-assisted account recovery attempts to bypass quorum.

## Provider and network

- Spanner available but S3 unavailable.
- S3 available but Spanner unavailable.
- CloudHSM unavailable while verification keys remain available.
- One TSA unavailable.
- Both TSAs unavailable.
- DNS compromised.
- Private endpoint unavailable.
- Severe throttling and partial timeouts.
- Cross-cloud egress blocked.
- Region is available but account-wide policy denies access.

## Integrity and verification

- Correct digest for maliciously pre-pinned bytes.
- Correct signature under an unauthorized but cryptographically valid key.
- Current JWKS substituted for historical issuer metadata.
- Verifier uses current schema after historical schema retrieval fails.
- Two verifier implementations share the same defective library.
- Manifest signature valid but scope deliberately narrowed.
- Raw logs missing while summarized report says PASS.

## Operational restoration

- Projection rebuild crashes and resumes.
- Stale cache serves pre-disaster state.
- Old production site reconnects and resumes writes.
- Duplicate client retries arrive during recovery.
- Read-only recovery is accidentally made writable.
- Restored service accepts requests before trust verification finishes.
- Recovered system passes technical checks but fails business-level totals.

---

# False-positive recovery success

A recovery result must be rejected if any of these occurs:

1. **Self-consistent rollback:** everything matches an old valid head.
2. **Manifest-derived completeness:** expected and observed inventories come from the same source.
3. **Digest-only authenticity:** bytes match a digest, but the digest was not independently trusted.
4. **Signature-only authorization:** signature verifies, but historical delegation or grant was invalid.
5. **Current-key verification:** historical objects are checked using current JWKS or current policy.
6. **Recovered projection substitution:** database or cache state is accepted instead of receipt-backed replay.
7. **Fresh recomputation substitution:** a new model result or policy result is presented as historical evidence.
8. **Scoped FULL:** difficult dependencies are excluded from the declared scope.
9. **Successful retrieval without semantic validation:** objects download but cannot be interpreted under historical schemas.
10. **Successful data recovery without service recovery:** archives reconstruct, but the application cannot safely operate.
11. **Single-verifier agreement:** recovery and verification use the same code or shared defective library.
12. **Operator self-certification:** recovery operator also controls manifest production or final acceptance.

The present specification recognizes several of these risks, but it does not yet supply the independent anchors and fixed scope profiles needed to prevent all of them. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

---

# Minimum evidence required to prove restoration

A successful exercise should produce an immutable evidence package containing:

## Scope and authority

- Signed disaster/exercise authorization.
- Fixed recovery profile and scope digest.
- Tenant, ledger, epoch, sequence, and time boundaries.
- Legal and erasure authorization.
- Named operator, verifier, reviewer, and re-enablement authority.
- Independence and conflict declarations.

## Clean-room proof

- New account/project and organization identifiers.
- IAM and trust-policy exports.
- Network and egress policy.
- Evidence showing no production DB, backup, cache, app export, or production credential access.
- Recovery credential issuance, expiry, approvals, and use logs.
- Screened list of every external service contacted.

## Inventory and completeness

- Independently created expected inventory.
- All R01-R30 classes.
- Stable object IDs and exact versions.
- Expected and observed counts.
- Digests and byte lengths.
- Sequence boundaries.
- Explicit omission and erasure register.
- Independent external head or checkpoint anchors.

## Retrieval

- Raw provider API requests and responses.
- Pagination records.
- Exact version or generation identifiers.
- Object Lock or retention metadata.
- Retrieval timestamps.
- Retry and timeout records.
- Evidence of source account and region.

## Cryptographic proof

- Exact signed bytes.
- Canonical preimages where permitted.
- Historical public keys and certificates.
- Key fingerprints and validity intervals.
- Revocation and compromise state.
- Crypto-policy version.
- Known-answer vectors.
- Outputs from two independently implemented verifiers.
- TSA tokens and validation evidence where required.

## Reconstruction

- Receipt continuity report.
- Fork and duplicate analysis.
- Lifecycle and lineage reconstruction.
- Authorization assertion and ADS decision reconciliation.
- Snapshot and finalization bindings.
- Historical configuration, schema, runtime, policy, taxonomy, and external-input resolution.
- Rebuilt projection comparison.

## Key restoration

- HSM backup identifiers and metadata.
- Quorum approvals.
- Restore-region evidence.
- Restored key fingerprints and attributes.
- Known-answer signatures.
- Audit logs proving no private key exposure.
- Explicit evidence for any new-key/new-epoch discontinuity.

## Operational proof

- Deployment logs.
- Service health checks.
- Read-only startup evidence.
- Synthetic business transaction results.
- Cache and downstream gating tests.
- Old-site fencing evidence.
- Re-enablement approval.
- Monitoring and alert validation.

## RPO/RTO

- Pre-approved numeric targets.
- Defined start and end events.
- Timestamped raw measurements.
- Data-loss calculation based on acknowledged commits.
- Repeated-run results.
- Data volume, object count, throughput, throttling, and cost.

## Independent acceptance

- Raw evidence retained outside the recovered environment.
- Signed verifier output.
- Signed reviewer report.
- Deviations and unresolved findings.
- Exact residual-risk statement.
- No conversion of BLOCKED, NOT RUN, PARTIAL, or UNAVAILABLE into PASS.

---

# Whether the supplied documents demonstrate the recovery claims

## Demonstrated by the documents

The documents demonstrate only that:

- A 30-class recovery inventory has been written.
- A class-by-class failure-injection specification has been written.
- Eight compound scenarios have been defined.
- PASS, FAIL, BLOCKED, NOT RUN, PARTIAL, UNAVAILABLE, and FULL terminology has been proposed.
- The authors recognize that synthetic tests and vendor documentation do not prove operational recovery.
- The current status is blocked and not run. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

## Not demonstrated

The package does **not** demonstrate:

- successful receipt enumeration;
- successful envelope retrieval;
- survival of acknowledged commits;
- backup restorability;
- HSM key restoration;
- clean-room credential effectiveness;
- provider or account-loss recovery;
- historical key verification;
- legal-erasure handling in a real recovery;
- deterministic replay;
- projection rebuilding;
- service restoration;
- RPO attainment;
- RTO attainment;
- administrator independence;
- recovery under compromised credentials;
- recovery under unavailable provider conditions;
- successful failure injection;
- prevention of false FULL results;
- independent review or sign-off.

The execution-status document expressly says there is no live infrastructure, receipt, envelope, signed assertion, HSM key, backup, recovery object, executed acceptance test, clean-room exercise, or appointed independent reviewer. [1](https://onedrive.live.com?cid=c02052f3dd8fd62e&id=C02052F3DD8FD62E!s949c21cc7bf449ae93427e8ab56a1942)

---

# Final adversarial conclusion

**F-03 is a recovery test specification, not a recovery capability.**

Its strongest feature is that it does not falsely claim execution. Its principal weaknesses are:

1. the incomplete normative review package;
2. stale MRSC/dual-store language conflicting with the selected Spanner/S3 topology;
3. lack of an independently established completeness oracle;
4. scope-flexible PASS/FULL terminology;
5. absence of operational service restoration;
6. undefined RPO/RTO metrics;
7. undocumented clean-room identity bootstrap;
8. insufficient provider-exit testing;
9. implicit rather than explicit recovery dependencies;
10. no output evidence from any actual exercise.

**Recommended disposition: REQUIRES DOCUMENTARY REVISION BEFORE TEST EXECUTION. Even after revision, F-03 must remain OPEN until a provider-backed, independently witnessed, clean-room exercise executes the full failure matrix and produces immutable raw evidence.**