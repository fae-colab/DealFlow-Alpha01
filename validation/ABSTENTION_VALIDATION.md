# Alpha 01.5 — Abstention validation battery

## Why this exists

P1.5 established the intake and validation protocol. This milestone adds a conservative, executable pre-optimization gate so that missing or unsupported inputs cannot silently become a ranked action.

**This is a test harness, not production recommendation logic.** `READY_FOR_OPTIMIZATION` means only that a case passed the minimum input gate. The production optimizer must still compare all feasible opportunity-action pairs under shared capacity, deadlines, dependencies, and duplicate-commission constraints.

## Evidence categories

Do not call the fixtures below anonymized agent cases. They are deliberately synthetic rehearsal cases. A genuine `anonymized_agent_case` must originate from a real Dubai realtor situation, have explicit consent, be anonymized by a human, and be frozen before DealFlow output is revealed.

| Scenario | Expected behavior | Reason |
|---|---|---|
| Complete, documented positive-lift action | READY_FOR_OPTIMIZATION | Capacity, commission, probability with/without action, effort, deadline, confidence, and evidence are present |
| Capacity unknown | ABSTAIN | Portfolio feasibility cannot be established |
| Net commission unknown | ABSTAIN | Expected incremental commission cannot be calculated |
| Evidence explicitly unverified | ABSTAIN for that action | A weak candidate must not be promoted as an actionable recommendation |
| Zero or negative estimated probability lift | ABSTAIN for that action | No positive incremental commission is supported by the supplied estimate |
| Mixed case: one supported action, one unverified action | Keep supported candidate; exclude weak candidate | Avoid both blanket abstention and unsupported promotion |

## Gate semantics

- Hard missing inputs at case level cause case-level `ABSTAIN`.
- An action with unverified evidence or non-positive estimated incremental value is excluded.
- If no action remains, return `ABSTAIN`.
- If at least one action remains, return `READY_FOR_OPTIMIZATION`; this is **not** a promise that the optimizer will select it.
- No arbitrary confidence-percentage cutoff is introduced in this milestone. Confidence is retained for reviewer interpretation; a threshold requires calibration against real cases.
- This gate does not establish that the action causes a sale or incremental commission.

## Test

Run:

```bash
python -m unittest -v test_abstention_policy.py test_validation_cases.py
```

## Real-world pilot entry criteria

For the first real agent cases, capture multiple competing opportunity-action pairs, not just a successful deal. Record the agent's priority order and rationale before revealing DealFlow. Use generated IDs and broad Dubai areas only. Preserve unknowns as null. Never upload raw CRM exports, WhatsApp chats, contracts, identity documents, or exact property/unit addresses.

The first pilot should include both recommendation-eligible and abstention cases. Have an experienced Dubai agent review the frozen case and the output. Keep retrospective blind replay separate from prospective shadow mode. Record adoption, rejection, and modifications as behavioral signals, not proof of decision quality or causal financial impact.

At present, no real-agent case is included in this battery. The fixtures are synthetic and do not count as field validation.
