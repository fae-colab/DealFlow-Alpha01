# Alpha 01.5 — Abstention validation battery

## Purpose

This milestone adds a conservative, executable pre-optimization gate. It tests whether incomplete or unsupported inputs are blocked rather than silently turned into ranked actions.

**This is a validation harness, not production recommendation logic.** `READY_FOR_OPTIMIZATION` means only that at least one candidate passed the minimum gate. The optimizer must still compare feasible opportunity-action pairs under shared capacity, deadlines, dependencies, and duplicate-commission constraints.

## Evidence categories

These rehearsal fixtures are deliberately synthetic. They must not be labeled anonymized agent cases. A genuine `anonymized_agent_case` must originate from a real Dubai realtor situation, have explicit consent, be human-reviewed for anonymization, and be frozen before DealFlow output is revealed.

| Scenario | Expected behavior | Reason |
|---|---|---|
| Complete, documented positive-lift action | READY_FOR_OPTIMIZATION | Capacity, commission, probability with/without action, effort, deadline, confidence, and evidence are present |
| Capacity unknown | ABSTAIN | Portfolio feasibility cannot be established |
| Net commission unknown | ABSTAIN | Expected incremental commission cannot be calculated |
| Evidence explicitly unverified | ABSTAIN for that action | Unsupported candidate must not be promoted |
| Zero or negative estimated probability lift | ABSTAIN for that action | No positive incremental value is supported |
| One supported action plus one unverified action | Keep supported candidate; exclude weak candidate | Avoid both blanket abstention and unsupported promotion |

## Gate semantics

- Missing required case-level inputs cause case-level `ABSTAIN`.
- An action with unverified evidence, non-positive net commission, or non-positive estimated conversion lift is excluded.
- If no action remains, return `ABSTAIN`.
- If at least one remains, return `READY_FOR_OPTIMIZATION`; this is not a promise the optimizer will select it.
- No arbitrary confidence cutoff is introduced. A threshold requires calibration against real cases.
- The gate does not establish that an action causes a sale or incremental commission.

## Test

```bash
python -m unittest -v test_abstention_policy.py test_validation_cases.py
```

## Real-world pilot entry criteria

Capture multiple competing opportunity-action pairs, not just a successful deal. Record the agent's priority order and rationale before revealing DealFlow. Use generated IDs and broad Dubai areas only. Preserve unknowns as null. Never upload raw CRM exports, WhatsApp chats, contracts, identity documents, or exact property/unit addresses.

The first pilot should include both recommendation-eligible and abstention cases. Have an experienced Dubai agent review frozen inputs and output. Keep retrospective blind replay separate from prospective shadow mode. Adoption, rejection, and modification are behavioral signals, not proof of decision quality or causal financial impact.

No real-agent case is included in this battery. The fixtures are synthetic and do not count as field validation.
