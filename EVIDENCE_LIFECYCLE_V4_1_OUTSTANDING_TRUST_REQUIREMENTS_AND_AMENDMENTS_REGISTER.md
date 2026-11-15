# DealFlow — v4.1 Outstanding Trust Requirements and Amendments Register

**Status:** Documentation-only amendment register; pending independent closure review.  
**Baseline:** v4 documents on `docs/evidence-lifecycle-v4-contract`.  
**Target:** v4.1 trust-closure baseline.  
**Authorization:** No implementation, test execution, migration, evidence ingestion, merge or production deployment is authorized by this register. PR #33 remains draft.

## 1. Purpose and decision rule

This register closes three conditional findings from the final v4 review: (F-01) witness receipt/envelope durability; (F-02) independent authorization authority; and (F-03) complete authoritative-history reconstruction. It also makes their shared cryptographic, operational and evidentiary dependencies explicit.

A normative requirement is not proof of implementation. A design review is not a provider attestation. A passing test in a simulated environment is not proof of a provider's production durability. Each finding closes only when every required artifact is independently reviewed and every acceptance criterion passes.

**No-go rule:** Any missing, unverifiable, stale, contradictory or self-attested-only closure artifact keeps the finding OPEN and implementation authorization WITHHELD. No exception may be inferred from successful database tests, a valid checkpoint, a signed marketing claim or an application-generated report.

## 2. Findings and amendment map

| Finding | Risk being closed | v4.1 architecture section | v4.1 server section | v4.1 test section | Required disposition |
|---|---|---|---|---|---|
| F-01 | Acknowledged receipt or complete envelope lost, deleted, rolled back or made unavailable after witness/storage failure or privileged attack | A14 | S14 | Tests 188–196 | Provider-backed durability demonstrated |
| F-02 | Witness trusts an application-created identity/role/authorization claim or issuer whose policy/control plane is not independent | A15 | S15 | Tests 197–204 | Independent authorization authority demonstrated |
| F-03 | Database loss leaves lifecycle history, evidence content, snapshots or decision dependencies unreconstructable while DealFlow claims full recovery | A16 | S16 | Tests 205–215 | Recovery scope and end-to-end reconstruction demonstrated |
| F-04 | Cryptographic trust roots, key history or provider control plane silently invalidate F-01–F-03 | A17 | S17 | Tests 216–220 | Key custody and compromise procedures demonstrated |

## 3. F-01 — Receipt and complete-envelope durability

### Exact document amendments
- Architecture: `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.1.md`, §A14.
- Server: `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.1.md`, §S14.
- Tests: `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.1.md`, tests 188–196.
- Traceability: `EVIDENCE_LIFECYCLE_V4_1_REQUIREMENT_TEST_TRACEABILITY.md`, §2.

### Normative requirement

The ICW MUST NOT acknowledge an append until the complete canonical batch envelope is durably committed in the independent witness trust domain and the receipt is atomically bound to the exact immutable object identity, byte length, digest, retention policy and ledger position. A successful response MUST mean that the receipt and every byte required to reconstruct that accepted batch meet the declared durability and availability contract.

The provider/deployment MUST define linearizability, quorum commit semantics, failure domains, replication, acknowledged-write durability, retention enforcement, administrator separation, regional recovery and maximum recovery-point loss. These MUST be concrete, versioned and contractually supported—not inferred from generic product labels.

### Acceptance criteria

1. Provider documentation and contract identify exact consistency and durable-acknowledgement semantics.
2. A receipt is never issued before immutable envelope persistence is confirmed.
3. Receipt and envelope survive every failure within the declared threat and failure model, including abrupt loss of the acknowledging node immediately after response.
4. Database/application administrators cannot delete, replace, reorder or suppress witness receipts or their referenced envelope objects.
5. Witness/storage privileged-administrator actions are separately authorized, tamper-evidently audited and alertable.
6. Cross-region or equivalent independent failure-domain recovery meets the approved RPO/RTO; no acknowledged receipt is lost within the declared model.
7. Missing, altered, expired or unavailable envelope objects cause explicit quarantine/unavailability; no database copy is promoted as witness truth.
8. Independent read-back verifies exact envelope bytes, digest, object identity and retention state.

### Required closure evidence

- Signed provider capability/consistency and durability statement, tied to the selected service tier and configuration.
- Architecture and IAM diagrams showing independent ownership, accounts/projects, credentials, network paths and recovery roles.
- Storage retention/immutability configuration export and privileged-bypass analysis.
- Replication/failure-domain configuration and service-specific RPO/RTO commitments.
- Independently witnessed fault-injection report, raw event timeline, receipt IDs, envelope digests, configuration versions and verifier output.
- Evidence of successful read-back after node/process termination and simulated regional/storage failure.
- Provider administrator access, deletion, retention-change and key-policy audit samples.
- Independent reviewer sign-off identifying the tested provider configuration and residual assumptions.

## 4. F-02 — Independent authorization authority

### Exact document amendments
- Architecture: `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.1.md`, §A15.
- Server: `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.1.md`, §S15.
- Tests: `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.1.md`, tests 197–204.
- Traceability: `EVIDENCE_LIFECYCLE_V4_1_REQUIREMENT_TEST_TRACEABILITY.md`, §3.

### Normative requirement

The ICW MUST trust only authorization assertions issued by a separately administered authorization authority whose identity proofing, policy source, policy evaluation, signing keys, revocation process and administrative controls are outside ordinary application and database administrator control.

The authority MUST authenticate the actor/client, derive tenant and resource scope from trusted identity/entitlement data, evaluate a versioned authorization policy, and issue a signed assertion bound to the exact canonical request digest, command, resource/claim scope, tenant, actor/client, ICW audience, policy/version identifier, decision identifier, issue/expiry times and unique assertion ID.

The ICW MUST verify the assertion signature, issuer trust chain, audience, time bounds, policy/decision metadata, scope, request digest and replay/idempotency conditions. It MUST reject unsigned application claims, role strings, authorization references without cryptographic proof, stale/revoked credentials and assertions outside their granted scope.

This architecture provides independent attestation of an authorization decision; it does not mean the ICW independently knows a human's real-world identity. The assurance of identity proofing and entitlement sources MUST be stated explicitly.

### Acceptance criteria

1. The issuer is deployed in a distinct security and administrative trust domain.
2. Application/database administrators cannot issue, broaden, sign, revoke protections around, or retrieve issuer signing credentials.
3. Identity authentication, tenant derivation, entitlement source, policy evaluation and decision logging are specified and versioned.
4. Every assertion is request-bound and carries a policy version and unique decision/assertion identity.
5. ICW verification is performed independently of application-supplied role/permission claims.
6. Revocation, key rotation, policy withdrawal, actor disablement and compromised issuer response are tested.
7. Exact idempotent retries cannot broaden the original authorization; returning a prior result requires current permission to receive it.
8. A compromised application administrator cannot obtain a valid assertion for an unauthorized actor, tenant, command or resource.
9. A compromised or unavailable authorization authority causes safe rejection/unavailability, never a permissive fallback.

### Required closure evidence

- Issuer threat model and trust-boundary diagram.
- Identity proofing/authentication and entitlement-source specification.
- Versioned authorization policy and decision-evaluation specification.
- Signing-key custody, rotation, revocation and compromise runbooks.
- Administrative role matrix and IAM exports proving separation from application/database administrators.
- Sample signed assertions with independently reproduced signature and request-digest verification.
- Tamper-evident authorization decision audit records linking actor, policy version, decision ID and assertion ID.
- Adversarial test report for privilege escalation, cross-tenant scope, replay, expiry, revocation, key compromise and issuer outage.
- Independent security reviewer sign-off.

## 5. F-03 — Complete authoritative-history reconstruction

### Exact document amendments
- Architecture: `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.1.md`, §A16.
- Server: `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.1.md`, §S16.
- Tests: `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.1.md`, tests 205–215.
- Traceability: `EVIDENCE_LIFECYCLE_V4_1_REQUIREMENT_TEST_TRACEABILITY.md`, §4.

### Normative requirement

The ICW recovery package MUST be sufficient to rebuild the authoritative lifecycle ledger without consulting the lost relational database. The recovery contract MUST enumerate and bind every authoritative object class required for DealFlow's declared history: genesis and epoch manifests; contiguous receipts; complete batch envelopes; evidence payload objects or explicit privacy-erasure tombstones; lifecycle events and lineage; authorization decision/assertion provenance; schema/canonicalization and cryptographic verification metadata; recommendation snapshots and finalization receipts; and the complete versioned dependency manifest for each historical decision.

Every object MUST have a stable identity, content digest, schema/version, retention classification, authoritative receipt/reference and retrieval procedure. A dependency not retained in the witness itself MUST be retained in an independently controlled durable store whose integrity and availability are covered by the same recovery contract. A pointer to an ordinary mutable database row is insufficient.

The system MUST distinguish:
- `LEDGER_RECOVERED`: all accepted lifecycle receipts/events and ledger structure reconstructed and verified;
- `CONTENT_RECOVERED`: all lawfully retained evidence and payload bytes needed for the declared content scope retrieved and verified;
- `DECISION_HISTORY_RECOVERED`: snapshots, inputs, authorization provenance, exact artifacts and all required dependencies retrieved and verified;
- `PARTIAL` or `UNAVAILABLE`: one or more required items are erased, missing, inaccessible, unverifiable or outside the declared retention scope.

No aggregate `FULL` claim is permitted unless every component in the declared scope is complete. Legal erasure MUST be represented explicitly; integrity metadata may remain, but erased plaintext MUST NOT be claimed as reconstructed.

### Acceptance criteria

1. A clean recovery environment with no access to the relational database can enumerate and retrieve the complete ICW authoritative receipt history from genesis or a separately verified genesis manifest.
2. It reconstructs every batch and lifecycle transition in sequence and independently verifies signatures, digests, semantics, lineage and authorization provenance.
3. It retrieves all evidence payloads within the declared retention scope and detects every missing/altered object.
4. It retrieves every finalized recommendation snapshot and verifies its exact receipt watermark and finalization receipt.
5. It retrieves every required historical dependency: engine/runtime, policy, taxonomy, projector, canonicalizer, feature/normalization definitions, configuration, external responses consumed, prompt/template and actual structured model output where applicable, precision/rounding/execution contract and artifact digests.
6. Deterministic historical replay produces the required canonical output under the pinned execution contract; nondeterministic outputs are verified from preserved actual outputs and deterministic downstream processing, not a fresh model call.
7. Legal-erasure fixtures produce explicit PARTIAL/UNAVAILABLE content and recomputation states without weakening ledger integrity claims.
8. A recovery from total relational database loss is completed, independently audited and compared to the witness head.
9. Every missing dependency is named by stable ID, class, digest/reference and reason; no newer substitute is silently used.
10. The recovered system remains isolated until an independent recovery verifier and authorized operator approve re-enablement.

### Required closure evidence

- Complete authoritative-object inventory and retention matrix.
- Witness/export API and offline recovery-package specification.
- Genesis/epoch and receipt-chain verification specification.
- Dependency-manifest schema and immutable artifact-store inventory.
- Clean-room recovery transcript from an environment with no relational database access.
- Independent verifier source/build identity, test vectors and verification output.
- Full recovery manifest listing every object class, IDs, digests, status and omissions.
- Deterministic replay comparison report and nondeterministic-output verification report.
- Legal-erasure test evidence and privacy/legal approval.
- Independent recovery reviewer sign-off.

## 6. F-04 — Cryptographic trust and compromise lifecycle

### Exact document amendments
- Architecture: `EVIDENCE_LIFECYCLE_APPEND_ONLY_DESIGN_v4.1.md`, §A17.
- Server: `EVIDENCE_LIFECYCLE_SERVER_IMPLEMENTATION_SPEC_v4.1.md`, §S17.
- Tests: `EVIDENCE_LIFECYCLE_MIGRATION_TEST_PLAN_v4.1.md`, tests 216–220.
- Traceability: `EVIDENCE_LIFECYCLE_V4_1_REQUIREMENT_TEST_TRACEABILITY.md`, §5.

### Normative requirement

All cryptographic verification MUST be anchored in independently retained trust-root, certificate, key-rotation, revocation and algorithm-version history. Key compromise MUST have a defined detection point, last-known-good boundary, quarantine procedure, re-attestation process and explicit treatment of receipts signed during the suspected compromise window. A new key or epoch MUST NOT retroactively legitimize unverifiable history.

### Acceptance criteria and closure evidence

- Independent key-management architecture and custody evidence.
- Key generation, use, rotation, revocation, backup and destruction runbooks.
- Historical verification-key/certificate retention and algorithm-agility policy.
- Simulated signing-key compromise and recovery report.
- Proof that database administrators cannot access or invoke witness/issuer signing keys.
- Independent cryptographic review and verification test report.

## 7. Cross-document consistency and closure controls

The four v4.1 documents MUST use the same terms and states. In particular:
- `durably acknowledged` means receipt plus complete envelope are committed under the selected provider's documented failure model.
- `authorized` means a valid assertion from the independently controlled issuer, verified by the ICW.
- `ledger recovered`, `content recovered` and `decision history recovered` are separate outcomes.
- `FULL` is prohibited when any required object/dependency in the declared scope is missing.
- Provider, issuer, storage, KMS and recovery outages MUST fail closed for new commits or current-state decisions as applicable.
- A database backup, checkpoint, local hash chain or application-generated report is never a substitute for a missing witness receipt/object.
- All provider-specific values remain explicit deployment parameters; no test may invent its own threshold.

The traceability matrix MUST map each normative requirement to one or more deterministic acceptance tests and one or more closure artifacts. Every test must identify its preconditions, adversary/failure injection, expected result, evidence captured and independent verifier.

## 8. Final authorization gates

Implementation authorization remains WITHHELD until:
1. F-01 through F-04 are each marked CLOSED by an independent reviewer.
2. Provider and issuer are selected and their exact production-like configurations are pinned.
3. The signed deployment parameter register is complete.
4. The complete acceptance suite passes in an isolated environment and raw evidence is retained.
5. The recovery exercise demonstrates the declared recovery scope without the relational database.
6. The four v4.1 documents pass a final independent consistency and adversarial review.
7. The user separately authorizes implementation.

**Current status:** All four findings OPEN. The v4.1 documents specify requirements and tests; they do not assert that providers, infrastructure, issuers or implementation have demonstrated them.
