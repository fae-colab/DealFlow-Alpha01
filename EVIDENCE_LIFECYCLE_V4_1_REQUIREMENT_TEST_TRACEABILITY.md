# Evidence Lifecycle v4.1 — Requirement/Test/Evidence Traceability

**Status:** Documentation-only traceability supplement.  
**Baseline:** v4 traceability matrix.  
**Authorization:** No implementation or test execution is authorized.

## 1. Trust-closure traceability

| Requirement | Normative source | Acceptance tests | Required closure evidence | Closure owner |
|---|---|---|---|---|
| F01-R1: Durable acknowledgement binds complete envelope | Architecture A14; Server S14 | 188, 189, 190 | Provider durability contract; receipt/object read-back | Independent infrastructure reviewer |
| F01-R2: Independent failure-domain survival | Architecture A14; Server S14 | 191, 192 | Replication config; witnessed fault report | Independent infrastructure reviewer |
| F01-R3: Privileged deletion/rollback resistance | Architecture A14; Server S14 | 193, 194 | IAM, retention, audit and adversarial report | Independent security reviewer |
| F01-R4: Missing object fails closed | Architecture A14; Server S14 | 195, 196 | Quarantine report and verifier output | Independent trust reviewer |
| F02-R1: Issuer independence and identity provenance | Architecture A15; Server S15 | 197, 198 | Trust-boundary, identity and entitlement specifications | Independent security reviewer |
| F02-R2: Policy-bound request assertions | Architecture A15; Server S15 | 199, 200 | Policy versions, assertion vectors and verifier output | Independent security reviewer |
| F02-R3: Revocation, replay and compromise | Architecture A15; Server S15 | 201–204 | Revocation and compromise test evidence | Independent security reviewer |
| F03-R1: Ledger recovery without relational DB | Architecture A16; Server S16 | 205, 206 | Clean-room recovery transcript and receipt verification | Independent recovery reviewer |
| F03-R2: Content and snapshot recovery | Architecture A16; Server S16; F-03 practical recovery specification §3 R06 | 207–209, 221–225 | Exact payload inventory, source/version binding, ciphertext/plaintext digests, backup/DR key-lineage map, isolated restore/decryption transcripts | Independent recovery reviewer |
| F03-R3: Decision dependency reconstruction | Architecture A16; Server S16 | 210–212 | Dependency manifest and replay report | Independent decision-audit reviewer |
| F03-R4: Partial/erasure semantics and total-loss exercise | Architecture A16; Server S16; F-03 practical recovery specification §3 R06-ERASE-01 | 213–215, 221–225 | Signed tombstone plus independently verified key-copy inventory, provider backup semantics, restore/escrow test results, residual-plaintext inspection; no false FULL | Independent privacy/recovery reviewer |
| F03-R5: Erasure irrecoverability across backup/DR recovery domains | F-03 practical recovery specification §3 R06-ERASE-01; §3 R29; §5 C04/C09 | 221–225 | DEK/KEK lineage and copy inventory; isolated backup, DR, escrow and historical KMS/HSM restore attempts; residual plaintext inspection; raw provider logs and independent sign-off | Independent privacy/recovery and cryptographic reviewers |
| F04-R1: Key custody/history/compromise | Architecture A17; Server S17 | 216–220, supporting evidence for 221–224 | KMS/HSM evidence, key history, custody/quorum and compromise exercise; payload-key erasure remains separately assessed under F03-R5 | Independent cryptographic reviewer |

## 2. Test evidence contract

Every test result MUST record: test ID; requirement ID; commit/document digest; provider and service tier; configuration export digest; issuer and key identifiers; environment and failure-domain topology; injected fault/adversary; start/end timestamps; receipt IDs and envelope digests; raw logs/audit evidence; verifier build digest; expected and observed result; deviations; reviewer identity and disposition.

A test is BLOCKED—not PASS—if provider configuration, policy version, key identity, deployment parameters, failure model or required evidence is missing.

## 3. Closure state

All requirements F01-R1 through F04-R1 are currently **OPEN / NOT DEMONSTRATED**. The test numbers are acceptance criteria, not claims of execution. No provider, issuer, KMS, retention tier or recovery topology has been selected or validated by this document.
