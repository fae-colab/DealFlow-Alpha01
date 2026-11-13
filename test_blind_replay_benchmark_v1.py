import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
BENCHMARK = ROOT / "validation" / "blind_replay_v1"
CASES_PATH = BENCHMARK / "cases.json"


class BlindReplayBenchmarkV1Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(CASES_PATH.read_text(encoding="utf-8"))
        cls.cases = cls.data["cases"]

    def test_benchmark_is_frozen_synthetic_input_only(self):
        self.assertEqual(self.data["benchmark_id"], "DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1")
        self.assertEqual(self.data["status"], "FROZEN_INPUTS_AND_KEY_COMMITTED_NOT_RUN")
        self.assertEqual(self.data["case_type"], "synthetic_fixture")
        self.assertEqual(self.data["count"], 18)
        self.assertEqual(len(self.cases), 18)
        self.assertTrue(all(c["case_type"] == "synthetic_fixture" for c in self.cases))
        self.assertIn("not real agent situations", self.data["warning"])

    def test_case_and_action_ids_are_unique_and_well_formed(self):
        case_ids = [c["case_id"] for c in self.cases]
        self.assertEqual(len(case_ids), len(set(case_ids)))
        self.assertEqual(set(case_ids), {f"BR-{i:03d}" for i in range(1, 19)})
        for case in self.cases:
            self.assertIsInstance(case["actions"], list)
            self.assertLessEqual(len(case["actions"]), 20)
            action_ids = [a["id"] for a in case["actions"]]
            self.assertEqual(len(action_ids), len(set(action_ids)), case["case_id"])
            for action in case["actions"]:
                for field in ("id", "opportunityId", "name", "action", "pWith",
                              "pWithout", "effort", "deadline", "evidenceStatus",
                              "evidenceNote"):
                    self.assertIn(field, action, (case["case_id"], field))
                self.assertIn(action["evidenceStatus"],
                              {"unverified", "user_reported", "documented", "verified"})
                self.assertIn("Synthetic", action["evidenceNote"])

    def test_expected_answers_are_not_in_public_case_inputs(self):
        forbidden = {"expected_decision", "expected_selected_action_ids",
                     "expected_outcome", "gold_label", "answer_key"}
        for case in self.cases:
            self.assertFalse(forbidden.intersection(case))
        self.assertFalse((BENCHMARK / "expected_outcomes.json").exists())
        commitment = (BENCHMARK / "EXPECTED_OUTCOMES_COMMITMENT.md").read_text(encoding="utf-8")
        self.assertRegex(commitment, r"[0-9a-f]{64}")
        self.assertIn("not committed to this public repository", commitment)

    def test_adversarial_conditions_are_present(self):
        by_id = {c["case_id"]: c for c in self.cases}
        self.assertIsNone(by_id["BR-004"]["capacity_hours"])
        self.assertEqual(by_id["BR-003"]["actions"][0]["evidenceUpdatedAt"], "2025-01-01")
        self.assertTrue(by_id["BR-006"]["actions"][1]["dependency"])
        self.assertTrue(by_id["BR-007"]["actions"][1]["dependency"])
        self.assertEqual(by_id["BR-008"]["actions"][0]["opportunityId"],
                         by_id["BR-008"]["actions"][1]["opportunityId"])
        self.assertEqual(by_id["BR-012"]["actions"][0]["commission"], None)
        self.assertEqual(by_id["BR-018"]["actions"][0]["pWith"], 120)
        self.assertTrue(all(a["evidenceStatus"] == "unverified"
                            for a in by_id["BR-016"]["actions"]))

    def test_only_synthetic_fixture_inputs_are_stored(self):
        serialized = CASES_PATH.read_text(encoding="utf-8").lower()
        for marker in ("client_name", "phone_number", "email_address",
                       "whatsapp", "passport_number", "unit_number",
                       "crm_export", "real_agent_name"):
            self.assertNotIn(marker, serialized)
        self.assertTrue(all(c["case_type"] != "anonymized_agent_case"
                            for c in self.cases))


if __name__ == "__main__":
    unittest.main()
