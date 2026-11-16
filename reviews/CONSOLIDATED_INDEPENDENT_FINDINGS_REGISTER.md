# ICW v4.2 — Consolidated Independent Findings Register

**Register version:** 0.3.1  
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
| **ICW-REV-DR-01** | **Copilot** | **Adversarial Disaster Recovery Review** | **2026-11-16** | **CR-01–CR-05; H-01–H-06** | **Baseline preserved at `reviews/ICW-REV-DR-01_BASELINE.md`; Git blob SHA `f78419ee14696123dab54782587c0c84ab2c93f7`.** |
| **ICW-REV-CSC-01** | **Claude** | **Chief Security Critic / Lead Adversarial Security Reviewer** | **2026-11-16** | **CSC-01–CSC-24** | **Structured archival transcription at `reviews/ICW-REV-CSC-01_BASELINE.md`; source was supplied in conversation, not as a separate file. Not represented as byte-for-byte original or independently hash-verified.** |
| **ICW-REV-DSI-01** | **Gemini** | **Distributed Systems and Infrastructure Reviewer** | **2026-11-16** | **F-01-01–F-04-01** | **Structured archival transcription at `reviews/ICW-REV-DSI-01_BASELINE.md`; source was supplied in conversation, not as a separate file. Not represented as byte-for-byte original or independently hash-verified.** |
| **ICW-REV-ISA-01** | **Grok** | **Independent Systems Assurance Auditor (Reviewer 05)** | **2026-11-16** | **ISA-01–ISA-11** | **Structured archival transcription at `reviews/ICW-REV-ISA-01_BASELINE.md`; source was supplied in conversation, not as a separate file. Not represented as byte-for-byte original or independently hash-verified.** |
| **ICW-REV-R06-02** | **ChatGPT** | **Focused adversarial reassessment of R06 erasure, backup/DR recovery copies and test-oracle completeness (Reviewer 06)** | **2026-11-16** | **CG-R06-01–CG-R06-09** | **Baseline preserved at `reviews/ICW-REV-R06-02_CHATGPT_BASELINE.md`; review scope and exact PR head recorded in the report. This is a focused second ChatGPT pass, not a separate reviewer organization.** |

All eight registered review passes are AI-generated reviews. Grok is Reviewer 05 and the focused ChatGPT R06 reassessment is Reviewer 06 in the reviewer sequence; the register ID `ICW-REV-ISA-01` is its stable traceability identifier. ICW-REV-ARCH-01 and ICW-REV-CSC-01 are two distinct Claude review passes/roles, not two independent reviewer organizations; do not count them as independent organizational corroboration. They are useful independent analytical passes but **do not satisfy the charter's human-independence gate or replace a qualified external human review**. No external reviewer engagement is claimed.

## 3. Consolidation rules

1. Reviewer baselines remain immutable and separately attributable.
2. Original finding IDs are never renumbered, rewritten, or reused.
3. Register-level IDs below are cross-review tracking keys only; they do not replace source IDs.
4. Similarity is recorded as overlap, not proof that two findings are identical.
5. Where a mapping is uncertain, it is marked **POTENTIAL OVERLAP — VERIFY**, not asserted as confirmed.
6. R01–R30 remain unchanged. If a reviewer proposes new inventory coverage, record it as a proposed amendment with a separate decision; do not silently add or renumber a recovery class.
7. Finding status is independent of document status. Rewriting a document does not close a finding.
8. BLOCKED, NOT RUN, PARTIAL, UNAVAILABLE, or undocumented outcomes must never be promoted to PASS.
9. Copilot's CR/H identifiers and Claude Chief Security Critic's CSC identifiers are retained exactly as supplied. The new register-level keys are not source finding IDs.
10. The CSC baseline is an archival transcription of the report pasted into chat; it is not claimed to be byte-identical to an original attachment.

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

### 4.3 Claude Chief Security Critic findings — source-preserving map

| Register key | Original Claude ID | Severity | Finding summary | Cross-review relationship | Current state |
|---|---|---|---|---|---|
| CSCF-01 | CSC-01 | P1 | Single mutable Spanner holds authoritative receipts/head; normative protocol does not archive receipts | **Confirmed thematic overlap:** Copilot CR-03 (independent completeness oracle), CR-02 (topology mismatch); earlier Claude architecture review P0-01/P1-04 may overlap. Distinct receipt-copy requirement retained. | OPEN |
| CSCF-02 | CSC-02 | P1 | No external head anchor/fork detection; expected recovery head is circular | **Confirmed thematic overlap:** Copilot CR-03/CR-04/H-06; earlier Claude P0-01 and Copilot's rollback/fixed-scope concerns. | OPEN |
| CSCF-03 | CSC-03 | P1 | Composite runtime identity can write, commit and sign; no continuous independent verifier | **Related overlap:** Copilot H-05 compound control-plane compromise; earlier Claude P0-04. Runtime-use compromise is distinct from administrator/control-plane compromise. | OPEN |
| CSCF-04 | CSC-04 | P1 | Tenant-root enrollment/recovery operator-controlled and unowned | **Related overlap:** Copilot H-01/H-05; earlier Claude authority/trust-root findings. Tenant-root bootstrap is a distinct explicit control. | OPEN |
| CSCF-05 | CSC-05 | P1 | F-02 authority documents conflict; Okta status contradictory | **Confirmed overlap:** Copilot CR-01/CR-02 baseline/consistency gaps; earlier Claude authority-model findings. | OPEN |
| CSCF-06 | CSC-06 | P1 | Session assertion does not prove user intent; compromised app can act as user | **Potential overlap — verify:** earlier Claude authorization/ADS findings. Copilot H-05 is only compound control-plane related, not equivalent. | OPEN |
| CSCF-07 | CSC-07 | P1 | Same 2-of-3 custodians span multiple key/control classes | **Related overlap:** Copilot H-01/H-05 and earlier Claude custody/quorum findings. Exact cross-class quorum concentration is retained. | OPEN |
| CSCF-08 | CSC-08 | P1 | Operator-controlled epoch reset/quarantine/re-enablement creates repudiation and DoS lever | **Related overlap:** Copilot CR-04/CR-05 (recovery scope/service governance); earlier Claude recovery authority findings. | OPEN |
| CSCF-09 | CSC-09 | P2 | Pre-commit signatures can produce signed but uncommitted/equivocating receipts | **Related overlap:** Copilot CR-03 and H-06 on receipt/anchor completeness; distinct commit-proof semantics. | OPEN |
| CSCF-10 | CSC-10 | P2 | Append order omits authorization/semantic/replay checks and retention ordering | **Potential overlap — verify:** earlier Claude protocol/authorization findings; no direct Copilot equivalent identified. | OPEN |
| CSCF-11 | CSC-11 | P2 | Idempotency semantics conflict with head-bound digest | **Potential overlap — verify:** earlier Claude retry/protocol findings; no direct Copilot equivalent identified. | OPEN |
| CSCF-12 | CSC-12 | P2 | Revocation feed/freshness unspecified; emergency revocation conflicts with tenant-root model | **Related overlap:** Copilot H-01 bootstrap and earlier Claude authority/revocation findings. | OPEN |
| CSCF-13 | CSC-13 | P2 | HSM signing use not constrained/reconciled; emergency suspension requires quorum | **Related overlap:** Copilot H-04 backup/key custody and H-05 compromise exercise; distinct live signing misuse and suspension issue. | OPEN |
| CSCF-14 | CSC-14 | P2 | HSM control-plane enforcement assumptions and recovery credentials/KEK custody unverified | **Confirmed thematic overlap:** Copilot H-04; earlier Claude key-custody/recovery findings. | OPEN |
| CSCF-15 | CSC-15 | P2 | Google/AWS concentration; no provider-exit/legal-inaccessibility path | **Confirmed overlap:** Copilot H-02 provider exit/account loss. CSC-15 additionally couples archive and signing concentration. | OPEN |
| CSCF-16 | CSC-16 | P2 | Compliance lock, wrapped keys and retained digests conflict with lawful erasure | **Related overlap:** earlier Claude privacy/erasure concerns; Copilot recovery-scope/legal exclusions may intersect but are not equivalent. | OPEN |
| CSCF-17 | CSC-17 | P2 | Projection gating inside application is bypassable by stated adversary | **Related overlap:** Copilot CR-05 operational service restoration/consumer gating. Consumer-side verification is an additional requirement. | OPEN |
| CSCF-18 | CSC-18 | P2 | Incomplete/inconsistent baseline; stale MRSC/dual-store references and absent test/design docs | **Confirmed overlap:** Copilot CR-01/CR-02; earlier Claude P0-05/P1-01. | OPEN |
| CSCF-19 | CSC-19 | P2 | No consolidated threat model/claims register | **Related overlap:** Copilot CR-01 baseline trace and H-05 compound threat scenario; earlier Claude threat-boundary findings. | OPEN |
| CSCF-20 | CSC-20 | P2 | Global receipt-key/aggregated ADS blast radius | **Potential overlap — verify:** earlier Claude key-scope/tenant-isolation findings; no direct Copilot equivalent identified. | OPEN |
| CSCF-21 | CSC-21 | P3 | TSA cadence, algorithm and receipt time source incomplete | **Related overlap:** Copilot H-06 anchor/TSA inventory; earlier Claude time-attestation findings. | OPEN |
| CSCF-22 | CSC-22 | P3 | Unicode identifier normalization can desynchronize authorization scope | **No direct overlap identified** in Copilot register; retain as unique. | OPEN |
| CSCF-23 | CSC-23 | P3 | Verifier/review independence asserted, not structurally independent | **Related overlap:** Copilot H-05 and human-review governance; distinct verifier authorship/vector independence. | OPEN |
| CSCF-24 | CSC-24 | P3 | Editorial/status/test-numbering inconsistencies and stale product-category wording | **Confirmed thematic overlap:** Copilot CR-01/CR-02 baseline hygiene; earlier Claude P0-05/P1-01. | OPEN |

**Mapping caution:** These are thematic cross-review links, not findings adjudicated as identical. Earlier Claude source IDs remain attributed to ICW-REV-ARCH-01. Because both Claude passes originate from the same AI provider, their agreement is not independent organizational corroboration. Gemini is a separate AI provider/reviewer system, but this remains an AI desk review and does not satisfy the charter's qualified human-independence gate. No source finding is closed by overlap.

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


## 8. Addendum — Claude Chief Security Critic remediation workstreams

The following workstreams supplement REM-01–REM-12. They do not replace or close existing remediation items. All source CSC identifiers remain OPEN pending their own objective evidence.

| Work ID | Source findings | Required action | Minimum acceptance evidence | State |
|---|---|---|---|---|
| REM-13 | CSC-01, CSC-02, CSC-09 | Separate receipt archival from Spanner; external witnessed head/consistency proofs; commit-bound receipts and bounded unanchored tail. | Independent archive rebuild after Spanner rollback/project loss; rollback/fork alarms; blind head reconstruction; CAS-loser receipt classified UNCOMMITTED. | NOT STARTED |
| REM-14 | CSC-03, CSC-13, CSC-17 | Split runtime identities; separate deployment authority; continuous verifier; HSM sign-count reconciliation; unilateral suspension; consumer-side verification. | Real-identity non-production runtime compromise exercise; no verifier-valid forged history; bounded alarm/suspension; consumer rejects forged projections. | NOT STARTED |
| REM-15 | CSC-04, CSC-05, CSC-06, CSC-12 | One normative F-02; operator-independent tenant-root enrollment/recovery; tenant-visible registry/cool-off; user-held request signature; signed revocation feed and freshness. | Consistency matrix; operator-only enrollment attack fails or is tenant-detected; app-as-user mutation fails without device signature; measured revoke-to-reject bound. | NOT STARTED |
| REM-16 | CSC-07, CSC-08, CSC-14 | Partition custodians/quorums; evidence-based quarantine/epoch decisions; safe interim mode; map enforcement to actual HSM/IAM/control-plane layer; govern recovery credentials/KEK. | Identity-backed disjoint quorum matrix; cross-class bypass tests; lose-two recovery; fabricated quarantine test; admin-class enforcement and credential-theft drills. | NOT STARTED |
| REM-17 | CSC-15, CSC-20 | Provider-exit and legal-inaccessibility design; separate AWS organizations or state residual risk; tenant/cohort key partitioning and blast-radius limits. | Google and AWS account-loss exercises; portable export/verification; measured affected cohort; tenant-visible epoch discontinuity and RPO/RTO results. | NOT STARTED |
| REM-18 | CSC-16 | Resolve envelope content, retention/legal basis, destroyable per-subject key hierarchy and keyed commitments. | Erasure test proves no recoverable plaintext or confirmable digest while permitted tombstone/receipt integrity remains verifiable; legal and technical approval. | NOT STARTED |
| REM-19 | CSC-18, CSC-19, CSC-24 | Complete frozen baseline/hash manifest; reconcile contradictions; publish consolidated threat model and claims register; editorial consistency pass. | Complete per-file manifest; requirement-to-objective/adversary/test trace; X1–X14 resolution matrix; independent review. | NOT STARTED |
| REM-20 | CSC-10, CSC-11, CSC-21, CSC-22, CSC-23 | Specify total append order, semantic/idempotency vs authorization digests, revocation race/replay rules, time/Unicode policy and independent verifier authorship/vectors. | Executed concurrency/replay/retention matrix; TSA rollover vectors; adversarial Unicode differential tests; independent verifier divergence and authorship evidence. | NOT STARTED |

**Overall status remains HOLD.** The CSC-01–CSC-08 architecture blockers are not accepted as resolved by document edits. All 24 CSC findings are OPEN; tests are NOT RUN unless separately evidenced. The review is an AI desk review and does not satisfy the independent human-review gate.


## 9. Addendum — Gemini Distributed Systems and Infrastructure review (ICW-REV-DSI-01)

Gemini's original source identifiers are retained exactly as supplied. Register keys below are cross-review tracking keys only; they do not replace the source IDs. The source is a structured archival transcription of the report supplied in conversation, not a byte-identical source attachment.

| Register key | Original Gemini ID | Severity | Finding summary | Cross-review relationship | Current state |
|---|---|---|---|---|---|
| GDSF-01 | F-01-01 | P1 | Two cloud vendors do not guarantee administrative independence where shared super-admin or root-recovery paths can compromise both domains. | **Confirmed thematic overlap:** Copilot H-05 / REM-10 (compound identity and cloud-control-plane compromise); Claude CSC-15 / REM-17 (provider concentration and provider-exit/legal-inaccessibility). Adds explicit demand for named legal account owners, IAM-role exports and independent audit-export proof. | OPEN |
| GDSF-02 | F-02-01 | P1 | TAR/ADS separation is not operationally assured while tenant-root bootstrap, key enrollment, ownership and second-person approval remain unassigned. | **Confirmed thematic overlap:** Claude CSC-04/CSC-05/CSC-06/CSC-12 / REM-15 (tenant authority, enrollment and revocation); Copilot H-01 / REM-06 (recovery credential bootstrap). Adds out-of-band tenant-root verification and named second approver. | OPEN |
| GDSF-03 | F-03-01 | P2 | The R01–R30 inventory and clean-room recovery design have not been exercised; documentary coverage is not demonstrated recovery. | **Confirmed thematic overlap:** Copilot CR-01/CR-05 and H-06 / REM-01/REM-05/REM-11/REM-12; Claude CSC-18 / REM-19 (baseline completeness). Distinct explicit requirement: execute the approved full recovery suite in an isolated environment only after the test specification and authorization gates are satisfied. | OPEN |
| GDSF-04 | F-04-01 | P2 | CloudHSM, FIPS mechanism behavior, 2-of-3 human custody and known-answer testing are specified but not provisioned or demonstrated. | **Confirmed thematic overlap:** Copilot H-04 / REM-09 (actual HSM backup restore); Claude CSC-07/CSC-13/CSC-14 / REM-16 and REM-20 (quorum partition, HSM enforcement and cryptographic verification). Adds named custodians, FIPS mechanism tests and independent known-answer vectors. | OPEN |

### 9.1 Gemini cross-review interpretation and limits

- Gemini's **CONDITIONAL PASS** applies only to architectural design progression and test-framework validation. It is not a production approval and does not override the consolidated **HOLD — NOT ACCEPTED** disposition.
- The report independently reinforces that Spanner/S3, ADS/TAR, CloudHSM, and R01–R30 are still documentary/specification-stage components. No live provisioning, cryptographic ceremony, fault injection, clean-room recovery or operational acceptance is evidenced by this review.
- The stated Spanner cost estimate (approximately USD 270.47/month for a 100-PU Asia 1 floor) is a reviewer-reported estimate, not a verified quote or authorization to incur spend.
- Gemini identifies residual shared dependencies (cloud control planes, DNS, IAM, time sources and cross-cloud super-admins), immutable-retention/legal-erasure tension, and quorum/custodian availability. These remain risk statements requiring evidence and design decisions, not accepted mitigations.
- Gemini's source refers to production closure evidence F-01 through F-09, while this register's top-level governing findings currently track F-01 through F-04. Do not silently equate these numbering schemes; reconcile the source register references against the frozen baseline before any closure decision.

### 9.2 Remediation cross-links

Gemini's findings are mapped into existing workstreams to avoid duplicate actions:
- **GDSF-01 → REM-10 and REM-17:** named legal owners, genuinely separated organizations/IAM roots, independent audit exports, and compound cross-provider super-admin compromise testing.
- **GDSF-02 → REM-06 and REM-15:** out-of-band tenant-root enrollment, named ownership, second-person approval and bootstrap-denial testing.
- **GDSF-03 → REM-01, REM-05, REM-11 and REM-12:** complete dependency trace and authorized clean-room recovery / service-restoration exercises. R01–R30 must remain unchanged absent a separately approved amendment.
- **GDSF-04 → REM-09, REM-16 and REM-20:** actual HSM/key restore, named disjoint custodians, FIPS mechanism validation and independent known-answer vectors.

All GDSF-01–GDSF-04 findings remain **OPEN**. No remediation is marked started, no test is represented as run, and no production or implementation authorization is granted.


## 10. Addendum — Grok Independent Systems Assurance Auditor review (ICW-REV-ISA-01)

Grok is registered as **Reviewer 05 — Independent Systems Assurance Auditor**. The original finding identifiers ISA-01–ISA-11 and severities P1/P2/P3 are preserved. The source baseline is a structured archival transcription of the complete report supplied in conversation; it is not represented as byte-identical to an original attachment or independently hash-verified.

**Reviewer verdict: FAIL.** Grok's scope was documentary examination of the frozen 12-document PDF only. It did not establish operational test execution, live infrastructure, provider-account existence, key custody, or acceptance. Its FAIL is a reviewer disposition and does not itself amend normative documents or grant authority.

### 10.1 Grok findings — source-preserving map

| Register key | Original Grok ID | Severity | Finding summary | Cross-review relationship / remediation mapping | Current state |
|---|---|---|---|---|---|
| GISA-01 | ISA-01 | P1 | Okta is simultaneously selected and unselected across F-02 model, decision, register and execution status. | **Confirmed thematic overlap:** CSC-05 / REM-15 (F-02 authority-document contradiction); related to GDSF-02 / REM-15 (tenant authority/bootstrap). | OPEN — DOCUMENTARY CONTRADICTION |
| GISA-02 | ISA-02 | P1 | F-02 binding authorization contract omits ledger, epoch, expected head, grant reference, TAR delegation and tenant-root binding from the decision's required claim set. | **Related overlap:** CSC-04/CSC-05/CSC-06/CSC-12 / REM-15. Adds explicit signed-schema field-level reconciliation. | OPEN — AUTHORIZATION CONTRACT MISMATCH |
| GISA-03 | ISA-03 | P1 | Register reopens provider selection and restores single-item CAS wording superseded by Spanner read-write transaction. | **Confirmed thematic overlap:** Copilot CR-02 / REM-02 and CSC-18 / REM-19. Also maps to REM-01 for baseline/register consistency. | OPEN — REGISTER CONTRADICTION |
| GISA-04 | ISA-04 | P1 | Authoritative F-03 inventory/procedure still requires MRSC and two stores; selected Spanner/S3 topology does not specify an independent receipt-byte copy. | **Confirmed overlap:** Copilot CR-02 / REM-02; CSC-01/CSC-02 / REM-13; GDSF-03 / REM-01/REM-11/REM-12. The missing second receipt copy remains a distinct design decision. | OPEN — RECOVERY PROCEDURE MISALIGNED |
| GISA-05 | ISA-05 | P1 | Frozen archive does not match charter-required review baseline; required core contracts are absent and F-02 decision is omitted from charter list. | **Confirmed overlap:** Copilot CR-01 / REM-01; CSC-18/CSC-19/CSC-24 / REM-19. Grok adds explicit two-way manifest reconciliation across charter and archive. | OPEN — BASELINE MANIFEST INCOMPLETE |
| GISA-06 | ISA-06 | P2 | F-01/F-02 status labels conflict across controlling records and include undefined vocabulary. | **Related overlap:** CSC-24 / REM-19 and Copilot CR-01 / REM-01. Adds explicit status-token normalization. | OPEN — STATUS VOCABULARY INCONSISTENT |
| GISA-07 | ISA-07 | P2 | F-04 T05 retains stale algorithm-selection blocker despite selected v1 suite; quorum wording conflicts between plan §3 and amendment §8.2. | **Confirmed thematic overlap:** GDSF-04 / REM-09/REM-16/REM-20; CSC-07/CSC-13/CSC-14 / REM-16/REM-20. Adds precise stale-blocker and supersession defects. | OPEN — F-04 DOCUMENTARY CONTRADICTION |
| GISA-08 | ISA-08 | P2 | S3 Compliance retention is applied before Spanner commit; failed/aborted uploads can become irreversible orphan objects without lawful disposition. | **Related overlap:** CSC-16 / REM-18 (lawful erasure/retention); CSC-01/CSC-09 / REM-13 (receipt/archive and commit semantics). Adds pre-commit object-state and orphan-specific disposition requirement. | OPEN — ORPHAN RETENTION DISPOSITION MISSING |
| GISA-09 | ISA-09 | P2 | F-05–F-08 DESIGN-RESOLVED claims, v3 comparison and tests 188–220 are not examinable from supplied archive. | **Confirmed thematic overlap:** Copilot CR-01 / REM-01; CSC-18/CSC-24 / REM-19. The absent F-05–F-08 procedures and test trace remain explicit. | OPEN — CLAIMS NOT TRACEABLE IN BASELINE |
| GISA-10 | ISA-10 | P2 | Acceptance prerequisites create a circular evidence gate; non-production evidence stage is not consistently authorized. | **Related overlap:** GDSF-03 / REM-01/REM-12 and Copilot CR-01 / REM-01. New sequencing/authorization issue; not equivalent to recovery-test execution. | OPEN — EVIDENCE-STAGE GATE CYCLE |
| GISA-11 | ISA-11 | P3 | Per-document integrity pins omit hash algorithm; F-01 section numbering duplicates §9; baseline/companion order is confusing. | **Confirmed thematic overlap:** CSC-24 / REM-19; Copilot CR-01 / REM-01. Adds digest recomputation and section-identity checks. | OPEN — INTEGRITY PIN VERIFICATION MISSING |

### 10.2 Grok cross-review interpretation and limits

- Grok's **FAIL** is limited to the frozen documentary package and its readiness as a review baseline. It supports retaining the consolidated **HOLD — NOT ACCEPTED** disposition; it does not prove the underlying architecture is operationally defective in a live deployment.
- ISA-01 through ISA-05 are P1 documentary contradictions/baseline defects. Their correction is a prerequisite to issuing a reliable external review package, but correction alone does not justify ACCEPTED.
- ISA-04 identifies an unresolved architectural placement question: whether receipt bytes are stored only in Spanner or also in an independently administered object archive. This must be decided explicitly; do not silently assume the second copy exists.
- ISA-08 requires an explicit pre-commit object state and orphan disposition. It is not resolved merely by a general lawful-erasure workstream.
- ISA-10 requires a non-production evidence stage with a clear authorization boundary and no ability to mark F-01–F-04 ACCEPTED. This is a process-sequencing requirement, not permission to provision or execute anything now.
- The review did not examine the missing charter-required core v4 contracts or test procedures for tests 188–220; claims depending on those documents remain NOT EXAMINABLE IN THIS BASELINE.
- The review is AI-generated. It does not satisfy the charter's qualified independent human-review gate. Claude's two passes remain one AI provider; Grok is another AI reviewer system, not a human auditor.

### 10.3 Remediation cross-links and new workstreams

Grok findings are mapped to existing workstreams wherever the corrective action is genuinely shared. Two additional workstreams are added because existing items do not fully specify their acceptance criteria:

- **ISA-01 / ISA-02 → REM-15:** one controlling F-02 authority decision and one signed assertion schema, with a field-level contract matrix.
- **ISA-03 / ISA-04 → REM-02 and REM-01; ISA-04 also → REM-13:** align F-03 with Spanner/S3 and decide the independent receipt-byte copy and trust boundary.
- **ISA-05 / ISA-09 / ISA-11 → REM-01 and REM-19:** complete hashed manifest, required-document reconciliation, traceable claims/tests, digest algorithm declaration, recomputation and unique section numbering.
- **ISA-06 → REM-19:** normalize F-01/F-02 state vocabulary across every controlling record.
- **ISA-07 → REM-16 and REM-20:** reconcile the F-04 quorum matrix, selected crypto suite and T05 blocker; retain NOT RUN absent operational evidence.
- **ISA-08 → REM-18 and new REM-22:** define pre-commit object state, Object Lock timing, orphan classification, legal disposition, retry/lost-acknowledgement behavior and plaintext/key erasure.
- **ISA-10 → new REM-21:** define an acyclic, explicitly authorized non-production evidence stage that cannot set ACCEPTED; keep production authorization separate.

| Work ID | Source findings | Required action | Minimum acceptance evidence | State |
|---|---|---|---|---|
| REM-21 | Grok ISA-10 | Define a gated, non-production evidence-generation stage and remove circular prerequisites. Specify account/ownership verification, crypto compatibility, synthetic verifier and fault-injection sequence; state which authorization permits each step and which status transitions are forbidden. | Approved acyclic gate diagram; named authority for each stage; explicit non-production boundary; evidence that no stage can mark F-01–F-04 ACCEPTED or authorize production; all live steps separately authorized. | NOT STARTED |
| REM-22 | Grok ISA-08 | Define pre-commit envelope state and lawful disposition of orphaned/aborted/lost-acknowledgement objects under S3 Object Lock. Reconcile retention timing with Spanner commit and lawful erasure. | Failure matrix for crash-before-upload, crash-after-upload, transaction abort and lost acknowledgement; exact object version/lock metadata; accepted-versus-unaccepted legal classification; approved retention/erasure/key-destruction disposition; no irreversible object with undefined legal status. | NOT STARTED |

All GISA-01–GISA-11 findings remain **OPEN**. Existing remediation items remain NOT STARTED unless separately evidenced. REM-21 and REM-22 are NOT STARTED. No test is claimed executed, no normative document is amended by this addendum, and no implementation, procurement, infrastructure, external engagement or production authorization is granted.


## 11. Addendum — ChatGPT focused R06 adversarial reassessment (ICW-REV-R06-02)

ChatGPT is registered as **Reviewer 06 — Focused R06 Erasure and Recovery-Copy Adversarial Reviewer**. The full review is preserved at `reviews/ICW-REV-R06-02_CHATGPT_BASELINE.md` and is scoped to PR #34 head `90cda0bb8225d8d733fd4f43b26992f2f3802165`. This is a second ChatGPT analytical pass, not an independent reviewer organization and not a human review.

**Reviewer verdict: DOCUMENTARY FAIL.** The five R06 tests materially improve the contract, but do not yet establish reliable detection of all surviving backup/DR keys or residual plaintext. Provider-backed execution remains BLOCKED / NOT RUN.

| Register key | Original ChatGPT ID | Severity | Finding summary | Required remediation | State |
|---|---|---|---|---|---|
| CGR-01 | CG-R06-01 | P1 | Active stale OPEN wording in F-03 spec §27.6 and inventory §7.4 contradicts the selected separate-object model in later sections. | Mark/remove stale wording as HISTORICAL / SUPERSEDED and rerun exact-head cross-document audit. | OPEN — DOCUMENTARY CONTRADICTION |
| CGR-02 | CG-R06-02 | P1 | F03-R06-04 positive control can detect a listed surviving key without proving recovery-domain inventory completeness. | Add blind unregistered surviving copy, independent provider-native enumeration and fail-closed inventory reconciliation. | OPEN — FALSE-PASS RISK |
| CGR-03 | CG-R06-03 | P1 | “Each in-scope” historical restore has no exhaustive boundary across generations, retention, regions, accounts, replicas, escrow and managed recovery copies. | Define discovery sources, retention interval, pagination/completeness evidence, snapshot identifiers and independent manifest reconciliation. | OPEN — RESTORE COVERAGE GAP |
| CGR-04 | CG-R06-04 | P1 | Monotonic erasure state lacks a concrete independent trust boundary and rollback/freshness test. | Specify independent owner/root/state authority and add rollback, replay, deletion and stale-state negative tests. | OPEN — ANTI-ROLLBACK TRUST GAP |
| CGR-05 | CG-R06-05 | P1 | Shared parent/KEK, wrapped DEK and cached/unwrapped key paths are not a complete explicit test fixture. | Test parent/child key lineage and prove erased artifact isolation while unrelated artifacts remain decryptable. | OPEN — KEY-HIERARCHY GAP |
| CGR-06 | CG-R06-06 | P1 | Residual derivative detection lacks measurable coverage for partial, transformed, chunked, re-encoded and restored plaintext copies. | Add multi-marker transformed fixtures, per-storage-class detection criteria and independent storage-domain enumeration. | OPEN — RESIDUAL-PLAINTEXT GAP |
| CGR-07 | CG-R06-07 | P2 | Positive/negative oracle calibration is incomplete; a verifier that always fails is not a useful erasure oracle. | Add paired known-positive, known-negative, blind-copy, incomplete-inventory, shared-parent and residual-derivative controls. | OPEN — ORACLE QUALITY GAP |
| CGR-08 | CG-R06-08 | P1 | Audit 04 does not validate the current reviewed PR head and its pinned v4 files do not fully represent the current v4.1 set; it also misses active stale OPEN wording. | Issue a new exact-head audit with current document blob SHAs and explicit section-level authority checks. | OPEN — AUDIT SCOPE GAP |
| CGR-09 | CG-R06-09 | P1 | No provider-backed restore/erasure evidence exists; no CI status checks or PR workflow runs were returned for the reviewed head. | Keep execution BLOCKED / NOT RUN until separately authorized provider-backed isolated tests and evidence exist. | OPEN — EXECUTION BLOCKED |

### 11.1 Test-by-test disposition

| Test | ChatGPT result | Execution |
|---|---|---|
| F03-R06-01 | Adequate requirement outline; executable fixture/evidence schema still required. | NOT RUN |
| F03-R06-02 | Adequate requirement outline; separately cross-check orphan retention/erasure disposition. | NOT RUN |
| F03-R06-03 | INSUFFICIENT: historical inventory boundary, independent anti-rollback authority and full key-hierarchy coverage under-specified. | BLOCKED / NOT RUN |
| F03-R06-04 | INSUFFICIENT: no blind unregistered copy or independent inventory-completeness oracle. | BLOCKED / NOT RUN |
| F03-R06-05 | INSUFFICIENT: transformed/partial derivative oracle and independent storage-domain enumeration under-specified. | BLOCKED / NOT RUN |

### 11.2 Coordination and independence limits

The recommended AI reassessment sequence is Copilot (disaster-recovery/inventory completeness), Claude (cryptographic hierarchy and anti-rollback), Gemini (distributed inventory/restore consistency), and Grok (oracle/evidence completeness). Each must attempt to falsify the current findings rather than merely endorse them. Findings must retain their original IDs and be reconciled as confirmed, disputed, unique or not examinable.

No named GitHub reviewer accounts were supplied for these AI systems; no reviewer requests are represented as sent. AI-only review is an analytical coordination process and does not satisfy any unchanged charter requirement for qualified independent human review. It cannot substitute for provider-backed evidence or authorize acceptance.

**Disposition:** AUD-XD-07 NOT ACCEPTED; F-03 OPEN / NOT DEMONSTRATED; F03-R06-01–05 DEFINED / NOT RUN; provider-backed R06 execution BLOCKED / NOT RUN; PR #34 remains OPEN / DRAFT / UNMERGED; overall HOLD — NOT ACCEPTED.
