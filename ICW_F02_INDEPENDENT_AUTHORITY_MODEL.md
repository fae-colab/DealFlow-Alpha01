# ICW F-02 Independent Authorization Authority — Proposed Trust Model

**Date:** 2026-11-15  
**Status:** Normative proposal for independent review; issuer/vendor selection remains OPEN. Documentation only.  
**Related control:** ICW Master Closure Register — Baseline 01.  
**Purpose:** Define who has authority to authorize lifecycle commits, how that authority is represented, and what the ICW must independently verify. This document does not provision an identity provider, authorization service, signing key or account.

## 1. Decision boundary

The ICW must not decide that a lifecycle mutation is authorized merely because:
- the application supplied an actor ID or role string;
- a user authenticated successfully;
- an OAuth scope is present;
- the application administrator says an operation is allowed;
- a token is correctly signed by an identity provider that the application controls.

Authentication answers "who presented these credentials?" Authorization answers "may this actor perform this exact operation on this exact tenant/resource now?" They are separate.

**Proposed authority model:** a separately administered Authorization Decision Service (ADS) is the sole issuer of short-lived, request-bound authorization assertions accepted by the ICW. An upstream identity provider (Okta is only a provisional identity-source candidate) authenticates the actor. The ADS evaluates current tenant ownership, delegated permissions, resource scope, lifecycle policy and revocation state. The ADS signs the assertion with a key controlled outside the application and ordinary database administrators. The ICW verifies the assertion itself and never trusts a plain application authorization decision.

The ADS is an independent security authority plane, not a helper library inside the application.

## 2. Authority and responsibility split

| Component / actor | May do | Must not do |
|---|---|---|
| Human tenant owner / explicitly designated tenant authority | Establish initial tenant authority; grant and revoke tenant-scoped roles; delegate permitted actions within that tenant | Grant permissions in another tenant; bypass the ADS audit and approval process |
| Upstream identity provider (Okta candidate) | Authenticate a principal; provide issuer, subject, authentication context and identity-token claims; publish/rotate its own signing keys | Decide lifecycle entitlement solely from a broad group/scope; sign the ICW's request-specific authorization assertion |
| ADS policy authority | Maintain versioned authorization policy and tenant/resource grants; evaluate exact request; issue or deny a signed assertion; revoke/deactivate credentials and grants | Accept app-admin supplied roles or tenant ownership as authoritative without independent verification |
| ADS operator/security administrators | Operate ADS in a separately controlled security account/project; manage its policy release and signing service under dual control | Share ordinary app-admin credentials; allow app admins to modify ADS policy or signing keys |
| DealFlow application/API | Authenticate through the configured identity flow; submit an authorization request; relay the signed assertion and exact request to ICW | Mint, alter, broaden, replay or self-approve assertions; write authoritative lifecycle history directly |
| ICW | Verify issuer trust, signature, audience, time, scope, request digest, assertion ID and replay/idempotency rules; reject invalid assertions | Trust app-supplied actor/role claims; infer authority from a valid login alone; create a receipt without a valid assertion |

**Important:** Okta is not the independent authority in this model. Okta's custom authorization server can issue access tokens with custom scopes/claims and access policies, and Okta documents automatic signing-key rotation. Those capabilities support identity federation and API access control, but they do not by themselves prove that a tenant owner validly granted the specific lifecycle entitlement or bind a one-time assertion to the exact canonical ICW request. The ADS must perform that separate decision and signing step.

## 3. Trust boundary and compromise assumptions

The security objective is to resist compromise of an ordinary DealFlow application administrator or application database administrator.

Required separations:
1. ADS policy store and service runtime are in a security account/project that ordinary app and database administrators cannot administer.
2. ADS signing key is held by a separately administered KMS/HSM boundary. App operators cannot sign, export, rotate, disable or change key policy.
3. ICW has a pinned trust configuration for the ADS issuer and accepted key IDs. It does not accept arbitrary issuer URLs, caller-supplied public keys or unsigned policy claims.
4. Tenant grant changes are attributable to a tenant authority and recorded in an append-only audit stream outside the application database.
5. ADS deployment, policy publication, key changes and break-glass use require separate approvers and independently retained audit records.
6. The ADS administrator, ICW administrator, application administrator and key administrator are distinct roles. No ordinary app admin can impersonate or silently assume the others.
7. If a single organization controls all roles, the residual risk of organization-wide administrator compromise must be stated. Separate projects or products under one super-admin do not create full organizational independence.

Threats not automatically solved:
- compromise of the tenant owner's credentials or device;
- collusion or compromise of ADS security administrators;
- compromise of the ADS signing key or its trust root;
- compromise of the identity provider or its administrators;
- coercion/fraud during initial tenant-owner verification;
- provider/operator compromise beyond the contractual threat boundary.

The system must not claim protection against these events without additional controls and evidence.

## 4. Tenant authority bootstrap

A tenant's first owner cannot be established by trusting a tenant ID, email address, domain claim or first user to sign up.

Before real evidence intake:
1. Verify the legal/organizational identity and authority of the initial tenant owner using an approved out-of-band process appropriate to the customer type.
2. Record the verifier, evidence type, verification date, tenant identifier, owner subject, decision and review artifact digest. Avoid retaining unnecessary identity documents or sensitive personal data.
3. Bind the owner to a stable identity-provider subject, not an email address alone.
4. Require strong authentication and a recovery path independent of the application account.
5. Have a second independent approver confirm the bootstrap grant.
6. Issue a versioned tenant-owner grant in ADS and retain its audit record.
7. Provide a customer-visible revocation and ownership-transfer process with dual approval.

For the prototype using synthetic data, this bootstrap process is not exercised and no real customer or agent authority is implied.

## 5. Authorization assertion contract

Every new lifecycle mutation must carry a signed ADS assertion with at least:

- issuer and signing key ID;
- assertion ID (jti) and assertion schema/version;
- audience fixed to the exact ICW deployment;
- tenant ID, ledger ID and ledger epoch;
- authenticated actor subject and actor/client identity;
- permitted command (createEvidence, supersedeEvidence, revokeEvidence, or withdrawEvidence);
- exact evidence/resource/claim scope, including predecessor and replacement identities for supersession;
- canonical request digest, including all client-controlled semantic fields and the expected current ICW receipt/head;
- policy version/digest and grant/entitlement reference;
- issued-at, not-before and expiry;
- authentication context/assurance level where required;
- unique correlation/request identity.

The assertion must not contain mutable or ambiguous free-form role claims as the sole authorization basis. Scope must be least-privilege and explicit.

The ICW verifies:
1. issuer is exactly the pinned ADS issuer;
2. signing key is trusted, valid for the assertion's issue time and not revoked;
3. signature and canonical serialization are valid;
4. audience exactly matches this ICW;
5. assertion is within its validity window and clock-skew policy;
6. tenant, ledger, epoch, actor, operation and resource scope match the request;
7. canonical request digest matches byte-for-byte after the same versioned canonicalization;
8. assertion ID has not been used for another request;
9. idempotent retry is allowed only for the same original request digest and receipt identity under the specified current-authorization policy;
10. policy/grant version is valid under the accepted revocation semantics.

Missing, expired, wrong-audience, wrong-scope, mismatched-digest, revoked-key or replayed assertions are rejected without advancing the ICW head or creating a receipt.

## 6. Revocation, expiry and replay

- Assertions are short-lived. Exact maximum lifetime and clock-skew tolerance belong in the signed deployment parameter register; no default is authorized here.
- Revoking a user, credential, tenant grant or signing key prevents new assertions from being issued under the revoked authority.
- The ADS maintains a monotonic revocation/policy version. The ICW must have a defined way to reject an assertion based on a superseded/revoked policy version; relying on an unbounded offline token lifetime is prohibited.
- The ICW checks assertion validity at the commit boundary. An assertion accepted for a committed receipt does not retroactively invalidate that historical commit if the actor is later revoked.
- A retry of a previously committed request must not create a new receipt. Before disclosing the original receipt, the service rechecks current authorization according to the privacy policy; if no longer authorized, it returns a non-disclosing result.
- A same-key/different-digest retry is an integrity conflict.
- If ADS or its revocation state cannot be reached and the assertion is outside the approved freshness/revocation window, the mutation fails closed. There is no app-side fallback.

## 7. Key custody and rotation

The ADS signing key is not the same key as the Okta identity-provider key, ICW receipt key, checkpoint key or snapshot key.

Required controls:
- key generated and held in a separately administered KMS/HSM;
- signing permission restricted to the ADS runtime identity and narrowly controlled operators;
- key use logged to an independent audit sink;
- no exportable private key in app configuration, source control or environment variables;
- versioned public-key history retained for the audit horizon;
- planned rotation with overlap, verifier cache refresh and an explicit cutover record;
- emergency compromise procedure that revokes the key, quarantines affected assertions and prevents silent re-signing of history;
- independent test vectors for valid, expired, wrong-audience, altered-payload and revoked-key assertions.

The specific KMS/HSM vendor remains part of F-04 and is not selected here.

## 8. Issuer and policy-engine evaluation

### Okta Custom Authorization Server — identity/access-token role only

Okta documents that a custom authorization server supports custom scopes, claims and access policies for protected APIs, and that its signing keys rotate automatically by default. This makes it a plausible upstream identity/access-token provider. It does not remove the need for the ADS to verify tenant ownership, resource-level entitlement, exact request digest and current revocation state. Okta must not be treated as the ADS signing authority in this design.

### Amazon Verified Permissions / Cedar — possible policy-decision component, not the issuer

AWS documents Verified Permissions as a service that evaluates Cedar policies and returns an ALLOW/DENY decision; it presumes the principal has already been authenticated elsewhere. It may be used inside a separately administered ADS to evaluate policy, but it does not by itself satisfy the request-bound signed assertion contract. A separate ADS wrapper and separately controlled signer would still be required. Policy-store administrators and audit controls must be independently separated from app admins.

### Open Policy Agent — possible policy engine, not the authority by itself

OPA can evaluate policy and retrieve external data, but a policy engine alone does not establish identity, tenant ownership, signer custody, independent administration or a signed request-bound assertion. If used, it must sit inside the ADS boundary and its policy/data distribution and signer integration must be specified and tested.

**Preliminary disposition:** Keep Okta as a provisional upstream identity-provider candidate. Define ADS as the actual authorization decision and assertion-issuing authority. Do not select Okta, Verified Permissions, OPA or a hosting provider as the complete F-02 solution until organizational ownership, trust roots, policy control, signing custody, revocation and audit evidence are demonstrated.

## 9. Required acceptance tests

The following must be executable against the selected ADS/ICW integration:

1. App administrator attempts to grant self tenant-owner rights: denied; no assertion.
2. App administrator alters tenant ID, actor, role, resource or operation in a request: ADS independently rejects.
3. Valid Okta login with no tenant grant: denied.
4. Valid tenant grant for one evidence item, but request targets another: denied.
5. Valid token for one operation, but request invokes a different lifecycle command: denied.
6. Request body altered after assertion issuance: digest mismatch; no receipt.
7. Assertion replayed for a different request or tenant: denied; no receipt.
8. Exact idempotent retry after successful commit: original receipt resolved; no new sequence; current authorization checked before disclosure.
9. Actor revoked before new request: denied.
10. Actor revoked after commit and before retry: no new mutation; original receipt not disclosed unless policy permits.
11. ADS outage, stale revocation data or expired assertion: fail closed.
12. Signing key rotation: old valid historical assertions verify for the permitted historical window; newly issued assertions use the approved key; revoked key is rejected.
13. ADS key compromise simulation: affected trust range quarantined; no silent history rewrite.
14. Tenant owner transfer: old owner loses authority and new owner is independently verified; no gap permits app-admin self-grant.
15. Independent verifier validates issuer, key history, assertion signature, canonical request digest, policy version and ICW receipt binding without trusting the application database.

Every test result is PASS, FAIL, BLOCKED or NOT RUN with exact artifact and version. BLOCKED/NOT RUN are not PASS.

## 10. Selection gates and open decisions

Still required:
- Who is the independent legal/organizational owner of the ADS?
- Is the ADS operated by a distinct security team/entity, with no shared app-admin or cloud-super-admin path?
- How is the first tenant owner verified and who approves that verification?
- Which identity provider supplies authenticated subject and assurance context?
- Which policy engine evaluates tenant, actor, operation and resource entitlements?
- Where is the ADS signer hosted and who controls key policy?
- How is immediate revocation achieved or bounded during ADS/IdP outages?
- How are tenant ownership transfer, lost-account recovery and emergency revocation handled?
- What are the exact assertion lifetime, clock skew, audit retention and policy-version freshness parameters?

**Authorization boundary:** This is a proposed control-plane contract, not an implementation. No provider account, Okta org, ADS, policy store, signer, credential or tenant-owner record has been created. F-02 remains BLOCKED pending independent review and explicit selection.

## 11. Primary vendor documentation reviewed (2026-11-15)

- Okta authorization servers: https://developer.okta.com/docs/concepts/auth-servers/
- Okta signing-key rotation: https://developer.okta.com/docs/concepts/key-rotation/
- Okta custom authorization server policies and claims: https://developer.okta.com/docs/guides/authorization/
- Amazon Verified Permissions overview and authentication boundary: https://docs.aws.amazon.com/verifiedpermissions/latest/userguide/what-is-avp.html
- Amazon Verified Permissions policy stores and schema validation: https://docs.aws.amazon.com/verifiedpermissions/latest/userguide/policy-stores.html
- Open Policy Agent external data and evaluation: https://www.openpolicyagent.org/docs/external-data

**Evidence boundary:** Vendor documentation describes product capabilities. It does not establish that a deployed ADS is organizationally independent, correctly configured, uncompromised, or entitled to speak for a particular tenant. Those facts require actual ownership records, permission exports, key-custody evidence, policy artifacts and independent adversarial tests.
