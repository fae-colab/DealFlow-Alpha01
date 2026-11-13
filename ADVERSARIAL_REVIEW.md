# Adversarial evidence eligibility review — v1.1

**Scope:** evidence policy and adversarial acceptance criteria for `decision_desk.js`, `evidence_model.js`, and `test_evidence_adversarial.js` on `test/adversarial-evidence-eligibility-v1`.

**Policy decision:** APPROVED for this validation baseline. These rules are explicit acceptance criteria for this branch; they do not imply that the implementation or tests have passed.

**Implementation status:** production implementation remains frozen pending corrected tests and a complete baseline run.

**Execution status:** not yet independently executed. No test result is represented as passed or failed until a complete Actions/local execution report is available.

## 1. H2 inconsistency resolved

Invalidity is **record-local by default**. A malformed, stale, expired, incomplete, or otherwise unusable record is quarantined individually and cannot mask a separate valid supporting record. Therefore:
- H2 must be split into (a) malformed expiry plus valid support → eligible, and (b) malformed-expiry-only support → abstain with `INVALID_EXPIRY_TIMESTAMP`.
- The same rule applies to missing/invalid observation timestamps and stale records.
- Whole-claim/bundle blocking is reserved for integrity failures (duplicate evidence IDs) and unresolved material contradictions.

This aligns H2 with A/B and prevents a single bad record from poisoning independent good evidence.

## 2. Approved evidence rules

### 2.1 Contradiction precedence

A current, valid, claim-matched, material `contradicts` record blocks eligibility even when valid supporting evidence also exists. Return `CONFLICTING_EVIDENCE` and abstain. Do not automatically let recency, verification level, or a source-type ranking choose a winner: the current schema has no calibrated authority hierarchy, and silently inventing one would turn uncertain evidence into a false certainty.

A contradiction is not current if its record lifecycle is explicitly `superseded`, `revoked`, or `withdrawn`, or if it is expired at evaluation time. Invalid/stale contradiction records are quarantined under the same record-local rule as invalid support. `context_only` and `unassessed` records are neither support nor contradiction. A future policy may permit explicit, auditable supersession links, but no implicit “newest wins” rule is approved.

### 2.2 Record-local invalidity and claim aggregation

Evaluate every matching record independently; never return early merely because one record is defective. Usable support can establish a claim if at least one valid supporting record remains and no unresolved material contradiction exists. If none remains, abstain with the most specific reason supported by the records (for example missing observation, invalid expiry, expired evidence, stale evidence, or insufficient support). Reason selection must be deterministic and independent of input record order.

### 2.3 Evidence lifecycle

Use the lifecycle values:
- `active`: eligible for evaluation, subject to all other rules.
- `superseded`: retained for audit/history; excluded from current support and conflict evaluation.
- `revoked`: withdrawn because its source or validity was invalidated; excluded from current evaluation and must never be silently reactivated.
- `withdrawn`: explicitly retracted by the reporting party; excluded from current evaluation.
- `expired`: derived from `validUntil`; not a manually assigned state.

For legacy v1 records with no `status`, treat status as `active` for compatibility, but new records should state it explicitly. Transitions from active to superseded/revoked/withdrawn are one-way; correction or revalidation creates a new evidence record with a new ID and provenance. Retired records remain auditable but cannot support or contradict the current claim.

### 2.4 Source provenance

Source requirements follow `sourceType`, never the accidental presence/absence of a URL:
- `agent_report`: no external URL or source-check timestamp required; require a non-empty report/support note, reporter attribution where available, `observedAt`, and `recordedAt`. Classify as agent-reported, not independently verified.
- `agent_document`: require a stable document reference (URI or internal document identifier) and `sourceCheckedAt` documenting when the document was actually inspected. This proves inspection, not independent truth.
- External/source-backed types (including `listing_portal`, developer inventory, public registry/land-department record, and transaction/document repository): require both `sourceReference` and `sourceCheckedAt`. Missing either is `MISSING_SOURCE_PROVENANCE`.
- Unknown or unsupported `sourceType` values abstain; do not silently downgrade them to agent reports.
- `verificationLevel` describes the strength of verification and does not waive source requirements. A URL alone does not establish independent verification.

The source-type allowlist should be explicit in code and tests. Extend it only with a deliberate schema/policy change.

### 2.5 Expiry boundary

`validUntil` is an exclusive instant. Evidence is expired when `validUntil <= asOf`; it remains unexpired only while `asOf < validUntil`. Malformed expiry timestamps invalidate that record with `INVALID_EXPIRY_TIMESTAMP`, not the entire claim if separate valid evidence exists.

### 2.6 Timestamp semantics and chronology

All timestamps are strict ISO-8601 date-times with an explicit timezone and valid calendar/clock components; reject impossible dates and normalized values.

- `observedAt`: when this evidence was actually observed/confirmed by the reporter or source. It is the freshness anchor for volatile evidence and is required for all active evidence records.
- `recordedAt`: when the evidence record was entered into DealFlow. It must be valid, not later than `asOf`, and not earlier than `observedAt`.
- `sourceCheckedAt`: when the referenced source/document was actually opened or checked. It is required for source-backed types, must not be later than `asOf`, and must be at or after `observedAt` under this contract (the observation is the fact captured from that check).
- `eventAt`: for historical events (for example a completed transaction), the time the underlying event occurred. It is distinct from `observedAt`; it may be much older, but must be valid and not later than `asOf`. Historical event age is not a freshness measure.
- No timestamp used as evidence provenance or event time may be in the future relative to the evaluation instant. Reject with field-specific reason codes.
- Volatile evidence freshness is calculated from `observedAt`, using the evidence-type policy's `maxAgeMinutes`. Historical event age is not substituted for observation freshness.

The previous overloaded use of `observedAt` as a historical transaction date must be migrated in fixtures to `eventAt`.

### 2.7 Duplicate IDs and multi-claim rules

Evidence IDs are globally unique within one evaluation bundle. Any duplicate ID is an integrity failure and blocks the bundle with `DUPLICATE_EVIDENCE_ID`, even if payloads appear identical; identical duplicates are not silently counted or deduplicated. Conflicting payloads under one ID are also integrity failures.

All required claims must pass. Evaluate the entire bundle, then select failures deterministically (stable claim-ID ordering, then a documented reason priority) so claim/evidence array permutations cannot change the decision or reason. A single failing required claim blocks the action.

## 3. Static code-path findings to verify with executable tests

| ID | Area | Existing behavior identified | Acceptance expectation |
|---|---|---|---|
| DEF-A | Multiple records / missing observation | Early return on one bad record | Quarantine record; independent valid support remains usable |
| DEF-B | Multiple records / stale record | Early return on stale record | Quarantine record; independent fresh support remains usable |
| DEF-C | Contradiction | Contradictions skipped | Active, valid, material contradiction forces abstention |
| DEF-E | Expiry boundary | Equality with `asOf` accepted | `validUntil <= asOf` is expired |
| DEF-F1 | Source provenance | Missing reference can bypass source-backed requirement | Enforce requirements by source-type allowlist |
| DEF-F2 | Future source check | Future `sourceCheckedAt` accepted | Reject future source-check timestamp |
| DEF-F3 | Source-check chronology | No chronology validation | Require `sourceCheckedAt >= observedAt` |
| DEF-G | Future timestamps | Future `recordedAt`, `observedAt`, and historical event time not consistently rejected | Reject all future timestamps with field-specific reasons |
| DEF-H1 | Calendar validity | `Date.parse` may normalize impossible dates | Strict calendar/clock round-trip validation |
| DEF-I3 | Duplicate IDs | Duplicate records can be counted | Bundle-level integrity abstention |

These are static inspection findings, not executed failures.

## 4. Required test corrections and acceptance controls

- Replace old H2 with two cases: malformed expiry alongside valid support remains eligible; malformed-expiry-only evidence abstains with `INVALID_EXPIRY_TIMESTAMP`.
- Replace the conditional lifecycle skip with executable cases for active, superseded, revoked, withdrawn, and expiry-derived status.
- C must test a valid current contradiction and retired/invalid contradiction controls.
- F3 now has a defined meaning and must enforce `sourceCheckedAt >= observedAt`.
- Add explicit tests for source-type allowlist behavior, agent reports without external URLs, source-backed missing reference/check time, strict impossible dates, eventAt vs observedAt, chronology, duplicate IDs, deterministic multi-claim reason selection, and record-order invariance.
- Run both the original five taxonomy cases and the full adversarial suite through `DealFlowDecisionDesk.eligibility` / the actual decision engine. Record command, commit SHA, output, pass/fail/skip counts, and CI run URL.
- After the baseline is recorded, implement fixes only on this branch; rerun the complete suite and independently inspect changed code and test outputs.

## 5. Decision and guardrails

The policy in section 2 is approved as the validation baseline. Correct the adversarial tests to match it, run the complete suite before implementation to establish actual failures and passed controls, then implement only confirmed defects on this branch and repeat the complete suite. Do not merge PR #29, do not modify PR #29, and do not begin a real-agent trial until the post-fix results have been independently reviewed and explicitly approved.
