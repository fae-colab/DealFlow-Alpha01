# Independent Reviewer Candidate Screen — ICW Trust Closure

**Date:** 2026-11-15  
**Status:** Desk screening only; no vendor contacted, appointed or paid.

## 1. Screening outcome

No single firm is evidenced by its public service description as covering the full combination of distributed-systems consistency, cloud control-plane review, OAuth/authorization assurance, cryptographic key custody and clean-room disaster recovery. A lead reviewer plus specialist reviewers is the safer engagement model.

| Candidate | Publicly described relevant service | Potential role | Limitation / due diligence still required |
|---|---|---|---|
| NCC Group | Cloud Configuration Assessments across AWS/Azure/Google Cloud and Cloud Security Assurance Review covering governance, operations and technology. | Lead cloud/infrastructure and IAM review; assess actual provider configuration and cloud resilience. | Public service page does not prove expertise in ICW receipt linearizability or cryptographic protocol analysis. Confirm named team, methodology and conflict status. |
| Trail of Bits | Cryptographic Design Assessment, protocol threat modeling, cryptographic code assessment, hardware-based cryptography configuration/access control. | Cryptographic protocol/key-lifecycle specialist for F-04 and signature/assertion design. | Public service description does not prove cloud provider durability or clean-room recovery expertise. Confirm availability, scope, conflicts and fees. |
| Bishop Fox | Architecture Security Assessment covering authentication, access control, cryptographic components, audit/logging, data protection and threat modeling; cloud penetration testing across AWS/GCP/Azure. | Adversarial architecture and cloud privilege-boundary review; optional red-team-style configuration challenge. | Public service description does not prove deep cryptographic protocol or recovery-verifier specialization. Confirm reviewer credentials and fit. |

## 2. Evidence sources

- NCC Group cloud security services: https://www.nccgroup.com/technical-assurance/cloud-security-services/
- Trail of Bits cryptography services: https://trailofbits.com/services/cryptography/
- Bishop Fox architecture security assessment: https://bishopfox.com/services/penetration-testing-services/architecture-security-assessment
- Bishop Fox cloud penetration-testing methodology: https://bishopfox.com/resources/cloud-pen-testing-methodology

## 3. Recommended engagement structure

- **Lead reviewer:** NCC Group or another demonstrably independent cloud-security assurance firm, responsible for overall evidence review and F-01/F-03 control-plane/recovery scope.
- **Cryptography specialist:** Trail of Bits or equivalent, independently reviewing signature/assertion protocols, key custody, compromise interval handling and verification semantics.
- **Optional adversarial assessment:** Bishop Fox or equivalent for cloud IAM privilege escalation and application/admin boundary tests.

Do not appoint solely on brand name. Require named staff CVs, directly relevant case studies, written methodology, independence/conflict declaration, secure handling plan, references, scope exclusions and fixed deliverables. The lead reviewer must be able to challenge the other specialists' conclusions.

## 4. Procurement and confidentiality gates

No contact has been made. Before disclosing proprietary architecture or implementation details:
1. Request a short capability statement using a redacted high-level brief.
2. Confirm conflicts and relevant experience.
3. Execute NDA and secure evidence-handling terms before sharing detailed documents, repo access or configuration exports.
4. Obtain a written fixed-scope proposal, fee, schedule, named reviewers and deliverables.
5. Obtain explicit user approval before accepting any engagement or spending funds.

No prices, availability, reviewer identities or conflicts have been verified. This is not a commissioned engagement.
