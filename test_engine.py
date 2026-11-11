import unittest
from python_engine import Action, optimize, schedule, validate_portfolio

class DealFlowEngineTests(unittest.TestCase):
    def test_probability_scale_is_percentage(self):
        a=Action('x',10000,60,40,60,10)
        self.assertAlmostEqual(optimize([a],1)['value'],2000)
    def test_respects_capacity(self):
        a=Action('x',10000,60,20,90,10)
        self.assertEqual(optimize([a],1)['value'],0)
    def test_skips_zero_or_negative_lift(self):
        a=Action('x',10000,30,40,30,10)
        self.assertEqual(optimize([a],2)['value'],0)
    def test_selects_best_combination(self):
        a=Action('a',10000,50,30,60,10); b=Action('b',10000,60,30,60,10); c=Action('c',10000,80,30,120,10)
        result=optimize([a,b,c],2)
        self.assertEqual(result['value'],5000); self.assertEqual([x.id for x in result['items']],['c'])
    def test_dependency_requires_prerequisite_or_completed_record(self):
        parent=Action('parent',1000,50,40,60,10); child=Action('child',10000,80,20,60,10,'parent')
        self.assertAlmostEqual(optimize([child,parent],2)['value'],6100)
        self.assertAlmostEqual(optimize([child],2,completed_ids={'parent'})['value'],6000)
    def test_rejects_invalid_probability_effort_and_confidence(self):
        bad=Action('bad',1000,120,20,0,5,confidence=101)
        self.assertTrue(validate_portfolio([bad],2))
        with self.assertRaises(ValueError): optimize([bad],2)
    def test_rejects_duplicate_action_ids(self):
        a=Action('same',1000,80,20,30,5); b=Action('same',2000,80,20,30,5)
        self.assertTrue(any('Duplicate action ID' in e for e in validate_portfolio([a,b],2)))
    def test_same_opportunity_prerequisite_and_action_are_allowed_without_double_count(self):
        parent=Action('prep',10000,60,20,30,5,opportunity_id='deal-1')
        child=Action('close',10000,90,20,30,5,'prep',opportunity_id='deal-1')
        result=optimize([child,parent],2)
        self.assertAlmostEqual(result['value'],7000)
        self.assertEqual({x.id for x in result['items']},{'prep','close'})
    def test_different_opportunities_are_additive(self):
        a=Action('a',10000,80,20,30,5,opportunity_id='deal-1')
        b=Action('b',10000,80,20,30,5,opportunity_id='deal-2')
        self.assertAlmostEqual(optimize([a,b],2)['value'],12000)
    def test_deadline_requires_completion_before_due_time(self):
        a=Action('late',10000,80,20,90,1)
        self.assertEqual(optimize([a],2)['value'],0)
    def test_schedule_api_finds_dependency_feasible_order(self):
        parent=Action('A0',1000,50,40,40,3)
        child=Action('A1',10000,80,20,30,1.5,'A0')
        independent=Action('A2',10000,80,20,30,2)
        result=schedule([parent,child,independent])
        self.assertEqual([x[0] for x in result['order']],['A0','A1','A2'])

    def test_exact_scheduler_finds_feasible_order_missed_by_edf(self):
        prerequisite=Action('A0',1000,50,40,40,3)
        dependent=Action('A1',10000,80,20,30,1.5,'A0')
        independent=Action('A2',10000,80,20,30,2)
        result=optimize([prerequisite,dependent,independent],2)
        self.assertAlmostEqual(result['value'],12100)
        self.assertEqual([x[0] for x in result['schedule']],['A0','A1','A2'])
    def test_negative_prerequisite_cost_is_retained(self):
        parent=Action('setup',1000,30,40,15,3,opportunity_id='deal')
        child=Action('close-step',10000,80,20,30,3,'setup',opportunity_id='deal')
        result=optimize([parent,child],2)
        self.assertAlmostEqual(result['value'],5900)
    def test_evidence_fields_are_validated_and_preserved(self):
        a=Action('e',1000,80,20,30,5,confidence=75,evidence_status='documented',evidence_url='https://example.com',evidence_updated_at='2026-11-06',evidence_note='Listing record')
        self.assertEqual(validate_portfolio([a],1),[])
        self.assertEqual(optimize([a],1)['items'][0].evidence_status,'documented')
        a.evidence_status='made_up'
        self.assertTrue(validate_portfolio([a],1))
    def test_rejects_missing_dependency_and_cycle(self):
        orphan=Action('orphan',1000,80,20,30,5,'missing')
        self.assertTrue(validate_portfolio([orphan],2))
        a=Action('a',1000,80,20,30,5,'b'); b=Action('b',1000,80,20,30,5,'a')
        self.assertTrue(any('cycle' in e.lower() for e in validate_portfolio([a,b],2)))

if __name__=='__main__': unittest.main(verbosity=2)