# BSPHCL Advocate Bill Management System - Project Handover Guide

## 1. Project & Academic Internship Overview
The **BSPHCL Advocate Bill Management System (ABMS)** is an enterprise-grade full-stack web application designed for Bihar State Power Holding Company Limited (BSPHCL) to manage empanelled advocate fee bills, track multi-department scrutinies, executive sanctions, and offline disbursements across Patna High Court, district courts, and tribunals.

### Student Development Team:
- **Raushan Kumar** (Reg. No: **23151144003**) — *Project Lead & Full-Stack Developer*
- **Anubhav Asthana** (Reg. No: **23151144004**) — *Frontend UI/UX & Testing*
- **Dipanshu Raj** (Reg. No: **23151144001**) — *Database Architecture & Testing*

### Academic & Institutional Details:
- **College:** Government Engineering College, Munger (GEC Munger)
- **Department:** Computer Science & Engineering (Artificial Intelligence) — CSE (AI)
- **Semester & Session:** 7th Semester | Session 2023–2027
- **Internship Duration:** **30/10/2026 to 27/11/2026** (1 Month)

### Mentorship & Supervision:
- **Mr. Sandeep Kumar** — *Under Secretary*, Dept. of HR & Administration, BSPHCL
- **Alok Sir** — *IT Department In-Charge*, BSPHCL
- **Mr. Ajay Kumar (DBA)** — *Database Administrator*, IT Cell, BSPHCL
- **Company:** Bihar State Power Holding Company Ltd. (BSPHCL), Vidyut Bhawan, Bailey Road, Patna

- **Frontend Application:** React.js 18, Vite, Lucide Icons, responsive departmental CSS
- **Backend API:** Node.js, Express.js, MongoDB / Mongoose, JWT Authentication, Multer PDF storage
- **Documentation:** `BSPHCL_Advocate_Management_System_Handover_Report_GEC_Munger.pdf` and `README.md`

---

## 2. Live Cloud Deployment URLs
- **Web Application (Vercel):** https://bsphcl-advocate-ms.vercel.app
- **Backend API (Render):** https://bsphcl-advocate-api.onrender.com
- **Source Code Repository (GitHub):** https://github.com/raushanpotter/bsphcl-advocate-ms

---

## 3. Departmental Roles & Login Credentials

All 5 core departments have dedicated pre-seeded user accounts:

| Department | Role | Username | Password | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `ADMIN` | `admin` | `Admin@123456` | Department user management, advocate empanelment, global bill ledger, audit logs & CSV reports. |
| **HR & Establishment** | `HR` | `hr_officer` | `Hr@123456` | Intake advocate physical fee bills, scan & upload PDF, register bill details, submit to Legal, refill & resubmit returned bills. |
| **Holding Legal Cell** | `LEGAL` | `legal_head` | `Legal@123456` | Scrutinize case details, verify advocate appearances & rate schedules, forward to GM or return to HR with remarks. |
| **General Management** | `GM` | `gm_approval` | `Gm@123456` | Review legal recommendations, determine approved sanction amount, issue sanction letter number & order PDF. |
| **Accounts & Finance** | `ACCOUNTS` | `accounts_officer` | `Accounts@123456` | Record offline disbursements (NEFT/RTGS/Cheque), enforce overpayment guard, mark bills as PAID upon full settlement. |

---

## 4. How to Run Locally

### Prerequisites
- Node.js (v18.0 or newer)
- Internet connection (or local MongoDB on `mongodb://localhost:27017/bsphcl_advocate_bills`)
  - *Note: If MongoDB is not running locally, the system automatically launches an embedded in-memory MongoDB database so you can test zero-dependency!*

### Step 1: Start Backend API
```powershell
# Open terminal 1
cd server
npm install
npm start
```
- API will be live at: `http://localhost:5000`
- Database automatically seeds default accounts and empanelled advocates on startup.

### Step 2: Start Frontend Web Client
```powershell
# Open terminal 2
cd client
npm install
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

### Step 3: Run Automated Verification Tests
```powershell
# Open terminal
cd server
node test_workflow.js
```
- Executes 14 end-to-end integration test scenarios validating all permissions, role transitions, return flows, and overpayment guards.

---

## 5. Sequential Workflow Architecture
$$\text{HR (Intake \& Scan)} \longrightarrow \text{LEGAL (Verification)} \longrightarrow \text{GM (Sanction \& Approval)} \longrightarrow \text{ACCOUNTS (Offline Disbursement)}$$

1. **HR Intake:** Physical invoice intake, PDF upload, unique Bill ID generation (`BSPHCL/ABM/YYYY/0001`).
2. **Legal Verification:** Case verification, schedule checking, return with correction remarks or forward to GM.
3. **GM Sanction:** Executive approval, sanction amount assignment, sanction order upload.
4. **Accounts Settlement:** Disburses via NEFT/RTGS/Cheque, partial payments, strict overpayment validation, marked `PAID`.
5. **Audit Trail:** Every action recorded in immutable `BillHistory` ledger with timestamp and performer.

---

## 6. Directory Structure
```
advocate MS/
├── client/                     # Frontend React SPA
│   ├── src/                    # Components, pages, context, styles
│   │   ├── pages/              # Admin, HR, Legal, GM, Accounts, Bills
│   │   ├── components/         # Modals, Navbar, Sidebar, Badges, Timelines
│   │   ├── context/            # AuthContext
│   │   └── services/           # Axios API configuration
│   ├── dist/                   # Production build
│   └── package.json
├── server/                     # Backend Express API
│   ├── controllers/            # Controller logic per role
│   ├── models/                 # Mongoose schemas (User, Advocate, Bill, Payment, BillHistory)
│   ├── routes/                 # Protected API routes
│   ├── seed/                   # Database seeder with 5 roles & advocates
│   ├── data/                   # Custom empanelled advocates database
│   ├── uploads/                # Document storage directory
│   ├── test_workflow.js        # 14-point automated test suite
│   ├── server.js               # Entry point
│   ├── .env                    # Environment configuration
│   └── package.json
├── BSPHCL_Advocate_Management_System_Guide.pdf  # Project guide PDF
├── HANDOVER_NOTES.md           # This handover document
├── README.md                   # Full technical documentation
├── render.yaml                 # Render cloud deployment blueprint
└── vercel.json                 # Vercel deployment configuration
```
