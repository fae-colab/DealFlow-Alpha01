# ICW F-03 — Practical Recovery Test Specification

**Record date:** 2026-11-16  
**Document version:** 1.1.1  
**Amends:** v1.0 baseline (Git blob `79d73a5def263ae4393727d9dea8d4708f714916`)  

**Baseline source:** `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md`  
**Baseline source blob SHA (companion inventory v1.1.1):** `e15d1c3a9aab98777822302665d17da1c588ba68`  
**Status:** TEST SPECIFICATION DEFINED — EXECUTION BLOCKED / NOT RUN  
**Disposition:** Documentation only. This specification does not demonstrate recovery or authorize infrastructure, implementation, migration, ingestion, deployment or live test execution.

## 1. Purpose and preservation rule

This document converts the original F-03 recovery inventory into an executable, evidence-producing test plan. It does not replace, rename, merge, reorder or reinterpret the original inventory.

**R01–R30 are preserved exactly**, including each original Object class label and its original required contents, integrity/binding requirement and missing-object consequence. The source inventory remains authoritative for the class names and scope. This document adds operational test instructions only.

The 30 classes must all appear in every recovery manifest. A class may be marked NOT_APPLICABLE, ERASED_BY_AUTHORITY, MISSING, UNAVAILABLE or NOT_YET_TESTED only with the evidence and reasoning specified below. Omission is a test failure. NOT_APPLICABLE is not a way to hide a missing dependency.

## 2. Test authority, environment and evidence

### 2.1 Roles

Before any live exercise, name and evidence these distinct roles:
- **Exercise controller:** approves scope and coordinates the run; cannot alone declare pass.
- **Recovery operator:** performs retrieval and restoration using documented recovery credentials.
- **Independent verifier:** operates a separately reviewed verifier and independently pinned trust material; cannot be the recovery operator or the person who prepared the production recovery package.
- **Custodian/approver:** authorizes access to protected keys and recovery materials under the approved quorum.
- **Independent reviewer:** reviews raw evidence, exceptions and acceptance decision.
- **Service owner:** receives the result and separately authorizes any re-enablement.

Actual people and their independence are currently unassigned. No role may be silently combined where that defeats separation.

### 2.2 Environment requirements

The live exercise MUST use a clean account/project or equivalent isolated trust boundary. It MUST NOT have access to the production relational database, its backups, application exports, caches, production credentials or mutable production pointers. It may access only the approved witness, immutable object stores, documented recovery package, independently pinned trust roots and explicitly authorized recovery services.

Record before execution:
- exercise ID, scope, ledger/tenant/epoch and expected genesis/head;
- approved deployment parameter register and its digest;
- source inventory digest and this test-specification digest;
- environment/account/project IDs, region and network controls;
- operator, verifier and reviewer identities;
- verifier source commit, build digest, SBOM, dependencies and test-vector results;
- recovery credential issue/expiry and approvals;
- expected receipt/object/class counts, dependencies, RPO/RTO targets and legal-erasure fixtures;
- trusted time source and clock uncertainty.

If any prerequisite is absent, mark the affected tests BLOCKED; do not substitute a local database export or synthetic receipt chain.

### 2.3 Common test record

For every injected fault, retain: test ID; affected class/object IDs; precondition and expected state; injection method and timestamp; raw provider/HSM/API logs; exact object version/generation; expected and observed digests/lengths; verifier output; quarantine/isolation action; recovery action; independent reviewer result; deviations; final status.

Never store private key material in the test report. Record key IDs, fingerprints, custody approvals and HSM audit references only.

### 2.4 Result vocabulary

- **PASS:** all stated class-specific and global criteria met with raw evidence and independent verification.
- **FAIL:** a safety property is violated, a false FULL/VERIFIED result is produced, an accepted object is silently replaced, or a prohibited recovery path is used.
- **BLOCKED:** a prerequisite or external dependency is unavailable; no test conclusion can be drawn.
- **NOT RUN:** no execution evidence exists.
- **NOT APPLICABLE:** justified by signed scope decision and independently accepted; class remains present in manifest.
- **ERASED_BY_AUTHORITY:** lawful erasure evidence and retained tombstone verified; erased plaintext is not claimed as recovered.
- **PARTIAL / UNAVAILABLE:** required bytes or dependencies cannot be recovered or verified. This is a valid safe outcome, not a successful FULL recovery.

## 3. Class-by-class failure and recovery matrix

For every class below, perform the specified failure injection in an isolated non-production fixture, verify detection independently, isolate affected history, attempt only the permitted recovery path, and record the acceptance evidence. Where the live object is sensitive, use a fixture with the same schema and cryptographic binding; do not inject faults into production data.

### R01 — Genesis/bootstrap

**Original required contents:** Genesis, initial epoch/head, trust-root IDs, initial schemas.  
**Original integrity/binding:** Signed digest; independently pinned root.  
**Original missing consequence:** Ledger unavailable.

- **Failure injection:** Withhold the genesis object; substitute a genesis with one altered byte; present a genesis whose root fingerprint differs from the offline pin.
- **Detection:** Independent verifier must fail signature/digest/fingerprint checks or report genesis unavailable; it must not infer genesis from the database or a later checkpoint.
- **Isolation:** Mark the ledger UNAVAILABLE from genesis; quarantine all descendant receipts pending trust resolution.
- **Recovery:** Retrieve the exact genesis object and its independently retained copy; verify its signature, digest, epoch/head and schema references against offline pins. No regenerated genesis under the old identity.
- **Independent verification:** Reviewer compares raw bytes, digest, signature, root fingerprint and exact version from a separate verifier/environment.
- **Acceptance:** PASS only when one unambiguous, independently pinned genesis is verified and all subsequent continuity starts from it. Otherwise ledger remains UNAVAILABLE.

### R02 — Epoch/continuity

**Original required contents:** Epoch transitions, prior terminal receipt, re-attestation.  
**Original integrity/binding:** Signed link; no silent reset.  
**Original missing consequence:** Ledger gap.

- **Failure injection:** Remove an epoch transition; alter its prior terminal receipt; introduce an unapproved epoch reset or fork.
- **Detection:** Continuity verifier identifies missing transition, invalid signature, wrong prior terminal head or unauthorized epoch.
- **Isolation:** Quarantine the new epoch and every dependent receipt; stop current-state serving and appends for the affected ledger.
- **Recovery:** Retrieve the original signed transition and prior terminal receipt; if unavailable, preserve the gap and mark affected history UNAVAILABLE. New epoch only through explicit authorized restore/incident procedure.
- **Independent verification:** Verify both epoch signatures, old terminal receipt, new genesis/starting head, approver identities and monotonic continuity.
- **Acceptance:** PASS only with complete signed continuity and no silent reset; otherwise affected interval remains quarantined.

### R03 — Append receipts

**Original required contents:** Receipt bytes, sequence, previous hash, batch, refs, digests, key IDs, timestamps.  
**Original integrity/binding:** Signature and chain continuity.  
**Original missing consequence:** Ledger unavailable at gap.

- **Failure injection:** Delete one receipt; reorder receipts; alter sequence/previous hash/batch digest/key ID; replay a duplicate or forked receipt.
- **Detection:** Independent chain verifier detects missing sequence, invalid signature, duplicate identity, fork or hash discontinuity.
- **Isolation:** Stop verification at the last independently verified predecessor; quarantine the affected tail; do not skip the gap.
- **Recovery:** Fetch the exact canonical signed receipt bytes (or the formally specified exact canonical representation) from the committed Spanner receipt row by immutable receipt identity, using independent recovery credentials. Verify the Spanner row/transaction commit evidence, receipt identity, idempotency identity, sequence, head transition, signature and chain binding. The independent expected-truth anchor is a completeness oracle, not an alternate receipt authority. Never synthesize a receipt or require an unselected second witness-copy archive.
- **Independent verification:** Independently recompute chain links and compare exact receipt bytes, witness transaction IDs and key history.
- **Acceptance:** PASS only if the chain is contiguous from trusted genesis to the expected head with every receipt uniquely verified; otherwise no FULL ledger result.

### R04 — Canonical batch envelopes

**Original required contents:** Exact accepted command/event bytes, batch boundaries, count/range.  
**Original integrity/binding:** Receipt-bound digest and exact object version.  
**Original missing consequence:** Ledger partial/quarantine.

- **Failure injection:** Remove an envelope; alter one byte; change batch boundaries/count; replace a referenced object version while leaving its name unchanged.
- **Detection:** Compare receipt-bound digest, byte length, batch count/range and exact version/generation; detect missing or altered content.
- **Isolation:** Quarantine the receipt/batch and all dependent projection/reconstruction; no DB copy may be promoted as authoritative.
- **Recovery:** Retrieve the exact version/generation from an independent store; verify byte-for-byte equality and receipt binding.
- **Independent verification:** Reviewer independently fetches the pinned version from each store and recomputes digest/length.
- **Acceptance:** PASS only when every accepted batch envelope is present at its exact receipt-bound version and verifies. Any missing accepted envelope makes recovery PARTIAL or UNAVAILABLE.

### R05 — Lifecycle events

**Original required contents:** State transitions, supersession, revocation, correction, exclusions/reasons.  
**Original integrity/binding:** Event IDs and receipt refs.  
**Original missing consequence:** Lifecycle partial.

- **Failure injection:** Omit a lifecycle event; alter event ordering, predecessor, exclusion reason or receipt reference; duplicate an event ID.
- **Detection:** Reconstruct transitions from accepted envelopes and compare event IDs, order, references and state-machine constraints.
- **Isolation:** Mark affected entity/lifecycle history PARTIAL; prevent a derived current state from being served as verified.
- **Recovery:** Replay exact retained event bytes from verified receipts; do not infer a missing transition from the latest projection.
- **Independent verification:** Rebuild state independently from the event sequence and compare every transition and terminal state.
- **Acceptance:** PASS only when every transition is receipt-backed, ordered and semantically valid; any missing transition remains explicit PARTIAL.

### R06 — Evidence payloads

**Original required contents:** Original source bytes, normalized capture, attachments/media/structured records.  
**Original integrity/binding:** Content digest, source/version/provenance.  
**Original missing consequence:** Content partial.

- **Failure injection:** Remove payload; truncate or bit-flip bytes; mismatch source version; make an encrypted payload's decryption key unavailable.
- **Detection:** Verify ciphertext/object digest and length, permitted plaintext digest, source/version/provenance and decryption result.
- **Isolation:** Quarantine the affected payload and dependent claims/snapshots; preserve integrity metadata; do not substitute a normalized derivative for original source bytes.
- **Recovery:** Retrieve exact retained payload version and required key under approved custody. If lawfully erased or key destroyed, recover tombstone/metadata only and mark content PARTIAL/UNAVAILABLE.
- **Independent verification:** Independently recompute ciphertext digest and, where authorized, plaintext digest; verify source/version binding and key-access audit.
- **Acceptance:** PASS for retained scope only when original bytes and provenance verify. Erased content is not counted as recovered.

### R07 — Evidence lineage

**Original required contents:** Parent/child, source-to-claim, derived-from, duplicate/conflict/supersedes links.  
**Original integrity/binding:** Stable IDs and relationship version.  
**Original missing consequence:** Semantic history partial.

- **Failure injection:** Remove a parent/child edge; change relationship version; introduce cycle, fork, duplicate edge or false supersession.
- **Detection:** Compare relationship IDs/version and graph invariants; detect unresolved endpoints, cycles and inconsistent references.
- **Isolation:** Quarantine affected graph component and dependent claims; avoid asserting lineage or deduplication status.
- **Recovery:** Retrieve exact versioned lineage events/objects and rebuild graph from receipt-backed history.
- **Independent verification:** Separate graph reconstruction checks all edges, endpoints, versions and constraints.
- **Acceptance:** PASS only when every in-scope relationship resolves and graph invariants hold; unresolved links force PARTIAL.

### R08 — Erasure/retention tombstones

**Original required contents:** Authority, scope, time, object/key disposition, retained metadata.  
**Original integrity/binding:** Signed tombstone and policy version.  
**Original missing consequence:** Privacy state unverifiable.

- **Failure injection:** Remove tombstone; alter authority/scope/time; retain a fixture payload after authorized erasure; falsely label an unapproved deletion as lawful.
- **Detection:** Verify tombstone signature, approval, scope, policy version, object/key disposition and consistency with object availability.
- **Isolation:** Quarantine the privacy-affected object and any recovery claim; block disclosure pending privacy review.
- **Recovery:** Retrieve signed tombstone and policy evidence. Do not restore erased plaintext unless a separately authorized legal process explicitly permits it.
- **Independent verification:** Privacy/legal reviewer confirms authority and scope; technical reviewer confirms object/key disposition and retained metadata.
- **Acceptance:** PASS only when erasure is both legally authorized and technically evidenced, with no erased plaintext claimed as recovered. Missing authority evidence = FAIL/BLOCKED, not NOT_APPLICABLE.

### R09 — Authorization assertions

**Original required contents:** Exact signed assertion bytes and claims.  
**Original integrity/binding:** Signature and request binding.  
**Original missing consequence:** Mutation authorization unverified.

- **Failure injection:** Remove assertion; alter canonical request digest, tenant, actor, command, resource, audience or expiry; replay assertion ID.
- **Detection:** Independently verify signature, issuer/key history, scope, request digest, audience, time bounds and replay state.
- **Isolation:** Mark the mutation authorization UNVERIFIED; quarantine dependent event history and block authorization-sensitive reconstruction claims.
- **Recovery:** Retrieve exact signed assertion and corresponding trust/revocation state. No reconstruction from application logs or role strings.
- **Independent verification:** Independent verifier reproduces signature and canonical request binding; compare assertion ID to receipt provenance.
- **Acceptance:** PASS only when each accepted mutation has its exact valid request-bound assertion or explicitly documented alternative allowed by the governing version. No inferred authorization.

### R10 — Authorization decisions

**Original required contents:** Decision ID, policy digest/version, entitlement source, auth context, outcome.  
**Original integrity/binding:** ADS audit signature/receipt.  
**Original missing consequence:** Decision provenance partial.

- **Failure injection:** Remove decision record; alter policy digest, entitlement version, auth context or outcome; provide unsigned or mismatched ADS audit event.
- **Detection:** Reconcile assertion decision ID with ADS-signed audit record and policy/entitlement version.
- **Isolation:** Mark decision provenance PARTIAL; block claim that authorization policy was correctly evaluated.
- **Recovery:** Retrieve immutable ADS decision audit record and versioned policy/entitlement references.
- **Independent verification:** Reviewer validates ADS signature and replays deterministic policy evaluation where inputs are retained.
- **Acceptance:** PASS only when decision, assertion, policy and entitlement evidence are linked and verified; otherwise provenance remains PARTIAL.

### R11 — Issuer trust metadata

**Original required contents:** Issuer registry, JWKS snapshots, historical keys, certs, validity/revocation.  
**Original integrity/binding:** Signed trust-root history.  
**Original missing consequence:** Affected interval unverifiable.

- **Failure injection:** Remove historical JWKS/certificate; alter issuer URI or key; omit a revocation event; substitute current key for historical key.
- **Detection:** Verify signed issuer registry history, key fingerprints, validity intervals and revocation chronology.
- **Isolation:** Quarantine assertions in the affected interval; do not validate historical signatures solely against current JWKS.
- **Recovery:** Retrieve immutable historical issuer/key snapshots and signed registry transitions.
- **Independent verification:** Offline verifier checks fingerprints, certificate chains, validity and revocation at the relevant time.
- **Acceptance:** PASS only if every historical assertion is verified against the correct historically valid issuer key and status; missing history leaves interval UNVERIFIABLE.

### R12 — Witness key history

**Original required contents:** Public keys/certs, IDs, activation/retirement/compromise intervals.  
**Original integrity/binding:** Offline fingerprint pin.  
**Original missing consequence:** Affected receipts unverifiable.

- **Failure injection:** Remove old public key; change key ID/fingerprint; shift activation or compromise time; falsely extend a revoked key's validity.
- **Detection:** Compare key-history records to offline fingerprint pins, HSM audit and signed lifecycle events.
- **Isolation:** Stop receipt verification at last key-history state independently established; quarantine affected signatures.
- **Recovery:** Retrieve independently retained public-key/certificate history and signed activation/retirement/revocation events.
- **Independent verification:** Offline fingerprint comparison and historical signature known-answer tests.
- **Acceptance:** PASS only when each receipt's signing key and applicable validity/compromise interval are unambiguous; otherwise affected receipts are UNVERIFIABLE.

### R13 — Crypto policy

**Original required contents:** Algorithms, digest/signature parameters, canonicalization, trusted-time and verifier versions.  
**Original integrity/binding:** Versioned policy digest.  
**Original missing consequence:** Verification unavailable.

- **Failure injection:** Remove crypto policy version; change algorithm/parameter/canonicalization identifier; downgrade verifier policy or trusted-time source.
- **Detection:** Compare receipt and manifest policy IDs/digests with independently pinned approved policy history and known-answer vectors.
- **Isolation:** Block affected cryptographic verification; do not silently fall back to weaker or current defaults.
- **Recovery:** Retrieve exact approved policy version and verifier compatibility metadata; do not retroactively rewrite historic algorithm identifiers.
- **Independent verification:** Second implementation validates known-answer vectors and signed policy digest.
- **Acceptance:** PASS only when every relevant signature/digest is checked under the historically approved parameters; unsupported or missing policy means UNAVAILABLE.

### R14 — Schemas/serialization

**Original required contents:** Event/envelope/receipt schemas, migration maps, canonical field/numeric rules.  
**Original integrity/binding:** Immutable artifact IDs/digests.  
**Original missing consequence:** Semantic replay unavailable.

- **Failure injection:** Remove schema version; alter field ordering/type/null semantics/numeric encoding; substitute a migration map.
- **Detection:** Validate immutable schema IDs/digests and canonicalization test vectors against receipt-bound versions.
- **Isolation:** Stop semantic replay for affected records; retain raw bytes and cryptographic verification status separately.
- **Recovery:** Retrieve exact schema/migration artifacts and rerun deterministic parsing without rewriting original bytes.
- **Independent verification:** Independent parser compares canonical bytes, decoded values and migration outputs using known-answer fixtures.
- **Acceptance:** PASS only when raw bytes parse under the exact historically pinned schema and semantic interpretation is reproducible.

### R15 — Recommendation snapshots

**Original required contents:** Exact bytes, input set, exclusions, confidence/evidence status, output/abstention.  
**Original integrity/binding:** Receipt-bound digest and snapshot ID.  
**Original missing consequence:** Decision history partial.

- **Failure injection:** Remove snapshot; alter ranking/output/exclusion/confidence; substitute a different input-set reference under the same snapshot ID.
- **Detection:** Verify snapshot digest, snapshot ID, receipt binding, input/exclusion references and status fields.
- **Isolation:** Mark historical decision record PARTIAL; never regenerate and present a new result as the original snapshot.
- **Recovery:** Retrieve exact immutable snapshot bytes and referenced input/dependency set.
- **Independent verification:** Independent verifier recomputes snapshot digest and checks its bound ledger watermark and dependencies.
- **Acceptance:** PASS only when exact original bytes and all declared decision inputs/statuses are present and bound; fresh recomputation is not a substitute.

### R16 — Finalization receipts

**Original required contents:** Snapshot ID/digest, watermark/head, actor/authority/time.  
**Original integrity/binding:** Signed exact snapshot binding.  
**Original missing consequence:** Finalization unproven.

- **Failure injection:** Remove finalization receipt; alter snapshot digest, watermark, actor or authority; supply receipt for a different snapshot.
- **Detection:** Verify signature and exact binding to immutable snapshot ID/digest, ledger receipt/head and sequence watermark.
- **Isolation:** Treat snapshot as non-final/non-actionable; block API, cache, export and downstream publication claims.
- **Recovery:** Retrieve exact finalization receipt and inclusion proof from witness history; no application-side final flag may substitute.
- **Independent verification:** Independent verifier checks signature, ledger inclusion and exact snapshot/object digest.
- **Acceptance:** PASS only when exact finalization binding is verified; otherwise snapshot remains pending/failed and non-actionable.

### R17 — Engine/runtime

**Original required contents:** Source commit, build/container digest, lockfiles, runtime/compiler/flags.  
**Original integrity/binding:** Reproducible build metadata.  
**Original missing consequence:** Deterministic replay unavailable.

- **Failure injection:** Remove build artifact/lockfile; alter source commit, compiler/runtime version or build flags; substitute image with same mutable tag but different digest.
- **Detection:** Compare immutable commit/build/container digests and SBOM/dependency versions with snapshot provenance.
- **Isolation:** Mark deterministic replay UNAVAILABLE; do not use current production runtime to claim historical reproducibility.
- **Recovery:** Retrieve exact source, lockfiles, build artifacts and runtime/toolchain; reproduce build in isolated environment.
- **Independent verification:** Independent build/replay compares resulting artifact digest and known-answer output.
- **Acceptance:** PASS only when exact execution environment is recoverable or a documented deterministic equivalence contract passes; otherwise replay is NOT_DETERMINISTIC/UNAVAILABLE.

### R18 — Policy/rules

**Original required contents:** Eligibility, trust, ranking, lifecycle, deadline, conflict, abstention and optimization rules.  
**Original integrity/binding:** Version, approval, effective interval, digest.  
**Original missing consequence:** Decision semantics unavailable.

- **Failure injection:** Remove rule version; alter threshold/order/effective time/approval; use current policy in place of historical policy.
- **Detection:** Verify signed policy digest, version, approver and effective interval referenced by snapshot.
- **Isolation:** Mark semantic reconstruction unavailable; no inferred historical decision rationale.
- **Recovery:** Retrieve exact approved rule package and approval history.
- **Independent verification:** Independently evaluate pinned fixtures under historical policy and compare outputs/abstention.
- **Acceptance:** PASS only when exact historical rules and approvals are available and semantics reproduce; current policy cannot stand in.

### R19 — Taxonomy/reference data

**Original required contents:** Project/area/property taxonomies, enums, currency/unit rules.  
**Original integrity/binding:** Immutable versioned snapshot.  
**Original missing consequence:** Replay incomplete.

- **Failure injection:** Remove taxonomy snapshot; alter enum mapping, currency conversion/unit rule or project/area identifier mapping.
- **Detection:** Compare referenced taxonomy IDs/version/digest and known values against snapshot dependencies.
- **Isolation:** Mark affected decision replay PARTIAL; avoid translating unknown values using current mappings.
- **Recovery:** Retrieve exact immutable reference-data snapshot and associated source/version metadata.
- **Independent verification:** Independently compare canonical snapshot digest and run fixed mapping/unit test vectors.
- **Acceptance:** PASS only when all decision-relevant reference values resolve under exact historical versions.

### R20 — Projector/canonicalizer

**Original required contents:** Projection/canonicalization code, hash/serialization libraries.  
**Original integrity/binding:** Source/build digest and known-answer vectors.  
**Original missing consequence:** Independent interpretation unavailable.

- **Failure injection:** Alter canonicalization library/code; remove source/build; change Unicode, field ordering, numeric or null handling.
- **Detection:** Known-answer vectors and digest comparisons expose any byte/semantic divergence.
- **Isolation:** Stop affected independent interpretation/replay; preserve raw receipts and payloads.
- **Recovery:** Retrieve exact source/build and dependencies; use a separately implemented verifier as independent oracle.
- **Independent verification:** Two implementations must agree on canonical bytes/digests for the full vector set; reviewer inspects independence of implementation.
- **Acceptance:** PASS only when canonicalization and projection behavior reproduce from pinned artifacts and independent vectors; production helper alone is not an oracle.

### R21 — Feature/normalization definitions

**Original required contents:** Formulas, units, rounding, precision, conversions, normalization maps.  
**Original integrity/binding:** Versioned code/data/test vectors.  
**Original missing consequence:** Numeric replay unavailable.

- **Failure injection:** Change formula, rounding mode, precision, unit conversion or normalization table; remove versioned test vectors.
- **Detection:** Compare formula/version digest and exact outputs on boundary/known-answer vectors.
- **Isolation:** Mark numeric replay UNAVAILABLE; do not use modern calculations to claim historical equivalence.
- **Recovery:** Retrieve exact code/data and execution precision contract; rerun fixed fixtures.
- **Independent verification:** Independently implement or inspect calculation vectors and compare exact outputs within only explicitly versioned tolerances.
- **Acceptance:** PASS only when all numeric decisions reproduce under the pinned version and declared precision contract.

### R22 — Configuration/deployment

**Original required contents:** Thresholds, tenant config, timezone, locale, flags, regions, retention and limits.  
**Original integrity/binding:** Signed deployment manifest.  
**Original missing consequence:** Replay/threat model incomplete.

- **Failure injection:** Remove deployment manifest; alter tenant config, feature flag, timezone, region, retention or threshold; supply unsigned runtime config.
- **Detection:** Compare signed manifest digest, version and effective interval with receipt/snapshot references and runtime audit.
- **Isolation:** Mark affected reconstruction/threat assessment incomplete; prevent configuration defaults from filling gaps.
- **Recovery:** Retrieve exact signed deployment manifest and config values; validate against approved parameter register.
- **Independent verification:** Reviewer independently checks signature, deployment identity, effective time and all referenced parameter values.
- **Acceptance:** PASS only when every decision/security-relevant configuration item is present and matches the historical manifest.

### R23 — External data consumed

**Original required contents:** Exact API response bytes, source IDs/URLs, retrieval time, metadata, transformations.  
**Original integrity/binding:** Immutable response digest/provenance.  
**Original missing consequence:** Decision history partial.

- **Failure injection:** Remove response bytes; alter a response field; change source/version/retrieval timestamp; replace historical response with a fresh API response.
- **Detection:** Verify raw response digest/length, source identity, retrieval metadata and transformation reference.
- **Isolation:** Mark dependent decision history PARTIAL; do not fetch current data and label it historical.
- **Recovery:** Retrieve exact retained response bytes and transformation metadata from immutable storage.
- **Independent verification:** Recompute digest and independently check source/provenance metadata and transformation chain.
- **Acceptance:** PASS only when exact consumed bytes and metadata are recovered; current-source re-query is never a substitute.

### R24 — Model provenance

**Original required contents:** Provider/model/version, parameters, prompt/template, tool outputs, actual structured output, errors.  
**Original integrity/binding:** Preserved request/response and digest.  
**Original missing consequence:** Nondeterministic history partial.

- **Failure injection:** Remove actual model output; alter prompt/template/tool output/model version/parameters; substitute a fresh model response.
- **Detection:** Verify preserved request/response bytes, provider/model metadata, tool outputs and digest bindings to snapshot.
- **Isolation:** Mark model-assisted history PARTIAL; do not claim a fresh call recreates the original output.
- **Recovery:** Retrieve exact recorded request, actual structured response, tool outputs and error records. Replay only deterministic downstream processing.
- **Independent verification:** Independent verifier validates bytes/digests and downstream deterministic result; it does not compare against a fresh model invocation.
- **Acceptance:** PASS only when actual historical output and all decision-relevant provenance are preserved and verified.

### R25 — Human inputs/approvals

**Original required contents:** User values/edits, overrides, approvals and identity context.  
**Original integrity/binding:** Actor assertion and timestamp.  
**Original missing consequence:** Provenance partial.

- **Failure injection:** Remove approval/input event; alter actor, value, override or timestamp; substitute an unverified identity label.
- **Detection:** Verify signed actor assertion, event receipt, timestamp source and exact input bytes.
- **Isolation:** Mark affected decision/provenance PARTIAL; do not attribute actions to an unverified person.
- **Recovery:** Retrieve original event and identity-context evidence from authorized immutable audit sources.
- **Independent verification:** Reviewer checks signature, actor mapping validity at event time, receipt and event contents.
- **Acceptance:** PASS only when every decision-relevant human input/approval has verifiable provenance; otherwise attribution remains unverified.

### R26 — Reconciliation/quarantine

**Original required contents:** Gaps, conflicting heads, outages, verifier alerts, quarantine/release approvals.  
**Original integrity/binding:** Signed incident records.  
**Original missing consequence:** Trust state partial.

- **Failure injection:** Remove incident record; alter conflict/gap classification; omit quarantine or release approval; falsely mark unresolved fork as cleared.
- **Detection:** Compare provider/ICW audit telemetry, verifier alerts, incident IDs and signed state transitions.
- **Isolation:** Maintain quarantine for every unresolved gap/fork; absence of incident evidence does not imply no incident.
- **Recovery:** Retrieve signed incident timeline and approvals; resolve only with documented verification and authorized release.
- **Independent verification:** Reviewer correlates raw logs, receipt history, incident records and approval signatures.
- **Acceptance:** PASS only when all detected trust incidents are represented and each release is authorized/evidenced; unresolved incidents remain quarantined.

### R27 — Independent audit

**Original required contents:** Test reports, raw logs, config exports, verifier build, findings/approvals.  
**Original integrity/binding:** Reviewer identity/signature/digest.  
**Original missing consequence:** Assurance unsupported.

- **Failure injection:** Remove audit package; alter report/config export; replace reviewer identity/signature; omit a failed test/finding.
- **Detection:** Verify report digest/signature, reviewer identity/independence evidence and consistency with raw evidence.
- **Isolation:** Withdraw any assurance or closure claim relying on the missing/altered report.
- **Recovery:** Obtain the original signed report and raw artifacts from independent reviewer-controlled retention; otherwise recommission review.
- **Independent verification:** A separate reviewer validates report authenticity, scope, conflicts, raw evidence links and completeness.
- **Acceptance:** PASS only with authentic, independent, complete audit evidence; self-attestation alone cannot close F-03.

### R28 — Recovery manifest/run

**Original required contents:** Scope, counts, expected IDs/digests, retrieval results/omissions, verifier build/time.  
**Original integrity/binding:** Signed manifest and independent output.  
**Original missing consequence:** Recovery result unsubstantiated.

- **Failure injection:** Remove manifest; omit an object/class; alter expected counts/digests; modify verifier build/time; produce unsigned output.
- **Detection:** Compare manifest to source inventory, expected scope, actual enumeration and independent verifier output.
- **Isolation:** Mark entire exercise result UNVERIFIED; no FULL claim or re-enablement.
- **Recovery:** Re-run enumeration and retrieval from pinned scope with a new immutable run ID; preserve prior failed manifest.
- **Independent verification:** Reviewer independently recomputes counts, class coverage, object results and manifest signature.
- **Acceptance:** PASS only when all 30 classes are represented, counts reconcile, omissions are explicit, and signed outputs match independent recomputation.

### R29 — Key custody/recovery

**Original required contents:** HSM backup IDs, custody approvals, recovery region, restore logs, key audit.  
**Original integrity/binding:** Provider records and quorum approvals.  
**Original missing consequence:** Signing restore unavailable.

- **Failure injection:** Make latest backup unavailable; alter backup ID/region; remove one quorum approval; attempt restore with one custodian; restore wrong HSM/key version.
- **Detection:** Verify provider backup metadata, HSM audit, key fingerprints, quorum logs and custody approvals.
- **Isolation:** Disable signing/recovery operations requiring the affected key; never recreate a missing private key under the same key ID.
- **Recovery:** Restore only through documented quorum procedure into isolated recovery HSM; verify public fingerprint and known-answer signature. If restore fails, use new key/epoch with explicit discontinuity.
- **Independent verification:** Independent cryptographic reviewer validates HSM configuration, quorum evidence, key identity and known-answer vectors without seeing private material.
- **Acceptance:** PASS only when approved backup restores the same key identity and policy under quorum, or the documented new-key/epoch discontinuity path is correctly invoked. Silent key replacement is FAIL.

### R30 — Retention/legal basis

**Original required contents:** Schedule, legal holds, erasure policy, classification/jurisdiction decisions.  
**Original integrity/binding:** Approved policy version/audit.  
**Original missing consequence:** Recovery scope undefined.

- **Failure injection:** Remove retention/legal policy; alter schedule/jurisdiction/classification; expire or bypass a legal hold; claim recovery of data outside lawful retention.
- **Detection:** Reconcile approved policy version, legal hold register, object metadata, jurisdiction and erasure events.
- **Isolation:** Suspend retrieval/disclosure of affected content pending legal/privacy determination; preserve permitted integrity metadata.
- **Recovery:** Retrieve approved policy and legal-hold/erasure records from authorized governance source; recover content only within lawful scope.
- **Independent verification:** Privacy/legal reviewer confirms scope, authority, retention and erasure; technical reviewer verifies actual object/key disposition.
- **Acceptance:** PASS only when recovery scope is approved and each object disposition matches policy. Undefined legal basis means BLOCKED; it is not permission to restore.

## 4. End-to-end exercise sequence

1. **Authorize scope:** Approve non-production fixture, tenant/ledger/epoch, exact expected genesis/head, all 30 classes, retention scope, RPO/RTO targets and injection schedule. No production data unless separately authorized.
2. **Freeze expected truth:** Independently pin manifest digest, expected receipt/object counts, IDs, digests, sequence range, exact object versions/generations and dependency graph before starting.
3. **Establish clean room:** Prove no access to relational DB, DB backup, application export, cache or production app credentials. Record environment and network policy.
4. **Enumerate from trust root:** Start at independently pinned R01 genesis. Enumerate R02 epoch history and R03 receipts; never begin from a mutable latest-head pointer alone.
5. **Retrieve exact objects:** Fetch R04 and all dependencies using exact object versions/generations. Verify bytes, lengths, digests, signatures and receipt bindings.
6. **Reconstruct semantics:** Rebuild R05 lifecycle and R07 lineage; verify R08 privacy state; validate R09–R14 authorization/trust/schema/crypto dependencies.
7. **Reconstruct decisions:** Retrieve R15–R16 snapshots/finalization; R17–R24 execution and data dependencies; R25 human provenance.
8. **Reconcile trust incidents:** Verify R26 incidents, R27 audit, R28 manifest/run evidence, R29 key recovery and R30 legal scope.
9. **Run class injections:** Execute each applicable class test in an isolated fixture. Run one fault at a time first; then approved compound scenarios to test interacting failures. Retain before/after evidence.
10. **Test fail-closed behavior:** Demonstrate that any missing/altered/unverifiable required object blocks affected state and prevents a FULL result, actionable snapshot, mutation or re-enablement.
11. **Compare expected and recovered state:** Compare receipt head, sequence/counts, exact object IDs/digests, lifecycle state, snapshot watermarks and dependency results to the pre-pinned manifest.
12. **Independent sign-off:** Independent verifier and reviewer reproduce results from raw evidence. Recovery operator cannot self-certify. Re-enable only through a separate authorized decision.

## 5. Required compound scenarios

The following cross-class scenarios are mandatory because isolated per-class tests do not prove the system handles interacting failures:

- **C01 — Receipt present, envelope absent:** the committed Spanner R03 receipt exists but its exact referenced S3 R04 VersionId is missing or unavailable; require quarantine and no ledger FULL.
- **C02 — Checkpoint rollback versus post-checkpoint tail:** restore an older valid checkpoint while newer accepted R03 receipts exist; discover and verify the complete tail from independently anchored witness history; reject stale history.
- **C03 — Historical key compromise:** combine R12 key compromise interval, R03 signatures, R11 issuer/key history and R26 incident record; quarantine the uncertain interval and do not retroactively trust it.
- **C04 — Erasure and replay:** combine R08 tombstone, R06 encrypted payload, R29 key disposition and R30 legal policy; preserve permitted integrity evidence while reporting content PARTIAL, never FULL.
- **C05 — Authorization provenance loss:** combine R09 assertion, R10 decision, R11 issuer metadata and R25 actor context; accepted mutation provenance must become UNVERIFIABLE if any required proof is absent.
- **C06 — Snapshot dependency loss:** combine R15/R16 with missing R17–R24 dependencies; preserve snapshot integrity while marking recomputation/reconstruction PARTIAL or UNAVAILABLE.
- **C07 — Recovery package tampering:** alter R28 manifest and R27 report; independent reviewer must detect and reject the purported result.
- **C08 — Key restore and signer interruption:** combine R12/R13/R29; stop signing, restore only under quorum, verify historical signatures and explicitly document any new epoch.

## 6. Global acceptance gates

A recovery exercise may be marked **PASS for its declared scope** only if all conditions hold:

1. All R01–R30 classes appear in the signed manifest; every class has a valid status and evidence-backed explanation.
2. Every in-scope retained object is retrieved by exact immutable version/generation and matches expected digest and byte length.
3. Receipt history is contiguous from independently pinned genesis to the exact expected head; no unexplained gap, fork, rollback or unanchored tail exists.
4. Every accepted mutation has verifiable authorization provenance and historical issuer/key state.
5. Every finalized snapshot binds to its exact finalization receipt and ledger watermark.
6. Every required dependency resolves to immutable verified bytes or is explicitly ERASED_BY_AUTHORITY, MISSING or UNAVAILABLE with correct scope and consequence.
7. Deterministic replay matches the pinned execution contract. Model-assisted history uses preserved actual output and deterministic downstream processing; no fresh model call is substituted.
8. Injected missing/altered/revoked/erased objects produce exact expected statuses; no unsafe fallback, silent substitution or false FULL state occurs.
9. RPO/RTO are measured from timestamped raw events against pre-approved numeric targets. If targets are not approved before the test, RPO/RTO acceptance is BLOCKED.
10. Raw logs, object refs, manifest, verifier build, output, deviations and independent sign-off are retained and digest-bound.
11. Independent reviewer confirms role separation, verifier independence, scope completeness and absence of production DB dependence.

### Status aggregation — legacy descriptive states only

**Superseded:** This legacy §6 aggregation text is subordinate to v1.1.0 §26.3 and the explicit profile rules in §27.3 below. Unqualified `FULL` is retired and MUST NOT be emitted. `LEDGER_RECOVERED`, `CONTENT_RECOVERED` and `DECISION_HISTORY_RECOVERED` may appear only as descriptive intermediate states; they are not complete-profile acceptance claims. Successful complete recovery claims are exclusively `FULL-L`, `FULL-C`, `FULL-D`, `FULL-O` or `FULL-A`, each subject to its full mandatory profile denominator and evidence gates. The later v1.1.0/v1.1.1 rules control over any conflicting legacy wording.
- **PARTIAL:** some valid history/content/decision material recovered but one or more required objects/dependencies are missing, erased or unverifiable.
- **UNAVAILABLE:** authoritative genesis/continuity or other essential trust basis cannot be established; no authoritative recovery claim can be made.

The source inventory's individual missing-object consequences remain controlling. These aggregate labels do not weaken them.

## 7. Current execution status and blockers

**F-03 test specification: DEFINED.**  
**F-03 live exercise: BLOCKED / NOT RUN.**

The F-01 Spanner/S3 topology is selected at documentary candidate level only; no provider service is provisioned, and no issuer, HSM, recovery export or live receipt history is available. This specification therefore contains no fabricated execution result.

Before a live run:
- F-01 must provide actual stores/witness and approved failure model.
- F-02 must provide a real issuer, trust metadata and authorization evidence.
- F-04 must provide approved cryptographic policy, historical key material, HSM custody and recovery procedures.
- A separately reviewed verifier and independent recovery credentials must exist.
- Legal retention/erasure scope, named operators/reviewers and numeric RPO/RTO must be approved.

A synthetic fixture can validate verifier mechanics only and must be labelled SYNTHETIC. It cannot close F-03 or establish provider-backed recoverability.

**F-03 disposition: INVENTORY PRESERVED; PRACTICAL TEST SPECIFICATION DEFINED; OPERATIONAL RECOVERY NOT DEMONSTRATED.**

## 8. Source preservation and change control

The v1.0 inventory source blob (`8a1d86fce3cf8c5c78edeb2aa468141a60543bcc`) is preserved in Git history. The current companion inventory is v1.1.1 (blob `e15d1c3a9aab98777822302665d17da1c588ba68`) and is the normative companion for this v1.1.1 specification. Original R01–R30 class IDs, labels, required contents, integrity/binding statements and missing consequences remain unchanged. Any future change to those definitions requires an explicit reviewed amendment and versioned traceability update; no silent edits are permitted.


---

## 26. Version 1.1.0 normative reconciliation amendment (2026-11-16)

**Amendment authority:** User-directed F-03 remediation aligned to `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md` (2026-11-15).  
**Amendment status:** Normative documentary amendment for the selected candidate protocol. Provider deployment and operational acceptance remain NOT DEMONSTRATED.  
**Supersession:** This section controls over any conflicting operative instruction elsewhere in this document or its companion inventory that describes DynamoDB MRSC, a two-object-store/MRSC recovery topology, generic “both stores” receipt recovery, or an unqualified independent receipt-copy requirement. Historical text is retained for auditability.

### 26.1 Authoritative topology and commit protocol

The selected candidate is Google Cloud Spanner multi-region as the **sole transactional ICW witness** and AWS S3 Object Lock Compliance as the **immutable exact-version archive for canonical batch envelopes**. This is a documentary design selection only, not deployment, procurement, durability or administrative-independence evidence.

1. Canonicalize the complete batch envelope under the approved policy and compute its digest.
2. Upload the envelope to S3 Object Lock; capture bucket/key/VersionId, retention metadata, length and checksum.
3. Read back that exact VersionId and independently verify bytes/digest. If this fails, do not attempt commit.
4. Prepare and sign a receipt candidate binding expected prior head, candidate sequence/range, envelope digest and exact S3 VersionId, idempotency identity, request digest and schema/crypto policy versions. A candidate signature is not proof of commit.
5. Execute one Spanner serializable read-write transaction that validates the expected head and atomically inserts the committed receipt and idempotency identity and advances the head.
6. The successful Spanner transaction is the sole logical acceptance/commit point. Acknowledge only after commit.

**Authority matrix:** committed receipt, authoritative head and idempotency identity are authoritative in Spanner. Exact canonical envelope bytes are archived in the referenced S3 object version. S3 object existence never proves acceptance. A prepared/signed candidate without successful Spanner commit is not a receipt. This baseline does **not** require a second independently committed receipt-byte archive in S3 or another provider. A separate receipt archive requires a separately versioned architecture decision defining commit binding, publication lag, failure, lost-acknowledgement and recovery semantics.

**Abort/orphan:** if Spanner aborts after S3 upload, no receipt is accepted and no head advances. The S3 object is an uncommitted orphan, not accepted history; quarantine and reconcile it against Spanner receipt/idempotency history under the approved retention/legal policy. Do not silently delete, promote or replay it.

**Lost acknowledgement:** query Spanner by the original idempotency identity and request digest. Same identity/digest returns the original committed receipt; same identity/different digest is an integrity conflict. No second sequence is allocated. If no committed record exists, the operation was not accepted.

**Post-commit S3 loss:** the Spanner commit remains a committed ledger event, but the missing exact envelope makes every profile requiring that envelope PARTIAL/UNAVAILABLE. Never substitute another version or a database export.

The companion inventory v1.1.0 contains the object authority/placement matrix and orphan classifications. Required tests include upload/read-back failure, transaction abort, CAS loser, crash before commit, crash after commit before acknowledgement, idempotent retry, digest conflict, S3 version substitution, retention mismatch, S3 outage after commit and orphan reconciliation. Retain raw provider responses, transaction IDs, exact VersionIds, receipt/head/idempotency before/after state and independent verifier output.

### 26.2 Independent expected-truth oracle

A separately executed verifier is not an independent oracle if its expected values can be rolled back with the witness, manifest, audit source or recovery tool. Before disaster, create an independently controlled expected-truth anchor package binding at minimum: tenant/ledger/epoch scope; trusted genesis; expected committed head and sequence; cryptographic commitment to receipt identities/ranges; commitment to accepted-envelope inventory and exact S3 VersionIds; profile/scope version; schema/canonicalization/crypto policy versions; anchor time, signer/key identity and retention evidence.

The anchor owner, writer, legal owner, trust root, update cadence, monotonicity, retention and recovery path must be specified in the approved trust/parameter register. It must be outside the ordinary application and recovery-package rollback boundary. A post-disaster manifest generated solely from recovered Spanner/S3 contents, mutable audit logs or operator output is not independent expected truth.

This amendment does not silently impose a numeric minimum number of anchor providers. The approved threat model must explicitly set the required number and independence criteria. If no independent source can establish completeness relative to prior acknowledged commits, no completeness-qualified FULL result is allowed. The only permitted limited statement is: **“Internally consistent recovery achieved; completeness relative to all prior acknowledgements not proven.”**

Required tests: coordinated rollback of Spanner head, recovered manifest and one audit source; stale-but-valid anchor; missing anchor; conflicting anchors; replay; compromised anchor key; verifier substitution; and operator-selected denominator. False completeness is FAIL.

### 26.3 Fixed recovery profiles and FULL semantics

Declare one or more fixed profiles before recovery. L is the common integrity prerequisite; C, D and O each include L; A is the union of L+C+D+O for the complete approved scope. Profiles cannot be redefined or narrowed during an exercise.

| Profile | Mandatory claim |
|---|---|
| **L — Ledger integrity** | Trusted genesis/epoch continuity; complete committed Spanner receipt/head/idempotency history; exact receipt-bound accepted-envelope versions; signature/key/policy/schema verification; independent expected-truth comparison; required tombstones, manifest and audit evidence. No claim of payload recovery or service restoration. |
| **C — Content recovery** | L plus all lawfully retained in-scope original evidence payloads, normalized captures, attachments, lineage and exact version/provenance bindings. Erased plaintext is never counted as recovered. |
| **D — Decision-history recovery** | L plus every in-scope snapshot/finalization receipt, evidence/provenance, policy/rules, taxonomy, engine/runtime, projector/canonicalizer, feature definitions, configuration, external inputs, model provenance and human inputs required to substantiate the declared historical decision claims. |
| **O — Operational restoration** | L plus all approved clean-environment service dependencies: identity/authorization, network/DNS/TLS, runtime/builds, secrets/key access, queues/workers, monitoring, projections, APIs/caches/exports/downstream consumers, cutover and old-site fencing. |
| **A — Complete approved scope** | L+C+D+O across the entire pre-approved tenant/ledger/epoch/time/sequence/service scope, with no unapproved exclusions. |

The companion inventory v1.1.0 defines the R01–R30 profile-to-class matrix and supplemental O-01–O-08 operational dependencies. All R01–R30 entries remain present in every manifest. A class not mandatory for a particular profile remains visible and becomes mandatory whenever the declared scope depends on it. Erasure is represented by independently verified tombstones, not recovered plaintext.

**FULL semantics:** unqualified FULL is prohibited. Only FULL-L, FULL-C, FULL-D, FULL-O or FULL-A may be emitted, and only after every mandatory requirement for that profile passes. Any missing, altered, unavailable, unverified or unapproved mandatory dependency prohibits that profile's FULL result. Coverage uses the independently anchored pre-disaster denominator, never the recovered subset. PARTIAL/UNAVAILABLE is a valid safe outcome, not FULL. Ledger/content reconstruction does not imply operational restoration.

### 26.4 Mandatory profile manifest and anti-scope-narrowing controls

The signed pre-exercise manifest MUST bind profile/version; exact tenant/ledger/epoch/time/sequence/service scope; every R01–R30 entry and status; O-01–O-08 where O/A is declared; expected IDs/counts/digests/lengths/schema versions/receipt refs/exact object versions; independent expected head/receipt/envelope commitments; legal exclusions/tombstones/NOT_APPLICABLE approvals; key generations and crypto policies; verifier build/dependencies; RPO/RTO targets and measurement events; denominator, coverage method, omissions and exceptions; signatures, trusted time and reviewer identities.

No post-disaster scope reduction, denominator change, database-export substitution or orphan promotion is permitted. Any change requires a new pre-exercise approved scope/profile version and a new independent anchor.

### 26.5 F-03 status

This amendment resolves the documentary topology, expected-truth and recovery-profile contracts for the selected candidate. It does not close F-03. F-03 remains **OPEN / NOT DEMONSTRATED** until provider-backed fault tests, independent expected-truth verification, complete R01–R30 recovery, profile-specific negative tests, measured RPO/RTO and independent human review are complete. Exercise status remains **BLOCKED — NOT RUN**. No implementation, procurement, infrastructure spend, migration, ingestion, deployment or live exercise is authorized.



## 27. Cross-document correction addendum (v1.1.1, 2026-11-16)

This addendum is normative for this test specification and its v1.1.0 inventory companion. It does not close F-03 or authorize execution.

### 27.1 Witness commit, internal result and client/API result

- **Witness commit:** Spanner commits the exact receipt representation, idempotency identity and authoritative head atomically. This is the sole logical acceptance point.
- **Internal commit result:** the caller resolves an ambiguous commit response through the original idempotency identity and request digest in Spanner.
- **Client/API success:** success is returned only after the full receipt-bound projection transaction is applied and verified. A committed-but-projection-pending operation returns typed HTTP 202; it is not current, decision-serving or actionable. No client success follows a pre-commit failure.
- “Acknowledge only after commit” MUST NOT be interpreted as client/API success at witness-commit time.

### 27.2 R03 exact receipt representation

The committed Spanner R03 row MUST retain the exact canonical signed receipt bytes, or a formally specified canonical representation that reproduces the exact signed bytes without ambiguity. Recovery reads this representation from Spanner with independently issued recovery credentials and verifies commit identity, receipt identity, sequence, previous-head binding, resulting head, idempotency identity, request/batch digest, signature and chain continuity. The expected-truth anchor verifies expected inventory and completeness; it is not a second receipt authority. No independent receipt archive is assumed.

### 27.3 FULL vocabulary precedence

This §27.3 and v1.1.0 §26.3 supersede legacy §6 “Status aggregation”. Unqualified `FULL` is prohibited. Only profile-qualified `FULL-L`, `FULL-C`, `FULL-D`, `FULL-O` and `FULL-A` may be emitted after all mandatory requirements and denominator checks for that profile pass. Legacy recovery labels are intermediate descriptive states only. BLOCKED, NOT RUN, PARTIAL, UNAVAILABLE and ERASED_BY_AUTHORITY cannot be promoted to PASS by omission or scope reduction.

### 27.4 O-01–O-08 operational recovery test suite

The following tests are mandatory for FULL-O and FULL-A. Each is executed in a clean isolated recovery environment with one fault injected at a time, raw evidence retained, and an independent verifier/reviewer. Each failure must block re-enablement.

| Test ID | Dependency / failure injection | Required detection and isolation | Recovery and independent verification | Negative assertion / acceptance |
|---|---|---|---|---|
| F03-O-01 | Identity/IAM/authorization bootstrap unavailable; revoke or substitute recovery principal, issuer trust root or role grant | Detect failed identity provenance, privilege mismatch or missing trust root; isolate service from tenant access | Restore only approved identity/issuer configuration; verify grants, signed assertions, MFA/break-glass and audit from separate reviewer credentials | No default/admin bypass, shared app credential or unaudited break-glass; PASS only with least-privilege and issuer verification |
| F03-O-02 | Network/DNS/TLS dependency missing, stale, misrouted or certificate invalid | Detect DNS, route, firewall, certificate-chain, hostname or TLS-policy mismatch; keep service offline | Restore approved network policy and certificate chain; independently inspect DNS answers, route rules, certificate fingerprints/validity and TLS handshake | No plaintext, insecure endpoint, permissive wildcard or stale endpoint; no traffic until verified |
| F03-O-03 | Runtime/build artifact unavailable or substituted; dependency lockfile/SBOM mismatch | Detect source/build/container digest, runtime, compiler, dependency or SBOM mismatch | Rebuild from pinned source and lockfiles or retrieve exact approved image; independent reproducibility/digest verification | No floating tag, unpinned dependency or unreviewed hotfix; service cannot start on mismatch |
| F03-O-04 | Secrets/HSM/KMS access unavailable, wrong key version or unauthorized key recovery | Detect missing key reference, wrong generation, HSM policy/custody/quorum failure | Restore exact approved key access under custody quorum; verify public fingerprints, key IDs, HSM audit and historical verification without exposing secret material | No plaintext key export, key regeneration under old identity or single-operator bypass; no signing/verification claim without key evidence |
| F03-O-05 | Queue/topic/worker/scheduler unavailable; duplicate, reordered or replayed delivery; dead-letter backlog | Detect stalled offsets, lost tasks, retry storm, duplicate side effects and idempotency mismatch | Restore pinned queue/worker definitions and offsets where authoritative; replay with stable idempotency; independently reconcile input/output counts and side effects | No dropped accepted task, duplicate mutation, skipped dead letter or non-idempotent replay; downstream remains gated until reconciled |
| F03-O-06 | Monitoring, trusted time or audit export unavailable/tampered | Detect missing metrics/logs/traces, clock uncertainty, alert suppression or audit-export gap | Restore pinned alert/configuration, trusted-time source and independent audit destination; compare raw timestamps and export digests | No silent operation without audit/time evidence; if time uncertainty exceeds approved bound, affected claims remain BLOCKED |
| F03-O-07 | Projection/API/cache/downstream dependency stale, unavailable or serving old state | Detect projection watermark mismatch, stale cache, API pending state or downstream consumer not gated | Rebuild projection from verified ICW receipts/envelopes; invalidate caches; verify API, export and consumers against current head | No decision serving/actionability on pending or stale projection; typed 202/unavailable until verified; no DB-only fallback |
| F03-O-08 | Cutover/rollback fault; old writer remains active; split-brain or duplicate write path | Detect active old writers, conflicting DNS/traffic, dual-write or stale site credentials | Execute approved cutover with fencing, traffic switch, write-disable and rollback controls; independently verify single writer and service-owner approval | No re-enable while old writer can append or old site can serve; no rollback that regresses accepted history; re-enable requires separate service-owner authorization |

**FULL-O gate:** all O-01–O-08 must be PASS or individually approved NOT_APPLICABLE under the signed pre-exercise scope, with independent evidence. Any BLOCKED/NOT RUN/FAIL/UNAVAILABLE mandatory operational dependency prohibits FULL-O and service re-enablement.

**FULL-A gate:** every mandatory L, C, D and O requirement for the approved complete scope must pass, including O-01–O-08. The same denominator, anchor, anti-scope-narrowing and measured RPO/RTO gates apply. A successful data reconstruction without operational restoration is not FULL-A.

### 27.5 Profile-level acceptance and anti-scope-narrowing tests

- **F03-PROFILE-L:** independently verify R01–R05 plus required trust/crypto dependencies from trusted genesis to expected head; reject receipt gap, fork, altered receipt or unanchored completeness claim.
- **F03-PROFILE-C:** require FULL-L plus every lawfully retained in-scope R06 payload and R07/R08 lineage/tombstone binding; erased plaintext is never counted.
- **F03-PROFILE-D:** require all decision-scope R09–R25 artifacts and exact snapshot/finalization/replay dependencies; no fresh model call substitutes for preserved actual output.
- **F03-PROFILE-O:** require O-01–O-08 and clean-environment service restoration/cutover gates above.
- **F03-PROFILE-A:** require every mandatory L/C/D/O and all in-scope R01–R30 objects, O-01–O-08 and approved operational scope.
- **F03-SCOPE-01:** remove a mandatory class, tenant, epoch, sequence range, key generation or dependency from the recovered manifest while retaining the signed pre-disaster denominator. PASS only if verifier rejects scope mismatch and prohibits profile FULL.
- **F03-ANCHOR-01:** present older/replayed expected-truth anchor; reject monotonic regression.
- **F03-ANCHOR-02:** present same-position conflicting head/digest; quarantine and prohibit FULL.
- **F03-ANCHOR-03:** remove anchor coverage for a post-anchor receipt range; prohibit completeness-qualified FULL for that uncovered interval. This test does not decide the unresolved production acknowledgement/anchor publication contract.
- **F03-RPO-01:** calculate RPO from the last independently proven accepted position to recovered position using trusted timestamps; compare to pre-approved numeric target. Missing target/time source = BLOCKED.
- **F03-RTO-01:** measure from declared disaster start to independently verified restoration/re-enable-ready point; compare to pre-approved numeric target. Missing target/time source = BLOCKED.

### 27.6 Explicitly unresolved design decisions — no silent default

**AUD-XD-06 (expected-truth anchor): OPEN / DESIGN AUTHORITY DECISION REQUIRED.** This specification does not decide whether the F-03 expected-truth anchor is the same artifact as the core v4 monotonic checkpoint anchor, a separate source, or a composite; it does not select an owner/provider, writer, trust root, publication cadence or client-success dependency. Before implementation, the architecture authority must approve a versioned contract defining these fields and choose either (a) client-visible success waits for independently published anchor coverage, or (b) a bounded unanchored-to-oracle interval is accepted, with an explicit rule prohibiting completeness-qualified FULL for uncovered commits after rollback. The approved threat model and RPO/RTO must bound the choice. No numeric anchor-provider count is invented.

**AUD-XD-07 (R06 payload object/erasure model): OPEN / DESIGN AUTHORITY AND PRIVACY DECISION REQUIRED.** This specification does not choose whether R06 bytes are embedded in the R04 envelope or separately stored as encrypted immutable objects, nor does it invent an Object Lock/key-destruction exception. Before implementation, approve a versioned object model specifying canonical envelope versus payload bytes, authoritative locator and exact VersionId for each object, receipt-bound digest/length/key references, per-object/subject key lifecycle, lawful erasure and tombstone proof, Object Lock/retention compatibility, and the exact profile downgrade when a payload is unavailable or erased. Until then R06 content recovery remains BLOCKED where those details are required; ledger integrity must not be represented as content reconstruction.

### 27.7 Execution and governance boundary

All new cases are TESTS DEFINED / NOT RUN. No provider-backed test, operational restoration, RPO/RTO measurement, legal-erasure validation or independent acceptance is claimed. F-01–F-04 remain OPEN / NOT DEMONSTRATED; overall disposition remains HOLD — NOT ACCEPTED.
