# ICW v4.2 — Independent Review Remediation Checklist

**Version:** 0.1.0  
**Date:** 2026-11-16  
**Register:** `reviews/CONSOLIDATED_INDEPENDENT_FINDINGS_REGISTER.md`  
**Status:** Tracking only. No implementation or live-exercise authorization.

All items are initially unchecked. A completed document edit does not close the finding. Mark an item complete only when the listed artifact exists; mark a finding CLOSED only after the required independent acceptance test passes and closure evidence is retained.

## P0 / critical documentary and assurance gates

- [ ] **REM-01 — Normative dependency trace** (Copilot CR-01; Claude P0-05)  
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

- [ ] **REM-05 — Operational service restoration** (Copilot CR-05)  
  Add a profile that proves clean-account service restoration, not just archival reconstruction.  
  **Evidence:** clean account/org; new identities/network/DNS/TLS/monitoring; verified replay and projections; consumer/cache gating; synthetic business transactions; duplicate prevention; old-site fencing; authorized cutover; measured service RTO.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

## High-priority identity, provider, recovery and control-plane gates

- [ ] **REM-06 — Recovery credential bootstrap** (Copilot H-01; Claude P1-06/P1-07)  
  Specify and test the credential-denial matrix, quorum bootstrap and break-glass path without production application credentials.  
  **Evidence:** identity/account ownership and recovery procedure; raw logs for IdP, custodian, mailbox, token, federation, policy and provider-support failures.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-07 — Provider outage and provider-exit claims** (Copilot H-02; Claude P0-02/P1-09)  
  Separate same-provider regional recovery, same-provider account-loss recovery and provider-exit recovery.  
  **Evidence:** provider-by-provider export/restore matrix; customer-controlled export; verifier output without unavailable provider, or an explicit narrowed portability claim.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-08 — Numeric RPO/RTO definitions** (Copilot H-03)  
  Approve separate ledger, content, verification, service, decision-history and key-recovery objectives with immutable start/end events.  
  **Evidence:** signed parameter register; repeated-run timestamped raw measurements; acknowledged-commit loss calculation; throughput, volume, percentile and worst-case results.  
  **Finding state:** OPEN. **Test state:** BLOCKED / NOT RUN.

- [ ] **REM-09 — Actual HSM backup restore** (Copilot H-04; ChatGPT A12)  
  Restore randomly selected generations, including pre/post rotation, corrupted, wrong-region/account and missing-custodian cases.  
  **Evidence:** backup IDs; quorum approvals; restored fingerprints/attributes/allowed operations; known-answer signatures; KEK/payload recovery where in scope; HSM audit; measured restore throughput.  
  **Finding state:** OPEN. **Test state:** NOT RUN.

- [ ] **REM-10 — Compound control-plane compromise** (Copilot H-05; Claude P0-04/P1-06/P1-07)  
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
