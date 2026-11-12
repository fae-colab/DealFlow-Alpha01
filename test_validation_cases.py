import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
TEMPLATE = ROOT / "validation" / "case_template.json"
PUBLIC_CASE = ROOT / "validation" / "casebook" / "DF-PUBLIC-001.json"
BANNED_KEYS = {
    "client_name", "customer_name", "owner_name", "agent_name", "full_name",
    "email", "phone", "mobile", "whatsapp", "address", "street_address",
    "unit_number", "passport", "national_id", "emirates_id",
    "transaction_number", "listing_reference", "crm_record_id",
}
CASE_TYPES = {"anonymized_agent_case", "public_reconstruction", "synthetic_fixture"}
EVIDENCE = {"unverified", "user_reported", "documented", "verified"}
NUMERIC_FIELDS = {
    "net_commission_aed": (0, 1_000_000_000),
    "p_close_with_action_pct": (0, 100),
    "p_close_without_action_pct": (0, 100),
    "effort_minutes": (1, 10080),
    "deadline_hours": (0, 8760),
    "confidence_pct": (0, 100),
}
FIELD_PROVENANCE = {"public_source", "agent_reported", "assumption", "unknown"}


def validate_engine_readiness(case):
    """A valid evidence record may intentionally be unsuitable for optimizer replay."""
    errors = []
    capacity = case.get("capacity_hours")
    if not isinstance(capacity, (int, float)) or isinstance(capacity, bool) or not 0 < capacity <= 24:
        errors.append("capacity_hours is unknown or invalid; optimizer replay is blocked.")
    for index, action in enumerate(case.get("candidate_actions", [])):
        for key in NUMERIC_FIELDS:
            value = action.get(key)
            if not isinstance(value, (int, float)) or isinstance(value, bool):
                errors.append(f"candidate_actions[{index}].{key} is unknown; optimizer replay is blocked.")
    return errors


def validate_case(case):
    errors = []
    if not isinstance(case, dict):
        return ["Case must be a JSON object."]

    def inspect_keys(value, path="$"):
        if isinstance(value, dict):
            for key, child in value.items():
                if key.lower() in BANNED_KEYS:
                    errors.append(f"{path}: identifying field '{key}' is not allowed.")
                inspect_keys(child, f"{path}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                inspect_keys(child, f"{path}[{index}]")

    inspect_keys(case)
    for key in ("schema_version", "case_id", "case_type", "agent_alias", "market", "as_of"):
        if not isinstance(case.get(key), str) or not case[key].strip():
            errors.append(f"{key} must be non-empty text.")
    case_type = case.get("case_type")
    if case_type not in CASE_TYPES:
        errors.append("case_type must identify agent, public, or synthetic provenance.")
    if case_type == "anonymized_agent_case" and case.get("consent_status") != "explicit_agent_consent":
        errors.append("Agent-originated cases require explicit_agent_consent.")
    if case_type == "public_reconstruction" and case.get("consent_status") != "not_required_public":
        errors.append("Public reconstructions must use not_required_public consent status.")

    capacity = case.get("capacity_hours")
    if capacity is None and case_type == "public_reconstruction":
        if case.get("capacity_status") != "unknown":
            errors.append("Unknown public capacity must be explicitly marked capacity_status=unknown.")
    elif not isinstance(capacity, (int, float)) or isinstance(capacity, bool) or not 0 < capacity <= 24:
        errors.append("capacity_hours must be greater than 0 and no more than 24, or explicitly unknown for public cases.")
    if case.get("commission_value_basis") not in {"exact", "rounded", "banded", "unknown"}:
        errors.append("commission_value_basis must be exact, rounded, banded, or unknown.")

    actions = case.get("candidate_actions")
    if not isinstance(actions, list) or not actions or len(actions) > 20:
        errors.append("candidate_actions must contain between 1 and 20 actions.")
        actions = []
    ids = set()
    for index, action in enumerate(actions):
        prefix = f"candidate_actions[{index}]"
        if not isinstance(action, dict):
            errors.append(f"{prefix} must be an object.")
            continue
        action_id = action.get("action_id")
        if not isinstance(action_id, str) or not action_id.strip():
            errors.append(f"{prefix}.action_id must be non-empty text.")
        elif action_id in ids:
            errors.append(f"duplicate action_id: {action_id}.")
        else:
            ids.add(action_id)
        for key in ("opportunity_id", "opportunity_type", "action_description", "area"):
            if not isinstance(action.get(key), str) or not action[key].strip():
                errors.append(f"{prefix}.{key} must be non-empty text.")

        provenance = action.get("input_provenance", {})
        if case_type in {"public_reconstruction", "anonymized_agent_case"} and not isinstance(provenance, dict):
            errors.append(f"{prefix}.input_provenance must be an object.")
            provenance = {}
        for key, (low, high) in NUMERIC_FIELDS.items():
            value = action.get(key)
            if value is None and case_type == "public_reconstruction":
                if provenance.get(key) != "unknown":
                    errors.append(f"{prefix}.{key} is null but its provenance is not unknown.")
            elif not isinstance(value, (int, float)) or isinstance(value, bool) or not low <= value <= high:
                errors.append(f"{prefix}.{key} must be numeric in [{low}, {high}] or explicitly unknown for public cases.")
            elif case_type in {"public_reconstruction", "anonymized_agent_case"}:
                status = provenance.get(key)
                if status not in FIELD_PROVENANCE - {"unknown"}:
                    errors.append(f"{prefix}.{key} has a value but lacks valid field provenance.")
                if status == "assumption" and not action.get("assumption_notes"):
                    errors.append(f"{prefix}.{key} is an assumption but assumption_notes are missing.")

        if action.get("evidence_status") not in EVIDENCE:
            errors.append(f"{prefix}.evidence_status is invalid.")
        if not isinstance(action.get("evidence_refs"), list):
            errors.append(f"{prefix}.evidence_refs must be a list.")
        dependency = action.get("dependency_action_id")
        if dependency is not None and not isinstance(dependency, str):
            errors.append(f"{prefix}.dependency_action_id must be text or null.")
        if isinstance(dependency, str) and dependency and dependency not in ids:
            # Resolve after all IDs have been collected below.
            pass

    completed = case.get("completed_action_ids", [])
    if not isinstance(completed, list):
        errors.append("completed_action_ids must be a list.")
        completed = []
    for index, action in enumerate(actions):
        if isinstance(action, dict):
            dependency = action.get("dependency_action_id")
            if dependency and dependency not in ids and dependency not in completed:
                errors.append(f"candidate_actions[{index}].dependency_action_id references an unknown action.")

    baseline = case.get("agent_baseline")
    if case_type == "public_reconstruction":
        if not isinstance(baseline, dict) or baseline.get("status") != "not_available_public_reconstruction":
            errors.append("Public reconstructions must explicitly mark the agent baseline as unavailable.")
    elif not isinstance(baseline, dict):
        errors.append("agent_baseline is required.")
    else:
        if baseline.get("recorded_before_dealflow") is not True:
            errors.append("agent baseline must be recorded before DealFlow is revealed.")
        if not isinstance(baseline.get("selected_action_ids"), list):
            errors.append("agent_baseline.selected_action_ids must be a list.")
        elif any(action_id not in ids for action_id in baseline["selected_action_ids"]):
            errors.append("agent baseline refers to an unknown action_id.")
    return errors


class ValidationCaseTests(unittest.TestCase):
    def test_template_is_valid_and_explicitly_a_template(self):
        case = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        self.assertEqual(validate_case(case), [])
        self.assertEqual(case["case_type"], "synthetic_fixture")
        self.assertIn("Template only", case["research_notes"])

    def test_real_agent_case_requires_explicit_consent(self):
        case = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        case["case_type"] = "anonymized_agent_case"
        case["consent_status"] = "pending"
        self.assertTrue(any("explicit_agent_consent" in e for e in validate_case(case)))

    def test_identifying_fields_are_rejected(self):
        case = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        case["candidate_actions"][0]["client_name"] = "Real Person"
        self.assertTrue(any("identifying field" in e for e in validate_case(case)))

    def test_missing_values_are_not_silently_filled(self):
        case = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        case["candidate_actions"][0]["p_close_with_action_pct"] = None
        self.assertTrue(any("p_close_with_action_pct" in e for e in validate_case(case)))

    def test_agent_baseline_must_precede_dealflow(self):
        case = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        case["agent_baseline"]["recorded_before_dealflow"] = False
        self.assertTrue(any("before DealFlow" in e for e in validate_case(case)))

    def test_duplicate_action_ids_are_rejected(self):
        case = json.loads(TEMPLATE.read_text(encoding="utf-8"))
        duplicate = dict(case["candidate_actions"][0])
        case["candidate_actions"].append(duplicate)
        self.assertTrue(any("duplicate action_id" in e for e in validate_case(case)))

    def test_public_reconstruction_preserves_unknowns_and_blocks_replay(self):
        case = json.loads(PUBLIC_CASE.read_text(encoding="utf-8"))
        self.assertEqual(validate_case(case), [])
        self.assertTrue(validate_engine_readiness(case))
        self.assertTrue(all(a["net_commission_aed"] is None for a in case["candidate_actions"]))

    def test_public_numeric_guess_requires_explicit_provenance(self):
        case = json.loads(PUBLIC_CASE.read_text(encoding="utf-8"))
        action = case["candidate_actions"][0]
        action["p_close_with_action_pct"] = 60
        action["input_provenance"]["p_close_with_action_pct"] = "unknown"
        self.assertTrue(any("lacks valid field provenance" in e for e in validate_case(case)))

    def test_public_assumption_must_be_labeled_and_explained(self):
        case = json.loads(PUBLIC_CASE.read_text(encoding="utf-8"))
        action = case["candidate_actions"][0]
        action["effort_minutes"] = 30
        action["input_provenance"]["effort_minutes"] = "assumption"
        action["assumption_notes"] = ""
        self.assertTrue(any("assumption_notes" in e for e in validate_case(case)))

    def test_unknown_dependency_is_rejected(self):
        case = json.loads(PUBLIC_CASE.read_text(encoding="utf-8"))
        case["candidate_actions"][0]["dependency_action_id"] = "DOES-NOT-EXIST"
        self.assertTrue(any("unknown action" in e for e in validate_case(case)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
