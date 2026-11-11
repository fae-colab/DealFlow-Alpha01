# Alpha 01.3 — Evidence, Confidence & Outcome Tracking

Status: implementation specification  
Baseline: `migration/alpha-01.2-source` at merge commit `098908160d6fd903ff89f49114bbf14e0c810d7b`  
Working branch: `feature/alpha-01.3-evidence-outcomes`  
Tracking: GitHub issue #10

## 1. Purpose and non-goals

Alpha 01.3 makes the decision process inspectable and preserves what was known when a recommendation was produced. It does not introduce AI prediction, causal attribution, probability calibration, cloud storage, or a backend.

The expected incremental commission calculation remains unchanged:

`net agent commission × (P(close | action) − P(close | no action))`

Confidence and evidence quality are descriptive integrity metadata in this milestone. They do not multiply, discount, or otherwise alter the optimizer's objective.

## 2. Evidence vocabulary

These concepts must not be conflated:

- **Assumption** — an input accepted for scenario analysis but not supported by a recorded source.
- **Estimate** — a quantified judgment or forecast, with its method/basis recorded where possible.
- **Observation** — something reported or recorded as having happened. It may be unverified.
- **Verified fact** — an observation or claim whose source was checked and whose verification details are recorded.

Evidence quality is a separate assessment of support:
- `none`: no supporting evidence recorded.
- `low`: weak, indirect, stale, or uncorroborated support.
- `medium`: relevant and reasonably current source, but not independently corroborated.
- `high`: direct, current, and independently corroborated or authoritative source.

A source URL alone does not make a record verified or high quality. Verification must record who/what checked it and when. Synthetic demo evidence must be explicitly marked synthetic and must never be represented as real-world verification.

## 3. Proposed evidence record

Evidence is attached to a specific subject and claim, not merely to an entire action.

```json
{
  "id": "EV-...",
  "subjectType": "action",
  "subjectId": "DF-01",
  "claimKey": "pWith",
  "claimValue": 58,
  "kind": "estimate",
  "quality": "low",
  "sourceType": "user_input",
  "sourceRef": "",
  "capturedAt": "ISO-8601 timestamp",
  "observedAt": null,
  "verifiedAt": null,
  "verifiedBy": null,
  "note": "Basis for the estimate",
  "isSynthetic": true,
  "supersedesId": null
}
```

Allowed `kind` values: `assumption`, `estimate`, `observation`, `verified_fact`.  
Allowed `sourceType` values: `user_input`, `public_source`, `document`, `system_record`, `third_party_confirmation`, `synthetic_demo`.

Confidence (0–100) remains a separate subjective confidence in the estimate. Evidence quality describes the support; confidence describes the user's confidence in the estimate. They are not interchangeable.

Legacy fields (`evidenceStatus`, `evidenceUrl`, `evidenceUpdatedAt`, `evidenceNote`) must remain readable during migration. Migration must preserve the original values and create a clearly marked legacy evidence record rather than silently upgrading its quality or verification status.

## 4. Outcome event log

Outcome records become append-only events. A repeated submission creates a new event; it must not mutate or delete a prior event.

Minimum event fields:

- `eventId`, `actionId`, `opportunityId`
- `eventType`: `status_update`, `commission_received`, `time_recorded`, or `correction`
- `status`: `completed`, `not_completed`, `lost`, or `pending` when relevant
- `actualCommission`, `currency` (AED for current demo), `actualMinutes`
- `occurredAt`, `recordedAt`
- `sourceType`, `verificationStatus`, `note`
- `supersedesEventId` for a correction/replacement relationship

A correction is a new event that references the event it corrects. The earlier event remains in the audit log. The UI may show a derived current state, but the source event list is immutable.

A transaction's actual commission is an observed transaction outcome. It is not automatically incremental commission caused by a particular action.

## 5. Recommendation snapshots

Each optimization run stores an immutable audit snapshot containing:

- Unique `runId`, `createdAt`, model/schema version.
- Capacity and optimization objective/version.
- Full candidate action inputs used for that run, including assumptions and evidence records.
- Selected action IDs and scheduled order/timing.
- Predicted incremental commission and total effort.
- Selection explanation grounded in the optimizer's actual constraints and objective.
- Exclusion disposition for unselected candidates. Do not invent a specific failure reason unless the engine has actually established it.

Editing an action later must not mutate an existing snapshot. A later run creates a new snapshot.

## 6. Reconciliation and attribution rules

The UI may display:
- Predicted incremental commission at recommendation time.
- Actual commission received for the linked opportunity/transaction.
- Actual action time and completion status.
- Verification and attribution status.

These are different measures. The actual transaction commission is not directly comparable to predicted incremental commission unless a valid incremental outcome has been established. Do not show a simple variance or label the difference as DealFlow-generated value by default.

A separate `actualIncrementalCommission` may be recorded only when supported by a documented comparison/counterfactual method. Otherwise it remains unknown. Association is not causation.

## 7. Local persistence and compatibility

- Keep the app local-first; no API, account, or backend.
- Introduce a versioned state migration from Alpha 01.2.
- Preserve existing action IDs, assumptions, history, and outcome information.
- Preserve imported legacy outcome records as historical legacy events; do not discard them.
- Export/import must round-trip new evidence, event, and recommendation records.
- Malformed imports must fail without partially replacing the current local state.
- Reset demo data must explicitly reset all local demo evidence, outcomes, and recommendation history.

## 8. Test gates

- Existing Python, JavaScript, and cross-engine P0 tests remain green.
- Evidence enum/field validation and legacy migration tests.
- Distinct confidence versus evidence-quality tests.
- Append-only outcome and correction/supersession tests.
- Recommendation snapshot immutability and export/import round-trip tests.
- Reconciliation tests proving actual commission is not mislabeled as incremental or causal value.
- UI syntax checks and CI execution on this feature branch.

## 9. Implementation order

1. Implement shared schema vocabulary and deterministic migration helpers.
2. Add evidence record editing/display and validation.
3. Convert outcome writes to append-only events with derived current state.
4. Persist immutable recommendation snapshots and audit explanations.
5. Add opportunity-level outcome reconciliation with explicit attribution limits.
6. Update documentation, fixtures, and CI tests.

Do not change the P0 optimization objective or introduce confidence-weighted optimization in this milestone.
