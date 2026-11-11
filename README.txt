DEALFLOW ALPHA 01.2 — DECISION ENGINE INTEGRITY UPDATE
=====================================================

WHAT THIS IS
A mobile-friendly browser-based experimental decision prototype with eight
synthetic Dubai real-estate opportunity-action scenarios. It is not a production
product and does not prove market demand, decision superiority, or financial
impact.

HOW TO OPEN
Open index.html in a modern browser, or publish this folder as the repository
root using GitHub Pages. No login, server, paid API, or external AI service is
required.

LOCAL DATA, BACKUP AND PRIVACY
The app stores editable scenarios and outcome observations in browser
localStorage on the current device. Alpha 01.2 migrates existing Alpha 01.1
local data when it is first opened. Use Export backup to save a JSON copy and
Import backup to restore it on this or another browser. Data does not leave the
browser through this prototype. Clearing site/browser data can erase it. Do not
enter real client identifiers, confidential information, or sensitive financial
data.

DECISION CALCULATION AND PROBABILITY SCALE
Both Python and JavaScript engines accept probabilities as percentages from
0 to 100. For each action:
Expected incremental commission = agent net commission x
(P(close WITH action) - P(close WITHOUT action)) / 100.
Probabilities are user-entered assumptions, not AI-generated or calibrated
forecasts. Confidence and evidence metadata are recorded for transparency; they
do not currently alter the calculated commission estimate.

P0 — COMMISSION ACCOUNTING AND DEPENDENCIES
Multiple actions belonging to the same opportunity may now be selected when
prerequisites require a sequence. Positive incremental commission is credited
once per opportunity, using the largest positive action lift among the selected
actions. Negative incremental lift on prerequisite actions remains included as
a cost. This conservative interim rule prevents simply adding overlapping
positive estimates for the same transaction. It is not a full joint-probability
model of interacting interventions; future versions need to estimate combined
outcomes from evidence rather than assume independent lifts.

Action IDs must be unique. Dependencies must point to another action in the
portfolio or an externally completed action ID supplied to the engine. Cycles
and missing prerequisites are rejected. The current UI supports dependencies
within the portfolio but does not yet provide a separate completed-prerequisite
management screen.

P0 — SCHEDULING
The optimizer searches all reachable schedule prefixes, memoized by selected
action set. It branches only to actions whose prerequisites are already
completed or selected, and only when the action can finish within both available
capacity and its deadline. This removes the Alpha 01.1 earliest-deadline-first
false-negative case. The schedule model remains single-agent, sequential,
non-preemptive work, with deadlines measured from the start of the planning
window. It does not model breaks, calendar availability, parallel work, task
splitting, travel, or multiple agents.

The exact state search is bounded by 2^N states. The prototype continues to cap
candidate actions at 20; this is an explicit computational limit, not a claim
that larger portfolios are impossible.

P1 — EVIDENCE AND CONFIDENCE
Each action can store:
- Evidence status: unverified, user_reported, documented, or verified.
- Confidence percentage (0–100).
- Optional evidence URL, update date, and note.

These fields are provenance and review aids, not proof that a claim is true.
A verified label must be assigned only after a human checks the underlying
source. Confidence is not currently used to shrink or inflate expected value.

P1 — OUTCOME TRACKING
The UI maintains one current outcome record per action. Submitting the form for
an action already recorded updates that record instead of silently appending a
duplicate. It captures status, actual agent commission received, and time spent.
This is a practical observation log, not a causal attribution system. A sale
after an action does not prove that the action caused the sale. Credible impact
evaluation requires a pre-defined comparison design, consistent outcome
verification, and enough observations.

P2 — EDITING AND DATA MANAGEMENT
The edit flow now supports changing action ID, opportunity/client name, action
description, opportunity ID, prerequisite, evidence fields, and numeric
assumptions. When an action ID changes, dependent references, outcome records,
and saved history references are updated. Capacity changes invalidate displayed
recommendations so stale results are not presented as current. JSON backup and
restore are available; storage remains local to the browser unless the user
moves a backup manually.

COMPARISON BASELINES
Two simple greedy sanity checks are shown: highest net commission first and
highest estimated incremental commission per hour. They use the same engine
feasibility and commission-accounting rules. They are not representative of
every CRM, commercial product, expert agent, or competing prioritization method.
A win against these baselines does not prove DealFlow is better than the market.

VERIFICATION STATUS
Current automated regression coverage:
- Python: 15 tests.
- JavaScript: 12 tests.
- JavaScript syntax checks for app.js and engine.js.
- Demo output parity target: AED 21,840 estimated incremental commission on
  the included eight-scenario synthetic portfolio with six hours of capacity.

Run:
  python -m unittest -v test_engine.py
  node test_engine.js
  node --check app.js
  node --check engine.js
  python python_engine.py

Passing software tests verifies only that specified cases behave as expected.
It does NOT verify:
- correctness or calibration of probability assumptions;
- that selected actions are better than an experienced agent's decisions;
- superiority to existing commercial tools or competing workflows;
- customer demand, willingness to pay, or product-market fit;
- that recommendations cause additional deals or commission;
- realized financial impact.

CURRENT LIMITATIONS / NEXT GATES
- No live CRM, WhatsApp, calendar, listing, or transaction integrations.
- No AI predictions, probability calibration, uncertainty model, or causal model.
- Positive multi-action lift is handled by a conservative max-credit rule, not
  an evidence-based joint intervention model.
- Opportunity identity depends on user-entered Opportunity IDs.
- No robust multi-agent calendars, availability windows, breaks, parallel work,
  task splitting, or time-varying deadlines.
- Browser storage is local; no cloud synchronization or automatic backup.
- The UI does not yet manage completed prerequisites separately.
- Exact scheduling search remains limited to 20 actions.

NEXT VALIDATION GATE
Test with anonymized real workflows. Compare DealFlow recommendations with
agent judgment and stronger baselines. Record recommendation exposure, whether
an action was followed, evidence quality, time spent, verified commission, and
comparison outcomes. Reject or redesign if evidence does not support the
product hypothesis.

All names, deal scenarios, commissions, probabilities, and deadlines in the
included demo portfolio are synthetic.
