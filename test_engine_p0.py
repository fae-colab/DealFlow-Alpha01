import unittest
from python_engine import Action, optimize, validate_portfolio

class P0IntegritySchedulingTests(unittest.TestCase):
    def test_positive_commission_for_one_opportunity_is_counted_once(self):
        actions=[Action("first",10000,80,20,30,5,opportunity_id="deal-42"),Action("second",20000,80,20,30,5,opportunity_id="DEAL-42")]
        self.assertAlmostEqual(optimize(actions,2)["value"],12000)
    def test_negative_prerequisite_cost_is_retained_without_double_counting_close(self):
        prep=Action("prep",1000,30,40,15,5,opportunity_id="same-deal")
        close=Action("close",10000,80,20,30,5,"prep",opportunity_id="same-deal")
        self.assertAlmostEqual(optimize([prep,close],2)["value"],5900)
    def test_exact_optimizer_finds_feasible_precedence_and_deadline_order(self):
        setup=Action("setup",1000,50,40,40,3,opportunity_id="setup-deal")
        urgent=Action("urgent",10000,80,20,30,1.5,"setup",opportunity_id="urgent-deal")
        independent=Action("independent",10000,80,20,30,2,opportunity_id="independent-deal")
        result=optimize([setup,urgent,independent],2)
        self.assertEqual([x[0] for x in result["schedule"]],["setup","urgent","independent"])
        self.assertAlmostEqual(result["value"],12100)
    def test_rejects_whitespace_only_opportunity_id(self):
        actions=[Action('space-1',10000,80,20,30,5,opportunity_id=' '),Action('space-2',10000,80,20,30,5,opportunity_id=' ')]
        self.assertTrue(all('opportunity_id must be a non-empty string' in error for error in validate_portfolio(actions,2)))

if __name__=="__main__": unittest.main(verbosity=2)
