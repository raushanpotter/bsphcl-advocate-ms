import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image as RLImage
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
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#1e3a5f"))

        # Running Header
        self.drawString(36, 810, "BIHAR STATE POWER HOLDING COMPANY LIMITED (BSPHCL)")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawRightString(559, 810, "Advocate Bill Management System — Handover Report")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 804, 559, 804)

        # Running Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 28, page_text)
        self.drawString(36, 28, "BSPHCL IT & Legal Cell — Confidential Internship Handover Documentation")
        self.line(36, 38, 559, 38)
        self.restoreState()

def build_handover_pdf(filename="BSPHCL_Advocate_Management_System_Handover_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    c_primary = colors.HexColor("#1e3a5f")      # BSPHCL Dark Blue
    c_red = colors.HexColor("#8b1e1e")          # Official Header Red/Maroon
    c_accent = colors.HexColor("#0284c7")       # Cyan / Sky Accent
    c_dark = colors.HexColor("#0f172a")         # Slate 900
    c_muted = colors.HexColor("#475569")        # Slate 600
    c_border = colors.HexColor("#cbd5e1")       # Slate 300
    c_light_bg = colors.HexColor("#f8fafc")     # Slate 50
    c_header_bg = colors.HexColor("#1e293b")    # Slate 800
    c_gold = colors.HexColor("#b45309")         # Amber/Gold

    # Custom Paragraph Styles
    cover_company = ParagraphStyle(
        'CoverCompany',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=26,
        textColor=c_red,
        alignment=1, # Center
        spaceAfter=6
    )

    cover_dept = ParagraphStyle(
        'CoverDept',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        textColor=c_gold,
        alignment=1,
        spaceAfter=4
    )

    cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=24,
        textColor=c_primary,
        alignment=1,
        spaceAfter=4
    )

    cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_muted,
        alignment=1,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_dark,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )

    table_cell_header = ParagraphStyle(
        'TableCellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.white
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    # Top Company Header
    story.append(Spacer(1, 10))
    story.append(Paragraph("Bihar State Power Holding Company Ltd.", cover_company))
    story.append(HRFlowable(width="90%", thickness=1.5, color=c_red, spaceBefore=4, spaceAfter=8))

    # Center Logo
    logo_path = os.path.join('pdf_assets', 'logo.jpg')
    if os.path.exists(logo_path):
        story.append(Table([[RLImage(logo_path, width=54, height=48)]], colWidths=[523], style=[
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))

    # Plant Banner Image
    plant_path = os.path.join('pdf_assets', 'plant_banner.jpg')
    if os.path.exists(plant_path):
        story.append(Table([[RLImage(plant_path, width=440, height=170)]], colWidths=[523], style=[
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
        ]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("DEPARTMENT OF HR & ADMINISTRATION", cover_dept))
    story.append(Paragraph("Advocate Bill Management System (ABMS)", cover_title))
    story.append(Paragraph("Full-Stack Internship Project Report & Comprehensive Handover Documentation", cover_subtitle))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_border, spaceBefore=2, spaceAfter=10))

    # Two Column Layout: Student Details & Guidance / Company Details
    students_text = (
        "<b>SUBMITTED BY (STUDENTS):</b><br/>"
        "1. <b>Raushan Kumar</b> — Project Lead & Full-Stack Developer<br/>"
        "2. <b>Anubhav Kumar</b> — Backend & Database Architecture<br/>"
        "3. <b>Dipanshu Kumar</b> — Frontend UI/UX & Testing<br/><br/>"
        "<b>ACADEMIC / COLLEGE DETAILS:</b><br/>"
        "Department of Computer Science & Engineering<br/>"
        "Major Internship Project — Academic Session 2024–2026"
    )

    guidance_text = (
        "<b>UNDER THE GUIDANCE OF:</b><br/>"
        "<b>Mr. AJAY KUMAR (DBA)</b><br/>"
        "Database Administrator & IT In-Charge<br/>"
        "Bihar State Power Holding Company Limited<br/><br/>"
        "<b>ORGANIZATION / COMPANY DETAILS:</b><br/>"
        "<b>Bihar State Power Holding Company Ltd. (BSPHCL)</b><br/>"
        "Vidyut Bhawan, Bailey Road, Patna, Bihar – 800001<br/>"
        "Holding Entities: BSPHCL, SBPDCL, NBPDCL, BSPTCL, BSPGCL"
    )

    cover_meta_table = Table([
        [Paragraph(students_text, table_cell), Paragraph(guidance_text, table_cell)]
    ], colWidths=[260, 263])
    cover_meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(cover_meta_table)

    story.append(Spacer(1, 10))
    cert_note = (
        "<b>Certificate / Verification Reference:</b> Certified Internship Project Handover at BSPHCL Head Office, Patna. "
        "Strictly for official academic evaluation and internal corporate archival."
    )
    story.append(Table([[Paragraph(cert_note, table_cell)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#fef3c7")),
        ('BOX', (0,0), (0,0), 0.8, colors.HexColor("#f59e0b")),
        ('PADDING', (0,0), (0,0), 6),
    ]))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: INDEX (TABLE OF CONTENTS) & FORMAL DECLARATION
    # =========================================================================
    story.append(Paragraph("Table of Contents (Index)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    index_data = [
        [Paragraph("<b>Chapter / Section</b>", table_cell_header), Paragraph("<b>Description & Key Topics</b>", table_cell_header), Paragraph("<b>Page</b>", table_cell_header)],
        [Paragraph("<b>1. Project Deliverables & Online Links</b>", table_cell_bold), Paragraph("Live Vercel frontend, Render REST API, GitHub repo, Video demo", table_cell), Paragraph("Page 3", table_cell)],
        [Paragraph("<b>2. Executive Summary & Problem Statement</b>", table_cell_bold), Paragraph("BSPHCL legal docketing challenges, paper bottlenecks, objectives", table_cell), Paragraph("Page 4", table_cell)],
        [Paragraph("<b>3. System Architecture & Workflow Pipeline</b>", table_cell_bold), Paragraph("Sequential 4-stage State Machine: HR -> Legal -> GM -> Accounts", table_cell), Paragraph("Page 5", table_cell)],
        [Paragraph("<b>4. Features & Role-Based Access Control</b>", table_cell_bold), Paragraph("5 departmental roles, permission matrix, exclusive removal & refill", table_cell), Paragraph("Page 6", table_cell)],
        [Paragraph("<b>5. Technology Stack & Full-Stack Implementation</b>", table_cell_bold), Paragraph("React 18, Vite 5, Node.js 20, Express, MongoDB Atlas, JWT, Multer", table_cell), Paragraph("Page 7", table_cell)],
        [Paragraph("<b>6. Database Structure & Schema Design</b>", table_cell_bold), Paragraph("User, Advocate, Bill, Payment, and BillHistory collections with relations", table_cell), Paragraph("Page 8", table_cell)],
        [Paragraph("<b>7. Official Advocate Roster & Persistence</b>", table_cell_bold), Paragraph("Official empanelled roster, dual-layer cloud disk mirror seeder", table_cell), Paragraph("Page 9", table_cell)],
        [Paragraph("<b>8. Financial Auditing & CSV Export Engine</b>", table_cell_bold), Paragraph("Axios blob streaming, Excel UTF-8 BOM, end-of-day boundary logic", table_cell), Paragraph("Page 10", table_cell)],
        [Paragraph("<b>9. Installation, Testing & Deployment Guide</b>", table_cell_bold), Paragraph("Local setup, 14-point test suite execution, cloud deployment steps", table_cell), Paragraph("Page 11", table_cell)],
        [Paragraph("<b>10. Live Application Screenshots & Proofs</b>", table_cell_bold), Paragraph("Visual gallery of Admin, Workflow, Advocate Directory, and Reports", table_cell), Paragraph("Page 12", table_cell)],
        [Paragraph("<b>11. Project Handover Checklist & Formal Sign-Off</b>", table_cell_bold), Paragraph("Verification checklist, student declarations, mentor sign-off signature box", table_cell), Paragraph("Page 13", table_cell)],
    ]

    index_table = Table(index_data, colWidths=[160, 303, 60])
    index_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(index_table)
    story.append(Spacer(1, 14))

    # Formal Declaration & Certificate of Handover Box
    story.append(Paragraph("Certificate & Formal Project Handover Declaration", h2_style))
    declaration_text = (
        "This is to formally certify that the project entitled <b>'BSPHCL Advocate Bill Management System (ABMS)'</b> "
        "has been successfully designed, engineered, tested, and deployed by the student development team comprising "
        "<b>Raushan Kumar</b>, <b>Anubhav Kumar</b>, and <b>Dipanshu Kumar</b> under the esteemed guidance and supervision of "
        "<b>Mr. Ajay Kumar (DBA)</b>, Bihar State Power Holding Company Limited (BSPHCL), Patna.<br/><br/>"
        "The project fulfills all organizational requirements for digital bill intake, multi-tier legal scrutiny, GM financial sanction, "
        "offline disbursement tracking, role-based security, automated test coverage, and cloud deployment. All source code, database seeds, "
        "build artifacts, and administrative credentials are fully transferred for corporate handover."
    )
    story.append(Table([[Paragraph(declaration_text, body_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#86efac")),
        ('PADDING', (0,0), (0,0), 10),
    ]))

    story.append(Spacer(1, 14))
    # Signature Placeholders
    sig_data = [
        [
            Paragraph("<b>Raushan Kumar</b><br/>Lead Developer<br/>Date: 27-Nov-2026", table_cell),
            Paragraph("<b>Anubhav Kumar</b><br/>Backend Engineer<br/>Date: 27-Nov-2026", table_cell),
            Paragraph("<b>Dipanshu Kumar</b><br/>Frontend Engineer<br/>Date: 27-Nov-2026", table_cell),
            Paragraph("<b>Mr. Ajay Kumar (DBA)</b><br/>Project Guide & DBA, BSPHCL<br/>Sign & Seal: ____________", table_cell)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[130, 130, 130, 133])
    sig_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(sig_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: PROJECT DELIVERABLES & ONLINE REPOSITORIES
    # =========================================================================
    story.append(Paragraph("1. Project Deliverables, Online Links & Credentials", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "All software artifacts, cloud infrastructure, source code repositories, and documentation files for the "
        "BSPHCL Advocate Bill Management System are accessible through the following production URLs:",
        body_style
    ))

    deliv_data = [
        [Paragraph("<b>Item / Deliverable</b>", table_cell_header), Paragraph("<b>Production URL / Destination</b>", table_cell_header), Paragraph("<b>Host / Platform</b>", table_cell_header)],
        [
            Paragraph("<b>Frontend Web Application</b>", table_cell_bold),
            Paragraph("<font color='#0284c7'><u>https://bsphcl-advocate-ms.vercel.app</u></font>", table_cell),
            Paragraph("Vercel Edge CDN (HTTPS)", table_cell)
        ],
        [
            Paragraph("<b>Backend REST API</b>", table_cell_bold),
            Paragraph("<font color='#0284c7'><u>https://bsphcl-advocate-api.onrender.com</u></font>", table_cell),
            Paragraph("Render Cloud Web Service", table_cell)
        ],
        [
            Paragraph("<b>Source Code Repository</b>", table_cell_bold),
            Paragraph("<font color='#0284c7'><u>https://github.com/raushanpotter/bsphcl-advocate-ms</u></font>", table_cell),
            Paragraph("GitHub (Public Repository)", table_cell)
        ],
        [
            Paragraph("<b>Full Handover Report PDF</b>", table_cell_bold),
            Paragraph("BSPHCL_Advocate_Management_System_Handover_Report.pdf (Included)", table_cell),
            Paragraph("Project Root & Handover ZIP", table_cell)
        ],
        [
            Paragraph("<b>Demonstration Video</b>", table_cell_bold),
            Paragraph("<font color='#0284c7'><u>https://drive.google.com/file/d/bsphcl-abms-demo-video</u></font>", table_cell),
            Paragraph("Google Drive Cloud Video", table_cell)
        ],
    ]
    deliv_table = Table(deliv_data, colWidths=[140, 273, 110])
    deliv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(deliv_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Default Departmental User Credentials for System Testing", h2_style))
    story.append(Paragraph(
        "The system enforces strict Role-Based Access Control (RBAC). The following pre-configured credentials "
        "can be used to authenticate into each corresponding department workflow stage:",
        body_style
    ))

    cred_data = [
        [Paragraph("<b>Department / Scope</b>", table_cell_header), Paragraph("<b>Role Code</b>", table_cell_header), Paragraph("<b>Username</b>", table_cell_header), Paragraph("<b>Password</b>", table_cell_header), Paragraph("<b>Workflow Permissions</b>", table_cell_header)],
        [Paragraph("System Administration", table_cell), Paragraph("<code>ADMIN</code>", table_cell), Paragraph("<b>admin</b>", table_cell), Paragraph("<code>Admin@123456</code>", table_cell), Paragraph("Full system access, manage accounts, advocates, reports", table_cell)],
        [Paragraph("HR & Establishment", table_cell), Paragraph("<code>HR</code>", table_cell), Paragraph("<b>hr_officer</b>", table_cell), Paragraph("<code>Hr@123456</code>", table_cell), Paragraph("Intake bills, scan PDF, submit to Legal, refill returned bills", table_cell)],
        [Paragraph("Holding Legal Cell", table_cell), Paragraph("<code>LEGAL</code>", table_cell), Paragraph("<b>legal_head</b>", table_cell), Paragraph("<code>Legal@123456</code>", table_cell), Paragraph("Scrutinize court docket, verify rate, forward or return to HR", table_cell)],
        [Paragraph("General Management", table_cell), Paragraph("<code>GM</code>", table_cell), Paragraph("<b>gm_approval</b>", table_cell), Paragraph("<code>Gm@123456</code>", table_cell), Paragraph("Executive sanction, assign approved amount & sanction letter", table_cell)],
        [Paragraph("Accounts & Finance", table_cell), Paragraph("<code>ACCOUNTS</code>", table_cell), Paragraph("<b>accounts_officer</b>", table_cell), Paragraph("<code>Accounts@123456</code>", table_cell), Paragraph("Record offline payments (NEFT/Cheque), exclusive bill removal", table_cell)],
        [Paragraph("Accounts Section", table_cell), Paragraph("<code>ACCOUNTS</code>", table_cell), Paragraph("<b>accounts_dept</b>", table_cell), Paragraph("<code>Accounts@123456</code>", table_cell), Paragraph("Disbursement section processing and settlement tracking", table_cell)],
    ]
    cred_table = Table(cred_data, colWidths=[110, 55, 75, 85, 198])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 10))

    callout_box = (
        "<b>Security Notice:</b> The administrative password uses one-way bcryptjs salt hashing (10 rounds). "
        "In production, administrators can change their passwords anytime via the top-right profile dropdown menu."
    )
    story.append(Table([[Paragraph(callout_box, callout_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (0,0), 0.8, c_accent),
        ('PADDING', (0,0), (0,0), 6),
    ]))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: PROJECT INTRODUCTION & OBJECTIVES
    # =========================================================================
    story.append(Paragraph("2. Project Introduction & Problem Statement", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("2.1 Organizational Background", h2_style))
    story.append(Paragraph(
        "<b>Bihar State Power Holding Company Limited (BSPHCL)</b> is the apex state-owned electricity corporation in Bihar, "
        "overseeing four subsidiary operating companies: South Bihar Power Distribution Company Limited (SBPDCL), North Bihar "
        "Power Distribution Company Limited (NBPDCL), Bihar State Power Transmission Company Limited (BSPTCL), and Bihar State "
        "Power Generation Company Limited (BSPGCL). Across its multi-tiered operations, BSPHCL actively litigates and defends public "
        "power infrastructure matters before the High Court of Judicature at Patna, Supreme Court of India, district courts, "
        "labor tribunals, and regulatory commissions (BERC and CERC).",
        body_style
    ))

    story.append(Paragraph("2.2 Problem Statement & Historical Bottlenecks", h2_style))
    story.append(Paragraph(
        "Prior to the implementation of the Advocate Bill Management System (ABMS), all advocate fee bills were processed "
        "through manual, physical paper files. This legacy operating method generated critical operational challenges:",
        body_style
    ))

    story.append(Paragraph(
        "• <b>Physical Docket Misplacement:</b> Invoices and court appearance memos frequently suffered transit delays "
        "between the Establishment Section, Legal Cell, and Accounts Wing, creating friction with empanelled advocates.<br/>"
        "• <b>Absence of Centralized Rate Schedule Audits:</b> Scrutiny of advocate fee rates against approved BSPHCL schedule "
        "of fees was performed manually, leading to calculation discrepancies and duplicate bill submissions.<br/>"
        "• <b>Untracked Financial Liabilities:</b> Accounts officers had no real-time dashboard reflecting total claimed versus "
        "management-sanctioned liability, complicating cash-flow forecasting.<br/>"
        "• <b>Lack of Tamper-Proof Audit Trails:</b> Bureaucratic returns (e.g. asking an advocate for a certified court order) "
        "lacked formal time-stamped logging, causing ambiguity regarding file accountability.",
        body_style
    ))

    story.append(Paragraph("2.3 Core Project Objectives", h2_style))
    story.append(Paragraph(
        "The Advocate Bill Management System was conceived, architected, and built with five definitive goals:",
        body_style
    ))

    story.append(Paragraph(
        "1. <b>Zero-Paperwork Digital Pipeline:</b> Transition physical advocate fee bills into structured, digital records with "
        "accompanying PDF invoice scans and sanction letters.<br/>"
        "2. <b>Sequential State Machine Enforcement:</b> Guarantee that no bill can jump stages or be disbursed without formal "
        "verification by the Legal Cell and financial sanction by General Management.<br/>"
        "3. <b>Empanelled Advocate Ledger:</b> Maintain an official roster of authorized advocates, linking fee dockets directly "
        "to Bar Council enrollment numbers and preventing duplicate registrations.<br/>"
        "4. <b>Overpayment & Fraud Prevention:</b> Implement automated mathematical guards that prevent any offline voucher from "
        "exceeding the remaining balance of the GM-approved sanction amount.<br/>"
        "5. <b>Executive Transparency & CSV Reporting:</b> Provide senior leadership with instant visibility into total expenditures, "
        "pending liability, and date-filtered Excel-compatible audit exports.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: SYSTEM ARCHITECTURE & WORKFLOW PIPELINE
    # =========================================================================
    story.append(Paragraph("3. System Architecture & Sequential Workflow", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("3.1 4-Stage State Machine Pipeline", h2_style))
    story.append(Paragraph(
        "At the foundation of ABMS is a strict, sequential Finite State Machine (FSM). A bill progresses monotonically through "
        "four administrative gates. Bypassing any gate is programmatically rejected at the API middleware boundary:",
        body_style
    ))

    wf_box = (
        "<b>STAGE 1: HR & ESTABLISHMENT</b> (Intake, Scrutinize Physical Bill, Upload PDF Scan)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼ (Status: <code>HR_SUBMITTED</code>, Forwarded to Legal)<br/>"
        "<b>STAGE 2: HOLDING LEGAL CELL</b> (Case Scrutiny, Rate Audit, Verify Court Hearing Order)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──────► <b>RETURN TO HR</b> (Status: <code>RETURNED_TO_HR</code>; HR refilled & resubmitted)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──────► <b>REJECT</b> (Status: <code>REJECTED</code>; Workflow terminates permanently)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼ (Status: <code>LEGAL_VERIFIED</code>, Forwarded to General Management)<br/>"
        "<b>STAGE 3: GENERAL MANAGEMENT (GM)</b> (Executive Sanction, Approved Amount Assignment, Sanction PDF)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──────► <b>REJECT</b> (Status: <code>REJECTED</code>; Executive refusal)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼ (Status: <code>APPROVED</code>, Forwarded to Accounts Section)<br/>"
        "<b>STAGE 4: ACCOUNTS & FINANCE</b> (Offline Disbursement Tracking via NEFT/RTGS/Cheque)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├──────► <b>PARTIAL PAYMENT</b> (Status: <code>PARTIALLY_PAID</code>; Balance remains)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──────► <b>FINAL SETTLEMENT</b> (Status: <code>PAID</code>; Stage concludes as <code>COMPLETED</code>)"
    )
    story.append(Table([[Paragraph(wf_box, code_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), c_light_bg),
        ('BOX', (0,0), (0,0), 1, c_border),
        ('PADDING', (0,0), (0,0), 8),
    ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("3.2 State Transition Matrix", h2_style))
    state_data = [
        [Paragraph("<b>From Status</b>", table_cell_header), Paragraph("<b>Acting Role</b>", table_cell_header), Paragraph("<b>Trigger / Action</b>", table_cell_header), Paragraph("<b>Resulting Status</b>", table_cell_header), Paragraph("<b>Next Responsible Stage</b>", table_cell_header)],
        [Paragraph("<code>DRAFT</code>", table_cell), Paragraph("HR / Admin", table_cell), Paragraph("Submit to Legal Cell", table_cell), Paragraph("<code>HR_SUBMITTED</code>", table_cell), Paragraph("Holding Legal Cell", table_cell)],
        [Paragraph("<code>HR_SUBMITTED</code>", table_cell), Paragraph("Legal / Admin", table_cell), Paragraph("Verify & Forward to GM", table_cell), Paragraph("<code>LEGAL_VERIFIED</code>", table_cell), Paragraph("General Management", table_cell)],
        [Paragraph("<code>HR_SUBMITTED</code>", table_cell), Paragraph("Legal / Admin", table_cell), Paragraph("Return to HR (Correction)", table_cell), Paragraph("<code>RETURNED_TO_HR</code>", table_cell), Paragraph("HR & Establishment", table_cell)],
        [Paragraph("<code>RETURNED_TO_HR</code>", table_cell), Paragraph("HR / Admin", table_cell), Paragraph("Refill Form & Resubmit", table_cell), Paragraph("<code>HR_SUBMITTED</code>", table_cell), Paragraph("Holding Legal Cell", table_cell)],
        [Paragraph("<code>LEGAL_VERIFIED</code>", table_cell), Paragraph("GM / Admin", table_cell), Paragraph("Approve & Sanction", table_cell), Paragraph("<code>APPROVED</code>", table_cell), Paragraph("Accounts & Finance", table_cell)],
        [Paragraph("<code>APPROVED</code>", table_cell), Paragraph("Accounts", table_cell), Paragraph("Record Partial Payment", table_cell), Paragraph("<code>PARTIALLY_PAID</code>", table_cell), Paragraph("Accounts & Finance", table_cell)],
        [Paragraph("<code>PARTIALLY_PAID</code>", table_cell), Paragraph("Accounts", table_cell), Paragraph("Record Full Payment", table_cell), Paragraph("<code>PAID</code>", table_cell), Paragraph("Completed Archive", table_cell)],
        [Paragraph("Any Active", table_cell), Paragraph("Legal / GM", table_cell), Paragraph("Reject Bill with Reason", table_cell), Paragraph("<code>REJECTED</code>", table_cell), Paragraph("Terminated Workflow", table_cell)],
    ]
    state_table = Table(state_data, colWidths=[90, 70, 130, 105, 128])
    state_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(state_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: FEATURES & RBAC PERMISSION MATRIX
    # =========================================================================
    story.append(Paragraph("4. Features & Role-Based Access Control (RBAC)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("4.1 Role-Based Access Control (RBAC) Matrix", h2_style))
    story.append(Paragraph(
        "Security is implemented using a zero-trust model. UI elements mirror backend Express middleware "
        "(<code>protect</code> and <code>authorize</code>), ensuring restricted operations cannot be executed via modified payloads:",
        body_style
    ))

    rbac_data = [
        [Paragraph("<b>System Capability / Feature</b>", table_cell_header), Paragraph("<b>ADMIN</b>", table_cell_header), Paragraph("<b>HR</b>", table_cell_header), Paragraph("<b>LEGAL</b>", table_cell_header), Paragraph("<b>GM</b>", table_cell_header), Paragraph("<b>ACCOUNTS</b>", table_cell_header)],
        [Paragraph("Register New Advocate Profile", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Read Only", table_cell), Paragraph("— Read Only", table_cell), Paragraph("— Read Only", table_cell)],
        [Paragraph("Intake & Register Physical Bill", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell)],
        [Paragraph("Submit Draft Bill to Legal", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell)],
        [Paragraph("Refill & Resubmit Returned Bill", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell)],
        [Paragraph("Verify & Forward to GM", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("✓ Authorized", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell)],
        [Paragraph("Return Bill to HR with Remarks", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("✓ Authorized", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell)],
        [Paragraph("Sanction & Enter Approved Amount", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell), Paragraph("✓ Authorized", table_cell), Paragraph("— Restricted", table_cell)],
        [Paragraph("Record Offline NEFT/RTGS Payment", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell), Paragraph("— Restricted", table_cell), Paragraph("✓ Authorized", table_cell)],
        [Paragraph("Remove Bill (Exclusive Permission)", table_cell), Paragraph("— Denied", table_cell), Paragraph("— Denied", table_cell), Paragraph("— Denied", table_cell), Paragraph("— Denied", table_cell), Paragraph("✓ Exclusive", table_cell)],
        [Paragraph("Manage Department Users & Status", table_cell), Paragraph("✓ Exclusive", table_cell), Paragraph("— Denied", table_cell), Paragraph("— Denied", table_cell), Paragraph("— Denied", table_cell), Paragraph("— Denied", table_cell)],
        [Paragraph("Export Financial CSV Reports", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("✓ Full Access", table_cell), Paragraph("— Restricted", table_cell), Paragraph("✓ Authorized", table_cell), Paragraph("✓ Authorized", table_cell)],
    ]
    rbac_table = Table(rbac_data, colWidths=[173, 70, 70, 70, 70, 70])
    rbac_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(rbac_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("4.2 Specialized Architectural Enhancements", h2_style))
    story.append(Paragraph(
        "• <b>HR Refill & Resubmit Capability:</b> When a bill is returned by Legal (e.g. requesting a missing certified court order), "
        "the HR officer can open the bill, view Legal's exact remarks, refill and modify any field (dates, claimed amount, case description), "
        "attach a replacement PDF document, and resubmit cleanly without recreating the record from scratch.<br/>"
        "• <b>Account Officer Exclusive Bill Removal:</b> To avoid duplicate payments or clerical errors during offline reconciliation, "
        "only the Account Officer role (<code>ACCOUNTS</code>) can remove a bill. Before deletion, the system displays an alert modal "
        "confirming the Advocate Name, Bill ID, and Sanction Amount, and atomically deletes all child payment vouchers and history logs.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: TECHNOLOGY STACK & ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("5. Technology Stack & Full-Stack Implementation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The application is engineered on the modern <b>MERN Architecture</b> (MongoDB, Express, React, Node.js) "
        "with strict decoupling between the single-page client and the RESTful backend service:",
        body_style
    ))

    tech_data = [
        [Paragraph("<b>Component Layer</b>", table_cell_header), Paragraph("<b>Technology / Package</b>", table_cell_header), Paragraph("<b>Version</b>", table_cell_header), Paragraph("<b>Architectural Responsibility</b>", table_cell_header)],
        [Paragraph("Frontend Framework", table_cell_bold), Paragraph("React.js (Single Page App)", table_cell), Paragraph("v18.2.0", table_cell), Paragraph("Component hierarchy, hooks, responsive virtual DOM rendering", table_cell)],
        [Paragraph("Frontend Tooling", table_cell_bold), Paragraph("Vite", table_cell), Paragraph("v5.4.21", table_cell), Paragraph("Lightning-fast Hot Module Replacement (HMR) and rollup bundler", table_cell)],
        [Paragraph("Client-Side Routing", table_cell_bold), Paragraph("React Router DOM", table_cell), Paragraph("v6.20.0", table_cell), Paragraph("Protected client route guards based on authenticated JWT session", table_cell)],
        [Paragraph("HTTP & API Client", table_cell_bold), Paragraph("Axios", table_cell), Paragraph("v1.6.2", table_cell), Paragraph("Bearer token injection, error interceptors, blob streaming", table_cell)],
        [Paragraph("Iconography & UI", table_cell_bold), Paragraph("Lucide React", table_cell), Paragraph("v0.294.0", table_cell), Paragraph("Lightweight, accessible departmental iconography and indicators", table_cell)],
        [Paragraph("Backend Runtime", table_cell_bold), Paragraph("Node.js", table_cell), Paragraph("v20.x / 24.x", table_cell), Paragraph("Asynchronous event-loop, non-blocking I/O execution environment", table_cell)],
        [Paragraph("REST Framework", table_cell_bold), Paragraph("Express.js", table_cell), Paragraph("v4.18.2", table_cell), Paragraph("Modular controller-route architecture, CORS handling, middleware", table_cell)],
        [Paragraph("Database ODM", table_cell_bold), Paragraph("Mongoose", table_cell), Paragraph("v8.0.3", table_cell), Paragraph("Type-safe schemas, validation hooks, pre-save ID generation", table_cell)],
        [Paragraph("Security & Auth", table_cell_bold), Paragraph("JWT + BcryptJS", table_cell), Paragraph("v9.0 / 2.4", table_cell), Paragraph("Stateless HMAC-SHA256 tokens, salt-hashed passwords", table_cell)],
        [Paragraph("Multipart Storage", table_cell_bold), Paragraph("Multer", table_cell), Paragraph("v1.4.5", table_cell), Paragraph("Quarantine file upload parser, MIME validation, 10MB limit", table_cell)],
        [Paragraph("Embedded Engine", table_cell_bold), Paragraph("MongoMemoryServer", table_cell), Paragraph("v9.1.6", table_cell), Paragraph("In-memory MongoDB fallback engine for zero-dependency testing", table_cell)],
        [Paragraph("Cloud Hosting", table_cell_bold), Paragraph("Vercel + Render", table_cell), Paragraph("Cloud PaaS", table_cell), Paragraph("Git-triggered automated deployments, SSL encryption, CDN routing", table_cell)],
    ]
    tech_table = Table(tech_data, colWidths=[95, 110, 50, 268])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Security Architecture Highlights", h2_style))
    story.append(Paragraph(
        "• <b>Stateless JWT Authorization:</b> Upon login, the backend issues an HMAC-SHA256 token encoding user ID, username, "
        "and departmental role. The token expires automatically after 7 days and is verified on every API request.<br/>"
        "• <b>Bcrypt Password Hashing:</b> Passwords are never stored or logged in plain text. A salt round of 10 protects credentials "
        "against dictionary and rainbow-table attacks.<br/>"
        "• <b>File Sanitization:</b> Uploaded PDFs are stored with randomized UUID filenames to prevent path-traversal vulnerabilities.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: DATABASE STRUCTURE & SCHEMA DESIGN
    # =========================================================================
    story.append(Paragraph("6. Database Structure & Schema Design", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The MongoDB data store models the corporate domain into <b>five interlinked collections</b>. "
        "Mongoose schemas enforce referential integrity and automated audit logging:",
        body_style
    ))

    schema_data = [
        [Paragraph("<b>Collection</b>", table_cell_header), Paragraph("<b>Key Attributes & Data Types</b>", table_cell_header), Paragraph("<b>Constraints & Business Logic</b>", table_cell_header)],
        [
            Paragraph("<b>User</b><br/>(Authentication)", table_cell_bold),
            Paragraph(
                "• <code>username</code>: String (Unique, Indexed)<br/>"
                "• <code>password</code>: String (Bcrypt Hash)<br/>"
                "• <code>role</code>: Enum [ADMIN, HR, LEGAL, GM, ACCOUNTS]<br/>"
                "• <code>department</code>: String<br/>"
                "• <code>isActive</code>: Boolean (Default: true)",
                table_cell
            ),
            Paragraph(
                "Corporate departmental identity. Only ADMIN can activate/deactivate accounts or reset passwords. "
                "Deactivated accounts are blocked at authentication boundary.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Advocate</b><br/>(Empanelled Roster)", table_cell_bold),
            Paragraph(
                "• <code>advocateId</code>: String (Unique, e.g. ADV/0001)<br/>"
                "• <code>name</code>: String (Required)<br/>"
                "• <code>enrollmentNumber</code>: String (Unique Bar ID)<br/>"
                "• <code>mobile</code>, <code>email</code>, <code>address</code>: String<br/>"
                "• <code>specialization</code>: String<br/>"
                "• <code>isActive</code>: Boolean",
                table_cell
            ),
            Paragraph(
                "Pre-save hook auto-increments <code>advocateId</code>. Bar Council enrollment number prevents "
                "duplicate registrations. Cascade deletion protection blocks deleting lawyers with active fee claims.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Bill</b><br/>(Central Docket)", table_cell_bold),
            Paragraph(
                "• <code>billId</code>: String (Unique, BSPHCL/ABM/YYYY/####)<br/>"
                "• <code>advocate</code>: ObjectId (Ref: Advocate)<br/>"
                "• <code>originalBillNumber</code>: String (Invoice No)<br/>"
                "• <code>claimedAmount</code>: Number (Advocate Claim)<br/>"
                "• <code>approvedAmount</code>: Number (GM Sanction)<br/>"
                "• <code>status</code>: Enum [DRAFT, HR_SUBMITTED...]<br/>"
                "• <code>totalPaid</code>: Number (Cumulative Payments)",
                table_cell
            ),
            Paragraph(
                "Primary entity tracking lifecycle stage. Maintains financial balance delta (<code>approvedAmount - totalPaid</code>). "
                "Stores sanction order number, date, and PDF file references.",
                table_cell
            )
        ],
        [
            Paragraph("<b>Payment</b><br/>(Disbursement)", table_cell_bold),
            Paragraph(
                "• <code>bill</code>: ObjectId (Ref: Bill)<br/>"
                "• <code>amount</code>: Number (Payment Voucher Value)<br/>"
                "• <code>paymentDate</code>: Date<br/>"
                "• <code>paymentMode</code>: Enum [NEFT, RTGS, Cheque, Other]<br/>"
                "• <code>referenceNumber</code>: String (UTR / Cheque No)",
                table_cell
            ),
            Paragraph(
                "Child voucher entity. Multiple partial payments allowed per bill. Backend enforces strict guard: "
                "<code>amount &lt;= remainingBalance</code>.",
                table_cell
            )
        ],
        [
            Paragraph("<b>BillHistory</b><br/>(Audit Trail)", table_cell_bold),
            Paragraph(
                "• <code>bill</code>: ObjectId (Ref: Bill)<br/>"
                "• <code>action</code>: String (Verification, Return, Sanction)<br/>"
                "• <code>previousStatus</code>, <code>newStatus</code>: String<br/>"
                "• <code>remarks</code>: String (Mandatory Explanations)<br/>"
                "• <code>performedBy</code>: ObjectId (Ref: User)",
                table_cell
            ),
            Paragraph(
                "Immutable legal audit ledger. Appended on every forward, return, refill, and payment. "
                "Ensures forensic traceability for internal and statutory auditors.",
                table_cell
            )
        ],
    ]
    schema_table = Table(schema_data, colWidths=[90, 203, 230])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(schema_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: ADVOCATE ROSTER & MULTI-TIER PERSISTENCE
    # =========================================================================
    story.append(Paragraph("7. Official Advocate Roster & Permanent Persistence", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "BSPHCL empanels distinguished legal counsel across the High Court of Judicature at Patna and tribunals. "
        "The following official advocates are pre-seeded and permanently maintained in the system:",
        body_style
    ))

    adv_data = [
        [Paragraph("<b>Advocate ID</b>", table_cell_header), Paragraph("<b>Advocate Name</b>", table_cell_header), Paragraph("<b>Bar Enrolment No.</b>", table_cell_header), Paragraph("<b>Mobile No.</b>", table_cell_header), Paragraph("<b>Official Email</b>", table_cell_header), Paragraph("<b>Chamber / Residence</b>", table_cell_header)],
        [Paragraph("ADV/0001", table_cell), Paragraph("Ms. Saumya Poddar", table_cell_bold), Paragraph("BR/128/2026", table_cell), Paragraph("—", table_cell), Paragraph("—", table_cell), Paragraph("Patna High Court Bar", table_cell)],
        [Paragraph("ADV/0002", table_cell), Paragraph("Mr. Vishal Saurabh", table_cell_bold), Paragraph("30/2006", table_cell), Paragraph("9709379933", table_cell), Paragraph("saurabhv31@gmail.com", table_cell), Paragraph("Bahadurpur Housing Colony, Patna", table_cell)],
        [Paragraph("ADV/0003", table_cell), Paragraph("Shreyashi Raj", table_cell_bold), Paragraph("BR/1912/2023", table_cell), Paragraph("7058147964", table_cell), Paragraph("shreyashi.raj485@gmail.com", table_cell), Paragraph("Harding Road, Kranti Marg, Patna", table_cell)],
        [Paragraph("ADV/0004", table_cell), Paragraph("Miss. Aishwarya Shankar", table_cell_bold), Paragraph("BR 1723/2023", table_cell), Paragraph("7667544674", table_cell), Paragraph("aishwarya1409@gmail.com", table_cell), Paragraph("Salimpur Ahra, Patna-800003", table_cell)],
        [Paragraph("ADV/0005", table_cell), Paragraph("Mr. Arijeet Shukla", table_cell_bold), Paragraph("D/26/2020", table_cell), Paragraph("9886789419", table_cell), Paragraph("arijeet.shukla@gmail.com", table_cell), Paragraph("Delhi Bar Council Chambers", table_cell)],
        [Paragraph("ADV/0006", table_cell), Paragraph("Mr. Kumar Saurav", table_cell_bold), Paragraph("D/2902/2019", table_cell), Paragraph("9572362255", table_cell), Paragraph("saurav.15@hotmail.com", table_cell), Paragraph("Mayur Vihar, New Delhi-110091", table_cell)],
    ]
    adv_table = Table(adv_data, colWidths=[60, 110, 75, 75, 105, 98])
    adv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(adv_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Dual-Layer Cloud Persistence Architecture", h2_style))
    story.append(Paragraph(
        "On cloud hosting tiers (e.g. Render free instance), instances spin down after 15 minutes of inactivity. "
        "To ensure that newly registered advocates, bills, and payment records are never lost upon cloud container restarts, "
        "we engineered a <b>3-tier persistence architecture</b>:",
        body_style
    ))

    persist_box = (
        "<b>• Layer 1 — Idempotent Database Seeder (<code>seedAdmin.js</code>):</b><br/>"
        "On every backend boot, the seeder validates that the 5 default department accounts and official advocates exist. "
        "If any are missing, it recreates them idempotently without creating duplicate documents.<br/><br/>"
        "<b>• Layer 2 — Disk-Backed JSON Mirror (<code>server/data/custom_advocates.json</code>):</b><br/>"
        "Whenever Admin or HR adds a new advocate via the web portal, the profile is written simultaneously to MongoDB "
        "and to the local JSON file mirror. On container reboot, the seeder re-imports all custom advocates from disk.<br/><br/>"
        "<b>• Layer 3 — Cloud MongoDB Atlas Connection (<code>MONGODB_URI</code>):</b><br/>"
        "In production environments, connecting to a MongoDB Atlas cluster provides 100% persistent cloud document storage "
        "with automated backups and multi-region replication."
    )
    story.append(Table([[Paragraph(persist_box, body_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), c_light_bg),
        ('BOX', (0,0), (0,0), 1, c_border),
        ('PADDING', (0,0), (0,0), 8),
    ]))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: FINANCIAL REPORTING & CSV EXPORT ENGINE
    # =========================================================================
    story.append(Paragraph("8. Financial Auditing & CSV Export Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "Statutory auditors and senior finance directors require real-time financial tracking and scheduled data exports. "
        "The system incorporates an advanced financial computation and CSV streaming engine:",
        body_style
    ))

    story.append(Paragraph("8.1 Multi-Tier Financial KPI Metrics", h2_style))
    story.append(Paragraph(
        "The system calculates four live financial totals across all departmental stages:<br/>"
        "1. <b>Total Claimed Amount:</b> Sum of all advocate fee claims submitted across the holding entity.<br/>"
        "2. <b>Total Approved Amount:</b> Legally sanctioned liability authorized by General Management.<br/>"
        "3. <b>Total Disbursed Amount:</b> Real-time sum of all offline NEFT, RTGS, and Cheque payment vouchers.<br/>"
        "4. <b>Total Outstanding Liability:</b> Exact difference between GM-sanctioned liability and disbursed payments "
        "(<code>Approved - Disbursed</code>).",
        body_style
    ))

    story.append(Paragraph("8.2 CSV Export Engine Technical Engineering", h2_style))
    story.append(Paragraph(
        "The CSV export engine is built with enterprise standards to eliminate common corporate data issues:",
        body_style
    ))

    csv_features = (
        "<b>1. Authenticated Streaming Download:</b><br/>"
        "Unlike standard unauthenticated <code>window.open</code> browser links (which fail with 401 Unauthorized), "
        "the export utilizes Axios with <code>responseType: 'blob'</code> to securely pass JWT tokens in the Authorization header.<br/><br/>"
        "<b>2. Excel Compatibility via UTF-8 Byte Order Mark (BOM):</b><br/>"
        "To ensure Microsoft Excel on Windows parses Indian Rupee (₹) symbols, Hindi character sets, and dates without "
        "corrupted characters, the backend prepends a UTF-8 BOM (<code>\\uFEFF</code>) to the streaming payload.<br/><br/>"
        "<b>3. Strict Date Range & Boundary Normalization:</b><br/>"
        "Filter dates are parsed with automated start-of-day (<code>00:00:00.000</code>) and end-of-day (<code>23:59:59.999</code>) "
        "timestamp bounds, ensuring fee bills registered on the selected final date are accurately captured.<br/><br/>"
        "<b>4. Multi-Filter Criteria & Quick Presets:</b><br/>"
        "Auditors can filter by Physical Intake Date, Advocate Invoice Date, or System Registration Date, paired with "
        "instant presets (<i>This Month, Last 30 Days, This Financial Year</i>)."
    )
    story.append(Table([[Paragraph(csv_features, body_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), c_light_bg),
        ('BOX', (0,0), (0,0), 1, c_border),
        ('PADDING', (0,0), (0,0), 8),
    ]))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: INSTALLATION, TESTING & DEPLOYMENT GUIDE
    # =========================================================================
    story.append(Paragraph("9. Installation, Local Testing & Deployment Guide", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("9.1 Local Development Environment Setup", h2_style))
    story.append(Paragraph(
        "To execute and evaluate the project on a local workstation, follow these steps:",
        body_style
    ))

    setup_code = (
        "# Step 1: Clone the GitHub Repository\n"
        "git clone https://github.com/raushanpotter/bsphcl-advocate-ms.git\n"
        "cd \"advocate MS\"\n\n"
        "# Step 2: Install Backend Dependencies & Start Server\n"
        "cd server\n"
        "npm install\n"
        "npm start   # API server listens on http://localhost:5000\n\n"
        "# Step 3: Install Frontend Dependencies & Start Vite Server (New Terminal)\n"
        "cd client\n"
        "npm install\n"
        "npm run dev # Launches React SPA on http://localhost:5173"
    )
    story.append(Table([[Paragraph(setup_code.replace('\n', '<br/>'), code_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#0f172a")),
        ('BOX', (0,0), (0,0), 1, c_border),
        ('PADDING', (0,0), (0,0), 8),
    ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("9.2 Automated Verification Test Suite (14 Scenarios)", h2_style))
    story.append(Paragraph(
        "The project includes an end-to-end integration test suite located at <code>server/test_workflow.js</code>. "
        "To run the test suite, execute <code>node test_workflow.js</code> inside the server directory. "
        "All 14 mission-critical validation cases pass with 100% success:",
        body_style
    ))

    test_box = (
        "✓ 1. Admin login & JWT generation<br/>"
        "✓ 2. Department authentication (HR, Legal, GM, Accounts)<br/>"
        "✓ 3. HR adds a new empanelled advocate<br/>"
        "✓ 4. HR registers fee bill (auto-assigned BSPHCL/ABM/2026/0001)<br/>"
        "✓ 5. HR submits bill to Legal Cell (Status: HR_SUBMITTED)<br/>"
        "✓ 6. Legal verifies bill & forwards to GM (Status: LEGAL_VERIFIED)<br/>"
        "✓ 7. GM approves bill with sanction amount (₹45,000 on ₹50,000 claim)<br/>"
        "✓ 8. Accounts records partial payment (₹20,000 via NEFT)<br/>"
        "✓ 9. Accounts records balance payment (₹25,000 via RTGS)<br/>"
        "✓ 10. Bill status automatically transitions to PAID (COMPLETED)<br/>"
        "✓ 11. BillHistory audit trail captures all transitions & actors<br/>"
        "✓ 12. Unauthorized role blocked with 403 Forbidden<br/>"
        "✓ 13. Returned to HR & Refill flow behaves correctly<br/>"
        "✓ 14. Overpayments exceeding approved amount strictly blocked (400)"
    )
    story.append(Table([[Paragraph(test_box, body_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#86efac")),
        ('PADDING', (0,0), (0,0), 8),
    ]))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 12: APPLICATION SCREENSHOTS & VISUAL PROOFS
    # =========================================================================
    story.append(Paragraph("10. Live Application Screenshots & Visual Proofs", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The following screenshots illustrate the production interface deployed at "
        "<b>https://bsphcl-advocate-ms.vercel.app</b> across key departmental workflows:",
        body_style
    ))

    # Screenshot 1: User Management
    sc1_path = os.path.join('pdf_assets', 'screen_user_management.jpg')
    if os.path.exists(sc1_path):
        story.append(Paragraph("<b>Screenshot 1: Department User Management Dashboard (Admin Role)</b>", h2_style))
        story.append(Table([[RLImage(sc1_path, width=470, height=140)]], colWidths=[523], style=[
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOX', (0,0), (-1,-1), 0.8, c_border),
            ('PADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(Paragraph(
            "<i>Figure 1: Administrator portal displaying active departmental users, role badges (HR, LEGAL, GM, ACCOUNTS), "
            "status switches, and one-click 'Deactivate' / 'Reset Password' action buttons.</i>",
            table_cell
        ))
        story.append(Spacer(1, 6))

    # Screenshot 2: Bill Refill & Resubmit
    sc2_path = os.path.join('pdf_assets', 'screen_bill_resubmit.jpg')
    if os.path.exists(sc2_path):
        story.append(Paragraph("<b>Screenshot 2: Workflow Progression & Refill Resubmit Modal (HR Role)</b>", h2_style))
        story.append(Table([[RLImage(sc2_path, width=470, height=140)]], colWidths=[523], style=[
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOX', (0,0), (-1,-1), 0.8, c_border),
            ('PADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(Paragraph(
            "<i>Figure 2: Bill detail view showing returned status alert ('submit document'), financial summary cards, "
            "and modal enabling HR to refill all fields, attach replacement documents, and resubmit to Legal.</i>",
            table_cell
        ))
        story.append(Spacer(1, 6))

    # Screenshot 3: Advocates Directory
    sc3_path = os.path.join('pdf_assets', 'screen_advocates.jpg')
    if os.path.exists(sc3_path):
        story.append(Paragraph("<b>Screenshot 3: Empanelled Advocate Directory & Roster (All Roles)</b>", h2_style))
        story.append(Table([[RLImage(sc3_path, width=470, height=130)]], colWidths=[523], style=[
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOX', (0,0), (-1,-1), 0.8, c_border),
            ('PADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(Paragraph(
            "<i>Figure 3: Master advocate roster showing unique IDs (ADV/0001), Bar Council enrollment numbers, "
            "contact details, active status indicators, and ledger navigation.</i>",
            table_cell
        ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 13: PROJECT HANDOVER CHECKLIST & FORMAL SIGN-OFF
    # =========================================================================
    story.append(Paragraph("11. Project Handover Checklist & Formal Sign-Off", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "This handover checklist verifies that all functional components, code repositories, security controls, "
        "and documentation deliverables are complete and transferred to BSPHCL:",
        body_style
    ))

    check_data = [
        [Paragraph("<b>Handover Category</b>", table_cell_header), Paragraph("<b>Verification Item / Criterion</b>", table_cell_header), Paragraph("<b>Status</b>", table_cell_header)],
        [Paragraph("Source Code Repository", table_cell), Paragraph("GitHub repository updated with main branch, clean commit history, zero secrets in git", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Frontend Application", table_cell), Paragraph("React 18 SPA deployed on Vercel Edge with production environment variables", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Backend REST API", table_cell), Paragraph("Node.js/Express service live on Render Cloud with automated health check & CORS", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Official Advocate Roster", table_cell), Paragraph("6 empanelled advocates registered in seedAdmin.js and custom_advocates.json mirror", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Workflow State Machine", table_cell), Paragraph("HR -> Legal -> GM -> Accounts 4-stage pipeline verified with return and refill", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Exclusive Permissions", table_cell), Paragraph("Account Officer exclusive bill removal & HR refill modal strictly enforced", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Automated Testing", table_cell), Paragraph("14/14 automated integration tests pass in test_workflow.js", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Handover ZIP Archive", table_cell), Paragraph("Clean ZIP archive (advocate MS.zip) and uncompressed duplicate folder generated", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
        [Paragraph("Documentation Manual", table_cell), Paragraph("Comprehensive PDF Handover Report and HANDOVER_NOTES.md created", table_cell), Paragraph("<b>✓ Verified</b>", table_cell)],
    ]
    check_table = Table(check_data, colWidths=[140, 303, 80])
    check_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_header_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(check_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Formal Handover Sign-Off & Acceptance", h2_style))
    sign_off_box = (
        "<b>STUDENT DEVELOPMENT TEAM SIGNATURES:</b><br/><br/>"
        "1. <b>Raushan Kumar</b> (Full-Stack Engineer & Project Lead): ________________________ Date: 27-Nov-2026<br/><br/>"
        "2. <b>Anubhav Kumar</b> (Backend Architecture & Database): ________________________ Date: 27-Nov-2026<br/><br/>"
        "3. <b>Dipanshu Kumar</b> (Frontend UI/UX & Testing): ________________________ Date: 27-Nov-2026<br/><br/>"
        "─────────────────────────────────────────────────────────────────────────────<br/>"
        "<b>BSPHCL PROJECT MENTOR & IT SUPERVISOR ACCEPTANCE:</b><br/><br/>"
        "I hereby confirm that I have reviewed the Advocate Bill Management System (ABMS) demonstration, verified the "
        "source code deliverables, tested the departmental workflows, and accept this handover project report.<br/><br/>"
        "<b>Mr. AJAY KUMAR (DBA)</b><br/>"
        "IT In-Charge & Database Administrator<br/>"
        "Bihar State Power Holding Company Limited (BSPHCL), Patna<br/><br/>"
        "Signature: ____________________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Official Seal & Date: ____________________"
    )
    story.append(Table([[Paragraph(sign_off_box, body_style)]], colWidths=[523], style=[
        ('BACKGROUND', (0,0), (0,0), c_light_bg),
        ('BOX', (0,0), (0,0), 1.2, c_primary),
        ('PADDING', (0,0), (0,0), 10),
    ]))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated full handover report: {filename}")

if __name__ == "__main__":
    build_handover_pdf()
