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
| F-01 — authoritative witness, durability and independence | Topology conflict resolved at documentary candidate level: Spanner multi-region + S3 Object Lock Compliance is the sole primary candidate carried forward; DynamoDB MRSC + S3 + GCS is retained as a superseded historical alternative requiring a separately redesigned single-item protocol. | **CANDIDATE SELECTED FOR REVIEW / BLOCKED — NOT DEMONSTRATED** | Validate exact transaction/retry/idempotency protocol; cost/region/contract; S3 exact-version retention; independent Google/AWS organization/account/root ownership; legal retention/erasure; fault injection, acknowledged-commit recovery and independent restore. Published Spanner 100-PU compute estimate ≈ USD 270.47/month before excluded storage, backups, replication, network, S3 and operations. |
| F-02 — independent authorization authority | Tenant is the ultimate authority for its own grants and trust root; ADS is a delegated, separately administered decision/assertion service; ICW verifies tenant-root-signed grants and ADS delegation. Okta is only an unselected identity-provider candidate. Ownership model decided; actual tenant owners, second approvers, ADS operator and trust-root enrollment remain unevidenced. | **BLOCKED** | Identify the actual issuer and trust root; prove it is outside ordinary application, database and ICW-operator control; define who can grant/revoke authority; key custody/rotation; issuer outage and compromise behavior; replay protection; independent audit. An identity provider or policy engine is not automatically an independent authorization authority. |
| F-03 — recovery and operational readiness | Original 30-class R01–R30 inventory located and preserved unchanged. Companion practical recovery test specification now maps every class to failure injection, detection, isolation, recovery, independent verification and acceptance criteria; includes end-to-end and compound scenarios. | **SPECIFICATION DEFINED / LIVE EXERCISE BLOCKED — NOT RUN** | Clean-room retrieval from actual ICW receipts and exact-version envelope stores; independent verifier and credentials; all-class fault injection; RPO/RTO measurements against approved targets; immutable raw evidence and independent sign-off. Specification does not demonstrate recovery. |
| F-04 — cryptographic trust and key custody | Binding documentary policy DF-ICW-CRYPTO-v1 selected: ES256 (ECDSA P-256/SHA-256), SHA-256 digests, RFC 8785 JCS, typed domain separation, AES-256-GCM per-object DEKs, TLS 1.3 and dual RFC 3161 timestamping for designated milestones. Custody model: separate ICW/ADS/TAR/trust-root/recovery domains; 2-of-3 human quorum for HSM lifecycle/admin actions, constrained automated signing. | **DOCUMENTARY POLICY SELECTED / OPERATIONAL ACCEPTANCE BLOCKED — NOT DEMONSTRATED** | Confirm HSM FIPS mode/SDK/mechanism and signature encoding; independent vectors/verifiers; appoint real custodians, ADS operator, tenant owners/approvers and two TSA operators; verify account/root separation; approve key lifecycle/retention policy; run generation/quorum/backup/restore/rotation/compromise tests and independent review. No key/HSM/tenant root/TSA configured. |
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
