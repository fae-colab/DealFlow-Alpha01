# ICW F-03 — Recovery Object Inventory and Clean-Room Exercise Record

**Record date:** 2026-11-15  
**Status:** Inventory baseline defined; live clean-room exercise BLOCKED.  
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
