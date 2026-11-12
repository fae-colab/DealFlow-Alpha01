import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parent / "validation"
ENGINE_INPUT = ROOT / "blind_replay_case_input.template.json"
SEALED_PLAN = ROOT / "sealed_agent_plan.template.json"
SCORECARD = ROOT / "blind_replay_scorecard.template.json"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def all_keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            yield key
            yield from all_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from all_keys(child)


class BlindReplayTemplateTests(unittest.TestCase):
    def test_templates_are_valid_json_and_explicitly_templates(self):
        for path in (ENGINE_INPUT, SEALED_PLAN, SCORECARD):
            with self.subTest(path=path.name):
                self.assertTrue(path.exists())
                self.assertIsInstance(load(path), dict)

    def test_engine_input_does_not_expose_agent_plan_or_rankings(self):
        case = load(ENGINE_INPUT)
        keys = set(all_keys(case))
        self.assertNotIn("agent_baseline", keys)
        self.assertNotIn("selected_action_ids", keys)
        self.assertNotIn("priority_order", keys)
        self.assertNotIn("reasons_by_action", keys)
        self.assertEqual(case["consent_status"], "pending_not_eligible_for_repository")
        self.assertEqual(case["dealflow_run"]["status"], "not_run")

    def test_unknown_business_inputs_remain_unknown(self):
        case = load(ENGINE_INPUT)
        required = (
            "net_commission_aed",
            "p_close_with_action_pct",
            "p_close_without_action_pct",
            "effort_minutes",
            "deadline_hours",
            "confidence_pct",
        )
        for action in case["candidate_actions"]:
            for field in required:
                with self.subTest(field=field):
                    self.assertIsNone(action[field])
                    self.assertEqual(action["input_provenance"][field], "unknown")

    def test_agent_plan_is_separate_and_precedes_dealflow(self):
        plan = load(SEALED_PLAN)
        self.assertEqual(plan["artifact_type"], "sealed_agent_plan")
        self.assertIs(plan["recorded_before_dealflow"], True)
        self.assertIn("priority_order", plan)

    def test_scorecard_uses_neutral_labels_without_unblinding_mapping(self):
        scorecard = load(SCORECARD)
        labels = scorecard["output_labels"]["neutral_labels"]
        self.assertEqual(labels, ["PLAN_A", "PLAN_B", "PLAN_C", "PLAN_D"])
        self.assertEqual(
            set(scorecard["output_labels"]),
            {"neutral_labels", "unblinding_key_location", "unblinding_key_sha256"},
        )
        self.assertNotIn("dealflow", json.dumps(scorecard["output_labels"]).lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
