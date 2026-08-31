# ⚖️ Master Services Agreement & Service Level Agreement (SLA)

**Agreement Reference**: PROOFSY-MSA-2026-V1  
**Provider**: Proofsy Digital Credential Platform ([https://proofsy.tech](https://proofsy.tech))  
**Customer**: [Client Institution / Enterprise Name]  
**Effective Date**: [Date]

---

## 1. Scope of Services
Proofsy grants Customer a non-exclusive, worldwide, subscription-based right to access and use the Proofsy SaaS platform for generating, cryptographically signing, delivering, and managing digital credentials and verifiable certificates.

---

## 2. Intellectual Property & Data Ownership
* **Customer Data & Brand Assets**: Customer retains **100% full ownership** of all recipient data, student lists, brand trademarks, logos, and custom diploma designs uploaded to the platform.
* **Platform Technology**: Proofsy retains all right, title, and interest in and to the platform software, algorithms, cryptographic engines, and user interfaces.
* **Cryptographic Signatures**: The mathematical digital signatures generated during credential issuance remain the permanent, irrevocable property of the Customer and credential recipients.

---

## 3. Service Level Agreement (SLA) & Uptime Guarantee

### 3.1 Availability Commitment
Proofsy commits to maintaining a **Monthly Uptime Percentage of at least 99.9%** ("Target Availability"), excluding Scheduled Maintenance.

$$\text{Monthly Uptime \%} = \frac{\text{Total Minutes in Month} - \text{Downtime Minutes}}{\text{Total Minutes in Month}} \times 100$$

### 3.2 Incident Severity & Response Times

| Severity Level | Description | Target Response Time | Target Resolution Time |
| :--- | :--- | :---: | :---: |
| **Severity 1 (Critical)** | Core certificate generation or verification engine is completely down. | **< 1 Hour** | **< 4 Hours** |
| **Severity 2 (High)** | Major feature failure (e.g., batch CSV upload or AI designer unavailable); workaround exists. | **< 4 Hours** | **< 12 Hours** |
| **Severity 3 (Standard)** | Minor cosmetic or non-critical administrative query. | **< 24 Hours** | **< 48 Hours** |

### 3.3 SLA Service Credits
If Monthly Uptime falls below 99.9%, Customer is eligible for Service Credits applied against future subscription invoices:
* **< 99.9% but $\ge$ 99.0%**: 10% Credit of monthly fee
* **< 99.0% but $\ge$ 95.0%**: 25% Credit of monthly fee
* **< 95.0%**: 50% Credit of monthly fee

---

## 4. Confidentiality & Security
1. **Confidential Information**: Both parties agree to protect and maintain the confidentiality of all proprietary technical, financial, and student data.
2. **Security Safeguards**: Proofsy maintains administrative, physical, and technical safeguards (including AES-256 at rest, TLS 1.3 in transit, and role-based access control) designed to prevent unauthorized access.

---

## 5. Warranties & Limitation of Liability
* **Warranty**: Proofsy warrants that the software will perform substantially in accordance with the Product Documentation and industry cryptographic standards.
* **Liability Cap**: Except for breaches of confidentiality or gross negligence, neither party's aggregate liability under this agreement shall exceed the total fees paid by Customer to Proofsy in the preceding twelve (12) month period.

---

## 6. Term & Termination
* **Term**: The initial term shall be one (1) year from the Effective Date, automatically renewing for successive one-year terms unless either party provides thirty (30) days prior written notice.
* **Data Export Upon Termination**: Upon expiration or termination, Customer may export all recipient records, public keys, and issuance logs in standard JSON/CSV format.

---

### Execution Signatures:

**For Proofsy:**  
Authorized Signature: ___________________________  
Name / Title: ___________________________  
Date: ___________________________  

**For Customer ([Institution Name]):**  
Authorized Signature: ___________________________  
Name / Title: ___________________________  
Date: ___________________________  
