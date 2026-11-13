# Issue #22 — Decision Desk acceptance contract

## Output contract

A recommendation is emitted only when the input gate accepts at least one action, the exact portfolio optimizer returns a positive feasible portfolio, and neither simple baseline beats the optimizer under the same eligible candidates and capacity.

Every selected opportunity–action pair contains exactly five ordered question/answer sections:

1. What should the agent do?
2. Why this action, and why now?
3. What is the estimated incremental commission, and how was it calculated?
4. What evidence supports the recommendation, and what remains uncertain?
5. Why is this better than the competing actions, or why should DealFlow abstain?

The machine-readable output is versioned as `schemaVersion: "1.0"` and is validated before rendering.

## Economic calculation

For an action with net agent commission (C), close probability with the action (P_w), and close probability without the action (P_0):

- Potential agent commission if closed: (C), entered as the agent's net payout after broker splits and fees (not gross brokerage commission).
- Expected commission with action: (C \times P_w)
- Expected commission without action: (C \times P_0)
- Estimated incremental commission: (C \times (P_w-P_0))

Probabilities are percentages. This is an assumption-based model estimate, not realized income or proof of causal uplift. Portfolio totals retain the engine's unique-opportunity de-duplication rule.

## Evidence and abstention

- `unverified` inputs are assumptions and cannot enter revenue ranking.
- `user_reported` inputs are agent-provided and require a provenance note.
- `documented` / `verified` labels require a source URL and evidence date. Because the UI's status field is user-entered, both are still presented as agent-provided unless an independent verification record exists.
- Missing commission, probability, effort, deadline, or confidence values are not defaulted.
- Unknown capacity blocks the whole portfolio and records the other missing inputs.
- An action is excluded when its own effort/deadline or its prerequisite chain cannot fit the capacity and deadlines.
- If no positive feasible portfolio remains, DealFlow abstains.
- If commission-first or incremental-commission-per-hour beats the optimizer, DealFlow abstains pending investigation.

For each selected action, question 5 compares the chosen portfolio with the best feasible portfolio excluding that action and its dependents, then reports both simple baselines. Excluded candidate actions and their reasons remain visible; non-selection is not described as proof that an action has no value.

## Test coverage

`node test_decision_desk.js` covers:
- a recommendation with all five populated sections and traceable commission arithmetic;
- an actual competing action under a shared capacity limit;
- explicit abstention for unknown capacity, missing commission, unverified evidence, no positive lift, and infeasible deadlines;
- false-abstention protection for supported agent-reported inputs;
- mixed supported/unsupported candidates without silently dropping the unsupported candidate;
- duplicate-opportunity commission de-duplication;
- prerequisite-chain infeasibility;
- abstention when a simple baseline beats DealFlow;
- the public reconstruction `DF-PUBLIC-001`, which must not be ranked because agent-specific capacity and economics are unknown.

All fixtures are synthetic or public reconstructions. No real-agent data is included.

## Release boundary

Passing tests verifies software behavior only. It does not establish recommendation quality, market demand, causal revenue uplift, or commercial value. Do not show these outputs to a real agent until the rendered examples have been reviewed and a consented, anonymized blind replay has been completed.
