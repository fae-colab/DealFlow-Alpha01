import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
TEMPLATE = ROOT / "validation" / "case_template.json"
BANNED_KEYS = {
    "client_name", "customer_name", "owner_name", "agent_name", "full_name",
    "email", "phone", "mobile", "whatsapp", "address", "street_address",
    "unit_number", "passport", "national_id", "emirates_id",
    "transaction_number", "listing_reference", "crm_record_id",
}
CASE_TYPES = {"anonymized_agent_case", "public_reconstruction", "synthetic_fixture"}
EVIDENCE = {"unverified", "user_reported", "documented", "verified"}


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
    if case.get("case_type") not in CASE_TYPES:
        errors.append("case_type must identify agent, public, or synthetic provenance.")
    if case.get("case_type") == "anonymized_agent_case" and case.get("consent_status") != "explicit_agent_consent":
        errors.append("Agent-originated cases require explicit_agent_consent.")
    if case.get("case_type") == "public_reconstruction" and case.get("consent_status") not in (None, "not_required_public"):
        errors.append("Public reconstructions must use not_required_public consent status.")
    if not isinstance(case.get("capacity_hours"), (int, float)) or isinstance(case.get("capacity_hours"), bool) or not 0 < case["capacity_hours"] <= 24:
        errors.append("capacity_hours must be greater than 0 and no more than 24.")
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
        for key, low, high in (
            ("net_commission_aed", 0, 1_000_000_000),
            ("p_close_with_action_pct", 0, 100),
            ("p_close_without_action_pct", 0, 100),
            ("effort_minutes", 1, 10080),
            ("deadline_hours", 0, 8760),
            ("confidence_pct", 0, 100),
        ):
            value = action.get(key)
            if not isinstance(value, (int, float)) or isinstance(value, bool) or not low <= value <= high:
                errors.append(f"{prefix}.{key} must be numeric in [{low}, {high}].")
        if action.get("evidence_status") not in EVIDENCE:
            errors.append(f"{prefix}.evidence_status is invalid.")
        if not isinstance(action.get("evidence_refs"), list):
            errors.append(f"{prefix}.evidence_refs must be a list.")
        if action.get("dependency_action_id") is not None and not isinstance(action.get("dependency_action_id"), str):
            errors.append(f"{prefix}.dependency_action_id must be text or null.")

    baseline = case.get("agent_baseline")
    if not isinstance(baseline, dict):
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


if __name__ == "__main__":
    unittest.main(verbosity=2)
