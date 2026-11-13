# DealFlow Evidence Taxonomy v1 — Contract Before Implementation

**Status:** Proposed engineering contract for review. This document does not change the freshness implementation or establish validated Dubai-market expiry periods.

## 1. Core model: claims, evidence, and time are separate

A recommendation depends on claims about an opportunity (for example, "the buyer is still ready to view", "the property is available", or "this transaction closed at AED X"). Each claim must be linked to one or more evidence records. Do not attach one undifferentiated evidence date to an entire action.

Each evidence record should distinguish:

| Field | Meaning | Requirement |
|---|---|---|
| `evidence_id` | Stable ID for this evidence record | Required |
| `claim_id` | Exact claim this record is offered to support | Required |
| `evidence_type` | Controlled category from the taxonomy below | Required |
| `claim_text` | Atomic factual proposition being evaluated | Required |
| `source_type` | Agent report, document, public listing, registry, dataset, internal record, etc. | Required |
| `source_reference` | URL, document ID, message ID, or other locator | Required when a source exists; never treat a URL alone as proof |
| `observed_at` | When the fact was observed, stated, or true as-of; UTC timestamp | Required for time-sensitive claims |
| `recorded_at` | When DealFlow captured the information; UTC timestamp | Required for every claim |
| `source_checked_at` | When the source was actually checked; UTC timestamp | Required for source-backed claims |
| `valid_until` | Explicit expiry supplied by the source or governing process | Optional; if elapsed, evidence cannot support a current-state claim |
| `support_relation` | `supports`, `contradicts`, `context_only`, or `unassessed` | Required |
| `verification_level` | `agent_reported`, `agent_documented`, `independently_verified`, or `unverified` | Required |
| `support_note` | Why this source supports this exact claim, including limitations | Required |

All timestamps use ISO 8601 with an explicit timezone (UTC preferred), e.g. `2026-11-13T09:30:00Z`. Date-only values are insufficient for short-lived facts such as listing availability or a viewing slot. Never substitute `recorded_at` for `observed_at` or `source_checked_at`.

## 2. Evidence categories and temporal semantics

| Evidence type | Examples | Freshness semantics |
|---|---|---|
| `buyer_intent` | Viewing interest, budget, preferred area, urgency | Volatile. Timestamp each buyer statement/confirmation. Reconfirm after the configured interval or any material change. |
| `buyer_readiness` | Financing status, proof of funds, decision-maker availability | Volatile and event-sensitive. Reconfirm near the decision/action; do not infer current readiness from old documents. |
| `listing_availability` | Active/available status, viewing access, unit availability | Highly volatile. Require a recent observation/source check; stale or missing time means reconfirm before recommending action that assumes availability. |
| `property_terms` | Asking price, negotiable range, seller terms, commission terms | Change-sensitive. Timestamp each term and revalidate after amendments or a configured interval. |
| `seller_mandate` | Authority to market, seller instructions, exclusivity | Validity- and event-sensitive. Check explicit expiry, revocation, and last confirmation; an old signed record may prove historical authority but not necessarily current authority. |
| `market_comparable` | Recent comparable listings or transactions, market metrics | Time-decaying. Use source period and publication/observation time; age tolerance should depend on the analysis and market volatility. |
| `historical_transaction` | Closed transaction record, historic sale price/date | The transaction event date is intentionally old and is not itself staleness. Validate source authenticity and whether the record is still the right historical fact; separately date any current interpretation derived from it. |
| `legal_or_identity_record` | Title/ownership, identity, permit, contractual record | Distinguish durable historical record from current legal status. Check expiry, amendment, cancellation, and the decision-specific requirement. |
| `agent_context` | Agent-reported relationship history or conversation summary | Timestamp when observed/reported and when captured. Treat as agent-reported, not independently verified; apply category-specific revalidation. |

The table defines *how to reason*, not universal TTL values. Numeric intervals must be configurable by evidence type and validated with agents and authoritative workflows before production use.

## 3. Required gate semantics

1. **Freshness is claim-type-specific.** A single global `maxEvidenceAgeDays` must not determine eligibility for every evidence type.
2. **Agent-reported claims are not exempt.** They need `recorded_at`; volatile claims also need `observed_at`. Missing timestamps for a time-sensitive claim mean freshness is unknown and must block a recommendation that relies on it.
3. **Source checked is not claim supported.** A recent `source_checked_at` does not establish relevance. The source must explicitly map to the same `claim_id`, and `support_relation` must be `supports`. `contradicts`, `context_only`, and `unassessed` cannot substantiate the claim.
4. **Historical event age is not freshness age.** An old transaction can remain valid evidence of what happened then. Its old `observed_at` must not be rejected using the buyer-intent/listing TTL. Any current inference from it is a separate claim with its own evidence.
5. **Expiry and revocation override age.** An expired, withdrawn, superseded, or revoked record cannot support a current-state claim even if it was checked recently.
6. **Verification is separate from provenance.** `agent_documented` means an agent supplied a document/reference; it does not mean DealFlow independently fetched or authenticated it. Reserve `independently_verified` for a recorded verification event and method.
7. **Evidence insufficiency is visible.** Rejection reasons should name the claim/evidence IDs, missing timestamp or support relation, and whether the required next step is reconfirmation, source verification, or abstention.

## 4. Targeted regression vectors

The companion `regression_cases.json` defines five contract vectors. Their policy intervals are deliberately local test parameters, not recommended production TTLs:

- stale buyer intent: old agent-reported buyer statement must not pass as current;
- missing time on a volatile claim: listing availability with no observation timestamp must require reconfirmation;
- recently confirmed listing: recent, claim-matched confirmation must pass;
- old historical transaction: an old event record remains admissible as evidence of that historical event;
- recent but irrelevant source: a recent source that does not support the claim must be rejected.

## 5. Implementation boundary

This is a contract-first change. The current `decision_desk.js` freshness gate is intentionally unchanged in this branch. The new vectors are specification fixtures, not evidence that the existing engine passes them. A subsequent implementation change must consume this schema, add behavior tests against the decision gate, and preserve the existing frozen v1.1 replay and PR #27.
