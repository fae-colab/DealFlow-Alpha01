import json
import unittest
from pathlib import Path

from python_engine import Action, optimize
from test_validation_cases import validate_case, validate_engine_readiness

ROOT = Path(__file__).parent
PUBLIC_CASE = ROOT / "validation" / "casebook" / "DF-PUBLIC-001.json"
STRESS_CASE = ROOT / "validation" / "stress_tests" / "DF-STRESS-001.json"


def load_case(path):
    return json.loads(path.read_text(encoding="utf-8"))


def actions_from_case(case):
    return [
        Action(
            id=item["action_id"],
            commission=item["net_commission_aed"],
            p_with=item["p_close_with_action_pct"],
            p_without=item["p_close_without_action_pct"],
            effort_minutes=item["effort_minutes"],
            deadline_hours=item["deadline_hours"],
            dependency=item.get("dependency_action_id"),
            opportunity_id=item["opportunity_id"],
            confidence=item["confidence_pct"],
            evidence_status=item["evidence_status"],
            evidence_note=item.get("assumption_notes", ""),
        )
        for item in case["candidate_actions"]
    ]


class PublicCasebookBenchmarkTests(unittest.TestCase):
    def test_public_entry_is_valid_but_optimizer_replay_is_blocked(self):
        case = load_case(PUBLIC_CASE)
        self.assertEqual(validate_case(case), [])
        readiness = validate_engine_readiness(case)
        self.assertTrue(readiness)
        self.assertTrue(any("capacity_hours" in error for error in readiness))
        self.assertTrue(any("net_commission_aed" in error for error in readiness))
        self.assertEqual(case["dealflow_evaluation"]["status"], "blocked_missing_agent_specific_inputs")
        for action in case["candidate_actions"]:
            for key in (
                "net_commission_aed", "p_close_with_action_pct",
                "p_close_without_action_pct", "effort_minutes",
                "deadline_hours", "confidence_pct",
            ):
                self.assertIsNone(action[key], f"{action['action_id']}:{key} must remain unknown")
                self.assertEqual(action["input_provenance"][key], "unknown")

    def test_public_entry_does_not_get_numeric_defaults_from_optimizer(self):
        case = load_case(PUBLIC_CASE)
        self.assertTrue(validate_engine_readiness(case))
        # The only supported path is to stop at readiness. Mapping nulls to zero,
        # defaults, or guessed values would turn an evidence gap into fake precision.
        with self.assertRaises((TypeError, ValueError)):
            actions_from_case(case)

    def test_stress_fixture_is_explicitly_synthetic_and_valid(self):
        case = load_case(STRESS_CASE)
        self.assertEqual(case["case_type"], "synthetic_fixture")
        self.assertEqual(case["public_context"]["linked_public_case_id"], "DF-PUBLIC-001")
        self.assertIn("all numeric inputs are synthetic assumptions", case["public_context"]["boundary"].lower())
        self.assertEqual(validate_case(case), [])
        self.assertEqual(validate_engine_readiness(case), [])

    def test_optimizer_selects_feasible_best_portfolio_without_double_counting(self):
        case = load_case(STRESS_CASE)
        result = optimize(actions_from_case(case), case["capacity_hours"])
        self.assertAlmostEqual(result["value"], 14100.0)
        self.assertEqual({item.id for item in result["items"]}, {"ST-ACT-001", "ST-ACT-002", "ST-ACT-003"})
        self.assertEqual(result["minutes"], 135)
        self.assertEqual(
            [item[0] for item in result["schedule"]],
            ["ST-ACT-001", "ST-ACT-002", "ST-ACT-003"],
        )
        # The two JVC actions represent one opportunity. Their expected lift is
        # 9,600 AED, not 6,000 + 9,600 AED.
        self.assertAlmostEqual(result["value"], 9600 + 4500)


if __name__ == "__main__":
    unittest.main(verbosity=2)
