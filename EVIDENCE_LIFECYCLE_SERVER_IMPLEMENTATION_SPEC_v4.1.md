# Evidence Lifecycle — Server Implementation Specification v4.1

**Status:** Documentation-only trust-closure revision.  
**Baseline:** v4 server specification.  
**Normative:** Sections S14–S17 supplement v4.  
**Authorization:** This is a specification only; implementation is not authorized.



## S14. Durable acknowledgement and immutable-envelope protocol

The server MUST treat the ICW acknowledgement as authoritative only when the ICW has verified durable persistence of the complete batch envelope under the pinned provider durability contract. The ICW MUST persist the envelope first, verify immutable object identity/version, byte length and digest, then atomically commit the receipt binding that object and the expected ledger head. It MUST NOT return a successful durable-acknowledgement response for a queued, eventually persisted or unconfirmed object write.

The receipt response MUST include the immutable object reference/version, digest metadata, retention-policy identifier, receipt ID/hash, previous receipt, sequence range, batch ID and witness transaction identity. The server MUST verify the receipt signature and object binding before applying the projection. If the object store or witness cannot establish the required durable state, the mutation fails closed and no database projection mutation is permitted.

The implementation MUST pin provider service tier, consistency semantics, replication/failure domains, retention lock configuration, privileged roles, RPO/RTO and recovery route in a signed deployment parameter register. Runtime health checks MUST distinguish receipt-log quorum health from envelope-store durability/availability. Loss of either blocks new commits. An acknowledged object later found missing or altered causes ledger quarantine and incident escalation; the relational database copy is not an authority substitute.

## S15. Authorization issuer and assertion verification

The server MUST obtain an authorization assertion from the separately administered issuer after actor/client authentication and policy evaluation. The server MUST NOT construct or self-sign an assertion, select a tenant/resource scope from untrusted request data, or replace an unavailable issuer with application role checks.

The issuer MUST bind subject, client, tenant, command, resource/claim scope, canonical request digest, ICW audience, policy ID/version/digest, decision ID, assertion ID, issue/expiry timestamps and authentication context. The ICW MUST validate the signature/trust chain, issuer status, audience, time, policy metadata, scope, digest, identity consistency, revocation and replay state before semantic lifecycle validation and append CAS. The issuer's identity proofing and entitlement sources MUST be documented as trusted dependencies; the ICW's verification of an assertion MUST NOT be described as independent proof of a person's real-world identity.

A retry with the original idempotency key and exact request digest may return the original receipt only after current authorization to receive that result is checked. It MUST NOT create a new append or broaden prior authorization. If the issuer is unavailable or its status cannot be verified, new lifecycle commands fail closed. The API MUST return a typed authorization-unavailable/denied result without disclosing cross-tenant information.

## S16. Recovery package and completeness states

The recovery client MUST be capable of operating in a clean-room environment without relational database access. It MUST enumerate and retrieve the witness genesis/epoch records, receipt chain, complete batch envelopes, evidence objects/tombstones, authorization provenance, snapshot bytes/finalization receipts, versioned dependency manifests, schema/canonicalization metadata and historical verification keys.

The recovery manifest MUST report per object: stable ID, object class, expected and observed digest, schema/version, receipt/reference, retention/erasure status, retrieval result and verification result. Recovery MUST produce separate `LEDGER_RECOVERED`, `CONTENT_RECOVERED`, `DECISION_HISTORY_RECOVERED`, `PARTIAL` and `UNAVAILABLE` outcomes. An aggregate FULL state is allowed only when every required object in the declared recovery scope is retrieved and independently verified.

The recovery verifier MUST be separately built or independently reviewed and MUST NOT rely on production application canonicalization/hash/authorization helpers as its sole oracle. It MUST verify signatures, receipt continuity, object digests, lifecycle semantics, lineage, authorization provenance, snapshot-to-receipt binding and dependency manifests. Deterministic replay uses exact pinned artifacts and inputs; nondeterministic output verification uses preserved actual model output and deterministic downstream computation.

A legally erased or inaccessible dependency MUST be listed explicitly and make the affected content/decision-history outcome PARTIAL or UNAVAILABLE. It MUST NOT invalidate unrelated receipt integrity if the permitted integrity metadata remains verifiable, and MUST NOT be described as full content reconstruction. Recovery MUST remain isolated from decision/mutation traffic until an independent verifier and separately authorized operator approve re-enablement.

For R06, ERASED_BY_AUTHORITY MUST NOT be inferred from deletion/unavailability of the primary object, primary DEK or primary KMS/HSM entry. The recovery contract MUST inventory all in-scope ciphertext copies; DEKs, wrapped DEKs, KEKs and parent-key hierarchies; backup/archive/replica/escrow/DR key copies; historical KMS/HSM backup and point-in-time restore states; cached/unwrapped key material; and plaintext-bearing exports, normalized captures, attachments, media, temporary files, caches and derivatives. An independently operated verifier MUST exercise the documented backup, DR, escrow and historical key-management restore paths in an isolated environment. Erasure state MUST remain monotonic across restore and MUST NOT be rolled back by restoring a pre-erasure key-management backup. Any successful recovery of prohibited plaintext is FAIL; incomplete inventory or unavailable provider restore evidence is BLOCKED / NOT DEMONSTRATED. A tombstone records the authorized disposition but is not, by itself, proof of cryptographic irrecoverability.

## S17. Key lifecycle and compromise operations

The implementation MUST use separately controlled signing and encryption key services for the ICW and authorization issuer. Database/application credentials MUST NOT invoke signing operations or alter key policy. The service MUST retain historical public verification material, certificate chains, key IDs, algorithm versions, rotation/revocation records and trusted-time evidence for at least the lifetime of every receipt that depends on them.

Key compromise response MUST support immediate issuer/witness append suspension, scoped quarantine, preservation of audit evidence, identification of the last trusted receipt, independent verification of the affected interval and controlled re-attestation/new-epoch only after review. If trust cannot be re-established, the ledger remains unavailable; no key rotation or database restore may silently bless an uncertain tail.
