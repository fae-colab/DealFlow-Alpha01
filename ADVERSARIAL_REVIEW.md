# Adversarial evidence eligibility review — v1

**Scope:** static control-flow review of `decision_desk.js`, `evidence_model.js`, and `test_evidence_adversarial.js` on `test/adversarial-evidence-eligibility-v1`.

**Implementation status:** frozen. No production implementation changes are included in this review.

**Execution status:** not yet independently executed. The GitHub workflow-run lookup available to this review returned no run for the branch commit, and direct local checkout was unavailable. Findings below are therefore classified as code-path-confirmed or policy-dependent, not represented as a completed test run.

## 1. Confirmed defects from code inspection

| ID | Area | Current behavior in code | Required regression expectation |
|---|---|---|---|
| DEF-A | Multiple records / missing observation | `evaluateClaim` returns immediately when it encounters a supportive record with a missing/invalid observation timestamp. A separate valid record cannot rescue the claim, making result order-sensitive. | Evaluate records independently; a defective supportive record must not mask a separate valid record. |
| DEF-B | Multiple records / stale record | `evaluateClaim` returns immediately when it encounters stale supportive evidence. A separate fresh valid record cannot rescue the claim. | Evaluate records independently; stale evidence must not mask a separate fresh valid record. |
| DEF-C | Contradictory evidence | Records whose relation is `contradicts` are skipped; if any supportive record is usable, the claim passes. | Implement an explicit conflict-resolution rule; do not silently ignore material contradictions. |
| DEF-E | Expiry boundary | Expiry is rejected only when `validUntil < asOf`. Evidence at exactly `validUntil === asOf` is still treated as usable. | If expiry is exclusive, reject when `validUntil <= asOf`. |
| DEF-F1 | Source provenance | Source-backed status is inferred only from presence of `sourceReference`; a source-backed `sourceType` with a missing reference is treated like an agent report. | Define source types that require a reference and source-check timestamp; enforce both. |
| DEF-F2 | Future source-check timestamp | A parseable `sourceCheckedAt` is accepted without checking whether it is later than evaluation time. | Reject future source-check timestamps. |
| DEF-F3 | Source-check chronology | No consistency rule compares source-check time with observation time. | Define and enforce chronology; see policy decisions below. |
| DEF-G1 | Future recorded timestamp | `recordedAt` is parsed but never checked against evaluation time. | Reject future recording timestamps. |
| DEF-G2 | Future nonvolatile observation | Nonvolatile observations are parsed but not checked against evaluation time. | Reject future observation timestamps across all evidence categories. |
| DEF-G3 | Future historical event | Historical event timestamps are checked for parseability but not whether the event lies in the future. | Reject future historical-event timestamps. |
| DEF-H1 | Impossible calendar date | The timestamp parser relies on `Date.parse`; it does not round-trip calendar components, so dates such as February 30 can normalize instead of being rejected. | Strictly validate calendar and clock components before accepting timestamps. |
| DEF-I3 | Duplicate evidence IDs | No duplicate-ID validation occurs before records are evaluated. Duplicate records can be counted as separate evidence. | Reject or quarantine duplicate IDs deterministically. |

## 2. Policy decisions required before implementation

1. **Contradiction precedence:** Does any current, material, claim-matched contradiction force abstention, or can a newer/more authoritative supporting record supersede it? Define authority, freshness, materiality, and tie handling.
2. **Record-local invalidity:** Should missing, stale, malformed, or incomplete records be quarantined individually while another valid record can support the claim? This is the behavior implied by A/B. Define exceptions for duplicate IDs and unresolved contradictions.
3. **Expiry semantics:** Adopt an explicit boundary rule. Proposed default: `validUntil` is exclusive, so the record is expired at or after that instant.
4. **Evidence lifecycle:** Define allowed states and transitions for active, superseded, revoked, withdrawn, and expired records. A retired record should not silently be treated as current evidence; preserve it for audit.
5. **Source-type requirements:** Define which source types require `sourceReference` and `sourceCheckedAt`. An agent report should not be forced into portal-source rules, and a portal record must not bypass them by omitting its reference.
6. **Timestamp semantics:** Define what `observedAt`, `recordedAt`, and `sourceCheckedAt` mean. Proposed chronology: none may be after evaluation time; `recordedAt` cannot precede the record's observation; for source-backed evidence, `sourceCheckedAt` represents the actual source retrieval/check and must not be future-dated. Whether it must be at or after `observedAt` depends on whether observation means source event time or retrieval time; do not enforce that comparison until the field meaning is fixed.
7. **Historical evidence:** Historical event time is not a freshness timestamp. It may be old, but must be a valid past event date; source verification time is separate.
8. **Duplicate IDs:** Decide whether duplicate IDs with identical payloads are deduplicated or treated as integrity failure; conflicting payloads under one ID should be an integrity failure.
9. **Multi-claim behavior:** Confirm that all required claims must pass, and define deterministic reason selection when multiple claims fail.

## 3. Passed controls by code-path inspection (execution still pending)

- **I1:** A multi-claim bundle stops at the failing claim and the Decision Desk rejects the action.
- **I2:** Reversing the two claims and their records in the supplied fixture yields the same failing claim and reason, because the failing claim is the same in both orderings.
- **Existing five taxonomy fixtures:** The current evaluator's branches appear consistent with the five expected outcomes (stale volatile claim, missing observation timestamp, fresh listing evidence, historical event, and context-only source). These must still be run in CI before being called test-confirmed.

## 4. Test-suite corrections needed before treating the suite as an acceptance gate

- **H2 conflicts with A/B:** H2 currently expects one malformed-expiry supportive record to invalidate a claim even when a separate valid record exists. A/B require invalid or stale records not to mask separate valid evidence. Unless policy explicitly says malformed records poison the whole claim, H2 should assert that the malformed record is rejected/quarantined while the valid record remains sufficient; add a separate malformed-only case that must abstain.
- **C needs a defined contradiction policy:** Its expected `CONFLICTING_EVIDENCE` result is appropriate only after the team defines what makes a contradiction material/current/authoritative.
- **D is currently a conditional skip:** It does not test lifecycle behavior because the model has no lifecycle-state contract. Replace the skip with policy-approved executable cases once lifecycle states are defined.
- **F3 needs field semantics:** The expectation that `sourceCheckedAt` cannot precede `observedAt` is valid only if `observedAt` means observation/retrieval time rather than the underlying event time.
- **Reason-code assertions:** Add explicit cases for malformed-only evidence, expired-only evidence, invalid `recordedAt`, and each future timestamp, so failures cannot collapse into a generic insufficient-evidence result unnoticed.

## 5. Decision

Do not amend `evidence_model.js` or `decision_desk.js` yet. First approve the policy decisions, correct the contradictory/underspecified test expectations, and obtain a real CI execution report. Only then should implementation changes be made on this separate branch and reviewed against the agreed acceptance criteria. No real-agent trial is authorized by this review.
