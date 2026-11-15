# ICW F-02 — Independent Authorization Authority Decision

**Record date:** 2026-11-15  
**Status:** Architecture selected for evaluation; no tenant or authority provisioned.  
**Disposition:** F-02 remains OPEN / NOT DEMONSTRATED.

## 1. Selected design

Select a dedicated **Authorization Decision Service (ADS)** as the sole ICW authorization-assertion issuer, with:
- Okta Custom Authorization Server as the upstream workforce identity/authentication provider.
- ADS policy evaluation and entitlement derivation in a separate security trust domain, outside the DealFlow application and relational database.
- ADS signing key in a dedicated HSM-controlled trust account; app/DB administrators cannot administer ADS, policy, trust roots or signing keys.
- ICW verifies the signed, request-bound ADS assertion directly. DealFlow cannot create, modify, self-sign or substitute it.

Okta is selected as the upstream identity platform, not as the sole decision-maker. ADS is the issuer because ICW needs exact request-digest, command, scope, tenant, policy-version and replay binding.

## 2. Trust-boundary flow

1. Actor authenticates through Okta OIDC. Authentication identifies the subject and authentication context; it does not alone authorize an ICW command.
2. ADS obtains identity, client and tenant entitlements from authoritative, separately governed sources. Tenant/resource scope is never trusted from a request field.
3. ADS evaluates a versioned policy bundle and writes a separately controlled audit record.
4. ADS signs an assertion binding issuer, subject, client, tenant, command, resource scope, canonical request digest, ICW audience, policy ID/version/digest, decision ID, unique assertion ID, issue/expiry times, authentication context and entitlement-source version.
5. ICW independently verifies signature/trust chain, issuer status, audience, time, policy version, scope, request digest, subject/client/tenant binding, revocation and replay before lifecycle validation/CAS.
6. Issuer outage, policy unavailability, revocation uncertainty, unknown identity or signature failure means fail closed.
7. Exact idempotent result retrieval requires current authorization and cannot create a new append or broaden prior scope.

## 3. Why Okta

Official Okta documentation says Custom Authorization Servers support custom scopes, claims and access policies for custom APIs, have unique issuer identifiers and signing keys, and publish rotated signing keys through JWKS. Production Custom Authorization Server use requires the API Access Management product; the Integrator Free Plan is a testing facility, not evidence of production entitlement.

Okta does not by itself establish real-world identity proofing, correctness of tenant entitlements, ADS administrative independence, request-digest binding, or retention of historical verification evidence for DealFlow's full receipt lifetime. Those remain explicit dependencies and acceptance requirements.

## 4. Administrative separation

Distinct roles are required: Okta super-admin; identity lifecycle/proofing operator; ADS policy author; ADS policy approver; ADS deployer; ADS signing-key custodian; ICW trust-root administrator; DealFlow app admin; DB admin; independent reviewer.

Require two-person policy publication and key lifecycle approval. App/DB admins must not alter Okta policy, ADS policy, assertion signing configuration, trust anchors or revocation. If one unrestricted person controls all roles, F-02 remains open; separate accounts alone do not prove human/administrative independence.

## 5. Assertion contract

Required signed claims:
- issuer, subject, client ID, tenant ID, ICW audience;
- command, resource/claim scope, canonical request digest;
- policy ID, policy version, policy digest;
- decision ID, unique assertion ID, issued-at, expiry;
- authentication context, entitlement source ID/version;
- schema version, canonicalization version, digest algorithm.

TTL is short and policy-bounded; no numeric TTL is selected here. Replay protection is keyed by issuer, assertion ID, ICW audience and request digest. ICW stores assertion reference and decision provenance with each lifecycle event.

## 6. Acceptance evidence

- Active Okta production tenant and subscription evidence for Custom Authorization Server.
- Configuration export: issuer URI, app integrations, authentication/MFA policy, claims, JWKS/key rotation and System Log.
- Written identity proofing and joiner/mover/leaver procedures; authoritative tenant/agency entitlement sources.
- ADS architecture, hosting/account boundary, network/IAM diagrams and separate named administrators.
- Versioned policy repository, two-person approvals and deterministic decision test vectors.
- HSM custody proof and signed assertion verification vectors.
- Live assertion with required claims; independent verifier reproduces signature and request digest.
- Tests 197–204 for cross-tenant attempts, escalation, stale policy, revocation, altered scope/digest, replay, idempotent retrieval and issuer outage.
- Audit samples linking actor, auth context, entitlement version, policy digest, decision and assertion IDs.
- Independent security review confirming app/DB admins cannot create or broaden authorization.

## 7. Official sources reviewed

- Okta authorization server capabilities: https://developer.okta.com/docs/concepts/auth-servers/
- Okta custom authorization server and production product qualification: https://developer.okta.com/docs/guides/customize-authz-server/main/
- Okta signing-key rotation/JWKS: https://developer.okta.com/docs/concepts/key-rotation/

**F-02 status: OPEN / NOT DEMONSTRATED.** Okta is selected as upstream identity provider and ADS as issuer architecture. No tenant, ADS, policy, separate administrator group, HSM or signed assertion has been provisioned or tested.
