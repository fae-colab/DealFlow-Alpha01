# Alpha 01.3 P1.5 — Dubai realtor validation

## Purpose

Test whether DealFlow helps a Dubai/UAE real-estate agent allocate limited attention better than the agent's own plan and simple, credible baselines. This is a decision-quality investigation, not a product launch or a claim of financial impact.

**Important:** the existing eight demo scenarios are synthetic. Do not relabel them as real, anonymized, or agent-validated. A case is only an `anonymized_agent_case` when it originated from a real agent situation and the agent has explicitly consented to its use. Publicly reconstructed situations must be labeled `public_reconstruction`; generated examples remain `synthetic_fixture`.

## Validation stages

### 1. Collect and freeze a decision-time case

Capture the situation as it was known at a specific date/time, before revealing a DealFlow recommendation. Include every material opportunity-action pair competing for the agent's available time—not just the deal that eventually closed.

Record the agent's own priority order and reasons first. This is the baseline. Do not let the agent revise it after seeing DealFlow's output.

### 2. Retrospective blind replay

For each case, give the same frozen inputs and capacity to:
- the agent's recorded plan;
- commission-first baseline;
- expected incremental commission per hour baseline;
- DealFlow optimizer.

Keep assumptions and evidence identical across methods. Check whether each plan is feasible under the same deadlines, dependencies, and capacity. Have an experienced agent review the anonymized case and recommendations without being told which plan came from DealFlow where practical.

Retrospective replay can assess plausibility and decision alignment. It cannot establish that the recommended actions would have caused additional commission.

### 3. Prospective shadow mode

Only after the retrospective review, follow a small number of cases forward with an agent's permission. Record the recommendation before the agent acts, whether it was accepted/rejected/modified, the reason, actual time spent, action completion, and verified outcomes. The agent remains in control; DealFlow does not execute actions.

Do not treat acceptance as proof of quality or a sale after an action as proof of causality.

### 4. Outcome and financial review

Keep these measures separate:
- **Observed:** action completed, time spent, deal status, actual paid agent commission (with source and date).
- **Associated:** a recorded outcome linked to a recommendation snapshot.
- **Incremental attribution:** only when a defensible counterfactual design, evidence reference, and independent reviewer support it.

Never subtract a standalone action estimate from actual paid commission and call the result a prediction error or causal impact. The P1.4 reconciliation rules remain in force.

## Measures to report

- Feasible-plan rate under the shared capacity/deadline/dependency constraints.
- DealFlow vs agent-plan overlap, plus the agent's explanation for disagreements.
- Actions the agent considers urgent or commercially important that DealFlow omitted.
- Recommendation acceptance, rejection, and modification rates (adoption signals only).
- Time required to review and decide.
- Predicted portfolio estimate under the same frozen assumptions (not realized revenue).
- Outcome completeness and evidence quality.
- Actual incremental commission only where attribution is supported.

Report counts and case-level explanations. A small convenience sample is exploratory; do not present it as statistically representative of Dubai agents or the market.

## Privacy and anonymization rules

- Use pseudonymous agent aliases such as `AGENT-01` and generated opportunity/action IDs.
- Remove client names, phone numbers, emails, WhatsApp handles, exact property addresses, unit numbers, listing references, transaction numbers, passport/ID details, and identifying screenshots.
- Use broad areas (for example, Dubai Marina or JVC), not building/unit-level details.
- Round sensitive commission amounts where exact values are not needed; record whether values are exact, rounded, or banded.
- Do not upload CRM exports, raw chats, contracts, identity documents, or unredacted screenshots.
- Keep the re-identification key outside this repository and outside ChatGPT.
- For agent-originated cases, obtain explicit permission for this specific research use. A case with pending consent must not be committed.
- Public source URLs may be retained, but do not include private links or authenticated CRM URLs.

The validator rejects common identifying field names; it is not a PII detector. A human must inspect every case before it is committed.

## Case status and provenance

Allowed case types:
- `anonymized_agent_case`: real agent-originated situation, anonymized, consent recorded.
- `public_reconstruction`: a reconstruction based only on public material; not an actual agent's private workflow.
- `synthetic_fixture`: deliberately invented test data.

Do not blend these categories. Every reported result must state the number of cases in each category and the limitations of each source.

## How to add a case

1. Copy `case_template.json` into this folder with a non-identifying filename such as `case_DF-PILOT-001.json`.
2. Fill in decision-time inputs and the agent's baseline before running DealFlow.
3. Keep missing values null/unknown; never invent probabilities, effort, deadlines, or commission.
4. Run `python -m unittest -v test_validation_cases.py`.
5. Have a human review the case for identifying details and consent before committing it.

No real agent cases are included in this first P1.5 change. The repository currently contains only synthetic demo scenarios. The next data contribution must come from a consenting agent or be clearly labeled as a public reconstruction.
