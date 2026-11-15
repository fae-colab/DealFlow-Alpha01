# ICW v4.2 — Independent Review Request for Proposal (RFP)

**Date:** 2026-11-15  
**Status:** Prepared for owner approval and external issue; NOT SENT  
**Companion:** `ICW_V4_2_INDEPENDENT_REVIEW_CHARTER.md`

## 1. Requested engagement

Provide a fixed-scope, independent documentary architecture and security review of the complete DealFlow ICW v4.2 document set, before implementation. The review must challenge the system as a whole, including distributed commit correctness, rollback resistance, cloud/IAM independence, tenant authorization, recovery, cryptographic protocol/key custody and cross-document consistency.

This is a design review only. No codebase implementation, live infrastructure, production data, account access, key ceremony, penetration test or deployment is in scope at this stage.

## 2. Preferred reviewer structure

The scope is multidisciplinary. Request proposals for either:
- one lead firm able to provide distributed-systems/cloud-security and cryptographic protocol expertise; or
- a coordinated two-specialist review, with one lead system-architecture reviewer and one cryptography/key-management specialist.

Preliminary public-service fit, not endorsement or appointment:
- **NCC Group — lead system/security architecture candidate.** Its UK NCSC listing identifies NCC Group as certified for Cyber Security Consultancy and lists audit/review and risk-management services. Contact route published by NCSC: `cyberenquiries@nccgroup.com`. Reference: https://www.ncsc.gov.uk/organisation/ncc-group/cyber-security-consultancy
- **Trail of Bits — cryptographic design specialist candidate.** Its published Cryptography service explicitly offers pre-implementation cryptographic design assessments, algorithm/parameter review, threat-model development and protocol validation. Reference: https://trailofbits.com/services/cryptography/
- **Bishop Fox — alternate architecture-security assessment candidate.** Its published Architecture Security Assessment covers authentication, access control, cryptographic components, logging/auditing, data protection and application architecture. Reference: https://bishopfox.com/services/penetration-testing-services/architecture-security-assessment

The owner must check conflicts, availability, named staff, qualifications, confidentiality terms, subcontractors and report-publication policy before appointment. No firm has been contacted or agreed to this work.

## 3. Proposal response requested

Please provide:
1. Named lead reviewer(s), qualifications and directly relevant distributed-systems, cloud IAM, recovery and cryptography experience.
2. Conflict-of-interest declaration and independence statement.
3. Fixed fee or capped time-and-materials estimate, currency, taxes and payment milestones.
4. Proposed schedule and estimated person-days.
5. Exact document-review scope and exclusions.
6. Methodology for adversarial review of atomic commit, retries, rollback/post-checkpoint authenticity, authority boundaries, F-03 recovery and F-04 crypto/custody.
7. Deliverables matching the companion review charter, including severity-ranked findings and exact document/section references.
8. Whether a second independent cryptographer is included or separately priced.
9. Confidentiality, data handling, retention/deletion, subcontractor and publication terms.
10. Whether a follow-up retest after amendments is included and its fee.

## 4. Deliverables and acceptance

The engagement is accepted only if it includes:
- a signed document-by-document finding matrix;
- a system-level threat model and trust-boundary analysis;
- protocol walkthroughs for commit, retry, checkpoint, recovery, rotation and compromise;
- cross-document contradiction/omission register;
- explicit F-01–F-04 dispositions and unresolved assumptions;
- a signed overall conclusion;
- a remediation/retest proposal.

A high-level sales review, automated scan, generic penetration test or vendor product assessment alone is not sufficient.

## 5. Baseline to be provided after engagement approval

The owner will provide the immutable branch/commit reference and review charter after approving the engagement, confidentiality terms and disclosure scope. The baseline currently includes:
- v4 architecture, server implementation specification, migration/recovery test plan and traceability matrix;
- F-01 provider evaluation and topology reconciliation;
- F-02 authority model;
- original F-03 R01–R30 inventory and companion practical recovery test specification;
- original F-04 custody plan and companion cryptographic trust specification;
- master closure register and execution status.

No secrets, credentials, real customer evidence or private keys will be provided.

## 6. Commercial and authorization boundary

No reviewer fee, purchase order, retainer, travel cost or external disclosure is authorized by this RFP. Do not begin billable work without written approval of the proposal and fee by the owner.

**RFP status: READY FOR OWNER APPROVAL; NOT SENT.**
