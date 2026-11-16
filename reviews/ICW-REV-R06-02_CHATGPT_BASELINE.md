# ICW v4.2 — ChatGPT Focused Adversarial Reassessment: R06 Erasure and Recovery Copies

**Review ID:** ICW-REV-R06-02  
**Reviewer:** ChatGPT — focused adversarial document review (AI reviewer; not an external human auditor)  
**Review date:** 2026-11-16  
**Repository:** `fae-colab/DealFlow-Alpha01`  
**PR:** #34  
**Branch:** `review/icw-v4-2-copilot-dr-review`  
**Reviewed head:** `90cda0bb8225d8d733fd4f43b26992f2f3802165`  
**Scope:** F03-R06-01 through F03-R06-05, R06-ERASE-01, cross-document authority, test-oracle quality, recovery-domain completeness, and execution/governance boundaries.  
**Method:** Direct inspection of the exact PR-head versions of the F-03 practical recovery specification, F-03 inventory, migration test plan, v4.1 traceability/server/append-only documents, outstanding-trust register, consolidated findings register and Audit 04. No provider systems or live data were accessed.

## 1. Verdict

**DOCUMENTARY REVIEW: FAIL — R06 tests are not yet sufficiently specified to establish reliable detection of every surviving recovery copy or residual plaintext.**

**EXECUTION: BLOCKED / NOT RUN.** This is not a provider-backed test result. No provider-backed restore, key-unwrapping, crypto-erasure or residual-plaintext exercise was executed. The reviewed PR itself says provider provisioning/procurement and live exercises are not authorized. The GitHub commit status returned no status checks, and no PR workflow runs were returned for the reviewed head; this is not evidence that R06 tests passed.

**Decision:** Do not accept AUD-XD-07 and do not close F-03. Keep PR #34 OPEN / DRAFT / UNMERGED and the overall disposition HOLD — NOT ACCEPTED. The selected separate immutable payload-object model is a useful documentary direction, but the current test specification has material false-pass paths.

This review is a separate ChatGPT analytical pass from the earlier ChatGPT cryptography review. It is not independent organizational corroboration, a qualified human review, provider evidence, or an acceptance authorization.

## 2. Findings

### CG-R06-01 — Stale normative authority directly contradicts the selected payload model
**Severity: P1 — DOCUMENTARY CONTRADICTION — OPEN**

The current F-03 test specification still contains an earlier statement at §27.6 (around the AUD-XD-07 paragraph) that the object model is OPEN and that the specification does not choose embedded versus separately stored payloads. The later §27.7 says the separate immutable-object model is normative and supersedes earlier wording. The companion inventory §7.4 likewise still says placement, key lifecycle and erasure protocol remain OPEN, while inventory §6.5 selects the separate-object model.

The later decision does not reliably cure the conflict while the stale statements remain unmarked in the same controlling documents. A reviewer or implementer can follow the earlier explicit OPEN statement and reasonably reach a different result.

**Required correction**
1. Remove the stale statements or mark them visibly HISTORICAL / SUPERSEDED, with a direct pointer to the controlling decision, version and section.
2. Apply the same supersession treatment to every controlling document, not only the F-03 spec and inventory.
3. Rerun the cross-document audit against the exact current PR head and exact current v4.1 document versions.

**Acceptance evidence:** no active normative statement leaves payload placement/key-erasure design OPEN; the audit records exact current Git blob SHAs and confirms the conflict is gone.

### CG-R06-02 — Positive-control test does not prove inventory completeness
**Severity: P1 — FALSE-PASS RISK — OPEN**

F03-R06-04 correctly requires a deliberately surviving backup/DR key copy that can decrypt a canary and requires the independent verifier to detect it. However, the test does not require that the seeded copy be unregistered or unknown to the verifier, nor does it define an independent inventory-discovery oracle.

A verifier can inspect only the supplied inventory, detect the positive-control copy because it was listed, and pass while an additional undisclosed copy exists in an unenumerated account, region, provider-managed backup, escrow export or recovery environment. A test that merely proves detection of a known listed copy does not prove that the recovery domain is complete.

**Required correction**
1. Seed at least one deliberately surviving key/copy that is absent from the declared inventory and hidden from the verifier's test manifest.
2. Require a separately authorized inventory process to enumerate provider-native key, wrapped-key, backup, replica, snapshot, escrow/export, DR and recovery-account resources independently of the supplied manifest.
3. Reconcile discovered resources against the declared inventory and require unexplained additions, omissions, inaccessible resources, permission gaps, incomplete pagination or stale inventory to return BLOCKED / NOT DEMONSTRATED (or FAIL where a prohibited copy is recovered), never PASS.
4. Retain raw provider-native inventory responses, pagination/completion evidence, immutable resource identifiers, timestamps and audit logs.

**Acceptance evidence:** the blind surviving copy is detected; a deliberately incomplete inventory is rejected; a complete reconciled inventory has independently reviewable provenance.

### CG-R06-03 — Historical restore coverage has no exhaustive boundary
**Severity: P1 — FALSE-PASS RISK — OPEN**

F03-R06-03 requires restoration of each in-scope historical KMS/HSM backup or point-in-time state. The phrase “each in-scope” is not operationally bounded. The test does not define how the full population is discovered across retention windows, key generations, backup schedules, regions, accounts/projects, replicas, provider-managed copies, escrow and exported recovery material.

A test can restore every item in an incomplete test manifest and still miss a retained historical generation capable of resurrecting the DEK.

**Required correction**
1. Define the inventory source and query/API coverage for each provider control plane and each recovery domain.
2. Record the covered retention interval, every generation/snapshot/PITR state, resource ID, region/account, creation/expiry time, pagination token/count and enumeration permissions.
3. Define a reproducible reconciliation between provider-native discovery and the test manifest; record signed exclusions with owner, rationale and expiry.
4. Restore-test every retained state that can restore key material or a usable wrapping path. Any unenumerable or inaccessible domain is BLOCKED.

**Acceptance evidence:** an independent reviewer can reproduce the inventory boundary and establish that every retained recoverable state in the approved scope is either exercised or explicitly blocked/excluded under signed authority.

### CG-R06-04 — “Monotonic erasure” lacks a specified independent anti-rollback trust boundary
**Severity: P1 — CONTROL-PLANE GAP — OPEN**

F03-R06-03 says erasure state/deny rules must be monotonic and independently protected from rollback. It does not specify the independent state authority, trust root, administrative separation, freshness/version mechanism, restore ordering, or how the system behaves if that state is unavailable. If the erasure deny state is stored only in the same KMS/HSM domain being restored, a pre-erasure restore may roll it back with the key material.

**Required correction**
1. Specify the trust boundary and owner for durable erasure/deny state, independently of the key backup domain whose restore is being tested.
2. Define authenticated monotonic version/sequence and freshness checks, plus how the verifier obtains a trusted latest state without relying on the restored domain or its operator.
3. Add negative tests for rollback, deletion, replay, stale replication and unavailability of the deny-state authority.
4. Restore a pre-erasure KMS/HSM image and demonstrate that the independent erasure state still blocks unwrap/decrypt; attempt to roll back or suppress the state itself.
5. Define fail-closed behavior where freshness or independent state cannot be established.

**Acceptance evidence:** the negative tests reject stale or rolled-back erasure state, and historical restore cannot resurrect a usable DEK. Do not prescribe a particular provider product until the provider/legal design is approved.

### CG-R06-05 — Shared-parent and wrapped-key paths are not expressed as complete test vectors
**Severity: P1 — KEY-HIERARCHY COVERAGE GAP — OPEN**

The normative contract mentions unique per-artifact DEKs and recoverable copies, but the five tests do not fully define a parent/child key-hierarchy fixture. In particular, the tests do not explicitly require traversal of every wrapped DEK, KEK/parent-key generation, nested wrapping layer, replica, escrow/export, cached or previously unwrapped key path.

**Required correction**
1. Create a fixture with multiple artifacts, unique DEKs, at least one shared KEK/parent hierarchy, multiple parent-key generations and wrapped DEK copies in the declared recovery domains.
2. Erase artifact A and verify every path to A is irrecoverable while artifact B remains decryptable. This tests both isolation and absence of shared-key collateral destruction.
3. Attempt unwrap/decrypt through every parent generation, replica, escrow/export and historical restore state, including cached or previously unwrapped key material where it can survive the threat model.
4. Any surviving path that recovers A is FAIL; inability to enumerate or test a path is BLOCKED.

**Acceptance evidence:** complete parent/child key lineage and test results demonstrate A cannot be recovered while B remains recoverable.

### CG-R06-06 — Residual derivative detection is not measurable enough to exclude false passes
**Severity: P1 — RESIDUAL-PLAINTEXT COVERAGE GAP — OPEN**

F03-R06-05 names useful storage classes and requires a synthetic canary, but it does not define a measurable detection oracle for partial, transformed, chunked, re-encoded, normalized or otherwise content-equivalent derivatives. Exact-string search can miss a transformed or partial copy. “Every in-scope location” is also only as complete as the pre-erasure inventory supplied to the test.

**Required correction**
1. Use multiple unique canary markers and seed controlled variants: exact copy, partial/chunked fragments, normalized/re-encoded text, structured-field extraction, attachment/media derivative, export, cache/staging copy and backup-restored copy.
2. Define per-storage-class inspection and restore coverage, the detection method, known limitations, expected positive/negative results and evidence retained.
3. Independently enumerate candidate storage locations and reconcile them to the declared location inventory; unexplained or inaccessible storage is BLOCKED.
4. Preserve lineage and content-matching evidence without retaining prohibited plaintext in the review report. Treat digest-only metadata separately under the approved privacy policy.

**Acceptance evidence:** every seeded residual variant is detected in its applicable storage class; no unenumerated class is silently treated as clean; the verifier distinguishes permitted tombstone/digest metadata from recoverable content.

### CG-R06-07 — Oracle calibration and control cases are incomplete
**Severity: P2 — TEST-ORACLE QUALITY — OPEN**

The suite defines a surviving-key positive control but does not fully define the paired control matrix needed to establish the verifier's sensitivity and specificity. A verifier that always fails would detect the positive control but would not establish a useful erasure decision procedure; one that always passes would fail the positive control.

**Required correction**
Add, at minimum:
- a known surviving-key positive control that MUST be detected;
- a known fully destroyed/unrecoverable control with complete independently enumerated inventory;
- a shared-parent case where an unrelated artifact remains decryptable;
- an incomplete-inventory case that MUST be BLOCKED;
- a deliberately unregistered copy that MUST be detected;
- a stale pre-erasure restore that MUST be rejected;
- a residual transformed-plaintext case that MUST be detected.

Record expected status, observed status, raw evidence and independent oracle validation for every case. A negative control must not be used to infer provider-wide completeness.

### CG-R06-08 — Audit 04 does not validate the current reviewed head
**Severity: P1 — AUDIT-SCOPE / TRACEABILITY GAP — OPEN**

Audit 04 records an audited branch head of `023ca36487ecc6b4d0ada0749641552ecae86428`, while this review inspected PR head `90cda0bb8225d8d733fd4f43b26992f2f3802165`. Audit 04's table pins the v4 append-only and server-spec files, whereas the current PR also contains v4.1 files. Its claim that the stale R06 wording is superseded/consistent is contradicted by the active OPEN statements still present in the current F-03 spec and inventory.

Therefore Audit 04's CONDITIONAL PASS is not a valid consistency attestation for the exact current head and cannot be used to close CG-R06-01 or accept the strengthened R06 tests.

**Required correction:** issue a new audit or explicit addendum against the exact current PR head, pin all controlling v4/v4.1 files actually in force, list exact Git blob SHAs, and verify each conflicting statement by section/line. The audit must distinguish documentary consistency from test sufficiency and provider-backed evidence.

### CG-R06-09 — Provider-backed execution is unavailable and must remain a hard gate
**Severity: P1 — EXECUTION BLOCKED — OPEN**

The repository says provider services are not provisioned and live exercises are not authorized. The reviewed CI status returned no status checks and no PR workflow runs for this commit. No KMS/HSM, object-store backup/DR, historical restore, key-unwrapping or residual-plaintext exercise is evidenced.

**Disposition:** F03-R06-01 through F03-R06-05 remain DEFINED / NOT RUN. R06-03 through R06-05 are also BLOCKED for provider-backed conclusions. Do not simulate a local test and label it provider-backed. Do not provision services, incur spend or access provider resources without a separately approved authorization and environment.

## 3. Test-by-test disposition

| Test | Documentary coverage | ChatGPT assessment | Execution |
|---|---|---|---|
| F03-R06-01 | Exact-version, descriptor and receipt binding are materially specified | Adequate as a requirement outline; executable fixture/evidence schema still needed | NOT RUN |
| F03-R06-02 | Upload/commit/orphan/lost-ack semantics specified | Adequate as a requirement outline; orphan retention/erasure disposition should be cross-checked separately | NOT RUN |
| F03-R06-03 | Historical restore and per-artifact erasure named | INSUFFICIENT: exhaustive restore inventory, independent anti-rollback authority and complete key-hierarchy paths under-specified | BLOCKED / NOT RUN |
| F03-R06-04 | Deliberate surviving backup/DR key positive control required | INSUFFICIENT: no blind unregistered copy or independent inventory-completeness oracle | BLOCKED / NOT RUN |
| F03-R06-05 | Residual plaintext locations and derivatives named | INSUFFICIENT: transformed/partial derivative oracle and independent storage-domain enumeration under-specified | BLOCKED / NOT RUN |

## 4. Minimum strengthened acceptance matrix

Before any documentary acceptance of the R06 test design, the revised specification must make these assertions testable:

1. **Inventory completeness:** independent provider-native enumeration reconciles to a signed scope; blind/unregistered key copy and unexplained inventory delta are detected.
2. **Historical coverage:** every retained KMS/HSM backup/PITR state and relevant region/account/replica/escrow route is enumerated; untestable domains are BLOCKED.
3. **Anti-rollback:** an independently administered, freshness-checked erasure state survives historical restore; rollback/replay/deletion is rejected.
4. **Key hierarchy:** wrapped DEKs and all parent/KEK generations are traversed; erased artifact stays unavailable while unrelated artifacts remain decryptable.
5. **Positive/negative controls:** surviving key MUST fail; complete destroyed-key control can pass only with independently complete inventory; incomplete inventory MUST block.
6. **Residual plaintext:** transformed, partial and restored derivatives are seeded and detected across each applicable storage class; unknown storage is BLOCKED.
7. **Evidence integrity:** raw signed provider inventory/audit exports, immutable resource IDs, restore identifiers, verifier build/vector evidence, timestamps, oracle output and independent review are retained.

## 5. Review coordination and sequence

This is an AI-only analytical review sequence, as requested by the project owner. It does not satisfy any charter requirement for a qualified independent human reviewer unless the governing charter is separately and explicitly amended by its authorized owner. No reviewer should represent AI agreement as human sign-off or provider evidence.

Recommended sequence:
1. **ChatGPT focused reassessment (this report):** register findings CG-R06-01–09; keep all acceptance decisions on HOLD.
2. **Copilot adversarial DR reassessment:** independently attack inventory completeness, historical restore population, blind surviving-key control and anti-rollback trust boundary. Do not merely confirm this report; attempt to falsify it and return counterexamples.
3. **Claude security/cryptography reassessment:** independently attack parent/child key hierarchy, escrow/wrapped-key recovery, erasure-state trust boundary, residual plaintext and privacy/digest retention.
4. **Gemini distributed-systems reassessment:** independently attack enumeration consistency, cross-account/region restore, stale-state rollback, evidence freshness and profile-status transitions.
5. **Grok systems-assurance reassessment:** independently attack verifier oracle quality, unknown-copy detection, evidence completeness and false PASS conditions.
6. **Reconciliation:** consolidate each reviewer’s source findings without renumbering; classify each as confirmed, disputed, unique or not examinable; update the remediation register and cross-document traceability. A disagreement remains OPEN until evidence or an explicit owner decision resolves it.
7. **Only after documentary findings are resolved:** issue a fresh exact-head consistency audit. Provider-backed execution remains a separate later gate requiring explicit authorization, approved provider design and isolated environment.

No named GitHub reviewer accounts were supplied for the AI systems, so this report does not fabricate review requests or claim that another AI system has completed reassessment. The exact reassessment brief for each system is in the sequence above and can be issued through its respective review session.

## 6. Final decision

- **AUD-XD-07:** NOT ACCEPTED.
- **F-03:** OPEN / NOT DEMONSTRATED.
- **F03-R06-01–05:** DEFINED / NOT RUN; R06-03–05 have material documentary gaps.
- **Provider-backed R06 execution:** BLOCKED / NOT RUN.
- **PR #34:** MUST REMAIN OPEN / DRAFT / UNMERGED.
- **Overall:** HOLD — NOT ACCEPTED.

This review changes no normative requirement, grants no implementation or procurement authority, and does not authorize infrastructure spend, migration, ingestion, deployment, live testing or production use.
