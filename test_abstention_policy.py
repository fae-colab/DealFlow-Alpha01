import copy
import json
import unittest
from pathlib import Path
from validation.abstention_policy import evaluate_case

ROOT = Path(__file__).parent
TEMPLATE = json.loads((ROOT / "validation" / "case_template.json").read_text(encoding="utf-8"))


def complete_case():
    case = copy.deepcopy(TEMPLATE)
    case["capacity_hours"] = 3
    case["candidate_actions"][0].update({
        "net_commission_aed": 20000, "p_close_with_action_pct": 60,
        "p_close_without_action_pct": 35, "effort_minutes": 45,
        "deadline_hours": 8, "confidence_pct": 70, "evidence_status": "documented",
        "evidence_refs": ["SRC-CASE-001"],
        "input_provenance": {k: "agent_reported" for k in (
            "net_commission_aed", "p_close_with_action_pct", "p_close_without_action_pct",
            "effort_minutes", "deadline_hours", "confidence_pct")},
    })
    case["sources"] = [{"source_id": "SRC-CASE-001", "title": "Synthetic validation record",
        "publisher": "DealFlow test harness", "source_type": "synthetic_fixture",
        "source_url": "https://example.invalid/synthetic-test-record", "accessed_at": "2026-11-13"}]
    return case


class AbstentionPolicyTests(unittest.TestCase):
    def test_complete_positive_action_passes_to_optimizer(self):
        result = evaluate_case(complete_case())
        self.assertEqual(result["decision"], "READY_FOR_OPTIMIZATION")
        self.assertEqual(result["eligible_action_ids"], ["ACT-001"])

    def test_unknown_capacity_requires_abstention(self):
        case = complete_case(); case["capacity_hours"] = None
        result = evaluate_case(case)
        self.assertEqual(result["decision"], "ABSTAIN")
        self.assertTrue(any("capacity_hours" in reason for reason in result["reasons"]))

    def test_unknown_commission_requires_abstention(self):
        case = complete_case()
        case["candidate_actions"][0]["net_commission_aed"] = None
        case["candidate_actions"][0]["input_provenance"]["net_commission_aed"] = "unknown"
        self.assertEqual(evaluate_case(case)["decision"], "ABSTAIN")

    def test_unverified_evidence_rejects_action(self):
        case = complete_case(); case["candidate_actions"][0]["evidence_status"] = "unverified"
        result = evaluate_case(case)
        self.assertEqual(result["decision"], "ABSTAIN")
        self.assertTrue(any("unverified" in reason for reason in result["reasons"]))

    def test_zero_or_negative_uplift_does_not_produce_recommendation(self):
        for uplift in (0, -10):
            with self.subTest(uplift=uplift):
                case = complete_case()
                case["candidate_actions"][0]["p_close_with_action_pct"] = 35 + uplift
                self.assertEqual(evaluate_case(case)["decision"], "ABSTAIN")

    def test_mixed_case_excludes_weak_action_but_keeps_supported_candidate(self):
        case = complete_case()
        second = copy.deepcopy(case["candidate_actions"][0])
        second.update({"action_id": "ACT-002", "opportunity_id": "OPP-002", "evidence_status": "unverified"})
        case["candidate_actions"].append(second)
        result = evaluate_case(case)
        self.assertEqual(result["decision"], "READY_FOR_OPTIMIZATION")
        self.assertEqual(result["eligible_action_ids"], ["ACT-001"])
        self.assertTrue(any("ACT-002" in reason for reason in result["reasons"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
