# Alpha 01.5 — Real Agent Blind Replay Protocol

## Status and purpose

This protocol governs the first exploratory, retrospective blind-replay pilot with consenting Dubai/UAE real-estate agents. It tests decision quality and evidence discipline—not market size, product-market fit, causal revenue lift, or statistical superiority.

The experiment asks whether DealFlow:
1. identifies material opportunities in the agent's actual decision context;
2. surfaces useful actions the agent did not originally plan;
3. abstains when required evidence or inputs are inadequate; and
4. produces a more defensible feasible priority plan than the agent's recorded plan and simple rules.

The existing public reconstruction and synthetic stress fixture remain separate test classes. Neither counts as a real-agent case.

## Non-negotiable privacy and consent gate

- Obtain explicit, informed consent for this specific research use before collecting a situation. Explain what is captured, how it is anonymized, where it is stored, who can access it, and how withdrawal works.
- Consent evidence and any re-identification key stay outside this repository and outside ChatGPT. A repository case contains only a random case ID, consent status, and a coarse consent date if needed.
- Do not collect or commit names, contact details, client identities, WhatsApp/email text, CRM exports, contracts, identity documents, exact property/unit identifiers, private URLs, or screenshots containing identifiers.
- Generalize areas and dates where exact values could identify a person or transaction. Round or band commission amounts when exact values are unnecessary; declare the value basis.
- The validator is not a PII detector. A human must review every file and its Git diff before commit.
- The agent can withdraw before irreversible aggregation. Remove the case from active analysis and repository history through the agreed process; do not promise that a public Git history can be made secret after exposure.
- Never ask an agent to disclose client-confidential information they are not authorized to share.

A case cannot enter the repository unless the participant has consented and a human reviewer has confirmed de-identification. If either is missing, stop.

## Blindness model: separate artifacts

Use three artifacts with different access timing:

1. **Frozen engine input** — `blind_replay_case_input.json`. Contains the anonymized decision-time opportunity/action set, evidence references, assumptions, capacity and constraints. It MUST NOT contain the agent's original plan, its ranking, later outcomes, or evaluator judgments.
2. **Sealed agent plan** — `sealed_agent_plan_template.json`. Capture the agent's original action choices, ranking, reasons, and confidence before DealFlow is run. Keep this artifact outside the engine-input folder and do not expose it to the DealFlow operator until the run and its immutable recommendation snapshot are locked. Prefer a separate custodian.
3. **Evaluation scorecard** — `blind_replay_scorecard_template.json`. Complete only after the DealFlow run and baseline outputs have been locked. Where practical, use neutral labels (Plan A/B/C/D) and have the agent/reviewer assess them without knowing which is DealFlow.

The templates are schemas/examples only. Never fill them with invented real-agent data.

## Procedure

### A. Recruit and consent
1. Assign a random participant code (for example, `AGENT-01`) with no mapping to identity in the repository.
2. Explain the retrospective nature, data minimization, voluntary participation, withdrawal route, and no client execution.
3. Record consent outside the repository. Mark only `explicit_agent_consent` and a coarse date in the sanitized case.

### B. Choose a decision point and freeze evidence
1. Select a historical decision point with enough contemporaneous records to reconstruct the competing work.
2. Include all material competing opportunity-action pairs, not only the deal that eventually closed.
3. Freeze what was knowable at the decision timestamp. Each material input is sourced or explicitly labeled agent-reported, documented, assumed, or unknown.
4. Exclude later outcomes and hindsight. A later sale, price change, or response must not be used to improve the historical input.
5. Record the agent's capacity and constraints as they were then. If unavailable, leave unknown and expect abstention.

### C. Seal the agent's original plan
1. Before showing any DealFlow result, ask the agent to record their intended actions, priority order, available hours, deadlines, and reasons.
2. Timestamp the sealed plan and compute a SHA-256 digest of the exact file. Store the digest in the case manifest; keep the plan itself sealed.
3. Do not let the DealFlow operator, optimizer, or baseline scripts read the sealed plan.
4. Do not allow post-output edits to the original plan. Corrections must be append-only and explained.

### D. Lock and run DealFlow
1. Validate consent, anonymization, provenance, and case structure.
2. Run the abstention gate first. Record READY or ABSTAIN and every reason.
3. If ready, run the optimizer and save the complete immutable recommendation snapshot, model/version, timestamp, frozen input digest, and capacity.
4. If not ready, do not force a ranking. The abstention itself is the result.
5. Hash and lock the engine input and output artifacts before unsealing the agent plan.

### E. Run baselines on identical information
Run all baselines from the exact same frozen engine input and capacity. Do not give one method extra information.

- **Agent plan:** the sealed plan, checked for feasibility under the frozen constraints.
- **Urgency/deadline-first:** rank feasible actions by documented deadline/urgency; unknown deadlines remain unknown and are not treated as imminent.
- **Expected incremental commission per effort:** rank only when both incremental commission estimate and effort are supported sufficiently to calculate the ratio; disclose tie handling.
- **Expected commission-only greedy:** rank by expected incremental commission, subject to the same dependencies/deadlines/capacity; use only where required inputs exist.
- **DealFlow:** use the locked optimizer output or its explicit abstention.

If a baseline cannot be computed because required inputs are unknown, mark it not computable. Never invent a default to force a comparison.

### F. Unseal, score, and review
1. Reveal the agent plan only after DealFlow and baseline outputs are locked.
2. Compare feasibility, selected actions, order, opportunity coverage, and estimated portfolio value under identical assumptions.
3. Ask the agent to judge whether any newly surfaced action is genuinely useful, feasible, and overlooked. Record the reason, not just yes/no.
4. Where practical, randomize output labels before an independent reviewer assesses action relevance and evidence sufficiency.
5. Record disagreements, omissions, false positives, unsupported recommendations, and missed opportunities caused by abstention.
6. Preserve the scorecard and all corrections append-only.

### G. Outcomes are separate
Later actions and outcomes are recorded separately from the frozen replay. Actual paid commission is observed financial data, not automatically incremental commission caused by DealFlow. Recommendation acceptance is an adoption signal, not proof of decision quality. No causal or realized-lift claim without a credible counterfactual design and independent review.

## Evaluation measures

Report counts and case-level examples, not just averages.

| Dimension | Measures |
|---|---|
| Opportunity identification | Material opportunities captured / judged relevant; material omissions and reasons |
| Overlooked actions | New actions absent from the sealed plan; agent/reviewer usefulness judgment and rationale |
| Abstention | Correct abstentions, unsupported recommendations, false abstentions, and reason coverage |
| Prioritization | Feasibility; selected-action overlap; top-k agreement; ranking differences; portfolio estimate under shared assumptions |
| Baseline comparison | Same-input results for each computable baseline; baseline unavailability reasons |
| Robustness | Recommendation changes under plausible input ranges; unstable rankings; sensitivity to missing fields |
| Practicality | Agent-rated relevance/actionability/trust and time to review; agent modifications/rejections with reasons |

Do not collapse all dimensions into one composite score unless the weights are declared before reviewing results and the raw dimensions remain visible.

## Pilot size and interpretation

Initial recruitment target: 3–5 consenting agents and 3–5 historical decision points per agent, if available. This is a feasibility pilot and convenience sample, not a statistically powered or representative study. Report actual denominators, missing cases, and participant/case selection limitations. Do not claim DealFlow beats Dubai agents, improves commissions, or has market validation based on this sample.

A prospective shadow-mode study requires a separate protocol and consent. DealFlow remains advisory; the agent remains responsible for all actions.

## Stop conditions

Stop and quarantine a case if consent is absent/unclear, identifiers remain, source access is unauthorized, the decision timestamp cannot be established, the original plan was recorded after DealFlow exposure, or the evidence freeze is contaminated by hindsight. Do not repair these defects by guessing.

## Reproducibility checklist

For each replay, preserve:
- random case ID and consent gate result;
- decision timestamp and input source/provenance ledger;
- engine-input file and SHA-256 digest;
- sealed-plan digest and capture timestamp;
- DealFlow version, run timestamp, readiness/abstention reasons, and immutable recommendation snapshot ID;
- baseline implementation/version and outputs;
- scorecard, reviewer identity code, and append-only corrections;
- separate later-outcome references and explicit attribution limitations.

## Current status

No real agent case is included by this protocol's creation. First collect consent, then complete the intake and human anonymization review before adding any case data.
