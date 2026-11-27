# BSPHCL Advocate Bill Management System

**Full-Stack Web Application for Bihar State Power Holding Company Limited (BSPHCL)**  
*Developed as an internship project to streamline advocate fee invoice processing, multi-department verification, executive sanction, and offline disbursement tracking.*

---

## 1. Executive Summary & Purpose

The **BSPHCL Advocate Bill Management System** is a responsive web application engineered to manage court case fee bills submitted by empanelled advocates representing BSPHCL, SBPDCL, NBPDCL, BSPTCL, and BSPGCL across the High Court of Judicature at Patna, district courts, and tribunals.

### Core Workflow
The application strictly enforces a sequential 4-stage departmental pipeline:

$$\text{HR (Intake \& Scan)} \longrightarrow \text{LEGAL (Verification)} \longrightarrow \text{GM (Sanction \& Approval)} \longrightarrow \text{ACCOUNTS (Offline Disbursement)}$$

---

## 2. Technology Stack

- **Frontend:**
  - React.js (v18.2) with Vite
  - React Router DOM (v6.20) for role-protected routing
  - Axios for authenticated REST API calls
  - Lucide React for departmental iconography
  - Custom responsive Government Portal CSS design system

- **Backend:**
  - Node.js & Express.js REST API
  - MongoDB & Mongoose ORM
  - JWT Authentication with HTTP Bearer tokens
  - bcryptjs for password hashing (cost factor 12)
  - Multer for PDF bill invoice and sanction letter attachments
  - Standalone In-Memory MongoDB engine fallback for zero-dependency evaluation

---

## 3. User Roles & Permission Matrix

There are **exactly 5 departmental roles** with no public registration:

| Role | Primary Functions | Prohibitions |
| :--- | :--- | :--- |
| **ADMIN** | System management, create departmental logins, reset passwords, activate/deactivate accounts, advocate management, global bill tracking, reports. | None (Complete System Access) |
| **HR** | Intake physical advocate invoices, scan/upload PDF bills, register bill records, forward bills to Legal, receive returned bills, edit and resubmit. | Cannot approve amounts or record payments. |
| **LEGAL** | Scrutinize case details, verify court appearance and rate schedules, add verification remarks, forward to GM, return to HR with remarks, or reject. | Cannot financially sanction or disburse payments. |
| **GM** | Sole management approval stage. Review legal remarks, determine approved sanction amount, enter sanction letter number/date, upload sanction PDF, approve or reject. | Combined HOD & GM stage. |
| **ACCOUNTS** | View GM-sanctioned bills, record offline payments (NEFT/RTGS/Cheque), validate that payment $\le$ remaining balance, mark bills as PAID upon full settlement. | No online payment gateway (offline tracking only). |

---

---

## 5. Sequential Workflow Details

1. **Stage 1: HR Registration**
   - Unique internal Bill ID generated: `BSPHCL/ABM/YYYY/####`
   - Select advocate, enter original invoice number, invoice date, submission date, claimed amount, court case number, court name, department, remarks, and PDF bill document.
   - Status: `DRAFT` $\rightarrow$ `HR_SUBMITTED` (Forwarded to Legal).

2. **Stage 2: Legal Verification**
   - Legal examines bill details, court case numbers, and scanned documents.
   - **Action 1:** Verify & Forward $\rightarrow$ status `LEGAL_VERIFIED` (Current Stage: `GM`).
   - **Action 2:** Return to HR $\rightarrow$ status `RETURNED_TO_HR` (Mandatory return remarks; HR can edit and resubmit).
   - **Action 3:** Reject $\rightarrow$ status `REJECTED` (Mandatory rejection reason; workflow terminates).

3. **Stage 3: GM Approval (Management Sanction)**
   - GM evaluates legal scrutiny remarks and original claim.
   - Enters final **Approved Amount** (can differ from claimed amount, e.g. ₹45,000 sanctioned for a ₹50,000 claim).
   - Enters **Sanction Letter Number**, **Sanction Letter Date**, and uploads Sanction Order PDF.
   - Status: `APPROVED` (Current Stage: `ACCOUNTS`).

4. **Stage 4: Accounts Offline Payment**
   - Accounts views sanctioned liability and payment history.
   - Enters offline disbursement details: Payment Amount, Date, Mode (`NEFT`, `RTGS`, `Cheque`, `Other`), Transaction/UTR Reference, and Remarks.
   - Multiple partial payments are fully supported.
   - **Overpayment Guard:** Attempts to pay more than the outstanding approved balance are strictly blocked with HTTP 400.
   - Status transitions to `PARTIALLY_PAID`, and automatically to `PAID` (Stage: `COMPLETED`) once the full approved amount is cleared.

---

## 6. Installation & Run Instructions

### Prerequisites
- Node.js (v18.0 or higher recommended, tested on Node v24)
- (Optional) Local MongoDB or MongoDB Atlas URI (If not running, the system automatically falls back to an embedded in-memory MongoDB instance)

### Step 1: Clone or Open Project Directory
```powershell
cd "c:\Users\Raushan\OneDrive\DEVELOPMENT\advocate MS"
```

### Step 2: Backend Setup
```powershell
cd server
npm install
```

Configure `server/.env` (already created with defaults):
```ini
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bsphcl_advocate_bills
JWT_SECRET=bsphcl_jwt_secret_2024_secure_key
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=System Administrator
```

Start the backend server:
```powershell
npm start
```
*Backend will run on: `http://localhost:5000`*

### Step 3: Frontend Setup
In a new terminal window:
```powershell
cd client
npm install
npm run dev
```
*Frontend will run on: `http://localhost:5173`*

---

## 7. Automated Test Suite (14 Verification Cases)

An automated end-to-end integration test is included in `server/test_workflow.js`.

To run the verification suite:
```powershell
cd server
node test_workflow.js
```

### Test Results Summary:
- **14 Passed, 0 Failed**
1. Admin logs in successfully
2. Admin authenticates department roles (HR, Legal, GM, Accounts)
3. HR adds a new advocate
4. HR registers a bill in system (`BSPHCL/ABM/2026/0001`)
5. HR submits bill to Legal Department
6. Legal verifies bill and forwards to GM
7. GM approves bill with sanction amount (₹45,000 on ₹50,000 claim)
8. Accounts records a partial payment (₹20,000)
9. Accounts records the remaining payment (₹25,000)
10. Bill status confirmed as `PAID` and stage `COMPLETED`
11. Bill history audit trail captures all workflow transitions
12. Unauthorized roles blocked from restricted endpoints (403 Forbidden)
13. Returned to HR and Rejected bills behave correctly
14. Overpayments exceeding approved amount are blocked (400 Bad Request)

---

## 8. Completed Features Summary

- [x] Full REST API backend with modular controllers, routes, and middleware.
- [x] JWT authentication and role authorization protecting all endpoints.
- [x] MongoDB Mongoose schemas for Users, Advocates, Bills, Payments, and BillHistories.
- [x] Resilient database launcher (connects to local/Atlas MongoDB or boots up embedded in-memory database).
- [x] Complete advocate registry with automatic ID generation (`ADV/0001`), duplicate check on Bar Council enrollment, and advocate-wise bill ledger.
- [x] Bill registration with auto ID format `BSPHCL/ABM/YYYY/0001` and PDF upload support.
- [x] Comprehensive workflow timeline with interactive scrutiny, sanction, and payment modals.
- [x] Multi-tier financial summaries (Total Claimed, Total Approved, Total Disbursed, Total Outstanding).
- [x] Filterable master bills table with search by Bill ID, Original Bill No, Case No, and Advocate Name.
- [x] Complete audit logging of every transition with timestamps, actor name, and role.
- [x] Reports module with date range filters, status breakdowns, and CSV export.
