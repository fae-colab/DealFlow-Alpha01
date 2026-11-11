const assert = require('node:assert/strict');
const E = require('./engine.js');

function action(id, opportunityId, commission, extra = {}) {
  return {
    id, opportunityId, name: 'Opportunity ' + opportunityId,
    action: 'Test action ' + id, commission,
    pWith: 80, pWithout: 20, effort: 30, deadline: 5,
    ...extra
  };
}

// P0 regression: one transaction cannot carry contradictory commission assumptions.
const conflicting = [
  action('viewing', 'deal-42', 12000),
  action('offer-followup', 'DEAL-42', 15000)
];
assert.ok(
  E.validatePortfolio(conflicting, 2).some(x => x.includes('Conflicting commission assumptions')),
  'case-insensitive opportunity IDs with different commission assumptions must be rejected'
);

// Same opportunity, same commission, multiple action stages: retain allowed workflow
// while crediting positive commission lift only once.
const consistent = [
  action('viewing', 'deal-42', 12000, { pWith: 70, pWithout: 30 }),
  action('offer-followup', 'DEAL-42', 12000, { pWith: 85, pWithout: 30, dependency: 'viewing' })
];
assert.deepEqual(E.validatePortfolio(consistent, 2), []);
assert.equal(E.optimize(consistent, 2).value, 6600);

// A feasible order exists even when a deadline-sorted first choice would block it.
// The exact optimizer must explore the alternative order rather than reject the portfolio.
const prep = action('prep', 'prep-deal', 1000, { pWith: 50, pWithout: 40, effort: 40, deadline: 3 });
const urgent = action('urgent', 'urgent-deal', 10000, { pWith: 80, pWithout: 20, effort: 30, deadline: 1.5, dependency: 'prep' });
const independent = action('independent', 'independent-deal', 10000, { pWith: 80, pWithout: 20, effort: 30, deadline: 2 });
const result = E.optimize([prep, urgent, independent], 2);
assert.deepEqual(result.items.map(x => x.id), ['prep', 'urgent', 'independent']);
assert.equal(result.value, 12100);

console.log('3 P0 JavaScript regression tests passed.');
