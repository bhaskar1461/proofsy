# 🛡️ Data Protection Addendum (DPA) & Privacy Compliance (GDPR, FERPA, CCPA)

**Addendum Reference**: PROOFSY-DPA-2026  
**Applicability**: Educational Institutions, Universities, Corporate Enterprises, and Global Clients.  
**Platform**: Proofsy Digital Credential Platform ([https://proofsy.tech](https://proofsy.tech))

---

## 1. Background & Purpose
This Data Protection Addendum ("DPA") supplements the Master Services Agreement ("Agreement") between Proofsy ("Data Processor" / "Service Provider") and the Customer ("Data Controller" / "Institution") regarding the processing of Personal Data in connection with digital credential issuance and verification.

---

## 2. FERPA Compliance Statement (Higher Education)
For educational institutions subject to the **Family Educational Rights and Privacy Act (FERPA, 20 U.S.C. § 1232g)**:

1. **School Official Designation**: Proofsy acts as a "School Official" with legitimate educational interests regarding student education records processed for certificate generation.
2. **Direct Control**: Proofsy performs institutional credentialing services under the direct control and instruction of the educational institution.
3. **Non-Disclosure**: Proofsy will not disclose personally identifiable student information (PII) to any unauthorized third party except as authorized by the institution or required by law.
4. **Student Rights**: Educational institutions retain full capability through the Proofsy Console to correct, update, or revoke student credential records upon request.

---

## 3. GDPR & Global Data Privacy Compliance (EU/UK/International)

### 3.1 Roles of the Parties
* **Customer as Controller**: Customer determines the categories of data subjects (e.g., students, workshop attendees, certified professionals) and the specific personal data fields included on credentials.
* **Proofsy as Processor**: Proofsy processes Personal Data solely on documented instructions from Customer to deliver credentialing services.

### 3.2 Data Processing Details
* **Categories of Data Subjects**: Students, alumni, hackathon participants, employees, course graduates.
* **Types of Personal Data**: Recipient Name, Recipient Email Address, Course / Event Title, Completion Date, Credential Distinction Grade.
* **Duration of Processing**: For the duration of the Customer subscription, plus a retention period designated by Customer for credential validation.

### 3.3 Data Subject Rights
Proofsy provides technical capabilities to assist Customer in fulfilling obligations under GDPR Articles 15–22 and CCPA:
* **Right of Access**: Recipients can view all credentials linked to their email at `proofsy.tech/recipient/[email]`.
* **Right to Rectification**: Admins can update misspelt recipient names via the Proofsy console.
* **Right to Erasure ("Right to Be Forgotten")**: Customer administrators can permanently delete recipient records and invalidate associated verification URLs upon verified request.

---

## 4. Technical and Organizational Security Measures (TOMs)

Proofsy implements the following technical safeguards:

| Domain | Implemented Controls |
| :--- | :--- |
| **Encryption in Transit** | Enforced TLS 1.3 / HTTPS encryption across all API endpoints, web views, and storage buckets. |
| **Encryption at Rest** | AES-256 encryption applied to all database storage volumes, backups, and cryptographic keyrings. |
| **Access Control** | Role-Based Access Control (RBAC) with JWT session tokens and workspace-scoped data boundary isolation. |
| **Vulnerability Management** | Automated dependency security scanning, regular vulnerability patch cycles, and container isolation. |
| **Data Redundancy** | Daily automated encrypted backups with geo-distributed snapshot storage. |

---

## 5. Sub-Processors
Proofsy utilizes reputable, enterprise-grade cloud sub-processors to deliver the service:
* **Amazon Web Services (AWS)**: Cloud infrastructure hosting, compute, and encrypted storage.
* **MongoDB Atlas**: Managed database services with automated encryption at rest.
* **Groq Cloud / Meta Llama 3.3**: Ephemeral inference processing for natural-language template design and chat assistant (zero data retention policy).

---

### Authorized Acceptance:

**For Proofsy:**  
Name: ___________________________  
Title: Data Protection Officer  
Date: ___________________________  

**For Customer ([Institution Name]):**  
Name: ___________________________  
Title: Authorized Privacy / Compliance Officer  
Date: ___________________________  
