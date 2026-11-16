# ICW v4.2 — Cross-Document Consistency Audit 04

**Audit date:** 2026-11-16  
**Audit ID:** ICW-AUD-XDOC-04  
**Repository:** `fae-colab/DealFlow-Alpha01`  
**PR:** #34  
**Branch:** `review/icw-v4-2-copilot-dr-review`  
**Audited branch head before this audit record:** `023ca36487ecc6b4d0ada0749641552ecae86428`  
**Prior audit:** ICW-AUD-XDOC-03  
**Audit type:** Documentary consistency and normative-contract review only. No provider-backed implementation, key-destruction proof, legal approval, regression execution or live recovery was performed.

## 1. Executive result

**RESULT: CONDITIONAL PASS — AUD-XD-07 DOCUMENTARY DESIGN AMBIGUITY RESOLVED; IMPLEMENTATION AND EVIDENCE GATES REMAIN OPEN.**

The R06 payload model is now explicit and consistent across the F-03 inventory, F-03 recovery test specification, core append-only architecture, server implementation contract, migration test plan and requirement/test traceability matrix.

The selected normative design is:
- R06 artifacts are separate immutable, versioned payload objects; they are not embedded in R04 canonical batch envelopes.
- Each accepted R04 envelope contains canonical descriptors binding each payload artifact's identity/role, source/version/provenance, exact object VersionId/generation, ciphertext digest/length, permitted plaintext digest/length and non-secret key reference/version.
- The Spanner receipt commits the R04 envelope digest and therefore commits the descriptor and exact payload-version binding.
- Each independently erasable artifact uses a unique DEK or equivalent independently destructible key domain. Wrapped DEKs and recoverable copies are held outside immutable payload objects and R04 envelopes, under separately administered key management.
- Lawful erasure requires a signed, authorized, receipt-backed tombstone and independent evidence that every usable key copy, including replica, backup, escrow and DR copies, is irrecoverable. WORM ciphertext may remain until retention expiry. A pointer deletion or operator assertion is not proof.
- Missing or mismatched payload after Spanner commit does not undo the receipt; dependent content/decision profiles become PARTIAL/UNAVAILABLE. An uncommitted payload object is an orphan, not accepted history.
- Original source, normalized capture and derivative artifacts remain distinct; a derivative cannot silently replace original source bytes.

**AUD-XD-07 disposition:** RESOLVED at the normative/documentary design level. The previous unresolved choice between embedded payloads and separate objects, and the missing exact-version/key-erasure contract, is no longer left to implementation interpretation.

**Not resolved by this audit:** provider-specific feasibility, approved cryptographic algorithms, key-vault design and independence, complete backup/replica destruction semantics, retention and legal basis, measurable erasure completion criteria, provider evidence and execution of the new tests. These remain implementation/legal/operational gates. Therefore F-03 remains OPEN / NOT DEMONSTRATED and overall ICW v4.2 remains HOLD — NOT ACCEPTED.

## 2. Audited normative documents and blob SHAs

Git blob SHAs below are Git object identifiers, not SHA-256 file digests.

| Document | Blob SHA |
|---|---|
| `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` v1.1.3 | `4b4a1e151515bcd8426dee5fe4e2e922aee4dfd0` |
| `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` v1.1.3 | `002c3d1f14276779deca37e953c1c751deda8417` |
| `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md` | `94c5e89227cc9e8dcebdc6626b8b5933eee0a1ab` |
| `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md` | `8545685bfa67397460869ec4bd4c0357281d60b9` |
| `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md` | `2a73907f93cf8ced0b1816c073f902b9674bd854` |
| `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md` | `054f803d973ef079d7ce5565fcdca5db05d0a3a0` |

## 3. Cross-document consistency checks

| Contract element | Inventory | F-03 test spec | Architecture | Server spec | Test plan / traceability | Result |
|---|---|---|---|---|---|---|
| Payload placement | §6.5 | §27.7 | §12 | §12.1 | §§22.4, 12.4 | CONSISTENT |
| Descriptor fields and exact version | §6.5 | F03-R06-01 | §12 | §12.1 | F03-R06-01 | CONSISTENT |
| Upload/read-back before commit; orphan behavior | §6.5 | F03-R06-02 | §12 | §12.1 | F03-R06-02 | CONSISTENT |
| Receipt binding | §6.5 | F03-R06-01/02 | §12 | §12.1 | F03-R06-01/02 | CONSISTENT |
| Per-artifact key isolation | §6.5 | F03-R06-03/04 | §12 | §12.2 | F03-R06-03/04 | CONSISTENT |
| Lawful erasure and tombstone | §6.5 | F03-R06-03/04 | §12 | §12.2 | F03-R06-03/04 | CONSISTENT |
| Original/derivative distinction and privacy | §6.5 | F03-R06-05 | §12 | §12.2 | F03-R06-05 | CONSISTENT |
| Profile scope and fail-closed outcome | §6.2/6.5 | §27.7 | §12 | §§6, 12 | §§22.4, 12.4 | CONSISTENT |

The original R01–R30 class labels and inventory rows remain preserved. The new sections are additive normative amendments and explicitly supersede less-specific R06 placement/erasure wording.

## 4. Regression requirements

Five additive tests are defined:
- F03-R06-01 — descriptor, exact-version, source and receipt binding;
- F03-R06-02 — upload/commit ordering, orphan classification and lost-ack retry;
- F03-R06-03 — independent per-artifact key destruction across primary/replica/backup/escrow/DR;
- F03-R06-04 — false, unauthorized or incomplete erasure rejection;
- F03-R06-05 — original/derivative lineage and privacy-sensitive digest handling.

**Execution status: DEFINED / NOT RUN.** No provider-backed fixture, key registry, backup/replica inventory, legal authority package or independent verifier output has been produced. Synthetic tests, if later run, cannot establish provider destruction semantics or close F-03.

## 5. Remaining implementation and approval gates

Before implementation or F-03 acceptance, the signed parameter/legal register must approve:
1. Exact object-store namespace, version/generation semantics and immutable-retention behavior.
2. Encryption format/algorithm, nonce/parameter handling and independent cryptographic review.
3. Unique-DEK issuance, key-vault architecture, trust roots, writer/reader identities and administrative separation.
4. Wrapped-key storage, backup, replica, escrow and disaster-recovery inventory and deletion semantics.
5. Legal basis, retention schedule, legal holds, permitted erasure scope and tombstone policy.
6. Measurable proof standard and completion time for crypto-erasure, including trusted time and independent verification.
7. Privacy treatment of plaintext digests and retained metadata.
8. Provider-backed tests and independent reviewer evidence.

If a selected provider cannot prove independent destruction of every usable key copy, the payload MUST NOT be labeled ERASED_BY_AUTHORITY. Report BLOCKED/UNAVAILABLE.

## 6. Other open findings and governance

- AUD-XD-06 Option 2 policy remains ACCEPTED; its numeric lag, trust/ownership and operational implementation parameters remain open.
- AUD-XD-05 R01–R30/AR/core-test crosswalk remains PROPOSED / PROVISIONAL pending independent validation.
- AUD-XD-08 O-01–O-08 tests remain DEFINED / NOT RUN.
- F-01 through F-04 remain OPEN / NOT DEMONSTRATED.
- Overall disposition remains HOLD — NOT ACCEPTED.
- No provider provisioning, procurement, infrastructure spend, implementation, migration, ingestion, deployment, live recovery exercise, production authorization or PR merge is authorized.
- PR #34 must remain OPEN / DRAFT / UNMERGED.

