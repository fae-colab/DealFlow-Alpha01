# ICW v4.2 — Chief Security Critic: Independent Adversarial Security Review

**Reviewer:** Claude — Chief Security Critic / Lead Adversarial Security Reviewer  
**Register ID:** ICW-REV-CSC-01 (assigned by the consolidation register; not supplied by reviewer)  
**Review date:** 2026-11-16  
**Subject:** ICW v4.2 frozen review package, converted from `ICW_V4_2_094311.zip`  
**Archive SHA-256 reported by reviewer:** `da076ad6b46d51152b262619b71e4238f58252757d3de629447c94167ec580ba`  
**Source provenance:** Full review text supplied by the user in the conversation on 2026-11-16. No separate source attachment or original report file was supplied. This file is a structured archival transcription of that supplied review, not a claim that the source was independently hash-verified or byte-for-byte preserved.  
**Citation convention:** D01–D12 and section references as defined in the supplied review.

## 1. Executive verdict

**FAIL — implementation authorization is not justified.**

The review reports 24 findings: **P0: 0, P1: 8, P2: 12, P3: 4. Controls demonstrated: 0.** All claims in the reviewed package are graded Specified, Assumed or Missing. No P0 is assigned because nothing is deployed and the package disclaims operational guarantees. The reviewer states that CSC-01 to CSC-04 would be P0 if externally represented as guarantees of authoritative ordering, no rewrite or authorized-only mutation.

Headline conclusions:
1. Administrative separation is not separation of use: one ICW runtime identity can write S3, commit Spanner, sign through the HSM and verify authorization; HSM controls prevent key extraction, not misuse.
2. The ledger has no immutable receipt copy or external head anchor; receipts and head exist only in one mutable Spanner database, leaving rollback, fork and truncation undetectable.
3. The authorization root is contradictory, operator-enrolled and not bound to user intent; D03 and D04 define incompatible authority models and enrollment/recovery owners are unassigned.
4. Custody and recovery concentrate power; one 2-of-3 group appears to span several key classes, and epoch reset/quarantine decisions are operator-controlled.
5. The evidence chain is blocked and partly circular: F-03 depends on F-01/F-02/F-04, while F-04 must be re-evaluated against F-01/F-02.

## 2. Scope and limitations

Reviewed 12 documents (D01–D12): F-01 provider/topology documents; F-02 authority documents; F-03 recovery specification and exercise record; F-04 cryptographic custody specification and plan; master closure register; review charter, RFP and execution status.

Limitations expressly stated by reviewer:
- Desk review only; no live system, code, IAM export, contract, key ceremony or test result inspected.
- Baseline mismatch: charter lists 14 documents but package contains 12. Missing are four core v4 documents (design, server implementation specification, migration/test plan, traceability matrix), historical F-01 provisional topology, F-05–F-09 design documents, and acceptance tests 188–220. D04 is present but outside charter list.
- Conversion fidelity could not be verified. The quoted SHA-256 covers the ZIP, not the PDF.
- This is an AI-generated desk review, does not meet the charter's named external human reviewer requirement, must not be presented as the commissioned review, and closes no F-item.
- Provider behaviors not inspected are marked “verify” in the review.

Evidence grades used: Demonstrated (actual test/verified artifact), Specified (text only), Assumed (unverified provider/human/external condition), Missing (no adequate specification or evidence).

## 3. Architecture assessment

Credited strengths: no database-only fallback; checkpoints treated as prefix accelerators only; no retroactive trust from replacement keys; domain-separated signing; BLOCKED and NOT RUN distinct from PASS; and explicit recognition that two vendors do not equal two independent administrators.

Systemic weaknesses: runtime powers are not separated; no continuous independent detection; root-of-trust bootstrap has no owner; recovery/incident paths are weaker than normal operation; threat boundaries differ across documents; F-03/F-04 dependency sequencing is circular or unspecified.

## 4. Findings register — original IDs preserved

### P1 — High

**CSC-01 — The only authoritative receipt chain and head are in one mutable Spanner database; the normative protocol does not archive receipts.**  
Location: D02 §§2–4, D01 §§1–2, D05 R03/R04, D06 §4. A Spanner writer/admin or project compromise can delete/revert receipts and head while S3 retains only unordered envelopes. Application-level “immutable rows” are not a database-enforced immutability control. Consequence: silent history loss/rewind and failed recovery requirement.  
**Correction:** Archive signed receipts and commit proofs to a locked store in a separate trust domain, written by an identity other than ICW runtime; define receipt RPO/lag alarm; restrict restore/DDL/IAM and export audit externally.  
**Closure:** As project admin, delete/revert N receipts and head; independent verifier with no Spanner access must rebuild to last committed receipt from archive and report exact loss within declared RPO; repeat with Google project inaccessible.

**CSC-02 — No external head anchor or fork detection between checkpoints; recovery completeness is circular.**  
Location: D09 §1/F-05, D07 §2.3, D05 §§4–6, D06 §4. Rollback can produce a valid fork; clients have no mechanism to object. Recovery's expected head is pinned by the exercise controller or the same witness. No cadence, witness or independent expected-head source is specified.  
**Correction:** Signed head statements per commit or bounded interval, cosigned by at least two witnesses outside ICW trust domain (including tenant monitors); inclusion/consistency proofs; bounded unanchored tail; expected head sourced independently.  
**Closure:** Inject rollback at several offsets and a fork; independent monitor alarms within bound; verifier establishes head/tail with exercise-controller expected head withheld.

**CSC-03 — ICW runtime is a composite single point of compromise; controls guard key extraction, not key use; no continuous independent verifier.**  
Location: D02 §4, D07 §§3.2/4, D08 §3, D01 §9. One runtime identity performs S3 write, Spanner write and HSM signing; RCE/build compromise can skip authorization, forge/censor mutations or create forks without compromising admins.  
**Correction:** Split ingress validator, signer, committer and archiver into least-privilege identities; separate deployment authority with reproducible signed builds/attestation; continuous independent verifier in another trust domain checks receipts, authorization, heads and HSM sign counts; correct threat exclusions.  
**Closure:** Red-team full runtime identity for forged mutation, fork and censorship; verifier alarms within bound; no verifier-valid forged history; signer cannot sign without independently checkable authorization; HSM counts reconcile.

**CSC-04 — Tenant-root enrollment and recovery are operator-controlled by unassigned processes; tenant supremacy is unsupported.**  
Location: D03 §12, D07 §§2.2/9, D08 §1. Operators can pin an attacker-controlled root or re-root after social engineering; tenant cannot independently detect it. Tenant root is absent from F-04 key inventory.  
**Correction:** Enrollment outside operator control; append-only tenant-visible trust-registry log; notification to pre-registered contacts and cool-off before re-root; define custody options and include tenant root in key inventory.  
**Closure:** Operator-only personnel cannot enroll/re-root attacker key, or tenant detects and reverses within cool-off; independent verification records.

**CSC-05 — F-02 documents define incompatible authority models and contradict the register on Okta selection.**  
Location: D03 §12 vs D04 §§1–5; D09/D12. D04 makes ADS sole issuer/root; D03 §12 requires tenant-root delegation. Okta is both selected and unselected.  
**Correction:** One normative F-02; withdraw/supersede D04 with requirement mapping; reconcile grants/revocation text and Okta status; update charter baseline.  
**Closure:** Every F-02 requirement has exactly one normative source; status consistent; no document defines ADS as authority root.

**CSC-06 — Authorization binds an authenticated session, not user intent.**  
Location: D03 §§1–2/5, D04 §2, D05/D06 R25, D01 §9. A compromised application can compose and request any in-grant mutation using a user's session; digest binds app-composed request, not what user approved.  
**Correction:** User-held device-bound signature over canonical request digest; step-up approval for destructive commands through channel outside application; state compromised-device residual risk.  
**Closure:** With full application server access and valid session, each lifecycle command fails without fresh user-device signature; verifier validates signature in R25 evidence.

**CSC-07 — Custody concentration: one 2-of-3 group appears to span HSM administration/restore, trust-root and epoch approval, verifier releases and recovery-manifest signing.**  
Location: D08 §§1–2/8.2, D07 §§4/9, D05 R29. Any two custodians may control ledger-continuity trust across multiple key classes; same people across nominally separate controls.  
**Correction:** Separate quorums per class with no person shared; larger cross-organizational quorums for trust-root, epoch and verifier releases; external custodian; documented replacement after loss.  
**Closure:** Identity-backed custodian matrix and HSM/IAM exports prove disjoint principals; any two cannot act across classes; lose-two exercise succeeds.

**CSC-08 — Epoch reset, quarantine and re-enablement are operator-authorized; recovery path is weaker and can enable repudiation/denial of service.**  
Location: D07 §5.1/§3.4, D08 §§3–4, D05 R02/R26/R29/C03/C08. Custodians can designate last verified receipt and quarantine valid history; fabricated anomalies can force indefinite fail-closed state; new epoch genesis and pins depend on same quorum.  
**Correction:** Objective independently verifiable quarantine/epoch criteria; independent witness cosignature and tenant notification/ratification; bounded decision deadlines and safe read-only mode; anchor recovery epoch in independent witnesses.  
**Closure:** Unsupported quarantine blocked or visible/contestable; fabricated anomaly leads to defined safe mode within RTO.

### P2 — Medium

**CSC-09 — Signed receipt is not proof of commit; pre-commit signing creates signed but uncommitted/equivocating receipts.** D02 §4. A CAS loser/abort leaves valid signature; clients cannot tell accepted from uncommitted.  
**Correction:** Commit-bound inclusion proof against signed head or post-commit countersignature; classify signed-uncommitted receipts; reconcile HSM sign count.  
**Closure:** CAS loss/abort/early-ack tests; no client artifact verifies as accepted unless committed; loser is UNCOMMITTED.

**CSC-10 — Normative append protocol omits authorization verification, semantic validation and replay consumption; ordering relative to irreversible retention is unspecified.** D02 §4 vs D03 §§5–6/D01 §§2/8. Unauthorized or replayed requests may create locked objects; TOCTOU revocation and concurrent assertion reuse possible.  
**Correction:** Total order: authenticate; verify assertion/delegation/policy/revocation; semantic validate; upload under fixed bucket-enforced retention writer cannot extend; commit transaction consumes assertion ID and rechecks revocation version; acknowledge; define orphan quotas.  
**Closure:** Unauthorized/replay creates zero S3 objects; concurrent duplicate exactly one commit; revocation race rejected; retention extension denied.

**CSC-11 — Idempotency conflicts with head-bound request digests.** D03 §5–6, D02 §4, D09 F-06. Retry after CAS loss changes expected head and digest, so same idempotency key is incorrectly treated as integrity conflict or implementers weaken binding.  
**Correction:** Define separate semantic idempotency digest and head-bound authorization digest.  
**Closure:** Matrix for lost response, CAS loss, retry after head advance and same key/different semantics.

**CSC-12 — Revocation is not executable: no authenticated feed, freshness bound, and tenant-root revocation conflicts with emergency revocation.** D03 §§2/6/10/12, D04 §§2/5, D09 §5. Revocation latency unbounded or authority contradictory.  
**Correction:** Signed revocation feed, max staleness and stale behavior; narrowly scoped revoke-only delegated key.  
**Closure:** Withhold/delay feed and measure revoke-to-reject; revoke-only key cannot grant.

**CSC-13 — Routine HSM signing is unconstrained; “rate/role constrained” is unenforceable there; suspension needs quorum; no sign-count reconciliation.** D07 §§3.2/4/5.1, D08 §§3/8.2. Stolen service credentials permit arbitrary signing until two custodians assemble.  
**Correction:** Unilateral emergency suspension, quorum to resume; independent semantic/rate gate; continuous sign-count reconciliation; consider use quorum for low-volume keys.  
**Closure:** Stolen-credential drill detects/suspends within bound; anomaly alarm; one custodian suspends, quorum resumes.

**CSC-14 — Key-custody controls rely on HSM enforcement it may not provide; recovery credentials and KEK access are unmanaged.** D07 §§4/9, D08 §§2/4, D05 §2.2, D06 §4. HSM cluster/backup lifecycle may be cloud IAM control-plane actions; recovery credentials can expose archive/KEK.  
**Correction:** Per-action enforcement matrix mapping HSM, IAM/org policy and external gate; split-custody expiring recovery credentials; name KEK custodian.  
**Closure:** Attempt bypass as each admin class including AWS account admin; theft drill shows no standing access and alerts on use.

**CSC-15 — Provider concentration/account events and provider exit/legal inaccessibility are unaddressed.** D01 §9, D02 §5, D08 §§2/4, D07 §3.4, D09 §4, D03 §8. Google holds only receipt/head store; AWS holds archive and HSM; account suspension/outage can remove both archive and signing; key backups may not be portable.  
**Correction:** Provider-exit design with exportable receipts/envelopes/public-key history and safe new-epoch process; separate AWS organizations or document residual risk; review continuity terms.  
**Closure:** Simulated loss of Google project and AWS HSM account; RPO/RTO met, discontinuity visible and tenant-ratified.

**CSC-16 — Lawful erasure conflicts with Compliance lock, wrapped-key placement and retained digests.** D01 §8, D02 §7, D07 §2.3/§5.2, D05/D06 R06/R08. Locked wrapped DEKs and plaintext digests can make erasure impossible or leave a confirmation oracle.  
**Correction:** Decide envelope content; per-tenant/subject destroyable KEK hierarchy; keyed commitments whose key is destroyed on erasure; establish retention basis before real data.  
**Closure:** No recoverable plaintext or confirmable digest after erasure; tombstone and receipt chain still verify; legal/technical sign-off.

**CSC-17 — Projection gating is enforced inside the application, which is the stated adversary.** D09 §1/F-08, D05 R16, D10 §3A. Application admin can bypass gate or serve forged projections/flags.  
**Correction:** Consumer-verifiable finalization receipt/inclusion proof or independent gateway; gate outside application-admin domain.  
**Closure:** Compromised application cannot make forged projection/flag pass independent consumer verifier.

**CSC-18 — Baseline incomplete and internally inconsistent.** D10 §2 vs package; D12 §3; D06 §1/§4; D05 §4/R04; D02 §§3/6; D09 §§3/5; D01 §9. Missing core docs/tests and stale MRSC/dual-store references make integrated contract and F-03 exercise unreviewable/unsatisfiable.  
**Correction:** Complete baseline with per-file hashes; amend stale references; unify numbering; downgrade F-05–F-09 status until designs supplied.  
**Closure:** Reproducible hash manifest; stale-term search returns no unjustified references; independent consistency matrix.

**CSC-19 — No consolidated threat model or claims register.** D01 §9, D03 §3, D07 §§2.1/9, D09 §1, D10 §4. Different threat boundaries make claims unfalsifiable.  
**Correction:** One model covering adversary classes/capabilities, assets, integrity/ordering/authorization/availability/confidentiality/erasure objectives, non-goals and claim-to-evidence mapping.  
**Closure:** Every normative requirement traces to objective and adversary; no unowned/untested claim.

**CSC-20 — Blast radius global: one ICW receipt key for all tenants/ledgers; ADS delegations may aggregate.** D08 §§1/8.2, D03 §12.3, D07 §5.2. One key event can quarantine all tenants; one ADS key may hold union of tenant delegations.  
**Correction:** Per-tenant/cohort ADS delegation keys; evaluate per-ledger/sharded receipt keys; quantify blast radius.  
**Closure:** Compromise simulation affects only declared cohort; others continue and verify.

### P3 — Low

**CSC-21 — Time attestation coarse and algorithm-incomplete.** D07 §§2.3/5.1, F04-T11, D05 R03. Milestone-only TSA stamps leave coarse compromise bounds; receipt time source and long-term validation unspecified.  
**Correction:** Timestamp each head statement; TSA algorithm/long-term validation policy and receipt time source.  
**Closure:** TSA rollover/retirement vectors and bounded compromise interval.

**CSC-22 — Unicode-preserving canonicalization with non-normalized identifiers can desynchronize authorization scope.** D07 §2.3, D03 §§5/8.  
**Correction:** Restrict identifier grammar (ASCII or PRECIS profile) and reject nonconforming IDs.  
**Closure:** Differential ADS/ICW adversarial Unicode corpus.

**CSC-23 — Verifier and review independence asserted, not structured.** D07 F04-T05/§§6/8, D05 §2.1/R20, D10 §§1/6–7, D11 §2. Two implementations/specification/vector sets may share authorship and errors; independent reviewer absent.  
**Correction:** Second verifier authored by reviewer-selected party; independent vectors including published ECDSA/JCS vectors; reviewer may extend charter.  
**Closure:** Disclosed authorship, divergence tests and reviewer-authored additions.

**CSC-24 — Document hygiene and product-category defects.** D01 §9, D12 §3, D04 §1/§6, D07 F04-T05/§2.3, D09 §5. Duplicate numbering, stale status, Okta category mismatch, test numbering drift and superseded MRSC wording.  
**Correction:** Editorial/consistency pass; justify identity-provider category; align test numbering.  
**Closure:** Independent review confirms edits against consistency matrix.

## 5. Cross-document contradictions

X1 Okta selected vs unselected (D04/D12 vs D03/D09).  
X2 ADS as sole issuer/root vs tenant-root delegation (D04 vs D03 §12).  
X3 ADS maintains grants/revokes vs tenant alone grants (D03 §§2/12).  
X4 S3 described as envelope/receipt archive vs envelope-only upload (D02 §§2/4; D05/D06).  
X5 One archive store vs “both stores” (D02 vs D05/D06).  
X6 MRSC rejected vs MRSC metadata in F-03 (D02 vs D06).  
X7 Single-item head CAS vs multi-row Spanner transaction (D09 vs D02).  
X8 Immediate suspension vs two-person disable approval (D07).  
X9 Head-bound digest vs same-key/different-digest retry conflict (D03/D02).  
X10 ICW compromise exclusion requires simultaneous compromise vs single runtime sufficing (D01 vs D02/D07).  
X11 14-document charter baseline vs 12 supplied (D10).  
X12 F04-T05 blocked pending parameters vs parameters selected (D07).  
X13 Tenant controls root vs operator-run enrollment (D03).  
X14 F-05–F-09 “DESIGN-RESOLVED” without supplied designs (D09).

## 6. Missing evidence

Missing documents: four core v4 docs; F-01 provisional topology; F-05–F-09 designs; acceptance tests 188–220; signed deployment parameter register.

Missing specifications: receipt archival; anchor cadence/witnesses; runtime separation/deployment authority/attestation; trust registry; revocation feed; tenant-root custody; user-intent signatures; provider exit; consolidated threat model.

Missing live evidence: IAM/account ownership, named custodians, TSA operators, HSM configuration, verifier build, fault-injection logs, recovery exercise, human review.

Missing numeric parameters: anchor interval, assertion lifetime, clock skew, revocation freshness, RPO/RTO, cryptoperiods and retention.

## 7. Required corrective actions and sequencing

**Tier 0 — before next review:** complete baseline/hash manifest and resolve X1–X14; publish threat model/claims register; collapse F-02 into one normative model.

**Tier 1 — architecture changes before security approval:**
- A — ledger integrity (CSC-01/02/09/10/11): external receipt archive, witnessed heads, commit-bound receipts, total-order append protocol, explicit digest semantics.
- B — runtime separation/detection (CSC-03/13/17): least-privilege components, separate deployment authority, continuous verifier, sign-count reconciliation, unilateral suspension, consumer verification.
- C — authority root (CSC-04/05/06/12): independent tenant enrollment, tenant-visible log/cool-off, user-held signatures, signed revocation feed.
- D — custody/recovery governance (CSC-07/08/14/15/20): partitioned quorums, evidence-based epoch/quarantine decisions, safe interim mode, enforcement matrix, provider exit, blast-radius limits.
- E — privacy/erasure (CSC-16): envelope decision, destroyable key layer, keyed commitments and retention basis.
- F — hygiene (CSC-21–24).

Sequencing: A and B precede F-03/F-04 test design; C precedes F-04 custody finalization; D's custodian partition precedes key ceremony; E precedes real data/retention settings.

## 8. Closure and exit criteria

P1 closure requires Demonstrated evidence from live non-production adversarial tests using real IAM identities and selected providers, with raw logs retained and execution/witness by independent reviewer. P2 requires Demonstrated evidence or reviewed specification plus executed test; documentation alone cannot close enforcement claims. P3 may close by reviewed change.

No self-certification. Tests use selected topology, not stand-ins. BLOCKED/NOT RUN are not PASS. Unnamed owner means OPEN. Retest after commit protocol, custody or authority changes.

Exit gates:
- G1 history survives Spanner revert and Google project loss (CSC-01/15).
- G2 rollback/fork detected and loser receipts classified (CSC-02/09).
- G3 compromised runtime exercise, sign-count reconciliation and bounded suspension (CSC-03/13).
- G4 tenant-root takeover and app-as-user attempts fail or are reversible (CSC-04/05/06).
- G5 custody partition and lose-two recovery (CSC-07/08/14).
- G6 blind recovery establishes head/tail with expected head withheld (CSC-02/18).
- G7 erasure leaves no recoverable plaintext/confirmable digest while chain verifies (CSC-16).
- G8 consistency matrix and threat model (CSC-05/18/19).

## 9. Residual risks and unresolved questions

Residual risks include provider-level compulsion/collusion, user device or IdP compromise, custodian quorum collusion/coercion, implementation/firmware/SDK/verifier defects, malicious legitimate submissions, fail-closed availability loss, and the fact that matching digests prove integrity rather than truth.

Unresolved questions include legal/account owners; runtime identities with S3/Spanner/HSM powers; receipt archive writer/lag; anchor cadence/witnesses; tenant enrollment owner/tenant view; custodian quorum overlap; envelope content/retention basis; RPO/RTO/assertion/clock/revocation parameters; whether missing core spec mitigates findings; and selected provider behaviors requiring verification.

## 10. Final recommendation

**FAIL.** Implementation authorization is not justified. No external statement of tamper-evidence, rollback resistance or independent authorization should be made on this package. Complete Tier 0, then commission human review under D10 with this AI review as input only. Retest after amendments by a reviewer other than the authors and other than this reviewer's prior conclusions.

**Important status:** This is an AI desk review. It does not satisfy the human-reviewer requirement or close any F-item.
