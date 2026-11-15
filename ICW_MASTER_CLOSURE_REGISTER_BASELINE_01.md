# ICW Master Closure Register — Baseline 01

**Date:** 2026-11-15  
**Status:** Documentation-only control register; implementation and infrastructure spend remain unauthorized.  
**Branch:** `docs/icw-v4-2-evidence-closure`  
**Purpose:** Separate documentary design resolution from independently demonstrated operational evidence. This register does not approve a provider, security claim, implementation, migration, test execution, deployment, or PR merge.

## 1. Current decision

**HOLD implementation authorization.** The v4 architecture is materially stronger than v3, but no production implementation, live witness, provider durability test, recovery exercise, cryptographic ceremony, independent security review, or end-to-end reconstruction proof has been completed.

The governing model remains:
- ICW is the authoritative lifecycle commit log and sequence/CAS authority.
- Every accepted batch has a complete retained envelope and signed durable receipt.
- The relational database is a receipt-backed projection only.
- Checkpoints are verified-prefix accelerators, not proof of post-checkpoint commits.
- Database-only history is never authoritative; no database-only fallback.
- Any unverified current head, receipt, projection, or required dependency blocks current-state serving.

## 2. Status vocabulary

- **DESIGN-RESOLVED:** normative documentation is internally specified; not proof of implementation.
- **PROVISIONAL:** candidate or direction exists but has not passed evidence-based acceptance.
- **BLOCKED:** required evidence, independent review, owner, or approved parameter is missing.
- **NOT RUN:** no execution evidence exists.
- **ACCEPTED:** only after the named evidence is independently reviewed and recorded. No infrastructure/provider item is ACCEPTED in this baseline.

A documented test case, vendor statement, architecture diagram, or successful local mock is not a substitute for the evidence specified below.

## 3. Finding closure register

| Finding | Documentary position | Evidence position | Required closure evidence |
|---|---|---|---|
| F-01 — authoritative witness, durability and independence | ICW receipt/CAS/envelope model specified. Preliminary public-documentation review favors Google Cloud Spanner as transactional witness plus AWS S3 Object Lock Compliance mode for envelopes; this is a candidate only, not a provider selection or acceptance. | **BLOCKED** | Named provider/service/version; contractual and technical linearizability semantics; durable-acknowledgement boundary; crash-after-ack proof; independent admin/IAM boundaries; immutable envelope retention; export/recovery path; failure-domain analysis; cost and operational ownership. |
| F-02 — independent authorization authority | Signed, scoped, short-lived assertion contract specified. ADS/Okta direction is provisional only. | **BLOCKED** | Identify the actual issuer and trust root; prove it is outside ordinary application, database and ICW-operator control; define who can grant/revoke authority; key custody/rotation; issuer outage and compromise behavior; replay protection; independent audit. An identity provider or policy engine is not automatically an independent authorization authority. |
| F-03 — recovery and operational readiness | Recovery protocol and 30-class recovery inventory are documented. | **BLOCKED / NOT RUN** | Prioritized failure matrix; runnable runbooks; independent recovery credentials; tested restore from ICW receipts/envelopes; fault-injection results; RPO/RTO measurements; dual-control re-enable; immutable recovery reports. Inventory coverage is not exercise evidence. |
| F-04 — cryptographic trust and key custody | Signed receipt/checkpoint/snapshot requirements specified. CloudHSM is a candidate, not an approved trust design. | **BLOCKED** | Approved algorithms and canonical preimages; key-generation ceremony; HSM policy/ownership; signing authorization separation; public-key history; rotation and compromise response; verifier test vectors; independent cryptographic review. HSM availability alone does not establish system trust. |
| F-05 — checkpoint publication crash windows | Object-before-anchor/CAS and reconciliation behavior specified. | **DESIGN-RESOLVED / NOT RUN** | Fault-injection traces for every write/ack/crash boundary; idempotent retry; orphan object and stale anchor handling; independently verified final anchor/object state. |
| F-06 — command watermark and idempotency semantics | Four-command exact-head matrix and same-key replay semantics specified. | **DESIGN-RESOLVED / NOT RUN** | Executed concurrency, timeout, retry-after-head-advance, stale/future/interior watermark and digest-conflict tests against the real commit authority. |
| F-07 — locking and projection consistency | ICW CAS before projection transaction; deterministic lock order; no DB lock across ICW call specified. | **DESIGN-RESOLVED / NOT RUN** | Executed race/deadlock/lock-wait tests, projection corruption/rebuild tests and multi-instance concurrency tests. |
| F-08 — pending/finalized publication and consumer gating | Explicit commit/projection/publication states specified. | **DESIGN-RESOLVED / NOT RUN** | Prove every API, cache, export, recommendation and downstream action rejects pending, stale or mismatched state. |
| F-09 — privileged-role separation | Role boundaries and signed assertion requirements specified. | **PROVISIONAL / BLOCKED** | Actual IAM/DB grant exports; independently owned issuer, ICW and key service; break-glass/dual-control procedure; adversarial role tests; audit ownership; independent review. |

## 4. Immediate F-01 provider evaluation gate

No provider is selected by this register. Evaluate candidate architectures against the following mandatory questions before recommending one:

1. **Atomicity and ordering:** What exact primitive performs the expected-head compare-and-swap? Is it linearizable for the selected scope? Can two writers using the same prior head both receive successful commit acknowledgements?
2. **Durable acknowledgement:** At what precise point may the service acknowledge acceptance? What survives process, host, zone and regional failure immediately after that acknowledgement?
3. **Envelope completeness:** Is the complete canonical batch durably retained before or atomically with the authoritative head advance? Can a receipt exist while its required envelope is missing?
4. **Independent control:** Can ordinary application, database, backup and cloud-account administrators rewrite, delete, suppress or roll back the witness history? Identify separate accounts, roles, owners, break-glass paths and audit streams.
5. **Retention and immutability:** Can committed envelopes and receipts be retained for the required horizon, protected against privileged deletion, and legally held/erased under the approved policy?
6. **Recovery and portability:** Can an independent verifier enumerate the full receipt chain and retrieve all envelopes without relying on the primary application or its database? Can the service be restored or migrated without trusting a provider-local mutable pointer?
7. **Outage behavior:** Define append/read outage behavior, bounded retry, projection backlog, current-head freshness, recovery and fail-closed behavior. No DB-only fallback.
8. **Operational proof:** Obtain provider documentation and contract terms, then test crash-after-ack, concurrent CAS, region/failure-domain loss, retention lock, administrative compromise and independent restore.
9. **Cost and burden:** Estimate baseline and failure-mode costs, minimum viable configuration, egress/retention costs, on-call burden and vendor lock-in. No paid deployment or trial is authorized by this register.

A dual-cloud label is not evidence of independence. Two services may still share identity, billing, organization ownership, support access, signing keys, network control, or recovery administrators. These shared dependencies must be explicitly mapped.

## 5. Cross-document consistency checks still required

Before the next independent review, verify that all three normative documents and the traceability matrix agree on:
- exact commit point and what constitutes a durable witness acknowledgement;
- complete envelope availability and receipt-to-envelope binding;
- single-item head CAS semantics (do not assume a multi-item transaction across services);
- witness outage, projection-pending and recovery states;
- current-head freshness and cache invalidation;
- signed authorization assertion fields, issuer trust root and replay behavior;
- snapshot receipt inclusion proof and reconstruction status separation;
- lawful erasure effects on integrity verification versus payload reconstruction;
- concrete deployment parameters and the rule that missing parameters are BLOCKED, never silently defaulted.

## 6. Authorization gate

Implementation, migration, ingestion, production deployment and merge remain unauthorized until:
1. F-01 through F-09 have accepted closure evidence, not merely design text.
2. The ICW and authorization authority are selected with independently reviewed trust boundaries.
3. Cryptographic design, actual roles/grants, privacy/retention and operational runbooks are approved.
4. The signed deployment parameter register is complete and pinned.
5. Required acceptance tests have been executed against the selected implementation and real services; BLOCKED and NOT RUN are not PASS.
6. Recovery and historical reconstruction have independent evidence.
7. A fresh independent reviewer finds no unresolved critical/high contradiction.
8. The user explicitly authorizes the next implementation stage.

## 7. Repository and scope controls

- Keep PR #33 draft/open.
- Preserve PR #32 and PR #30 as historical/baseline review artifacts; do not merge them.
- This register is documentation only.
- Do not create infrastructure, incur provider charges, run migrations, ingest real-agent evidence, or claim production-grade rollback resistance.
- Record every future closure with artifact URI/digest, exact version, reviewer, date, result and residual limitations.
