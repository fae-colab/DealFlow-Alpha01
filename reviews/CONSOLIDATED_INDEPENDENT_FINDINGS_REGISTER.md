# ICW v4.2 — Consolidated Independent Findings Register

**Register version:** 0.2.0  
**Date:** 2026-11-16  
**Baseline branch:** `docs/icw-v4-2-evidence-closure`  
**Working branch:** `review/icw-v4-2-copilot-dr-review`  
**Status:** Documentation-only review register. No implementation, infrastructure, test execution, migration, evidence ingestion, production deployment, or merge authorization is granted.

## 1. Governing disposition

**HOLD — NOT ACCEPTED.**

- F-01: OPEN / NOT DEMONSTRATED.
- F-02: OPEN / NOT DEMONSTRATED.
- F-03: OPEN / NOT DEMONSTRATED; test specification only, with material documentary revisions required before execution.
- F-04: OPEN / NOT DEMONSTRATED.
- Implementation and production authorization: WITHHELD.

This register consolidates reviewer findings. It does not replace any reviewer report, amend normative requirements, change the R01–R30 inventory, or declare a finding closed. A documentation amendment alone is not closure evidence. A finding may be closed only after its defined implementation/evidence prerequisites and objective acceptance tests pass, with independent review recorded.

## 2. Reviewer index and preserved baselines

| Register ID | Reviewer | Role / scope | Date | Original finding identifiers | Baseline and preservation status |
|---|---|---|---|---|---|
| ICW-REV-CRYPTO-01 | ChatGPT | Independent Cryptography and Key Management Specialist | 2026-11-15 | Original report's A01–A12 and workstream findings; preserve source identifiers | Preserved as `ICW-REV-CRYPTO-01_BASELINE.md` in the prior independent-review artifact. Original report remains unchanged. |
| ICW-REV-ARCH-01 | Claude | Chief Security Architect and Adversarial Security Critic | 2026-11-16 | P0-01–P0-05; P1-01–P1-12; P2-01–P2-11; P3-01–P3-06 | Original source: `ICW v4.2 — Independent Security Architecture Review (Adversarial).md`. The source did not specify a stable reviewer ID; ICW-REV-ARCH-01 is the register-assigned reference only. |
| ICW-REV-DS-01 | DeepSeek | Adversarial architecture/security review | 2026-11-15 | P0-01–P0-05; P1-01–P1-09; P2-01–P2-06; P3-01–P3-03 | Review supplied by the owner in conversation. Preserve all original IDs. A standalone immutable source file has not yet been added to this branch. |
| **ICW-REV-DR-01** | **Copilot** | **Adversarial Disaster Recovery Review** | **2026-11-16** | **CR-01–CR-05; H-01–H-06** | **Verbatim baseline preserved at `reviews/ICW-REV-DR-01_BASELINE.md`; Git blob SHA `f78419ee14696123dab54782587c0c84ab2c93f7`.** |

All four named reviews are AI-generated reviews. They are useful independent analytical passes but **do not satisfy the charter's human-independence gate or replace a qualified external human review**. No external reviewer engagement is claimed.

## 3. Consolidation rules

1. Reviewer baselines remain immutable and separately attributable.
2. Original finding IDs are never renumbered, rewritten, or reused.
3. Register-level IDs below are cross-review tracking keys only; they do not replace source IDs.
4. Similarity is recorded as overlap, not proof that two findings are identical.
5. Where a mapping is uncertain, it is marked **POTENTIAL OVERLAP — VERIFY**, not asserted as confirmed.
6. R01–R30 remain unchanged. If a reviewer proposes new inventory coverage, record it as a proposed amendment with a separate decision; do not silently add or renumber a recovery class.
7. Finding status is independent of document status. Rewriting a document does not close a finding.
8. BLOCKED, NOT RUN, PARTIAL, UNAVAILABLE, or undocumented outcomes must never be promoted to PASS.
9. Copilot's CR/H identifiers are retained exactly as supplied. The new register-level keys are not source finding IDs.

## 4. Consolidated finding map

### 4.1 Copilot findings — source-preserving map

| Register key | Original Copilot ID | Severity | Finding summary | Cross-review relationship | Current state |
|---|---|---|---|---|---|
| CF-01 | CR-01 | Critical | Complete normative recovery contract absent from the frozen review package; no dependency-to-requirement/test trace | **Confirmed overlap:** Claude P0-05 (review basis incomplete). Also relates to the earlier ChatGPT concern that claims need exact normative source and closure evidence. | OPEN — DOCUMENTARY GAP |
| CF-02 | CR-02 | Critical | F-03 retains stale MRSC / “both stores” topology language inconsistent with the Spanner + S3 candidate | **Confirmed overlap:** Claude P1-01 (F-03 still written for superseded MRSC and dual-store topology). | OPEN — DOCUMENTARY CONTRADICTION |
| CF-03 | CR-03 | Critical | Expected-truth oracle can be derived from the same compromised/rolled-back source; coordinated rollback can produce false recovery success | **Related overlap:** Claude P0-01 (independent anchor / rollback or fork detection) and P1-10 (false FULL recovery). The Copilot coordinated-rollback test is a distinct, explicit acceptance requirement. | OPEN — INDEPENDENT ORACLE NOT ESTABLISHED |
| CF-04 | CR-04 | Critical | “PASS for declared scope” and FULL can be manipulated by narrowing recovery scope; no fixed mandatory profiles | **Confirmed thematic overlap:** Claude P1-10 (clean-room criteria can falsely report FULL). Copilot adds fixed L/C/D/O/A profiles, scope hash, omission list and coverage requirements. | OPEN — SCOPE GOVERNANCE GAP |
| CF-05 | CR-05 | Critical | Data reconstruction is not operational service restoration; network, identity, runtime, consumer gating, cutover and old-site fencing are not proven | **Potential overlap — verify:** Claude P1-11 and ChatGPT recovery/operational acceptance concerns. Copilot makes full service restoration an explicit profile and end-to-end acceptance gate. | OPEN — SERVICE RESTORATION NOT SPECIFIED/DEMONSTRATED |
| CF-06 | H-01 | High | Clean-room recovery credential bootstrap has no demonstrated path under IdP, administrator, custodian, mailbox, token or federation failures | **Related overlap:** Claude P1-06/P1-07 and F-02 authority/administrative separation findings. | OPEN — BOOTSTRAP PATH ABSENT |
| CF-07 | H-02 | High | Same-provider regional/account-loss recovery is conflated with provider-exit portability; total provider unavailability is not tested | **Related overlap:** Claude P0-02 and P1-09 concerning independent receipt copies and provider/account-loss dependency. Provider-exit is an additional distinct claim. | OPEN — PORTABILITY CLAIM UNPROVEN |
| CF-08 | H-03 | High | RPO/RTO have no approved numeric targets or unambiguous start/end measurement events and separate data/service objectives | **Related overlap:** ChatGPT's recovery/key recovery and operational acceptance concerns; verify against full baseline before treating as identical. | OPEN — METRICS BLOCKED |
| CF-09 | H-04 | High | HSM backup existence is not restore evidence; selected generations, account-loss survival, attributes, KEKs, corruption detection and throughput are untested | **Confirmed thematic overlap:** ChatGPT A12 (recovery key loss); related to Claude F-04/key custody findings. | OPEN — RESTORE NOT DEMONSTRATED |
| CF-10 | H-05 | High | No compound identity-provider/cloud-organization compromise scenario spanning manifest, deployment, head and audit sources | **Related overlap:** Claude P0-04 (ICW service plane/trust boundary), P1-06/P1-07 (authority and trust-root boundaries). Copilot adds a multi-control-plane compound scenario. | OPEN — COMPOUND SCENARIO MISSING |
| CF-11 | H-06 | High | Checkpoint, anchor, inclusion-proof and publication artifacts are not explicit recovery dependencies/classes despite compound checkpoint tests | **Confirmed thematic overlap:** Claude P0-01 and P1-04 (anchor/cadence); also intersects ChatGPT's recovery trust-anchor concerns. | OPEN — INVENTORY/TRACE GAP |

### 4.2 Additional Copilot inventory and process requirements

The following are not separately numbered CR/H findings in the source report. They are preserved as remediation work items, not promoted to new reviewer findings:

- Explicit inventory of infrastructure-as-code/account bootstrap, provider ownership, identity bootstrap, network/DNS/TLS, non-key secrets, artifact/toolchain supply chain, independent verifier supply chain, audit destinations, checkpoint/external-anchor artifacts, projection/consumer state, operational control state, capacity/quotas, communication/decision records, recovery tooling, and historical time sources.
- Machine-enforceable dependency graph and abort conditions for each recovery stage.
- Negative tests for coordinated rollback, pagination omissions/repetition, cache substitution, wrong tenant/epoch, duplicate receipt enumeration, provider outages, compromised identity/control plane, maliciously pre-pinned digests, unauthorized-but-valid signatures, historical-key substitution, shared verifier defects, premature writable startup and old-site reactivation.
- Evidence package covering authorization, clean-room isolation, independent inventory, raw provider API traces, cryptographic verification, reconstruction, key restore, service restoration, RPO/RTO and independent acceptance.

These work items must be assigned to explicit owners and mapped to existing requirements/tests or formally approved new requirements/tests. Do not alter R01–R30 merely to accommodate a reviewer recommendation.

## 5. Consolidated remediation register

The checklist below is deliberately not a closure declaration. All items begin **NOT STARTED** or **NOT RUN** until evidence is supplied.

| Work ID | Source findings | Required action | Minimum acceptance evidence | State |
|---|---|---|---|---|
| REM-01 | Copilot CR-01; Claude P0-05 | Freeze the complete normative v4 contract with hashes; build a component/artifact-to-R01–R30-to-requirement-to-test dependency trace. | All four core v4 docs and all referenced normative artifacts in the same immutable baseline; every persisted artifact and service maps to a recovery class, restore order, verifier, failure consequence and test. | NOT STARTED |
| REM-02 | Copilot CR-02; Claude P1-01 | Amend F-03 topology preconditions and all “both stores”/receipt-copy wording to match the selected Spanner + S3 candidate; define exact receipt/head/idempotency/envelope/checkpoint locations. | Signed, versioned F-03 amendment; topology cross-reference audit; explicit provider APIs and independent-copy semantics; no operator interpretation required. | NOT STARTED |
| REM-03 | Copilot CR-03; Claude P0-01/P1-10 | Establish independent pre-disaster completeness anchors and test coordinated rollback of witness head, manifest and one audit source. | At least two separately controlled anchors; provenance/retention evidence; injected rollback detected by an independent verifier; absent anchor results in the prescribed limited claim, never a completeness PASS. | NOT STARTED |
| REM-04 | Copilot CR-04; Claude P1-10 | Define mandatory recovery profiles L/C/D/O/A, approval authority, fixed scope boundaries and FULL reporting rules. | Versioned profile definitions; scope hash; independently derived pre-disaster inventory; omitted-object register; coverage percentage; negative tests proving scope narrowing cannot produce unqualified FULL. | NOT STARTED |
| REM-05 | Copilot CR-05 | Add an Operational Restoration Profile and end-to-end clean-account service restoration tests. | Clean organization/account deployment; fresh identities/network/TLS/monitoring; receipt-verified projection rebuild; API/cache/export/downstream gating; synthetic business transactions; duplicate prevention; old-site fencing; authorized cutover; measured service RTO. | NOT STARTED |
| REM-06 | Copilot H-01; Claude P1-06/P1-07 | Specify and test clean-room credential bootstrap and credential-denial matrix. | Recovery identities, root/account ownership and quorum procedures; test logs for IdP, custodian, mailbox, token, federation, policy and support failures; no production credential or unapproved super-admin bypass. | NOT STARTED |
| REM-07 | Copilot H-02; Claude P0-02/P1-09 | Separate and define regional, account-loss and provider-exit recovery claims for each required provider. | Provider-by-provider portability matrix; customer-controlled exports; restore/verification test without the unavailable provider or an explicit narrowed portability claim. | NOT STARTED |
| REM-08 | Copilot H-03 | Approve separate numeric RPO/RTO objectives and immutable measurement definitions. | Signed parameter register defining ledger/content/verification/service/decision-history/key recovery metrics; immutable start/end events; repeated-run raw timestamps, data volume, throughput, percentile and worst-case results. | NOT STARTED |
| REM-09 | Copilot H-04; ChatGPT A12 | Test actual HSM/key backup restore across selected generations and failure cases. | Backup identifiers; quorum and account/region evidence; restored fingerprints and attributes; allowed-operation checks; known-answer signatures; KEK/payload decryptability where in scope; corruption detection; audit logs; measured throughput. | NOT STARTED |
| REM-10 | Copilot H-05; Claude P0-04/P1-06/P1-07 | Add compound compromised-control-plane exercise and verify independence of trust roots, verifier, scope, alerts and re-enablement authority. | Injected IdP + cloud-admin + manifest/deployment/head/audit compromise; offline pins; separate account; two-person approval; raw logs showing substitution, suppression and self-approval are detected/rejected. | NOT STARTED |
| REM-11 | Copilot H-06; Claude P0-01/P1-04 | Make checkpoint and external-anchor artifacts explicit in recovery dependency trace and test matrix. | Explicit class mapping or separately approved class amendment; object/publication/inclusion-proof/anchor fields; six Copilot checkpoint negative/positive scenarios with immutable verifier output. | NOT STARTED |
| REM-12 | Copilot inventory/order/negative-test/evidence requirements | Convert dependency inventory, dependency ordering, abort rules, negative tests and evidence-package requirements into traceable testable artifacts. | Machine-readable dependency graph; per-step abort conditions; full fault-injection matrix; raw evidence schema; independent reviewer acceptance; no hidden or circular bootstrap dependency. | NOT STARTED |

## 6. Required finding lifecycle and closure evidence

Use only these states:

- **OPEN:** finding accepted into the register; remediation unresolved.
- **IN_PROGRESS:** a named owner is actively implementing the approved correction.
- **READY_FOR_RETEST:** correction and evidence package are complete; independent retest not yet performed.
- **CLOSED:** objective acceptance test passed, required raw evidence is retained, and an independent reviewer approves closure.
- **REJECTED:** finding is rejected with a documented technical rationale and independent approval.
- **DEFERRED:** owner-approved deferral with explicit residual risk, expiry/review date and authorization boundary.

Do not use “fixed”, “resolved”, or “closed” as a substitute for the above states. BLOCKED and NOT RUN are test execution outcomes, not finding closure states.

Each closure record must contain:
1. Finding and source reviewer IDs.
2. Exact source document path, version and digest.
3. Corrective commit/PR and changed files.
4. Requirement and test IDs.
5. Test environment, build and verifier versions.
6. Raw output/log/artifact references and digests.
7. PASS/FAIL/BLOCKED/NOT RUN result.
8. Independent reviewer identity, date and approval.
9. Residual limitations and affected claims.

## 7. Governance and authorization constraints

- Keep PR #33 draft/open and unmodified by this review-consolidation change.
- Preserve PR #30 and PR #32 as historical/baseline review artifacts; do not merge them as part of this work.
- Do not change the normative v4 architecture or F-01–F-04 source documents in this register-only change.
- Do not modify or renumber R01–R30.
- Do not provision infrastructure, incur provider charges, run live tests, migrate data, ingest real evidence or make production claims.
- Do not represent any AI review as the required independent human review.
- The consolidated review does not authorize implementation, migration, test execution, deployment, or merge of the underlying architecture PRs.

**Current final disposition: HOLD — F-01 through F-04 OPEN; F-03 requires documentary revision before any exercise; no operational recovery claim is demonstrated; implementation/production authorization remains withheld.**
