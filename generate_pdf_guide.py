import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip header and footer on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(40, 810, "BSPHCL Advocate Bill Management System — Technical Architecture & Learning Guide")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 804, 555, 804)

        # Running Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 30, page_text)
        self.drawString(40, 30, "Confidential — For Learning & Technical Evaluation Only")
        self.line(40, 40, 555, 40)
        self.restoreState()

def build_pdf(filename="BSPHCL_Advocate_Management_System_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom typography palette
    primary_color = colors.HexColor("#1e3a5f")    # BSPHCL Dark Blue
    accent_blue = colors.HexColor("#2563eb")      # Vibrant Blue
    secondary_color = colors.HexColor("#0f172a")  # Slate 900
    text_muted = colors.HexColor("#475569")       # Slate 600
    border_color = colors.HexColor("#e2e8f0")     # Slate 200
    card_bg = colors.HexColor("#f8fafc")          # Slate 50
    header_bg = colors.HexColor("#0f172a")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=primary_color,
        alignment=0,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=text_muted,
        alignment=0,
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=22,
        textColor=primary_color,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=accent_blue,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=secondary_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=secondary_color,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=secondary_color,
        alignment=0
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=primary_color,
        alignment=0
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # ================= PAGE 1: COVER & EXECUTIVE OVERVIEW =================
    story.append(Spacer(1, 20))
    story.append(Paragraph("BIHAR STATE POWER HOLDING COMPANY LIMITED", ParagraphStyle(
        'GovHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=13,
        textColor=colors.HexColor("#b45309"), spaceAfter=15
    )))
    story.append(Paragraph("BSPHCL Advocate Bill Management System (ABMS)", title_style))
    story.append(Paragraph("Comprehensive Technical Architecture, Engineering Design & Full-Stack Learning Guide", subtitle_style))

    # Meta banner table
    meta_data = [
        [Paragraph("<b>Project:</b> Enterprise Legal Bill Workflow", table_cell_style), Paragraph("<b>Tech Stack:</b> React 18, Node.js, Express, MongoDB", table_cell_style)],
        [Paragraph("<b>Frontend URL:</b> https://bsphcl-advocate-ms.vercel.app", table_cell_style), Paragraph("<b>Backend API:</b> https://bsphcl-advocate-api.onrender.com", table_cell_style)],
        [Paragraph("<b>Repository:</b> github.com/raushanpotter/bsphcl-advocate-ms", table_cell_style), Paragraph("<b>Author / Dev:</b> Raushan Kumar | BSPHCL IT Cell", table_cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[255, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), card_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("1. Executive Summary & Purpose", h1_style))
    story.append(Paragraph(
        "The <b>BSPHCL Advocate Bill Management System (ABMS)</b> is a purpose-built, secure, enterprise-grade "
        "web platform designed for the Bihar State Power Holding Company Limited (BSPHCL) to modernize, audit, "
        "and accelerate the entire lifecycle of legal fee billing submitted by empanelled advocates across the Patna High Court, "
        "Supreme Court of India, Civil Courts, Electricity Regulatory Commissions (BERC/CERC), and Arbitral Tribunals.",
        body_style
    ))
    story.append(Paragraph(
        "Prior to this application, advocate bills encountered common bureaucratic obstacles: physical file transit delays, "
        "misplacement of sanction orders, absence of centralized rate schedule audits, and untracked outstanding liabilities. "
        "ABMS delivers a strict <b>State Machine Workflow</b> traversing four autonomous corporate departments: "
        "<b>Human Resources (HR) & Establishment</b>, <b>BSPHCL Holding Legal Cell</b>, <b>General Management (GM)</b>, and "
        "<b>Accounts & Finance</b>.",
        body_style
    ))

    # Architecture Overview Callout
    callout_data = [[
        Paragraph(
            "<b>Key Architectural Principle:</b> Strict Separation of Concerns (SoC) combined with Role-Based Access Control (RBAC). "
            "No department can bypass an intermediate verification stage. Every transition generates an immutable cryptographic "
            "audit trail record with user identity, timestamp, and legal remarks.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[515])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bfdbfe")),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1, 10))
    story.append(callout_table)
    story.append(PageBreak())

    # ================= PAGE 2: TECH STACK & ARCHITECTURE =================
    story.append(Paragraph("2. Full-Stack Technology Stack & Architecture", h1_style))
    story.append(Paragraph(
        "The application leverages the <b>MERN Architecture</b> (MongoDB, Express.js, React, Node.js) paired with modern "
        "tooling, automated deployment pipelines, and cloud resilience patterns:",
        body_style
    ))

    tech_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technology / Package", table_header_style), Paragraph("Role & Architectural Purpose", table_header_style)],
        [
            Paragraph("<b>Frontend Framework</b>", table_cell_bold),
            Paragraph("React 18.2 + Vite 5.4", table_cell_style),
            Paragraph("Component-based Single Page Application (SPA), ultra-fast HMR, modular routing via React Router v6.", table_cell_style)
        ],
        [
            Paragraph("<b>Client State & Auth</b>", table_cell_bold),
            Paragraph("React Context API + Axios", table_cell_style),
            Paragraph("Global authentication session management, automatic bearer token injection via Axios interceptors, blob file responses.", table_cell_style)
        ],
        [
            Paragraph("<b>UI Components & Styling</b>", table_cell_bold),
            Paragraph("Custom Corporate CSS + Lucide Icons", table_cell_style),
            Paragraph("Responsive, accessibility-focused enterprise UI design, custom status badges, modal dialogs, and SVG visual indicators.", table_cell_style)
        ],
        [
            Paragraph("<b>Backend Runtime</b>", table_cell_bold),
            Paragraph("Node.js (v20+) + Express 4.18", table_cell_style),
            Paragraph("Asynchronous event-driven RESTful API server, middleware pipeline, structured JSON error handling.", table_cell_style)
        ],
        [
            Paragraph("<b>Security & Identity</b>", table_cell_bold),
            Paragraph("JWT (JSON Web Tokens) + BcryptJS", table_cell_style),
            Paragraph("Stateless authorization tokens with 7-day expiry, salt-hashed passwords, role validation middleware.", table_cell_style)
        ],
        [
            Paragraph("<b>Database Layer</b>", table_cell_bold),
            Paragraph("MongoDB Atlas + Mongoose 8", table_cell_style),
            Paragraph("Schematized document database with automated indexing, pre-save auto-increment hooks, and relationship population.", table_cell_style)
        ],
        [
            Paragraph("<b>File Handling</b>", table_cell_bold),
            Paragraph("Multer (v1.4)", table_cell_style),
            Paragraph("Multipart form-data parsing, file sanitization, document storage for advocate fee bills and GM sanction orders.", table_cell_style)
        ],
        [
            Paragraph("<b>Offline Resilience</b>", table_cell_bold),
            Paragraph("MongoMemoryServer + File Backup", table_cell_style),
            Paragraph("Embedded in-memory MongoDB fallback engine plus JSON file mirror ensuring zero loss across server restarts.", table_cell_style)
        ],
        [
            Paragraph("<b>Hosting & CI/CD</b>", table_cell_bold),
            Paragraph("Vercel (Frontend) + Render (Backend)", table_cell_style),
            Paragraph("Automatic Git-triggered deployments, production CORS configuration, health monitoring endpoints.", table_cell_style)
        ]
    ]

    tech_table = Table(tech_data, colWidths=[90, 140, 285])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Directory Structure & Modular Layout", h2_style))
    story.append(Paragraph(
        "The project follows a clean decoupled structure separating client-side view logic from server-side domain models and business controllers:",
        body_style
    ))

    dir_text = (
        "<b>advocate-ms/</b><br/>"
        "├── <b>client/</b> (Vite + React SPA)<br/>"
        "│   ├── src/components/ (Sidebar, Navbar, StatusBadge, Modal, WorkflowTimeline)<br/>"
        "│   ├── src/context/ (AuthContext.jsx - Login session, role decoding)<br/>"
        "│   ├── src/pages/ (admin/, hr/, legal/, gm/, accounts/, bills/, advocates/, reports/)<br/>"
        "│   └── src/services/api.js (Axios instance configured with baseURL and JWT)<br/>"
        "├── <b>server/</b> (Node.js + Express REST API)<br/>"
        "│   ├── controllers/ (authController, advocateController, billController, reportController...)<br/>"
        "│   ├── models/ (User.js, Advocate.js, Bill.js, Payment.js, BillHistory.js)<br/>"
        "│   ├── middleware/ (auth.js for protect/authorize, upload.js for Multer)<br/>"
        "│   ├── routes/ (billRoutes, advocateRoutes, authRoutes, reportRoutes...)<br/>"
        "│   ├── seed/ (seedAdmin.js - idempotent database seeder)<br/>"
        "│   └── utils/ (advocateStore.js - persistent JSON storage mirror)<br/>"
        "└── <b>render.yaml</b> (Infrastructure as Code specification for cloud deployment)"
    )
    dir_table = Table([[Paragraph(dir_text, code_style)]], colWidths=[515])
    dir_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(dir_table)
    story.append(PageBreak())

    # ================= PAGE 3: STATE MACHINE WORKFLOW =================
    story.append(Paragraph("3. Departmental State Machine Workflow", h1_style))
    story.append(Paragraph(
        "The core innovation of the BSPHCL system is its strict, multi-tier state machine. A bill cannot progress "
        "to payment without traversing every mandated department. At each step, role-based checks prevent unauthorized execution:",
        body_style
    ))

    workflow_data = [
        [Paragraph("Step", table_header_style), Paragraph("Department", table_header_style), Paragraph("Initial Status", table_header_style), Paragraph("Action Performed", table_header_style), Paragraph("Resulting Status", table_header_style)],
        [
            Paragraph("<b>1</b>", table_cell_bold),
            Paragraph("<b>HR Cell</b>", table_cell_bold),
            Paragraph("<font color='#64748b'>DRAFT</font>", table_cell_style),
            Paragraph("Registers advocate bill, fee memo, court case number, and claimed amount. Submits to Legal.", table_cell_style),
            Paragraph("<font color='#2563eb'>HR_SUBMITTED</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>2A</b>", table_cell_bold),
            Paragraph("<b>Legal Cell</b>", table_cell_bold),
            Paragraph("<font color='#2563eb'>HR_SUBMITTED</font>", table_cell_style),
            Paragraph("Verifies case appearance, hearing memo, and schedule of rates. Approves and forwards to GM.", table_cell_style),
            Paragraph("<font color='#0284c7'>LEGAL_VERIFIED</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>2B</b>", table_cell_bold),
            Paragraph("<b>Legal Cell</b>", table_cell_bold),
            Paragraph("<font color='#2563eb'>HR_SUBMITTED</font>", table_cell_style),
            Paragraph("Finds deficiency or discrepancy. Returns bill to HR with mandatory explanation remarks.", table_cell_style),
            Paragraph("<font color='#d97706'>RETURNED_TO_HR</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>2C</b>", table_cell_bold),
            Paragraph("<b>Legal Cell</b>", table_cell_bold),
            Paragraph("<font color='#2563eb'>HR_SUBMITTED</font>", table_cell_style),
            Paragraph("Disallows fee claim with documented rejection justification.", table_cell_style),
            Paragraph("<font color='#dc2626'>REJECTED</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>3A</b>", table_cell_bold),
            Paragraph("<b>General Mgmt (GM)</b>", table_cell_bold),
            Paragraph("<font color='#0284c7'>LEGAL_VERIFIED</font>", table_cell_style),
            Paragraph("Issues financial sanction order. Enters Sanction Letter Number, Sanction Date, and Approved Amount.", table_cell_style),
            Paragraph("<font color='#16a34a'>APPROVED</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>3B</b>", table_cell_bold),
            Paragraph("<b>General Mgmt (GM)</b>", table_cell_bold),
            Paragraph("<font color='#0284c7'>LEGAL_VERIFIED</font>", table_cell_style),
            Paragraph("Refuses expenditure sanction with formal rationale.", table_cell_style),
            Paragraph("<font color='#dc2626'>REJECTED</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>4A</b>", table_cell_bold),
            Paragraph("<b>Accounts Dept</b>", table_cell_bold),
            Paragraph("<font color='#16a34a'>APPROVED</font>", table_cell_style),
            Paragraph("Disburses partial payment voucher via NEFT/RTGS. Calculates remaining liability balance.", table_cell_style),
            Paragraph("<font color='#0d9488'>PARTIALLY_PAID</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>4B</b>", table_cell_bold),
            Paragraph("<b>Accounts Dept</b>", table_cell_bold),
            Paragraph("<font color='#0d9488'>PARTIALLY_PAID</font>", table_cell_style),
            Paragraph("Clears 100% of sanctioned amount. Bill status automatically concludes as closed.", table_cell_style),
            Paragraph("<font color='#15803d'>PAID (Settled)</font>", table_cell_bold)
        ],
        [
            Paragraph("<b>4C</b>", table_cell_bold),
            Paragraph("<b>Accounts Dept</b>", table_cell_bold),
            Paragraph("Any Approved", table_cell_style),
            Paragraph("<b>Exclusive Bill Removal:</b> Account Officer permanently deletes invalid bill after mandatory verification prompt.", table_cell_style),
            Paragraph("<font color='#475569'>PERMANENTLY REMOVED</font>", table_cell_bold)
        ]
    ]

    workflow_table = Table(workflow_data, colWidths=[35, 80, 95, 185, 120])
    workflow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(workflow_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Account Officer Exclusive Removal Feature", h2_style))
    story.append(Paragraph(
        "To prevent duplicate vouchers or administrative errors during payment processing, a specialized security permission "
        "was implemented: <b>Only the Account Officer role (`ACCOUNTS`) has access to remove bills</b>. "
        "Before deleting, the system prompts a mandatory verification modal displaying Advocate Name, Bill ID, and Sanctioned Amount. "
        "Upon confirmation, the controller atomically removes the Bill, associated `Payment` vouchers, `BillHistory` audit records, "
        "and physical attachment files from server storage.",
        body_style
    ))
    story.append(PageBreak())

    # ================= PAGE 4: DATABASE SCHEMA & RBAC =================
    story.append(Paragraph("4. Data Modeling & Database Schema Design", h1_style))
    story.append(Paragraph(
        "MongoDB with Mongoose ODM models the domain entities into five interlinked collections. Indexes and pre-save hooks "
        "guarantee high performance and data integrity:",
        body_style
    ))

    schema_data = [
        [Paragraph("Collection", table_header_style), Paragraph("Key Fields & Types", table_header_style), Paragraph("Relationships & Business Rules", table_header_style)],
        [
            Paragraph("<b>Advocate</b>", table_cell_bold),
            Paragraph("advocateId (String, unique)<br/>name (String)<br/>enrollmentNumber (String, unique)<br/>mobile, email, address<br/>specialization, isActive", table_cell_style),
            Paragraph("Auto-increments <code>ADV/0001</code> via pre-save hook. Empanelled lawyer roster. Protected against cascade deletion when active bills exist.", table_cell_style)
        ],
        [
            Paragraph("<b>Bill</b>", table_cell_bold),
            Paragraph("billId (String, unique)<br/>advocate (ObjectId -> Advocate)<br/>claimedAmount, approvedAmount<br/>courtCaseNumber, courtName<br/>status, currentStage<br/>sanctionLetterNumber, totalPaid", table_cell_style),
            Paragraph("Auto-generates <code>BSPHCL/ABM/2026/0001</code>. References Advocate. Tracks stage lifecycle and financial liability delta.", table_cell_style)
        ],
        [
            Paragraph("<b>Payment</b>", table_cell_bold),
            Paragraph("bill (ObjectId -> Bill)<br/>amount (Number)<br/>paymentDate (Date)<br/>paymentMode (NEFT/RTGS/Cheque)<br/>referenceNumber, voucherNumber", table_cell_style),
            Paragraph("Child voucher entity. Multiple payments can exist per bill until sum(payments) equals approvedAmount.", table_cell_style)
        ],
        [
            Paragraph("<b>BillHistory</b>", table_cell_bold),
            Paragraph("bill (ObjectId -> Bill)<br/>action (String)<br/>newStatus, remarks<br/>performedBy (ObjectId -> User)<br/>performedByRole, createdAt", table_cell_style),
            Paragraph("Immutable legal audit trail. Records every forward, return, approval, and voucher recording action.", table_cell_style)
        ],
        [
            Paragraph("<b>User</b>", table_cell_bold),
            Paragraph("username (String, unique)<br/>password (Bcrypt hash)<br/>role (ADMIN/HR/LEGAL/GM/ACCOUNTS)<br/>department, email, isActive", table_cell_style),
            Paragraph("Corporate departmental authentication entity. Admin can activate/deactivate accounts and trigger password resets.", table_cell_style)
        ]
    ]

    schema_table = Table(schema_data, colWidths=[80, 205, 230])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(schema_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Role-Based Access Control (RBAC) Permission Matrix", h1_style))
    rbac_data = [
        [Paragraph("Permission / Feature", table_header_style), Paragraph("ADMIN", table_header_style), Paragraph("HR", table_header_style), Paragraph("LEGAL", table_header_style), Paragraph("GM", table_header_style), Paragraph("ACCOUNTS", table_header_style)],
        [Paragraph("Register New Bill", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("Submit to Legal Cell", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("Verify & Forward to GM", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("Return to HR with Remarks", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("Sanction / Approve Amount", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style)],
        [Paragraph("Record Voucher Payment", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("✓", table_cell_bold)],
        [Paragraph("Remove Bill (Exclusive)", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("✓", table_cell_bold)],
        [Paragraph("Add / Edit Advocate Profile", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("Deactivate / Manage Users", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style)],
        [Paragraph("Export Financial CSV Reports", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("✓", table_cell_bold), Paragraph("—", table_cell_style), Paragraph("✓", table_cell_bold), Paragraph("✓", table_cell_bold)]
    ]
    rbac_table = Table(rbac_data, colWidths=[165, 70, 70, 70, 70, 70])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('ALIGN', (1,1), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(rbac_table)
    story.append(PageBreak())

    # ================= PAGE 5: ADVOCATE ROSTER & PERSISTENCE =================
    story.append(Paragraph("5. Official Advocate Roster & Permanent Persistence", h1_style))
    story.append(Paragraph(
        "A critical enterprise requirement was registering the official roster of empanelled advocates while guaranteeing that "
        "their profiles are never lost or wiped when the cloud server spins down, refreshes, or restarts.",
        body_style
    ))

    adv_data = [
        [Paragraph("Advocate ID", table_header_style), Paragraph("Advocate Name", table_header_style), Paragraph("Bar Enrolment No.", table_header_style), Paragraph("Mobile No.", table_header_style), Paragraph("Official Email", table_header_style), Paragraph("Chamber / Residential Address", table_header_style)],
        [Paragraph("<b>ADV/0001</b>", table_cell_bold), Paragraph("Ms. Saumya Poddar", table_cell_style), Paragraph("<code>BR/128/2026</code>", table_cell_style), Paragraph("—", table_cell_style), Paragraph("—", table_cell_style), Paragraph("Patna High Court Bar", table_cell_style)],
        [Paragraph("<b>ADV/0002</b>", table_cell_bold), Paragraph("Mr. Vishal Saurabh", table_cell_style), Paragraph("<code>30/2006</code>", table_cell_style), Paragraph("9709379933", table_cell_style), Paragraph("saurabhv31@gmail.com", table_cell_style), Paragraph("Bahadurpur Housing Colony, Patna-800026", table_cell_style)],
        [Paragraph("<b>ADV/0003</b>", table_cell_bold), Paragraph("Shreyashi Raj", table_cell_style), Paragraph("<code>BR/1912/2023</code>", table_cell_style), Paragraph("7058147964", table_cell_style), Paragraph("shreyashi.raj485@gmail.com", table_cell_style), Paragraph("Harding Road, Kranti Marg, Patna-800001", table_cell_style)],
        [Paragraph("<b>ADV/0004</b>", table_cell_bold), Paragraph("Miss. Aishwarya Shankar", table_cell_style), Paragraph("<code>BR 1723/2023</code>", table_cell_style), Paragraph("7667544674", table_cell_style), Paragraph("aishwarya1409@gmail.com", table_cell_style), Paragraph("Shankar Bhawan, Salimpur Ahra, Patna-800003", table_cell_style)],
        [Paragraph("<b>ADV/0005</b>", table_cell_bold), Paragraph("Mr. Arijeet Shukla", table_cell_style), Paragraph("<code>D/26/2020</code>", table_cell_style), Paragraph("9886789419", table_cell_style), Paragraph("arijeet.shukla@gmail.com", table_cell_style), Paragraph("Delhi Bar Council Chambers", table_cell_style)],
        [Paragraph("<b>ADV/0006</b>", table_cell_bold), Paragraph("Mr. Kumar Saurav", table_cell_style), Paragraph("<code>D/2902/2019</code>", table_cell_style), Paragraph("9572362255", table_cell_style), Paragraph("saurav.15@hotmail.com", table_cell_style), Paragraph("Manu Apts, Mayur Vihar, New Delhi-110091", table_cell_style)],
    ]
    adv_table = Table(adv_data, colWidths=[65, 95, 80, 70, 105, 100])
    adv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(adv_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Dual-Layer Persistence Mechanism", h2_style))
    story.append(Paragraph(
        "On cloud platforms like Render Free Tier, services spin down after 15 minutes of inactivity. When running on an in-memory "
        "database without an external MongoDB connection, RAM resets. To solve this permanently, we engineered a <b>two-tier storage architecture</b>:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>Layer 1 — Database Idempotent Seeder (`seedAdmin.js`):</b> On every server boot, the seeder validates that all 6 official advocates "
        "exist. If any are missing, it immediately recreates them with their official enrollment numbers.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Layer 2 — Disk-Backed JSON Mirror (`server/data/custom_advocates.json`):</b> Whenever Admin or HR registers a new advocate through "
        "the web form, the controller writes the profile to the file store. On server restart, the seeder parses this file and automatically "
        "re-seeds all user-added advocates. Advocates are <b>only</b> deleted when explicitly removed by Admin or HR.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Layer 3 — Cloud MongoDB Atlas Connection:</b> For production environments, connecting a persistent MongoDB Atlas cluster via the "
        "<code>MONGODB_URI</code> environment variable permanently stores all bills, sanction letters, and advocate vouchers in the cloud forever.",
        bullet_style
    ))
    story.append(PageBreak())

    # ================= PAGE 6: FINANCIAL CSV & SECURITY =================
    story.append(Paragraph("6. Financial CSV Export Engine & Date Filtering", h1_style))
    story.append(Paragraph(
        "Financial auditors and accounts officers require periodic expenditure statements. The system includes an advanced CSV export engine "
        "accessible from both <b>Executive Reports (`/reports`)</b> and the <b>Bills Master Registry (`/bills`)</b>:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>Authenticated Streaming Download:</b> Uses Axios with <code>responseType: 'blob'</code> to securely pass the user's JWT bearer token, "
        "eliminating 401 Unauthorized errors caused by unauthenticated <code>window.open</code> browser links.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Excel Compatibility (UTF-8 BOM):</b> Inserts a Byte Order Mark (<code>\\uFEFF</code>) at the beginning of the CSV payload, ensuring "
        "Microsoft Excel on Windows correctly formats dates, Indian Rupee amounts, and special characters without encoding corruption.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Date Range & Boundary Handling:</b> Filter by start and end dates with automatic end-of-day timestamp alignment (<code>23:59:59.999</code>) "
        "so bills registered on the selected final date are accurately captured.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Flexible Criteria:</b> Filter by <i>Submission Date</i>, <i>Advocate Bill Date</i>, or <i>System Registration Date</i>, paired with "
        "quick one-click presets (<b>This Month</b>, <b>Last 30 Days</b>, <b>This Year</b>).",
        bullet_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Security Architecture & Defenses", h2_style))
    story.append(Paragraph(
        "The system incorporates government-standard security controls to safeguard financial and legal data:",
        body_style
    ))
    story.append(Paragraph(
        "• <b>Stateless JWT Lifecycle:</b> Signed with HMAC-SHA256, carrying user role and department identity. Automatically refreshed and verified "
        "at the Express middleware boundary on every protected API transaction.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>Password Security:</b> All user credentials are encrypted with <code>bcryptjs</code> using a salt round of 10. Raw passwords are never "
        "persisted or logged in plaintext.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>File Upload Quarantine & Whitelisting:</b> Multer restricts attachments to authorized formats (PDF, DOCX, JPG, PNG) up to 10MB, "
        "sanitizing filenames with unique cryptographically random suffixes to prevent path traversal exploits.",
        bullet_style
    ))
    story.append(Paragraph(
        "• <b>CORS Whitelisting:</b> Production API strictly restricts cross-origin resource sharing to authorized Vercel domains and trusted holding entities.",
        bullet_style
    ))
    story.append(PageBreak())

    # ================= PAGE 7: SETUP & CREDENTIALS =================
    story.append(Paragraph("7. Practical Learning Guide: Setup, API & Deployment", h1_style))
    story.append(Paragraph(
        "This project serves as a comprehensive reference implementation for full-stack enterprise development. Follow the step-by-step "
        "instructions below to set up, run, and understand the codebase locally:",
        body_style
    ))

    story.append(Paragraph("A. Local Development Setup", h2_style))
    setup_code = (
        "# 1. Clone the repository\n"
        "git clone https://github.com/raushanpotter/bsphcl-advocate-ms.git\n"
        "cd \"advocate MS\"\n\n"
        "# 2. Install backend dependencies & start server\n"
        "cd server\n"
        "npm install\n"
        "node server.js   # Listens on http://localhost:5000\n\n"
        "# 3. In a separate terminal, install client dependencies & run Vite dev server\n"
        "cd client\n"
        "npm install\n"
        "npm run dev      # Launches SPA on http://localhost:5173"
    )
    story.append(Table([[Paragraph(setup_code.replace('\n', '<br/>'), code_style)]], colWidths=[515], style=[
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("B. Default Department Credentials for Local Testing", h2_style))
    creds_data = [
        [Paragraph("Department Role", table_header_style), Paragraph("Username", table_header_style), Paragraph("Password", table_header_style), Paragraph("Workflow Role & Scope", table_header_style)],
        [Paragraph("<b>Central Admin</b>", table_cell_bold), Paragraph("<code>admin</code>", table_cell_style), Paragraph("<code>Admin@123456</code>", table_cell_style), Paragraph("Master system administration, user status toggle, full oversight", table_cell_style)],
        [Paragraph("<b>Human Resources (HR)</b>", table_cell_bold), Paragraph("<code>hr_officer</code>", table_cell_style), Paragraph("<code>Hr@123456</code>", table_cell_style), Paragraph("Bill registration, rate verification, resubmissions", table_cell_style)],
        [Paragraph("<b>Legal Cell Head</b>", table_cell_bold), Paragraph("<code>legal_head</code>", table_cell_style), Paragraph("<code>Legal@123456</code>", table_cell_style), Paragraph("Legal scrutiny, forward to GM, return to HR with remarks", table_cell_style)],
        [Paragraph("<b>General Management (GM)</b>", table_cell_bold), Paragraph("<code>gm_approval</code>", table_cell_style), Paragraph("<code>Gm@123456</code>", table_cell_style), Paragraph("Financial sanction, letter number issuance, approval/rejection", table_cell_style)],
        [Paragraph("<b>Account Officer</b>", table_cell_bold), Paragraph("<code>accounts_officer</code>", table_cell_style), Paragraph("<code>Accounts@123456</code>", table_cell_style), Paragraph("Payment voucher recording, liability tracking, exclusive bill removal", table_cell_style)],
        [Paragraph("<b>Accounts Section</b>", table_cell_bold), Paragraph("<code>accounts_dept</code>", table_cell_style), Paragraph("<code>Accounts@123456</code>", table_cell_style), Paragraph("Disbursement section processing and settlement", table_cell_style)]
    ]
    creds_table = Table(creds_data, colWidths=[120, 95, 105, 195])
    creds_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(creds_table)
    story.append(PageBreak())

    # ================= PAGE 8: API REFERENCE & ARCHITECTURE TAKEAWAYS =================
    story.append(Paragraph("8. Core REST API Endpoints & Engineering Takeaways", h1_style))
    story.append(Paragraph(
        "The backend implements RESTful semantics with standard status codes (200 OK, 201 Created, 400 Bad Request, 403 Forbidden, 404 Not Found):",
        body_style
    ))

    api_data = [
        [Paragraph("HTTP Method & Route", table_header_style), Paragraph("Required Role", table_header_style), Paragraph("Action Description", table_header_style)],
        [Paragraph("<code>POST /api/auth/login</code>", table_cell_style), Paragraph("Public", table_cell_style), Paragraph("Authenticates username & password, returns signed JWT token and user profile.", table_cell_style)],
        [Paragraph("<code>GET /api/advocates</code>", table_cell_style), Paragraph("All Users", table_cell_style), Paragraph("Lists all empanelled advocates with search and active/inactive status filters.", table_cell_style)],
        [Paragraph("<code>POST /api/advocates</code>", table_cell_style), Paragraph("ADMIN, HR", table_cell_style), Paragraph("Registers a new advocate; auto-assigns <code>ADV/000x</code> and updates persistent backup.", table_cell_style)],
        [Paragraph("<code>DELETE /api/advocates/:id</code>", table_cell_style), Paragraph("ADMIN, HR", table_cell_style), Paragraph("Deletes advocate; enforces check preventing removal if active bills exist.", table_cell_style)],
        [Paragraph("<code>POST /api/bills</code>", table_cell_style), Paragraph("ADMIN, HR", table_cell_style), Paragraph("Registers a new bill with fee document upload; initiates DRAFT status.", table_cell_style)],
        [Paragraph("<code>POST /api/hr/bills/:id/submit</code>", table_cell_style), Paragraph("ADMIN, HR", table_cell_style), Paragraph("Submits draft bill to Legal Cell; advances stage to <code>LEGAL</code>.", table_cell_style)],
        [Paragraph("<code>POST /api/legal/bills/:id/verify</code>", table_cell_style), Paragraph("LEGAL", table_cell_style), Paragraph("Legal scrutiny verification; forwards bill to GM sanction stage.", table_cell_style)],
        [Paragraph("<code>POST /api/legal/bills/:id/return</code>", table_cell_style), Paragraph("LEGAL", table_cell_style), Paragraph("Returns bill to HR with mandatory remarks detailing corrections needed.", table_cell_style)],
        [Paragraph("<code>POST /api/gm/bills/:id/approve</code>", table_cell_style), Paragraph("GM", table_cell_style), Paragraph("Sanctions expenditure, attaches sanction letter number and approved amount.", table_cell_style)],
        [Paragraph("<code>POST /api/accounts/bills/:id/pay</code>", table_cell_style), Paragraph("ACCOUNTS", table_cell_style), Paragraph("Records voucher payment (NEFT/RTGS); transitions bill to PARTIALLY_PAID or PAID.", table_cell_style)],
        [Paragraph("<code>DELETE /api/bills/:id</code>", table_cell_style), Paragraph("ACCOUNTS", table_cell_style), Paragraph("<b>Exclusive:</b> Permanently removes bill and cascades cleanup to payments and audit logs.", table_cell_style)],
        [Paragraph("<code>GET /api/reports/bills?format=csv</code>", table_cell_style), Paragraph("ADMIN, ACCOUNTS, GM, HR", table_cell_style), Paragraph("Streams filtered bill records in Excel-compatible CSV format with UTF-8 BOM.", table_cell_style)]
    ]
    api_table = Table(api_data, colWidths=[185, 110, 220])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Key Engineering Takeaways for Learners", h2_style))
    story.append(Paragraph(
        "1. <b>Design for Resilience:</b> Always decouple cloud database dependencies with intelligent in-memory and disk fallbacks.<br/>"
        "2. <b>Atomic Transactions:</b> Cascading deletions (e.g. bill removal deleting associated vouchers and logs) prevent orphaned database records.<br/>"
        "3. <b>Zero-Trust State Machines:</b> Never rely on UI buttons for access control. Always mirror authorization on Express route middleware.<br/>"
        "4. <b>Audit Trails:</b> Every bureaucratic forward or return action must log the acting officer's identity, timestamp, and mandatory remarks.",
        body_style
    ))

    # Document generation
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF documentation: {filename}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "BSPHCL_Advocate_Management_System_Guide.pdf"
    build_pdf(out_file)
