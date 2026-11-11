import unittest
from python_engine import Action, optimize, validate_portfolio

class P0IntegritySchedulingTests(unittest.TestCase):
    def test_conflicting_commission_assumptions_for_same_opportunity_are_rejected(self):
        actions = [
            Action("viewing", 12000, 70, 30, 30, 5, opportunity_id="deal-42"),
            Action("offer", 15000, 85, 30, 30, 5, opportunity_id="DEAL-42"),
        ]
        self.assertTrue(any("Conflicting commission assumptions" in e for e in validate_portfolio(actions, 2)))
        with self.assertRaises(ValueError):
            optimize(actions, 2)

    def test_consistent_commission_across_action_stages_remains_allowed(self):
        actions = [
            Action("viewing", 12000, 70, 30, 30, 5, opportunity_id="deal-42"),
            Action("offer", 12000, 85, 30, 30, 5, dependency="viewing", opportunity_id="DEAL-42"),
        ]
        self.assertEqual(validate_portfolio(actions, 2), [])
        self.assertAlmostEqual(optimize(actions, 2)["value"], 6600)

    def test_exact_optimizer_finds_feasible_non_greedy_deadline_order(self):
        prep = Action("prep", 1000, 50, 40, 40, 3, opportunity_id="prep-deal")
        urgent = Action("urgent", 10000, 80, 20, 30, 1.5, dependency="prep", opportunity_id="urgent-deal")
        independent = Action("independent", 10000, 80, 20, 30, 2, opportunity_id="independent-deal")
        result = optimize([prep, urgent, independent], 2)
        self.assertEqual([x[0] for x in result["schedule"]], ["prep", "urgent", "independent"])
        self.assertAlmostEqual(result["value"], 12100)

if __name__ == "__main__":
    unittest.main(verbosity=2)
