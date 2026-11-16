# ICW F-03 — Recovery Object Inventory and Clean-Room Exercise Record

**Record date:** 2026-11-16  
**Document version:** 1.1.0  
**Amends:** v1.0 baseline (Git blob `8a1d86fce3cf8c5c78edeb2aa468141a60543bcc`)  

**Status:** v1.1.0 normative topology/profile amendment recorded; live clean-room exercise BLOCKED / NOT RUN.  
**Disposition:** No recovery guarantee claimed.

## 1. Exercise disposition

The clean-room recovery exercise cannot honestly be reported as completed. No selected/provisioned witness, dual-store object repository, issuer, HSM, recovery export or live receipt history is available. The repository currently contains specifications, not authoritative deployed history. Fabricating receipts or replaying a local DB would not test F-03.

Completed here: inventory, manifest contract, exercise procedure and pass/fail criteria.  
Blocked: provider-backed retrieval, cryptographic verification, complete history reconstruction and independent recovery sign-off.

A synthetic fixture may test verifier mechanics, but must be labelled SYNTHETIC and cannot close F-03.

## 2. Complete recovery object inventory

Every class must appear in the recovery manifest, even when NOT_APPLICABLE, ERASED, MISSING or UNAVAILABLE. Omission is not a status.

| ID | Object class | Required contents | Integrity/binding | Missing means |
|---|---|---|---|---|
| R01 | Genesis/bootstrap | Genesis, initial epoch/head, trust-root IDs, initial schemas | Signed digest; independently pinned root | Ledger unavailable |
| R02 | Epoch/continuity | Epoch transitions, prior terminal receipt, re-attestation | Signed link; no silent reset | Ledger gap |
| R03 | Append receipts | Receipt bytes, sequence, previous hash, batch, refs, digests, key IDs, timestamps | Signature and chain continuity | Ledger unavailable at gap |
| R04 | Canonical batch envelopes | Exact accepted command/event bytes, batch boundaries, count/range | Receipt-bound digest and exact object version | Ledger partial/quarantine |
| R05 | Lifecycle events | State transitions, supersession, revocation, correction, exclusions/reasons | Event IDs and receipt refs | Lifecycle partial |
| R06 | Evidence payloads | Original source bytes, normalized capture, attachments/media/structured records | Content digest, source/version/provenance | Content partial |
| R07 | Evidence lineage | Parent/child, source-to-claim, derived-from, duplicate/conflict/supersedes links | Stable IDs and relationship version | Semantic history partial |
| R08 | Erasure/retention tombstones | Authority, scope, time, object/key disposition, retained metadata | Signed tombstone and policy version | Privacy state unverifiable |
| R09 | Authorization assertions | Exact signed assertion bytes and claims | Signature and request binding | Mutation authorization unverified |
| R10 | Authorization decisions | Decision ID, policy digest/version, entitlement source, auth context, outcome | ADS audit signature/receipt | Decision provenance partial |
| R11 | Issuer trust metadata | Issuer registry, JWKS snapshots, historical keys, certs, validity/revocation | Signed trust-root history | Affected interval unverifiable |
| R12 | Witness key history | Public keys/certs, IDs, activation/retirement/compromise intervals | Offline fingerprint pin | Affected receipts unverifiable |
| R13 | Crypto policy | Algorithms, digest/signature parameters, canonicalization, trusted-time and verifier versions | Versioned policy digest | Verification unavailable |
| R14 | Schemas/serialization | Event/envelope/receipt schemas, migration maps, canonical field/numeric rules | Immutable artifact IDs/digests | Semantic replay unavailable |
| R15 | Recommendation snapshots | Exact bytes, input set, exclusions, confidence/evidence status, output/abstention | Receipt-bound digest and snapshot ID | Decision history partial |
| R16 | Finalization receipts | Snapshot ID/digest, watermark/head, actor/authority/time | Signed exact snapshot binding | Finalization unproven |
| R17 | Engine/runtime | Source commit, build/container digest, lockfiles, runtime/compiler/flags | Reproducible build metadata | Deterministic replay unavailable |
| R18 | Policy/rules | Eligibility, trust, ranking, lifecycle, deadline, conflict, abstention and optimization rules | Version, approval, effective interval, digest | Decision semantics unavailable |
| R19 | Taxonomy/reference data | Project/area/property taxonomies, enums, currency/unit rules | Immutable versioned snapshot | Replay incomplete |
| R20 | Projector/canonicalizer | Projection/canonicalization code, hash/serialization libraries | Source/build digest and known-answer vectors | Independent interpretation unavailable |
| R21 | Feature/normalization definitions | Formulas, units, rounding, precision, conversions, normalization maps | Versioned code/data/test vectors | Numeric replay unavailable |
| R22 | Configuration/deployment | Thresholds, tenant config, timezone, locale, flags, regions, retention and limits | Signed deployment manifest | Replay/threat model incomplete |
| R23 | External data consumed | Exact API response bytes, source IDs/URLs, retrieval time, metadata, transformations | Immutable response digest/provenance | Decision history partial |
| R24 | Model provenance | Provider/model/version, parameters, prompt/template, tool outputs, actual structured output, errors | Preserved request/response and digest | Nondeterministic history partial |
| R25 | Human inputs/approvals | User values/edits, overrides, approvals and identity context | Actor assertion and timestamp | Provenance partial |
| R26 | Reconciliation/quarantine | Gaps, conflicting heads, outages, verifier alerts, quarantine/release approvals | Signed incident records | Trust state partial |
| R27 | Independent audit | Test reports, raw logs, config exports, verifier build, findings/approvals | Reviewer identity/signature/digest | Assurance unsupported |
| R28 | Recovery manifest/run | Scope, counts, expected IDs/digests, retrieval results/omissions, verifier build/time | Signed manifest and independent output | Recovery result unsubstantiated |
| R29 | Key custody/recovery | HSM backup IDs, custody approvals, recovery region, restore logs, key audit | Provider records and quorum approvals | Signing restore unavailable |
| R30 | Retention/legal basis | Schedule, legal holds, erasure policy, classification/jurisdiction decisions | Approved policy version/audit | Recovery scope undefined |

## 3. Manifest contract

Every object entry must include stable object ID/class/scope/source; expected digest, algorithm and byte length; schema and canonicalization versions; receipt/epoch/sequence; primary and secondary exact object version/generation; retention and erasure status; retrieval timestamp; observed digest/length; integrity, semantic, replay and recovery statuses; missing reason; verifier build digest; reviewer identity.

Controlled statuses: VERIFIED, MISSING, ALTERED, UNAVAILABLE, ERASED_BY_AUTHORITY, NOT_APPLICABLE, NOT_YET_TESTED. Empty is not equivalent to NOT_APPLICABLE.

## 4. Clean-room exercise procedure

### Preconditions
1. Provision actual F-01 stores and MRSC ledger metadata.
2. Generate non-production fixture history through approved ICW implementation; retain raw receipts/envelopes in both stores.
3. Pin recovery package manifest digest and expected genesis/head.
4. Prepare isolated account/project with no production DB, DB backup, cache, app export or production app credentials.
5. Supply only documented recovery credentials and independently pinned trust-root fingerprints.
6. Build a separately reviewed verifier; it must not rely on production canonicalization/hash/authorization helpers as sole oracle.
7. Record expected scope, receipt/object counts, dependencies, RPO/RTO and erasure fixtures before start.

### Execution
1. Record clean environment identity, timestamp, software bill of materials and network policy.
2. Enumerate witness history from trusted genesis.
3. Retrieve each receipt and exact envelope version/generation from both stores.
4. Verify continuity, signatures, ranges, counts, lengths and digests.
5. Retrieve payloads/tombstones, authorization provenance, snapshots/finalization receipts and all dependencies R01–R30.
6. Reconstruct lifecycle state and verify supersession, revocation, conflict and lineage.
7. Replay deterministic decisions using exact pinned artifacts/inputs. For model-assisted decisions verify preserved actual output and deterministic downstream processing; do not compare a fresh model call.
8. Inject missing payload, altered object, revoked-key interval and lawful erasure fixture; require exact missing IDs and downgraded statuses.
9. Compare recovered head/counts with independently pinned expected values.
10. Keep isolated until independent verifier and separately authorized operator approve re-enablement.

### Pass criteria
- Every in-scope class represented; every retained object exact-version retrieved and digest/length verified.
- Receipt chain contiguous from trusted genesis to expected head.
- Every accepted mutation has verifiable authorization provenance.
- Every finalized snapshot binds to its exact finalization receipt and ledger watermark.
- Every dependency resolves to immutable bytes or is explicitly missing/erased.
- Deterministic replay matches pinned execution contract; model output is verified from preserved output.
- Injected missing/altered/erased objects force exact PARTIAL/UNAVAILABLE states; FULL prohibited.
- Raw logs, manifest, object refs, verifier output and independent sign-off retained.

## 5. Current exercise result

**BLOCKED — NOT RUN.** No live ICW, receipt set, stores, recovery credentials or independent verifier build are available. No object was recovered. No clean-room result, RPO/RTO or FULL status is claimed. A local simulation tests only verifier mechanics and cannot satisfy F-03.

**F-03 status: OPEN / NOT DEMONSTRATED.** Inventory and protocol are defined; live exercise awaits infrastructure and authoritative objects.


---

## 6. Version 1.1.0 normative recovery inventory amendment (2026-11-16)

**Amendment authority:** User-directed F-03 remediation aligned to `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md`.  
**Status:** Normative documentary amendment for the selected candidate; no provider-backed recovery is demonstrated.  
**Precedence and preservation:** This v1.1.0 section supersedes conflicting operative text in §4 that requires MRSC or retrieval of receipts/envelopes from “both stores”. Those statements remain as historical v1.0 procedure text only. The selected candidate is Spanner transactional witness + S3 exact-version envelope archive. The original R01–R30 IDs, labels, required contents, integrity/binding statements and missing consequences in §2 remain unchanged. This section adds authority, dependency, profile and supplemental operational mappings; it does not delete historical material.

### 6.1 Selected topology: authoritative placement and recovery source

| Inventory item | Authoritative source | Archive / independent evidence | Recovery rule |
|---|---|---|---|
| R01 Genesis/bootstrap | Independently pinned genesis/trust-root record | Offline or separately administered trust-root copy | Never reconstruct from DB or later head. |
| R02 Epoch/continuity | Spanner committed receipt/head history plus signed epoch transition | Independent expected-truth anchor and retained transition evidence | Verify signed continuity; no silent reset. |
| R03 Append receipts | Spanner committed receipt rows and authoritative head | Independent expected-truth commitment to receipt IDs/ranges; key history in R12 | Spanner commit is acceptance. Do not assume a second S3 receipt archive. |
| R04 Canonical batch envelopes | Exact S3 Object Lock Compliance object version referenced by committed Spanner receipt | S3 exact VersionId, retention evidence, independent expected-envelope inventory commitment | Read back and verify exact VersionId before commit; after commit, missing bytes block profiles requiring them. |
| R05 Lifecycle events | Accepted canonical envelope bytes referenced by Spanner receipts | R04 exact S3 versions plus receipt-bound IDs | Reconstruct from accepted envelopes, never projection-only state. |
| R06 Evidence payloads | Receipt-bound payload object/version under approved storage design | Independent digest/provenance and lawful retention evidence | Recover exact retained bytes; otherwise PARTIAL/UNAVAILABLE or ERASED_BY_AUTHORITY. |
| R07 Evidence lineage | Receipt-backed lineage records/events | Independent digest and source/version references | Rebuild from accepted events; no inference from latest projection. |
| R08 Erasure/retention tombstones | Signed, receipt-backed tombstone and approved policy | Independent legal approval and key/object disposition evidence | Tombstone is recovered; erased plaintext is not. |
| R09–R10 Authorization | Exact signed assertion and ADS decision evidence bound to accepted command | Issuer/ADS audit and trust records independently retained | Application logs or role strings are not substitutes. |
| R11–R13 Trust and cryptographic policy | Signed issuer/key/policy history under approved trust authority | Offline/independently administered trust pins and historical key evidence | Verify historical signatures against historically valid key state. |
| R14 Schemas/serialization | Immutable versioned schema/canonicalization artifacts | Independently pinned digests and known-answer vectors | No current-default substitution. |
| R15–R25 Decision dependencies | Exact receipt-bound snapshots, finalization, engine, rules, taxonomy, projector, features, config, external inputs, model and human-input artifacts | Independent digests, provenance and retained outputs | Recover exact historical dependencies; no fresh model call as replacement. |
| R26–R27 Reconciliation and audit | Signed incident/quarantine and independent audit records | Separately controlled audit/assurance retention | Audit records do not alone establish expected truth. |
| R28 Recovery manifest/run | Signed manifest bound to pre-approved scope and expected inventory | Independent pre-disaster expected-truth anchor package | A post-disaster manifest generated from recovered stores alone is not an oracle. |
| R29 Key custody/recovery | Approved HSM/key-custody authority and provider recovery records | Separate custody/quorum and independently retained audit | No key export or recovery outside approved custody. |
| R30 Retention/legal basis | Approved legal/retention policy and signed scope decision | Independent legal approval and policy digest | No recovery scope or retention exception by operator discretion. |

**Commit and receipt authority:** A canonical envelope is uploaded to S3 and its exact VersionId is read back and verified before the Spanner transaction. Spanner atomically validates the expected head, inserts the committed receipt and idempotency identity, and advances the head. The successful Spanner transaction is the sole logical commit point. S3 object existence is not proof of acceptance. A signed/prepared receipt candidate is not a committed receipt. The baseline does not require an independently committed S3 receipt-byte archive.

**Orphan classification:** An S3 object without a matching committed Spanner receipt/idempotency record is an uncommitted orphan. It is not part of accepted history and must be quarantined/reconciled under approved retention/legal policy. A committed receipt whose exact S3 envelope version cannot be retrieved is still a committed ledger event, but any profile requiring that envelope is PARTIAL/UNAVAILABLE. No substitute version or DB copy may be silently promoted.

### 6.2 Fixed profile-to-class mapping

All R01–R30 entries MUST appear in every manifest. The following mapping identifies mandatory classes for the named claim; a class not marked mandatory for a profile remains visible with its actual status and an approved scope reason. Conditional does not mean omittable where the declared scope contains the dependency.

| Class | L — Ledger integrity | C — Content | D — Decision history | O — Operational restoration | A — Complete approved scope |
|---|---|---|---|---|---|
| R01 Genesis/bootstrap | M | M | M | M | M |
| R02 Epoch/continuity | M | M | M | M | M |
| R03 Append receipts | M | M | M | M | M |
| R04 Canonical batch envelopes | M | M | M | M | M |
| R05 Lifecycle events | M | M | M | M | M |
| R06 Evidence payloads | — | M | M where decision scope depends on evidence | — unless required by service scope | M where in approved scope |
| R07 Evidence lineage | — | M | M where decision/provenance scope depends on lineage | — unless required by service scope | M where in approved scope |
| R08 Erasure/retention tombstones | M | M | M | M | M |
| R09 Authorization assertions | M | M | M | M | M |
| R10 Authorization decisions | M | M | M | M | M |
| R11 Issuer trust metadata | M | M | M | M | M |
| R12 Witness key history | M | M | M | M | M |
| R13 Crypto policy | M | M | M | M | M |
| R14 Schemas/serialization | M | M | M | M | M |
| R15 Recommendation snapshots | — | — | M | — | M where in approved scope |
| R16 Finalization receipts | — | — | M | — | M where in approved scope |
| R17 Engine/runtime | — | — | M | M | M |
| R18 Policy/rules | — | — | M | M where needed to operate safely | M |
| R19 Taxonomy/reference data | — | — | M | — | M where in approved scope |
| R20 Projector/canonicalizer | M for receipt canonicalization; otherwise — | — | M | M | M |
| R21 Feature/normalization definitions | — | — | M | — | M where in approved scope |
| R22 Configuration/deployment | M for commit/verification parameters | M for content/retention parameters | M | M | M |
| R23 External data consumed | — | — | M | — | M where in approved scope |
| R24 Model provenance | — | — | M | — | M where in approved scope |
| R25 Human inputs/approvals | M for required authority | M where content authority applies | M | M for operational approvals | M |
| R26 Reconciliation/quarantine | M | M | M | M | M |
| R27 Independent audit | M | M | M | M | M |
| R28 Recovery manifest/run | M | M | M | M | M |
| R29 Key custody/recovery | M | M | M | M | M |
| R30 Retention/legal basis | M | M | M | M | M |

Legend: **M** = mandatory for the profile; **—** = not a profile-wide dependency, but must still appear in the manifest and becomes mandatory if the approved scope depends on it. For C, D, O and A, lawful erasure is represented by an independently verified tombstone; no profile treats erased plaintext as recovered. For D and A, every dependency actually consumed by the declared historical decision must be mandatory even where a row says “where in approved scope.”

Profile definitions:
- **L:** ledger authenticity and completeness to the independently anchored expected head, including receipt-bound accepted envelopes. It does not claim payload/content recovery or service restoration.
- **C:** L plus all lawfully retained content and its provenance/lineage in the approved content scope.
- **D:** L plus every artifact and input required to substantiate the declared historical decision scope, including content dependencies actually consumed.
- **O:** L plus the operational dependencies listed in §6.3. It does not imply complete historical decision reconstruction.
- **A:** union of L, C, D and O across the complete pre-approved scope. No operator-selected exclusions.

### 6.3 Supplemental operational dependency inventory for O and A

R01–R30 remain unchanged. The following supplemental classes are mandatory in the manifest whenever O or A is declared; they do not renumber or replace R01–R30.

| Supplemental ID | Operational dependency | Minimum retained/recoverable evidence |
|---|---|---|
| O-01 | Identity, IAM and authorization control plane | Tenant/actor identities, role and grant exports, assertion issuer configuration, trust roots, recovery principals, MFA/break-glass policy and audit. |
| O-02 | Network, DNS, certificates and TLS | Network topology/rules, routing, DNS zones/records, certificate chains/private-key custody references, TLS policy and renewal/revocation state. |
| O-03 | Deployable service/runtime | Source commit, reproducible build/container digests, deployment manifests, runtime/compiler versions, dependency lockfiles and SBOM. |
| O-04 | Secrets and cryptographic service dependencies | Secret identifiers/versions, KMS/HSM key references, rotation and recovery procedures, quorum approvals; never plaintext secrets in the manifest. |
| O-05 | Queues, schedulers, workers and integrations | Queue/topic definitions, consumer offsets where authoritative, retry/dead-letter policy, worker versions, integration endpoints and idempotency state. |
| O-06 | Monitoring, alerting, time and audit export | Metrics/log/trace configuration, alert rules, trusted-time source, audit export destinations, retention and access controls. |
| O-07 | Projections, APIs, caches and downstream consumers | Projection rebuild version/watermark, API contract/config, cache invalidation, export jobs, consumer gating and stale-read denial evidence. |
| O-08 | Cutover, rollback and old-site fencing | Approved cutover plan, write fencing, DNS/traffic switch, old-site disablement, rollback constraints, duplicate-write prevention and service-owner approval. |

For O/A, each O-01–O-08 item must be marked mandatory, approved-not-applicable or unavailable with evidence. No service may be declared restored while stale APIs/caches/consumers can serve old state, old writers remain active, or authorization/monitoring controls are missing.

### 6.4 Independent expected-truth anchor package

R28 remains the recovery manifest/run record; it is not, by itself, an independent expected-truth source. The pre-disaster anchor package must be created outside the ordinary application/recovery rollback boundary and bind: scope/profile, genesis, expected committed head/sequence, receipt identity/range commitment, accepted-envelope inventory commitment including exact S3 VersionIds, policy/schema versions, creation time, trust root and retention evidence. Anchor owner, writer, key, cadence, monotonicity and recovery path must be in the approved trust/parameter register.

This baseline does not silently prescribe a numeric count of anchor providers. The approved threat model must state the required count and independence criteria. If no available independent anchor can prove completeness relative to all prior acknowledgements, no FULL-L/C/D/O/A result is permitted; report only: **“Internally consistent recovery achieved; completeness relative to all prior acknowledgements not proven.”**

### 6.5 Manifest and status additions

Every manifest entry must additionally include:
- authoritative source and authority type (Spanner committed receipt/head, S3 exact envelope VersionId, independent anchor, trust/custody authority, or other explicitly named source);
- object role (accepted, prepared candidate, orphan, checkpoint, anchor, tombstone, operational dependency);
- exact commit/transaction identity where applicable;
- exact S3 bucket/key/VersionId and Object Lock retention metadata for R04;
- expected and observed inventory commitment references;
- profile membership and mandatory/conditional status;
- independent-anchor reference and verifier evidence;
- for orphans, the proof that no matching committed Spanner receipt/idempotency identity exists.

The manifest MUST distinguish PREPARED/UNCOMMITTED, COMMITTED, ORPHAN, VERIFIED, MISSING, ALTERED, UNAVAILABLE, ERASED_BY_AUTHORITY and NOT_APPLICABLE. PREPARED/UNCOMMITTED and ORPHAN must never be represented as committed or included in accepted receipt counts.

### 6.6 Change control and current disposition

This v1.1.0 amendment is additive. R01–R30 remain unchanged. Any change to their labels, contents, integrity/binding or missing consequences requires a separately reviewed versioned amendment and corresponding test/traceability update. Any change to selected provider topology or commit point requires a new F-01 decision and coordinated F-03 amendment.

**F-03 remains OPEN / NOT DEMONSTRATED.** Current exercise: **BLOCKED — NOT RUN.** This amendment authorizes no procurement, implementation, infrastructure spend, migration, ingestion, deployment or live exercise. Synthetic fixtures may test verifier mechanics only and cannot close provider-backed recovery.

