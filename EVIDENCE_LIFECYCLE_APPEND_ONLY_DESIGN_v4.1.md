# Evidence Lifecycle — Append-Only Architecture v4.1

**Status:** Documentation-only trust-closure revision.  
**Baseline:** v4 architecture.  
**Normative:** Sections A14–A17 supplement v4 and prevail where they add stronger trust requirements. Earlier v4 requirements remain in force unless explicitly superseded.  
**Authorization:** No implementation, migration, evidence ingestion or test execution is authorized.



## A14. Receipt and complete-envelope durability contract

The ICW MUST NOT acknowledge an append until both (a) the complete canonical batch envelope is durably committed in the independent witness trust domain and (b) the receipt is atomically bound to the exact immutable object identity, byte length, digest, retention policy/version and ledger position. A successful durable acknowledgement MUST mean that the receipt and every byte required to reconstruct the accepted batch meet the selected provider's documented consistency, durability and availability contract.

The deployment MUST define and pin: linearizability/consensus semantics; quorum commit and acknowledgement point; replica count and independent failure domains; regional replication/failover behavior; storage immutability and retention enforcement; privileged bypass/deletion controls; recovery credentials; receipt/object availability objectives; RPO/RTO; and provider-specific failure exclusions. Generic claims such as "highly available", "immutable" or "eleven nines" are insufficient without service-tier-specific semantics and configuration evidence.

The immutable envelope object MUST be written and confirmed under the selected retention policy before receipt publication. The receipt MUST bind object ID/version, exact byte length, digest algorithm/version, digest, retention-policy identifier, ledger/epoch/batch identity, previous receipt, sequence range and event count. A provider API response that only confirms request acceptance or an asynchronous queue enqueue is not durable acceptance. If the provider cannot prove the required durable state, the ICW MUST NOT acknowledge.

The ICW trust domain MUST use separately administered accounts/projects, IAM, credentials, audit and recovery controls from the application and relational database. Ordinary application/database administrators MUST have no permission to delete, overwrite, shorten retention, suspend protection, alter replication, invoke witness signing, or suppress audit records. Privileged witness/storage actions MUST require separately authorized controls, tamper-evident audit and alerting. Provider superuser/control-plane powers are residual trust and MUST be documented rather than described as impossible.

After acknowledgement, node loss, process crash, storage-node loss or regional failure within the declared model MUST NOT lose or alter the receipt or envelope. Recovery MUST read back and verify exact bytes and receipt linkage. If any required object is missing, altered, expired or inaccessible, the affected ledger is quarantined; a database copy MUST NOT be promoted.

The deployment parameter register MUST identify actual selected values and provider semantics. Tests may not invent or substitute thresholds.

## A15. Independent authorization authority

The authorization assertion issuer MUST be a separately administered security authority. Its identity proofing/authentication, entitlement sources, policy repository/evaluation, signing keys, audit, revocation and incident controls MUST be outside ordinary application and database administrator control.

The issuer MUST authenticate the actor/client and derive tenant and resource scope from trusted identity and entitlement data, not request-body fields or application role strings. It MUST evaluate a versioned policy and issue a signed assertion binding at minimum: issuer; subject/actor; client; tenant; permitted command; resource and claim scope; canonical request digest; ICW audience; policy identifier and immutable version/digest; authorization decision identifier; issue and expiry times; unique assertion ID; and applicable authentication context/assurance level.

The ICW MUST verify issuer trust chain, signature, audience, validity period, policy/version metadata, scope, request digest, actor/client/tenant consistency, revocation state and replay/idempotency conditions. It MUST reject plain actor IDs, role names, unsigned decision references, application-created assertions, stale credentials and assertions broader than the exact command/resource. The ICW's trust in the issuer is explicit: the ICW independently verifies the attestation and binding; it does not independently prove a human's real-world identity. The identity proofing and entitlement-source assurance are therefore part of the required issuer evidence.

An exact idempotent retry may resolve the original receipt only when the retry digest matches and the caller is currently authorized to receive the result. A replay MUST NOT reuse an assertion to authorize a new append. Issuer outage, unverifiable policy state, key compromise or revocation uncertainty MUST fail closed.

## A16. Complete authoritative-history reconstruction contract

The ICW recovery package MUST be sufficient to reconstruct the authoritative lifecycle ledger without consulting the relational database. The declared authoritative-history scope MUST include genesis and epoch manifests; contiguous signed receipts; complete canonical batch envelopes; lifecycle events and lineage; evidence payload objects or explicit privacy-erasure tombstones; authorization decision/assertion provenance; schema/canonicalization and digest-algorithm versions; signing and verification key history; recommendation snapshots and their finalization receipts; and complete versioned dependency manifests for historical decisions.

Each authoritative object MUST have a stable identifier, type, content digest, schema/version, retention classification, receipt/reference, retrieval route and integrity-verification rule. A dependency stored outside the ICW MUST reside in a separately controlled durable object store covered by the same retention, integrity, availability and disaster-recovery contract. A pointer to an ordinary mutable relational row, unversioned URL, current software package or provider endpoint is insufficient.

Recovery outcomes MUST be separate:
- `LEDGER_RECOVERED`: complete accepted receipt/event history and ledger structure reconstructed and verified;
- `CONTENT_RECOVERED`: all lawfully retained evidence/payload bytes in the declared content scope retrieved and verified;
- `DECISION_HISTORY_RECOVERED`: finalized snapshots, exact inputs, authorization provenance, artifacts and every required dependency retrieved and verified;
- `PARTIAL` or `UNAVAILABLE`: one or more required objects are erased, missing, inaccessible, unverifiable or outside declared retention.

No aggregate `FULL` claim is permitted unless all components of the explicitly declared scope are complete. Legal erasure MUST be represented by an authenticated tombstone or erasure record linked to the original object digest and policy/approval record where lawful. Integrity metadata may remain, but erased plaintext MUST NOT be represented as reconstructed. A missing artifact MUST be named by stable ID, expected digest, object class and reason; a newer artifact MUST NOT be silently substituted.

A clean-room recovery MUST work with no relational database, database backup, application cache or application-generated export. It MUST retrieve the witness receipt chain from genesis or a separately verified genesis manifest, independently validate receipt signatures/continuity and lifecycle semantics, retrieve every referenced retained object, verify authorization provenance, reconstruct snapshot provenance and run deterministic replay where all pinned dependencies exist. Nondeterministic/model-assisted results are verified from the preserved actual structured output and deterministic downstream computation; a fresh remote model call is not a substitute.

## A17. Cryptographic trust-root and compromise lifecycle

The trust model MUST retain independently protected historical verification material: genesis trust statements, issuer and witness certificates/public keys, key IDs and validity intervals, rotation/revocation events, algorithm/canonicalization versions, trusted timestamps or equivalent time evidence, and the evidence needed to establish which key was authoritative when a receipt was signed.

Key generation, activation, rotation, revocation, backup, destruction, access review and compromise response MUST be governed by separately controlled procedures. A suspected signing-key compromise MUST define the detection time, last independently verified good position, affected key/time window, quarantine boundary, independent investigation, re-verification strategy and explicit re-attestation or new-epoch process. A replacement key or new epoch MUST NOT retroactively legitimize receipts whose authenticity cannot be established. If the affected interval cannot be resolved, the ledger remains quarantined from the last independently verified position.

The deployment MUST document residual trust in provider control planes, witness administrators, issuer administrators, KMS/HSM operators and cryptographic roots. Simultaneous compromise of these independent roots is outside the ordinary database-admin guarantee, but MUST trigger incident response and an explicit downgrade of trust claims.
