import json
import subprocess
import unittest
from python_engine import Action, optimize, validate_portfolio

CASES = [
    {"capacityHours": 2, "actions": [
        {"id":"A0","commission":1000,"pWith":50,"pWithout":40,"effort":40,"deadline":3},
        {"id":"A1","commission":10000,"pWith":80,"pWithout":20,"effort":30,"deadline":1.5,"dependency":"A0"},
        {"id":"A2","commission":10000,"pWith":80,"pWithout":20,"effort":30,"deadline":2}]},
    {"capacityHours": 2, "actions": [
        {"id":"prep","opportunityId":"deal","commission":10000,"pWith":60,"pWithout":20,"effort":30,"deadline":5},
        {"id":"close","opportunityId":"deal","commission":10000,"pWith":90,"pWithout":20,"effort":30,"deadline":5,"dependency":"prep"}]},
    {"capacityHours": 2, "actions": [
        {"id":"setup","opportunityId":"deal","commission":1000,"pWith":30,"pWithout":40,"effort":15,"deadline":3},
        {"id":"close-step","opportunityId":"deal","commission":10000,"pWith":80,"pWithout":20,"effort":30,"deadline":3,"dependency":"setup"}]},
    {"capacityHours": 1, "completedIds":["already-done"], "actions": [
        {"id":"follow-up","opportunityId":"d1","commission":10000,"pWith":80,"pWithout":20,"effort":60,"deadline":1,"dependency":"already-done"}]},
    {"capacityHours": 1, "actions": [
        {"id":"boundary","opportunityId":"d1","commission":10000,"pWith":80,"pWithout":20,"effort":60,"deadline":1},
        {"id":"too-late","opportunityId":"d2","commission":20000,"pWith":90,"pWithout":20,"effort":1,"deadline":0}]},
    {"capacityHours": 1, "actions": [
        {"id":"a","opportunityId":" Deal-X ","commission":10000,"pWith":80,"pWithout":20,"effort":20,"deadline":1},
        {"id":"b","opportunityId":"deal-x","commission":20000,"pWith":70,"pWithout":20,"effort":20,"deadline":1}]},
    {"capacityHours": 2, "actions": [
        {"id":"root","opportunityId":"d1","commission":1000,"pWith":50,"pWithout":40,"effort":20,"deadline":2},
        {"id":"middle","opportunityId":"d1","commission":10000,"pWith":70,"pWithout":20,"effort":20,"deadline":2,"dependency":"root"},
        {"id":"leaf","opportunityId":"d1","commission":10000,"pWith":90,"pWithout":20,"effort":20,"deadline":2,"dependency":"middle"}]}
]

def to_action(a):
    return Action(a["id"], a["commission"], a["pWith"], a["pWithout"],
                  a["effort"], a["deadline"], a.get("dependency"),
                  a.get("opportunityId"))

class CrossEngineParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        proc = subprocess.run(["node", "parity_runner.js"], input=json.dumps(CASES),
                              text=True, capture_output=True, check=True)
        cls.javascript = json.loads(proc.stdout)

    def test_optimizer_value_selection_and_schedule_match(self):
        self.assertEqual(len(self.javascript), len(CASES))
        for i, case in enumerate(CASES):
            with self.subTest(case=i):
                py_actions = [to_action(a) for a in case["actions"]]
                result = optimize(py_actions, case["capacityHours"], set(case.get("completedIds", [])))
                js = self.javascript[i]
                self.assertTrue(js["valid"])
                self.assertAlmostEqual(result["value"], js["value"], places=7)
                self.assertEqual(result["minutes"], js["minutes"])
                self.assertEqual([a.id for a in result["items"]], js["items"])
                self.assertEqual([[x[0], x[1], x[2]] for x in result["schedule"]], js["schedule"])

    def test_opportunity_id_validation_matches(self):
        for bad_id in ("", 17):
            with self.subTest(opportunity_id=bad_id):
                raw = {"id":"x","opportunityId":bad_id,"commission":1000,
                       "pWith":80,"pWithout":20,"effort":10,"deadline":1}
                py_errors = validate_portfolio([to_action(raw)], 1)
                js = subprocess.run(["node","-e",
                    "const E=require('./engine.js');const a=JSON.parse(process.argv[1]);process.stdout.write(JSON.stringify(E.validatePortfolio([a],1)));",
                    json.dumps({"id":"x","name":"Deal","action":"Test","opportunityId":bad_id,
                                "commission":1000,"pWith":80,"pWithout":20,"effort":10,"deadline":1})],
                    text=True,capture_output=True,check=True)
                self.assertEqual(bool(py_errors), bool(json.loads(js.stdout)))

if __name__ == "__main__":
    unittest.main(verbosity=2)
