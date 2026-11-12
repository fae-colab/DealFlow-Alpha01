"""Conservative pre-optimization gate for validation fixtures.

This is a validation harness, not production recommendation logic. A PASS means
that an action may be sent to the optimizer; it does not mean the action wins.
"""
from __future__ import annotations
from typing import Any
from test_validation_cases import validate_engine_readiness


def evaluate_case(case: dict[str, Any]) -> dict[str, Any]:
    """Return READY_FOR_OPTIMIZATION or ABSTAIN with explicit reasons."""
    errors = validate_engine_readiness(case)
    if errors:
        return {"decision": "ABSTAIN", "eligible_action_ids": [], "reasons": errors}
    eligible, rejected = [], []
    for action in case["candidate_actions"]:
        action_id = action["action_id"]
        if action.get("evidence_status") == "unverified":
            rejected.append(f"{action_id}: evidence is unverified.")
            continue
        if action["net_commission_aed"] <= 0:
            rejected.append(f"{action_id}: net commission must be positive.")
            continue
        uplift = action["p_close_with_action_pct"] - action["p_close_without_action_pct"]
        if uplift <= 0:
            rejected.append(f"{action_id}: action has no positive estimated conversion lift.")
            continue
        eligible.append(action_id)
    if not eligible:
        return {"decision": "ABSTAIN", "eligible_action_ids": [], "reasons": rejected or ["No candidate action passed the conservative gate."]}
    return {"decision": "READY_FOR_OPTIMIZATION", "eligible_action_ids": eligible, "reasons": rejected}
