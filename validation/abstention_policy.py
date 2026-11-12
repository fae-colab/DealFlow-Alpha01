"""Conservative pre-optimization gate for validation fixtures.

This is a validation harness, not production recommendation logic. A PASS means
that an action may be sent to the optimizer; it does not mean the action wins.
"""
from __future__ import annotations

import math
from typing import Any

from test_validation_cases import NUMERIC_FIELDS, validate_case


def evaluate_case(case: dict[str, Any]) -> dict[str, Any]:
    """Return READY_FOR_OPTIMIZATION or ABSTAIN with explicit reasons."""
    errors = validate_case(case)
    if errors:
        return {"decision": "ABSTAIN", "eligible_action_ids": [], "reasons": errors}

    capacity = case.get("capacity_hours")
    if (not isinstance(capacity, (int, float)) or isinstance(capacity, bool)
            or not math.isfinite(capacity) or not 0 < capacity <= 24):
        return {
            "decision": "ABSTAIN",
            "eligible_action_ids": [],
            "reasons": ["Available working capacity is unknown or invalid; portfolio optimization is blocked."],
        }

    eligible, rejected = [], []
    for action in case["candidate_actions"]:
        action_id = action["action_id"]
        missing = [
            field for field, (low, high) in NUMERIC_FIELDS.items()
            if (not isinstance(action.get(field), (int, float))
                or isinstance(action.get(field), bool)
                or not math.isfinite(action[field])
                or not low <= action[field] <= high)
        ]
        if missing:
            rejected.append(f"{action_id}: required numeric inputs are unknown or invalid: {', '.join(missing)}.")
            continue
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
        return {
            "decision": "ABSTAIN",
            "eligible_action_ids": [],
            "reasons": rejected or ["No candidate action passed the conservative gate."],
        }
    return {
        "decision": "READY_FOR_OPTIMIZATION",
        "eligible_action_ids": eligible,
        "reasons": rejected,
    }
