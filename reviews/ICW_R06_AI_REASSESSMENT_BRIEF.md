# ICW v4.2 — R06 Independent AI Reassessment Brief

**Prepared:** 2026-11-16  
**Target:** PR #34, branch `review/icw-v4-2-copilot-dr-review`  
**Review baseline:** use the current PR head at the time of review, not an earlier commit. Record the exact commit SHA and every source document blob SHA.  
**Primary test set:** F03-R06-01 through F03-R06-05 and R06-ERASE-01.  
**Existing focused review:** `reviews/ICW-REV-R06-02_CHATGPT_BASELINE.md` (findings CG-R06-01–09).  
**Purpose:** obtain independent AI analytical reassessments that try to falsify the test suite and the ChatGPT findings. This is not provider-backed execution, human sign-off or acceptance authorization.

## Common instructions to every AI reviewer

Do not assume the ChatGPT findings are correct. Attempt to disprove them and identify additional false-pass paths. Inspect the current PR-head files directly. At minimum inspect:
- `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` §§27.6–27.7 and R06-ERASE-01;
- `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` §§6.5 and 7.4;
- `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md` §22.4;
- current v4.1 append-only, server implementation, traceability and outstanding-trust documents;
- Audit 04 and the consolidated findings register.

For each F03-R06 test, report:
1. attack path and threat assumptions;
2. whether the fixture actually exercises the path;
3. whether the verifier/oracle detects the path;
4. false-pass and false-fail conditions;
5. evidence required and whether it exists;
6. exact corrective test/specification language;
7. result: PASS (documentary adequacy only), FAIL, BLOCKED / NOT DEMONSTRATED, or NOT EXAMINABLE.

Mandatory decision rules:
- Any successful recovery of prohibited plaintext = FAIL.
- A surviving usable key/wrapped-key/parent-key/escrow/DR path = FAIL.
- Incomplete inventory, inaccessible restore domain, missing provider evidence or untested retained recovery state = BLOCKED / NOT DEMONSTRATED, never ERASED_BY_AUTHORITY.
- Tombstone, pointer deletion, primary-key deletion or operator assertion alone is not proof.
- Synthetic/local tests may validate verifier mechanics but cannot establish provider destruction semantics.
- Do not claim a provider-backed test was run unless provider-native restore and audit evidence are supplied.
- Do not approve AUD-XD-07 or close F-03 from specification text alone.
- Do not merge PR #34 or change its OPEN / DRAFT / UNMERGED state.

Use unique reviewer finding IDs. Preserve all source IDs and do not renumber other reviewers' findings. Classify each finding as CONFIRMED, DISPUTED, UNIQUE, DUPLICATE/THEMATIC OVERLAP, or NOT EXAMINABLE. Explain disagreements with evidence, not consensus language.

## Reviewer-specific attack assignments

### Copilot — disaster-recovery and inventory-completeness review
Attack the provider-native discovery boundary: unregistered key copies, backup/PITR enumeration, region/account/project scope, provider-managed backups, replicas, escrow/export, recovery credentials, pagination omissions, stale inventories, inaccessible domains and blind positive controls. Determine whether an inventory can be declared complete without relying on the same manifest being tested.

### Claude — cryptographic hierarchy and anti-rollback review
Attack DEK/KEK/parent-key hierarchy, wrapped DEKs, multiple key generations, shared parents, escrow and cached/unwrapped key material. Examine whether erasure deny-state can be rolled back with a historical KMS/HSM restore, and specify the independent trust boundary and freshness mechanism needed. Test artifact A erasure while artifact B remains decryptable.

### Gemini — distributed systems and recovery-state review
Attack cross-account/region restore consistency, stale replication, historical-state ordering, erasure-state monotonicity, inventory snapshots, trusted time, evidence freshness and profile-status transitions. Look for race windows where the system reports ERASED_BY_AUTHORITY before every recovery domain has converged or been independently proven irrecoverable.

### Grok — systems-assurance and verifier-oracle review
Attack the test oracle itself: blind/unregistered surviving copies, positive and negative controls, verifier independence, incomplete inventories, unknown storage classes, transformed residual plaintext and false PASS/FAIL behavior. Determine whether the evidence is sufficient for an independent reviewer to reproduce the result.

## Required output template

- Reviewer/system and review date:
- Exact PR head SHA and source blob SHAs:
- Overall documentary verdict:
- Provider-backed execution verdict:
- Test-by-test matrix for R06-01 through R06-05:
- Findings with severity, unique IDs, evidence locations and concrete corrections:
- Challenge to CG-R06-01 through CG-R06-09 (confirm/dispute/modify/not examinable):
- Additional attack paths:
- Acceptance recommendation:
- Explicit statement of what was not tested and what evidence is absent.

## Reconciliation gate

After the four reviews are returned, consolidate them in `reviews/CONSOLIDATED_INDEPENDENT_FINDINGS_REGISTER.md`. Do not treat multiple AI reviews as a human review or as independent organizational corroboration when they share a provider. Preserve disagreements. Resolve documentary contradictions first, rerun the exact-head cross-document audit second, and only then consider provider-backed execution under separately approved authority. The current disposition remains HOLD — NOT ACCEPTED.
