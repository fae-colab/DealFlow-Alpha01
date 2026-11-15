# Evidence Lifecycle — Migration and Acceptance Test Plan v4.1

**Status:** Test specification only. Tests have NOT been executed.  
**Baseline:** v4 test plan.  
**Authorization:** No test execution, migration or evidence ingestion is authorized by this document.



## 26. F-01 — Durable receipt and complete-envelope tests

188. **Acknowledgement ordering:** inject delay/failure between envelope write, immutable-retention confirmation and receipt publication. PASS only if no receipt/success response occurs before complete object durability and immutable identity/digest confirmation.
189. **Immediate crash after acknowledgement:** terminate witness process/node and storage client immediately after reported durable acceptance. PASS only if exact receipt and complete envelope bytes remain retrievable and verify under the declared provider contract.
190. **Envelope byte completeness:** truncate, omit, reorder or corrupt one envelope component before attempted receipt publication. PASS only if ICW rejects without head/sequence advancement.
191. **Replica/failure-domain loss:** fail the acknowledging node and each declared replica/failure domain in turn. PASS only if every acknowledged receipt and complete envelope remain retrievable within declared availability objectives and no acknowledged data is lost.
192. **Regional recovery:** simulate loss of the primary region/control plane within the declared disaster model. PASS only if the independent recovery region retrieves the same receipt chain and byte-identical envelopes within approved RPO/RTO; any loss beyond the approved contract is FAIL.
193. **Privileged retention attack:** exercise each documented provider/storage administrator role attempting delete, overwrite, shorten retention, suspend immutability, alter replication or suppress audit. PASS only if unauthorized actions are denied or independently detected/contained according to the declared threat model; any silent deletion or retention bypass is FAIL.
194. **Database-admin boundary:** with database-owner and application-admin credentials, attempt to modify witness object, receipt, retention and audit state. PASS only if all such actions are denied and ICW history remains byte-identical.
195. **Missing/altered envelope:** remove or substitute a referenced envelope in a controlled fixture. PASS only if verification fails at the exact object and ledger is quarantined; no DB copy is promoted.
196. **Read-back/retention verification:** independently retrieve acknowledged objects after restart and verify object version, exact byte length, digest, retention policy and receipt binding. PASS only if all values match and audit trail is complete.

## 27. F-02 — Independent authorization authority tests

197. **Issuer trust-domain separation:** inspect live IAM, account/project boundaries, network paths, key policy and administrative roles. PASS only if ordinary application/database administrators cannot issue assertions, invoke issuer signing keys or modify issuer policy/trust roots.
198. **Identity and tenant provenance:** submit actor, client, tenant or resource values altered in request body/header while authenticating as a different principal. PASS only if issuer derives authoritative identity/scope from trusted sources and ICW rejects mismatched bindings.
199. **Policy-version binding:** issue assertion under policy version P, alter policy reference/digest or attempt acceptance after prohibited policy withdrawal. PASS only if ICW validates exact permitted policy/version state and rejects altered/stale assertions.
200. **Assertion exact-scope binding:** alter command, claim/resource scope, tenant, ICW audience or canonical request digest after assertion issuance. PASS only if signature/binding validation rejects every mismatch without receipt.
201. **Privilege escalation:** compromise ordinary application-admin credentials and request an assertion for an unauthorized actor, tenant, command or resource. PASS only if issuer denies and ICW accepts no batch.
202. **Revocation and disabled identity:** revoke actor, client, issuer key or entitlement and attempt new append and idempotent result retrieval. PASS only if new append is denied and result retrieval follows current authorization policy.
203. **Replay and idempotency:** replay assertion for a new request, different digest, different ledger or new idempotency key; also retry exact original request. PASS only if only exact idempotent retry can resolve original receipt and no second append is created.
204. **Issuer outage/compromise:** make issuer status unavailable or mark signing key compromised. PASS only if new appends fail closed, affected scope is quarantined as required, and no application-local authorization fallback succeeds.

## 28. F-03 — Complete authoritative-history recovery tests

205. **Clean-room ledger reconstruction:** provide recovery credentials and ICW access but no relational database, backup, application cache or app-generated export. PASS only if verifier reconstructs genesis-to-head receipt and lifecycle history with contiguous sequences and valid signatures.
206. **Lifecycle semantic replay:** independently replay every event from accepted envelopes. PASS only if all transitions, terminal-state rules, supersession links, tenant boundaries and graph invariants reproduce the authoritative ledger state.
207. **Evidence content retrieval:** retrieve all retained evidence payloads referenced by the ledger. PASS only if every object matches its receipt-bound digest and retention metadata; missing/altered content is explicitly identified.
208. **Authorization provenance reconstruction:** retrieve and verify the authorization assertion, issuer trust chain, policy version/digest and decision record for every accepted mutation. PASS only if no accepted event lacks verifiable authorization provenance under the declared contract.
209. **Snapshot and finalization reconstruction:** retrieve every finalized snapshot and snapshot-finalization receipt. PASS only if snapshot bytes, digest, receipt watermark, ledger provenance and immutable object reference verify independently.
210. **Dependency-manifest completeness:** enumerate every dependency required by each historical decision, including engine/runtime, policy, taxonomy, projector, canonicalizer, feature/normalization definitions, config, external responses, prompts/templates and actual structured model outputs where applicable. PASS only if each item resolves to an immutable version and digest or is explicitly marked missing.
211. **Deterministic decision replay:** replay a deterministic historical decision from exact retained inputs and artifacts. PASS only if canonical outputs, eligibility states/reasons, recommendation/abstention and ordering match the original under the versioned execution contract.
212. **Nondeterministic model history:** reconstruct a model-assisted decision using preserved actual structured model output and metadata. PASS only if integrity of the recorded output and deterministic downstream computation verify without requiring remote model rerun equality.
213. **Legal erasure semantics:** erase a permitted payload/key while retaining allowed integrity metadata and tombstone. PASS only if receipt integrity can remain VERIFIED where justified, content/decision reconstruction becomes PARTIAL/UNAVAILABLE, and no erased plaintext is claimed as recovered.
214. **Missing dependency oracle:** remove one referenced artifact, schema version, key history item or external response. PASS only if the exact missing stable ID/digest/class is reported and aggregate FULL is prohibited.
215. **Total relational database loss:** destroy/withhold all relational backups and recover in a clean environment. PASS only if the declared recovery scope is reconstructed from ICW and independent stores, recovery manifest is complete, head matches and re-enable requires independent approval.

## 29. F-04 — Cryptographic trust lifecycle tests

216. **Historical key verification:** verify receipts signed across every documented key rotation. PASS only if historical public keys, certificate chains and validity/revocation records establish the correct signing authority.
217. **Signing-key compromise:** simulate compromise at a known time. PASS only if appends suspend, affected range is identified, last-known-good receipt is established independently and no uncertain receipt is silently accepted.
218. **Database-admin key boundary:** use application/database administrator credentials to invoke, export or alter witness/issuer signing keys or policies. PASS only if denied and independently audited.
219. **Algorithm/canonicalization migration:** verify historical receipts after approved algorithm/schema version transition. PASS only if exact historical verifier versions and migration evidence are available without rewriting original receipts.
220. **Unresolved compromise interval:** create a fixture where authenticity cannot be re-established for a receipt interval. PASS only if ledger remains quarantined from last verified position and new epoch cannot claim continuity over the gap.
