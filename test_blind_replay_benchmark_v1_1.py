import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).parent
BENCHMARK = ROOT / "validation" / "blind_replay_v1_1"
CASES = BENCHMARK / "cases.json"
SEALED = BENCHMARK / "sealed_expected_outcomes.aesgcm.json"
COMMITMENT = BENCHMARK / "EXPECTED_OUTCOMES_COMMITMENT.md"

def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}".encode("ascii") + b"\0"
    return hashlib.sha1(header + data).hexdigest()

class BlindReplayV11IntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cases_raw = CASES.read_bytes()
        cls.sealed_raw = SEALED.read_bytes()
        cls.cases = json.loads(cls.cases_raw)
        cls.sealed = json.loads(cls.sealed_raw)
        cls.commitment = COMMITMENT.read_text(encoding="utf-8")

    def test_version_and_synthetic_case_set(self):
        self.assertEqual(self.cases["schema_version"], "1.1")
        self.assertEqual(self.cases["benchmark_id"], "DEALFLOW-ALPHA-01.5-BLIND-REPLAY-V1.1")
        self.assertEqual(self.cases["status"], "SEALED_KEY_AND_INPUTS_FROZEN_NOT_RUN")
        self.assertEqual(self.cases["count"], 18)
        self.assertEqual(len(self.cases["cases"]), 18)
        self.assertTrue(all(c["case_type"] == "synthetic_fixture" for c in self.cases["cases"]))
        self.assertEqual([c["case_id"] for c in self.cases["cases"]],
                         [f"BR-{i:03d}" for i in range(1, 19)])

    def test_no_expected_answers_leak_into_public_inputs(self):
        forbidden = {"expected_decision", "expected_selected_action_ids",
                     "expected_outcome", "gold_label", "answer_key"}
        for case in self.cases["cases"]:
            self.assertFalse(forbidden.intersection(case))

    def test_sealed_key_is_encrypted_and_version_bound(self):
        self.assertEqual(hashlib.sha256(self.sealed_raw).hexdigest(), "3cacd2f6158cee5c8d55046c5d37d966d5785ca9eebc00b91b8b0a96ae2d1ff9")
        self.assertEqual(self.sealed["format"], "AES-256-GCM")
        self.assertEqual(self.sealed["compression"], "zlib")
        self.assertEqual(self.sealed["benchmark_id"], self.cases["benchmark_id"])
        self.assertNotIn("key", self.sealed)
        self.assertNotIn("expected_outcomes", self.sealed)

    def test_git_blob_commitments_match(self):
        self.assertIn(git_blob_sha(self.cases_raw), self.commitment)
        self.assertIn(git_blob_sha(self.sealed_raw), self.commitment)

    def test_answer_key_plaintext_digest_is_committed_but_not_exposed(self):
        digest = self.sealed["plaintext_sha256"]
        self.assertRegex(digest, r"^[0-9a-f]{64}$")
        self.assertIn(digest, self.commitment)
        self.assertNotIn("expected_selected_action_ids", self.commitment)

if __name__ == "__main__":
    unittest.main()
