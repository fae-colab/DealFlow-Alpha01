# ICW v4.2 — Cross-Document Consistency Audit 03

**Audit date:** 2026-11-16  
**Audit ID:** ICW-AUD-XDOC-03  
**Repository:** `fae-colab/DealFlow-Alpha01`  
**PR:** #34  
**Branch:** `review/icw-v4-2-copilot-dr-review`  
**Audited branch head:** `f1185511d8a0adb1699e24f95710d62c6d7d35cb`  
**Prior audit:** ICW-AUD-XDOC-02, which treated AUD-XD-06 as unresolved.  
**Audit type:** Documentary consistency audit only; no provider-backed tests, implementation, live recovery, or operational proof.

## 1. Executive result

**RESULT: CONDITIONAL FAIL — OPTION 2 POLICY DECISION IS INCORPORATED CONSISTENTLY; IMPLEMENTATION PARAMETERS AND AUD-XD-07 STILL BLOCK FULL REVIEW ACCEPTANCE.**

The authorized decision is now explicit and normative: **Option 2 is accepted.** Client/API success does not wait for independent expected-truth anchor publication. It remains gated on verified receipt-bound projection. Anchor publication is asynchronous, monotonic and bounded by a finite numeric `ANCHOR_MAX_PUBLICATION_LAG` that must be approved in the signed threat/parameter register.

After rollback, the last independently verified anchor is the completeness boundary. Every Spanner-committed position beyond that anchor is an uncovered committed interval unless separately proven by another approved independent source. That interval MUST be enumerated and MUST NOT be included in any completeness-qualified FULL-L, FULL-C, FULL-D, FULL-O or FULL-A result. A post-disaster anchor derived solely from recovered/rolled-back state cannot close the gap.

The policy choice portion of AUD-XD-06 is therefore **RESOLVED / ACCEPTED**. AUD-XD-06 is not fully accepted for implementation or F-03 closure: numeric lag, anchor identity/ownership/trust/admin separation, source independence, publisher implementation, retention/recovery and RPO alignment remain open parameters. AUD-XD-07 remains OPEN. Independent validation of the provisional R01–R30/AR/core-test crosswalk is also pending.

No F-01–F-04 finding is closed. Overall status remains **HOLD — NOT ACCEPTED**.

## 2. Audited documents and exact blob SHAs

Git blob SHAs are Git object identifiers, not SHA-256 file digests.

| Document | Blob SHA |
|---|---|
| `ICW_F01_TOPOLOGY_RECONCILIATION_DECISION.md` | `abeb744503968f3d79e82b898bcfb8e164120616` |
| `ICW_F03_PRACTICAL_RECOVERY_TEST_SPECIFICATION.md` (v1.1.2) | `b1bb1024ec58a0d727d7d7800b0fee96631a9a43` |
| `ICW_F03_RECOVERY_OBJECT_INVENTORY_AND_EXERCISE_RECORD.md` (v1.1.2) | `927ee737f0224201b52e841f3ee71a24a2f96b1f` |
| `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.md` | `2adb0f1c7cc17e400af44f2c5ce9513c76dc6bf3` |
| `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.md` | `f84efc8c96b700baf3d4ca1ba436e37d99251544` |
| `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.md` | `03225f7012c5f7af22c0636e228b0446ddb0a785` |
| `EVIDENCE_LIFECYCLE_V4_REQUIREMENT_TEST_TRACEABILITY.md` | `72e7d41b63746d1a73d9d4268a2fe0f943a9f6a9` |
| `reviews/ICW_V4_2_NORMATIVE_RECONCILIATION_AND_OBJECTIVE_CLOSURE.md` | `1ed3d6ffc88b11886cb3e148db777e24c87b360b` |

The F-03 practical specification v1.1.2 binds to the current v1.1.2 inventory blob `927ee737f0224201b52e841f3ee71a24a2f96b1f`. The four core v4 files are unchanged from their previously audited baselines except the migration plan and traceability matrix, which have additive §22.3 and §12.3 updates respectively.

## 3. AUD-XD-06 decision and consistency result

### 3.1 Accepted policy

The following normative sources now agree:
- F-03 practical recovery specification §27.6 (v1.1.2);
- F-03 inventory §§6.4 and 7.5 (v1.1.2);
- core requirement/test traceability §12.3;
- core migration test plan §22.3;
- reconciliation and objective-closure record §14.

The consistent policy is:
1. Spanner witness commit is the logical acceptance point.
2. Client/API success remains gated on complete receipt-bound projection application and verification; it does not wait for anchor publication.
3. The expected-truth anchor is an asynchronous independent completeness control.
4. Anchor publication must be monotonic and within a finite, numeric `ANCHOR_MAX_PUBLICATION_LAG` approved before implementation.
5. A missed publication deadline triggers high-severity alert/escalation and the pre-approved degraded/fail-closed acceptance mode before further unanchored exposure exceeds the approved bound.
6. On rollback, only the last independently verified anchor establishes completeness. All later committed positions form an uncovered committed interval unless separately established by an approved independent source.
7. Every uncovered committed position is excluded from FULL-L/C/D/O/A. The result must enumerate the interval and be PARTIAL/UNAVAILABLE or use the prescribed limited statement.
8. A post-disaster anchor generated solely from recovered Spanner, recovered manifests, mutable logs or operator output is circular and cannot establish prior completeness.
9. The approved lag must be reconciled with the numeric RPO and threat model. A stricter RPO requires a tighter publication bound or another independently proven mechanism.

### 3.2 Regression coverage

F-03 now defines:
- F03-ANCHOR-03: uncovered committed interval after rollback; prohibit all FULL profiles from including it; preserve distinction between committed history and proven completeness.
- F03-ANCHOR-04: delayed publication within bound; projection-gated client success proceeds without anchor wait; completeness watermark remains at last published anchor.
- F03-ANCHOR-05: publication bound breach; alert/escalation, evidence preservation and approved degraded/fail-closed behavior.
- F03-ANCHOR-06: rollback behind a committed head with only prefix anchor coverage; enumerate uncovered tail and reject FULL.
- F03-ANCHOR-07: reject post-disaster self-anchoring from recovered/rolled-back sources.

Core migration plan §22.3 maps these tests to existing core test IDs where available and explicitly identifies new F-03-only tests. Traceability §12.3 binds each requirement to tests, evidence and fail-closed outcomes. Tests are DEFINED / NOT RUN.

### 3.3 Remaining implementation gates under AUD-XD-06

The policy choice is accepted, but implementation remains blocked until the signed parameter/trust register defines:
- finite numeric `ANCHOR_MAX_PUBLICATION_LAG`;
- trusted measurement clock and exact deadline semantics;
- breach alert threshold, escalation owner and degraded/stop-accepting behavior;
- whether expected-truth anchor is the same as, separate from, or composite with the core checkpoint anchor;
- legal owner, writer, trust root, administrative boundary and recovery path;
- required independent source/provider count and criteria, set by threat model rather than invented here;
- retention and RPO/RTO alignment;
- actual publisher behavior and independent operational evidence.

Therefore AUD-XD-06 is **POLICY RESOLVED / IMPLEMENTATION BLOCKED / NOT DEMONSTRATED**. The policy choice is not to be reopened absent a new versioned architecture decision.

## 4. Other finding dispositions

| Finding | Current disposition |
|---|---|
| AUD-XD-01 | Documentary correction applied; runtime behavior not tested |
| AUD-XD-02 | Documentary correction applied; provider authority not tested |
| AUD-XD-03 | Unqualified FULL superseded; profile-qualified semantics retained |
| AUD-XD-04 | Exact R03 receipt representation in Spanner; recovery not executed |
| AUD-XD-05 | R01–R30 crosswalk exists; independent validation still pending |
| AUD-XD-06 | Option 2 policy ACCEPTED; implementation parameters and evidence OPEN |
| AUD-XD-07 | OPEN — R06 payload placement, key binding, lawful erasure/tombstones |
| AUD-XD-08 | O-01–O-08 tests defined; NOT RUN |
| AUD-XD-09 | Version provenance corrected |
| AUD-XD-10 | Stale topology text marked historical/superseded |
| AUD-XD-11 | Profile and RPO/RTO traceability added; execution NOT RUN |

## 5. Regression test acceptance criteria

Before the new anchor regression suite can PASS, the signed parameter register must supply a finite numeric `ANCHOR_MAX_PUBLICATION_LAG`, trusted measurement clock, publication deadline semantics, alert/escalation owner, fail-closed acceptance behavior and numeric RPO/RTO. Missing any required parameter is BLOCKED / NOT RUN; tests must not guess a default.

The test fixtures must cover:
- commit and projection success before anchor publication but within the bound;
- publication exactly at the deadline;
- publication after the deadline;
- delayed or failed publisher and fail-closed mode;
- stale/replayed/conflicting/compromised anchors;
- rollback after committed but unanchored tail;
- exact tail enumeration and exclusion from each FULL profile;
- attempted post-disaster self-anchor;
- later independently proven catch-up without rewriting the historical recovery record.

## 6. Remaining blockers and reviewer readiness

1. AUD-XD-06 policy is ready for targeted independent review; numeric/trust/operational implementation parameters remain blocked.
2. AUD-XD-07 requires a separate explicit architecture/privacy/legal decision.
3. R01–R30/AR/core-test mappings remain PROPOSED / PROVISIONAL until independently validated.
4. All F-03 regression and operational tests remain NOT RUN.
5. No provider-backed anchor or recovery evidence exists.

**Reviewer reassessment recommendation:** A targeted reviewer reassessment may now examine whether the accepted Option 2 policy is faithfully and consistently specified across F-03, traceability and tests. Do not request an overall ICW v4.2 acceptance review or treat F-03 as ready for closure until AUD-XD-06 implementation parameters, AUD-XD-07, crosswalk validation and actual test evidence are resolved.

## 7. Governance

- Audit 03 is documentary only.
- F-01 through F-04 remain OPEN / NOT DEMONSTRATED.
- Overall disposition remains HOLD — NOT ACCEPTED.
- No provider provisioning, procurement, infrastructure spend, implementation, migration, ingestion, deployment, live recovery exercise, production authorization or PR merge is authorized.
- PR #34 remains OPEN / DRAFT / UNMERGED.
