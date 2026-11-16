# ICW v4.2 — Independent Review Remediation Checklist

**Version:** 0.2.0  
**Date:** 2026-11-16  
**Register:** `reviews/CONSOLIDATED_INDEPENDENT_FINDINGS_REGISTER.md`  
**Status:** Tracking only. No implementation or live-exercise authorization.

All items are initially unchecked. Gemini findings GDSF-01–GDSF-04 are cross-linked to the existing workstreams below; no duplicate workstream is created solely to count the same remediation twice. A completed document edit does not close the finding. Mark an item complete only when the listed artifact exists; mark a finding CLOSED only after the required independent acceptance test passes and closure evidence is retained.

## P0 / critical documentary and assurance gates

- [ ] **REM-01 — Normative dependency trace** (Copilot CR-01; Claude P0-05; Gemini F-03-01)  
  Freeze all four normative v4 documents and referenced artifacts in one immutable review baseline. Map every service, persisted object, manifest field and dependency to recovery class, restore order, verifier, failure consequence, requirement and test.  
  **Evidence:** baseline commit and per-file hashes; completed dependency trace; independent consistency review.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-02 — F-03 topology amendment** (Copilot CR-02; Claude P1-01)  
  Remove stale MRSC/dual-store assumptions through a signed, versioned amendment. Define Spanner/S3 receipt, head, idempotency, envelope, checkpoint and archive locations; clarify “both stores” and independent copies.  
  **Evidence:** signed amendment; cross-reference audit; exact provider API and retrieval semantics.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-03 — Independent completeness oracle** (Copilot CR-03; Claude P0-01/P1-10)  
  Establish at least two independently controlled pre-disaster anchors and inject coordinated rollback of head, expected manifest and one audit source.  
  **Evidence:** anchor ownership/retention proofs; injected rollback transcript; independent detection result; limited-claim behavior when no external anchor exists.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-04 — Fixed recovery profiles and FULL semantics** (Copilot CR-04; Claude P1-10)  
  Define profiles L/C/D/O/A with mandatory scope, approval authority, boundaries, R01–R30 mapping, key ranges, legal exclusions and RPO/RTO.  
  **Evidence:** versioned profile schema; scope hash; independent expected inventory; omission list; coverage calculation; scope-narrowing negative tests.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-05 — Operational service restoration** (Copilot CR-05; Gemini F-03-01)  
  Add a profile that proves clean-account service restoration, not just archival reconstruction.  
  **Evidence:** clean account/org; new identities/network/DNS/TLS/monitoring; verified replay and projections; consumer/cache gating; synthetic business transactions; duplicate prevention; old-site fencing; authorized cutover; measured service RTO.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

## High-priority identity, provider, recovery and control-plane gates

- [ ] **REM-06 — Recovery credential bootstrap** (Copilot H-01; Claude P1-06/P1-07; Gemini F-02-01)  
  Specify and test the credential-denial matrix, quorum bootstrap and break-glass path without production application credentials.  
  **Evidence:** identity/account ownership and recovery procedure; raw logs for IdP, custodian, mailbox, token, federation, policy and provider-support failures.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-07 — Provider outage and provider-exit claims** (Copilot H-02; Claude P0-02/P1-09; Gemini F-01-01)  
  Separate same-provider regional recovery, same-provider account-loss recovery and provider-exit recovery.  
  **Evidence:** provider-by-provider export/restore matrix; customer-controlled export; verifier output without unavailable provider, or an explicit narrowed portability claim.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-08 — Numeric RPO/RTO definitions** (Copilot H-03)  
  Approve separate ledger, content, verification, service, decision-history and key-recovery objectives with immutable start/end events.  
  **Evidence:** signed parameter register; repeated-run timestamped raw measurements; acknowledged-commit loss calculation; throughput, volume, percentile and worst-case results.  
  **Finding state:** OPEN. **Test state:** BLOCKED / NOT RUN.

- [ ] **REM-09 — Actual HSM backup restore** (Copilot H-04; ChatGPT A12; Gemini F-04-01)  
  Restore randomly selected generations, including pre/post rotation, corrupted, wrong-region/account and missing-custodian cases.  
  **Evidence:** backup IDs; quorum approvals; restored fingerprints/attributes/allowed operations; known-answer signatures; KEK/payload recovery where in scope; HSM audit; measured restore throughput.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-10 — Compound control-plane compromise** (Copilot H-05; Claude P0-04/P1-06/P1-07; Gemini F-01-01)  
  Inject simultaneous identity-provider, cloud-organization-admin, manifest/deployment/head/audit compromise.  
  **Evidence:** offline trust pins; separate provider account; two-person approvals; verifier and scope integrity; evidence that alerts and re-enablement cannot be suppressed or self-approved.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-11 — Checkpoint and anchor inventory** (Copilot H-06; Claude P0-01/P1-04)  
  Make checkpoint bytes, publication records, inclusion proofs, external anchors and TSA/customer-held proofs explicit recovery dependencies. Do not alter R01–R30 without a separately approved amendment.  
  **Evidence:** explicit class mapping or approved new class; negative/positive tests for old checkpoint + complete/suppressed tail, missing prefix, compromised key, absent anchor and conflicting checkpoints.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-12 — Dependency graph, abort rules and evidence package** (Copilot additional inventory/process recommendations)  
  Map bootstrap dependencies and recovery order; define abort conditions and required raw evidence for each stage.  
  **Evidence:** machine-readable dependency graph; negative-test matrix; raw provider/API and pagination records; cryptographic verifier outputs; reconstruction and operational proof; independent acceptance record.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

## Global controls

- [ ] Confirm every source reviewer baseline is preserved unchanged.
- [ ] Confirm source finding identifiers remain unchanged and register cross-reference IDs are not substituted for them.
- [ ] Confirm R01–R30 are unchanged.
- [ ] Confirm all AI-review findings remain distinct from the human-independence gate.
- [ ] Confirm F-01 through F-04 remain OPEN until evidence-backed closure.
- [ ] Confirm no BLOCKED, NOT RUN, PARTIAL or UNAVAILABLE result is represented as PASS.
- [ ] Confirm no infrastructure spend, live execution, migration, evidence ingestion or production authorization occurred without separate explicit approval.

**Current overall status: HOLD — all remediation items NOT STARTED; operational tests NOT RUN; implementation/production authorization WITHHELD.**


## Claude Chief Security Critic — additional remediation gates (ICW-REV-CSC-01)

All source findings below remain OPEN; all tests remain NOT RUN unless separate raw evidence is attached. These checklist items supplement REM-01–REM-12 and do not authorize implementation or live testing.

- [ ] **REM-13 — Receipt archive, witnessed heads and commit-bound receipts** (CSC-01, CSC-02, CSC-09)  
  Specify a separate-trust-domain receipt archive, independent writers, archive lag/RPO, witnessed head statements, inclusion/consistency proofs, bounded unanchored tail, and a commit-bound client receipt.  
  **Evidence:** real-provider rollback/project-loss reconstruction; fork and truncation alarms within bound; blind recovery without controller-pinned expected head; CAS loser classified UNCOMMITTED.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-14 — Runtime separation, continuous verification and emergency containment** (CSC-03, CSC-13, CSC-17)  
  Split ingress validation, signing, commit and archive identities; separate deployment authority; independently run continuous verifier; reconcile HSM sign counts; unilateral suspension/quorum resume; consumer-side proof verification.  
  **Evidence:** real-identity non-production runtime compromise test; no verifier-valid forged history; bounded alarm and suspension; forged projection rejected by consumer verifier.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-15 — Tenant authority, user intent and revocation** (CSC-04, CSC-05, CSC-06, CSC-12; Gemini F-02-01)  
  Establish one normative F-02 model; operator-independent tenant-root enrollment/recovery; tenant-visible registry and cool-off; user-held signature over canonical request; authenticated revocation feed with freshness bound and revoke-only authority.  
  **Evidence:** consistency matrix; operator-only re-root attack fails or is detected/reversible; app-as-user attempts fail without user-device signature; measured revoke-to-reject latency.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-16 — Custody partition, recovery governance and actual enforcement points** (CSC-07, CSC-08, CSC-14; Gemini F-04-01)  
  Partition quorums/personnel by key class; define objective quarantine/epoch criteria and safe read-only mode; map HSM vs IAM/org-policy enforcement; split-custody expiring recovery credentials and KEK.  
  **Evidence:** identity-backed custodian matrix; cross-class bypass attempts; lose-two recovery; fabricated anomaly/quarantine exercise; AWS admin bypass and recovery-credential theft drills.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-17 — Provider exit and tenant blast-radius containment** (CSC-15, CSC-20)  
  Define provider-exit/legal-inaccessibility path, exportable receipts/envelopes/public-key history, separate AWS organization or explicit residual risk, per-tenant/cohort delegation and receipt-key strategy.  
  **Evidence:** Google-project and AWS-HSM-account loss exercises; independently verifiable exports; measured blast radius; visible/ratified epoch discontinuity and RPO/RTO.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-18 — Lawful erasure and cryptographic data minimization** (CSC-16)  
  Decide envelope content and retention basis; design destroyable per-subject key layer and keyed commitments without destroying permitted receipt-chain integrity.  
  **Evidence:** erasure exercise proves no recoverable plaintext or confirmable digest; tombstone and receipt chain still verify; independent legal and technical approval.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-19 — Complete baseline, threat model and claims register** (CSC-18, CSC-19, CSC-24)  
  Supply all charter baseline documents/tests with per-file hashes; resolve X1–X14; publish adversary classes, objectives, non-goals and claim/evidence trace; align section/test numbering and identity-provider terminology.  
  **Evidence:** reproducible manifest; signed contradiction/consistency matrix; every normative requirement maps to an adversary, objective and test; independent review.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-20 — Append semantics, digest separation, time, identifiers and verifier independence** (CSC-10, CSC-11, CSC-21, CSC-22, CSC-23)  
  Specify total append order and authorization/replay/retention sequence; separate semantic idempotency and head-bound authorization digests; set TSA/time and Unicode identifier policies; ensure genuinely independent verifier authorship and vectors.  
  **Evidence:** concurrent replay/CAS/revocation/retention tests; TSA rollover/algorithm vectors; adversarial Unicode differential corpus; verifier divergence and authorship evidence.  
  **Finding state:** OPEN. **Test state:** NOT RUN.



## Gemini Distributed Systems and Infrastructure — source finding cross-links (ICW-REV-DSI-01)

- [ ] **GDSF-01 / Gemini F-01-01 — Cross-provider administrative independence**  
  Extend REM-10 and REM-17 evidence to include named legal account owners, separate cloud organizations and IAM hierarchies, super-admin/root-recovery path analysis, role exports, and independent audit-export proofs.  
  **Finding state:** OPEN. **Test state:** NOT RUN.
- [ ] **GDSF-02 / Gemini F-02-01 — Tenant-root ownership and bootstrap**  
  Extend REM-06 and REM-15 to require named tenant-root owner and second approver, out-of-band identity verification, key-enrollment evidence, and negative tests for operator-controlled or unverified bootstrap.  
  **Finding state:** OPEN. **Test state:** NOT RUN.
- [ ] **GDSF-03 / Gemini F-03-01 — R01–R30 clean-room recovery execution**  
  Extend REM-01, REM-05, REM-11 and REM-12. First reconcile and approve the complete normative test baseline, dependencies and authorization; only then run the recovery suite in an isolated non-production environment with independent expected-truth sources and raw evidence. Do not modify or renumber R01–R30 as part of this checklist update.  
  **Finding state:** OPEN. **Test state:** NOT RUN / NOT AUTHORIZED BY THIS REGISTER.
- [ ] **GDSF-04 / Gemini F-04-01 — CloudHSM, FIPS and human-quorum evidence**  
  Extend REM-09, REM-16 and REM-20 to require named 2-of-3 custodians with disjoint roles, actual CloudHSM provisioning only after separate approval, FIPS mechanism/firmware validation, and independent known-answer vectors across two implementations.  
  **Finding state:** OPEN. **Test state:** NOT RUN / NOT AUTHORIZED BY THIS REGISTER.

**Gemini review disposition note:** Gemini's CONDITIONAL PASS is limited to architectural design progression and test-framework validation. It does not supersede the consolidated HOLD — NOT ACCEPTED, authorize provisioning or spending, authorize live tests, or satisfy the independent human-review gate.


## Grok — Independent Systems Assurance Auditor (Reviewer 05, ICW-REV-ISA-01)

Grok's source findings ISA-01–ISA-11 remain OPEN. The source-preserving baseline is `reviews/ICW-REV-ISA-01_BASELINE.md`. The mappings below supplement existing workstreams; they do not close findings or authorize execution.

- [ ] **ISA-01 / ISA-02 — F-02 authority and assertion contract** → REM-15. Establish one controlling Okta disposition and one signed assertion schema covering ledger, epoch, expected head, grant reference and TAR delegation. Produce a four-document consistency matrix and field-level schema coverage. **Finding state:** OPEN. **Test state:** NOT RUN.
- [ ] **ISA-03 — Register/commit primitive consistency** → REM-01 / REM-02. Remove superseded single-item CAS instructions and align register, F-01 topology decision and F-03 procedure to the selected Spanner transaction. **Finding state:** OPEN.
- [ ] **ISA-04 — F-03 topology and receipt-byte placement** → REM-02 / REM-13. Amend MRSC/two-store assumptions; explicitly decide whether an independent receipt-byte copy exists and identify its trust boundary, owner, write/read/recovery behavior. **Finding state:** OPEN. **Test state:** NOT RUN.
- [ ] **ISA-05 / ISA-09 / ISA-11 — Review baseline and integrity pins** → REM-01 / REM-19. Freeze the charter-required manifest and archive contents; hash each original source file with a declared algorithm; reconcile missing contracts/tests; correct duplicate section numbering. **Finding state:** OPEN.
- [ ] **ISA-06 — Status vocabulary consistency** → REM-19. Use the register's defined lifecycle vocabulary consistently across F-01/F-02 source records, register and execution status. **Finding state:** OPEN.
- [ ] **ISA-07 — F-04 crypto suite and quorum consistency** → REM-16 / REM-20. Remove the stale algorithm-selection blocker, explicitly supersede or restore the plan's dual-control sentence, and publish one operation-by-operation quorum matrix. **Finding state:** OPEN. **Test state:** NOT RUN.
- [ ] **ISA-08 — Pre-commit object retention and orphan disposition** → REM-18 / REM-22. Define object state before Spanner commit, S3 Object Lock timing, orphan legal classification, lost-acknowledgement/retry behavior and erasure/key-destruction disposition. **Finding state:** OPEN. **Test state:** NOT RUN.
- [ ] **ISA-10 — Acyclic non-production evidence stage** → REM-21. Define authorization and forbidden status transitions for each evidence-generation stage; preserve separate production gate. **Finding state:** OPEN. **Test state:** NOT RUN.

### New workstream gates

- [ ] **REM-21 — Non-production evidence-stage authorization and sequencing** (Grok ISA-10)  
  Define an acyclic sequence for account/ownership verification, crypto compatibility, synthetic verifier and fault injection. Each stage must identify its authorization, evidence output and forbidden status transition. No stage may set F-01–F-04 to ACCEPTED or authorize production.  
  **Evidence:** approved gate diagram; named authority; explicit non-production boundary; separate production authorization gate.  
  **Finding state:** OPEN. **Test state:** NOT RUN / NOT AUTHORIZED BY THIS CHECKLIST.

- [ ] **REM-22 — Pre-commit object state and orphan retention disposition** (Grok ISA-08)  
  Specify crash-before-upload, crash-after-upload, Spanner abort and lost-acknowledgement outcomes, including exact S3 version/lock state and lawful treatment of unaccepted envelopes.  
  **Evidence:** failure matrix; accepted/unaccepted classification; approved retention, erasure and key-destruction disposition; no irreversible object with undefined legal status.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

**Grok review disposition:** FAIL for the frozen documentary package. This supports the existing HOLD — NOT ACCEPTED disposition. It does not constitute a human independent audit, operational evidence, closure, or authorization.
