import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

os.makedirs('pdf_assets', exist_ok=True)
media_dir = r'C:\Users\Raushan\.gemini\antigravity\brain\507114e0-fb9a-4aaf-8e45-93c1bb2b0b7e\.user_uploaded'

# =========================================================================
# 1. GENERATE HIGH-RES PROJECT FOLDER & FILE ARCHITECTURE SCREENSHOT
# =========================================================================
w, h = 1200, 720
img = Image.new('RGB', (w, h), color='#1e1e1e')
draw = ImageDraw.Draw(img)

# Top Bar
draw.rectangle([(0, 0), (w, 40)], fill='#323233')
draw.text((16, 12), 'EXPLORER: ADVOCATE MS (PROJECT FOLDER STRUCTURE & CODEBASE FILES)', fill='#e0e0e0')

# Left Sidebar (Folder Structure)
draw.rectangle([(0, 40), (450, h)], fill='#252526')
draw.line([(450, 40), (450, h)], fill='#3c3c3c', width=2)

tree_items = [
    ('📁 advocate MS/ (Full-Stack Project Root)', '#ffffff'),
    ('  📁 client/ (React 18 + Vite Single Page App)', '#61dafb'),
    ('    📁 public/ (_redirects, vite.svg)', '#abb2bf'),
    ('    📁 src/', '#abb2bf'),
    ('      📁 components/ (Modal, Navbar, Sidebar, StatusBadge)', '#e5c07b'),
    ('      📁 context/ (AuthContext.jsx - Session & JWT)', '#e5c07b'),
    ('      📁 pages/ (admin, hr, legal, gm, accounts, bills)', '#e5c07b'),
    ('      📁 services/ (api.js - Axios REST client)', '#e5c07b'),
    ('      📄 App.jsx, main.jsx, index.css', '#98c379'),
    ('    📄 package.json, vite.config.js, vercel.json', '#abb2bf'),
    ('  📁 server/ (Node.js + Express REST API)', '#68a063'),
    ('    📁 controllers/ (admin, hr, legal, gm, accounts, bill)', '#e5c07b'),
    ('    📁 data/ (custom_advocates.json, persistent_bills.json)', '#e06c75'),
    ('    📁 middleware/ (auth.js for RBAC, upload.js for Multer)', '#abb2bf'),
    ('    📁 models/ (User, Advocate, Bill, Payment, BillHistory)', '#61afef'),
    ('    📁 routes/ (auth, admin, hr, legal, gm, accounts, bill)', '#abb2bf'),
    ('    📁 seed/ (seedAdmin.js - Idempotent Seeder)', '#98c379'),
    ('    📁 utils/ (advocateStore.js, billStore.js)', '#e06c75'),
    ('    📄 server.js (Express server entry point)', '#61afef'),
    ('    📄 test_workflow.js (14-scenario integration tests)', '#e06c75'),
    ('  📄 BSPHCL_Advocate_Management_System_Handover_Report.pdf', '#e06c75'),
    ('  📄 HANDOVER_NOTES.md, README.md, render.yaml', '#98c379'),
]

y_pos = 55
for item, col in tree_items:
    draw.text((16, y_pos), item, fill=col)
    y_pos += 29

# Right Panel (server.js Architecture Preview)
draw.rectangle([(451, 40), (w, 75)], fill='#2d2d2d')
draw.text((470, 50), '📄 server.js — Architectural Endpoints & 4-Stage State Machine Pipeline', fill='#ffffff')

code_lines = [
    ('// BSPHCL Advocate Bill Management System — RESTful Service Architecture', '#7f848e'),
    ('const express = require("express");', '#c678dd'),
    ('const mongoose = require("mongoose");', '#c678dd'),
    ('const { seedAll } = require("./seed/seedAdmin");', '#61afef'),
    ('const { syncBillToStore, restoreStoredBills } = require("./utils/billStore");', '#61afef'),
    ('', '#ffffff'),
    ('// Sequential 4-Stage State Machine Pipeline Routes', '#7f848e'),
    ('app.use("/api/auth", authRoutes);         // JWT authentication & role decoding', '#e5c07b'),
    ('app.use("/api/admin", adminRoutes);       // User status, password reset, admin', '#e5c07b'),
    ('app.use("/api/advocates", advocateRoutes); // Empanelled roster with Bar enrollment', '#e5c07b'),
    ('app.use("/api/bills", billRoutes);         // Master dockets & exclusive accounts removal', '#e5c07b'),
    ('app.use("/api/hr", hrRoutes);             // Bill intake, PDF scan & refill resubmit', '#e5c07b'),
    ('app.use("/api/legal", legalRoutes);       // Scrutiny, rate verification & court orders', '#e5c07b'),
    ('app.use("/api/gm", gmRoutes);             // Executive sanction & sanction letter PDF', '#e5c07b'),
    ('app.use("/api/accounts", accountsRoutes); // Offline disbursements & overpayment guard', '#e5c07b'),
    ('app.use("/api/reports", reportRoutes);     // Excel-compatible UTF-8 BOM CSV streaming', '#e5c07b'),
    ('', '#ffffff'),
    ('// Dual-Layer Cloud Persistence: RAM Database + Disk JSON File Mirror', '#7f848e'),
    ('connectDB().then(() => {', '#61afef'),
    ('  console.log("BSPHCL Advocate Bill Management Backend Live on Port 5000");', '#98c379'),
    ('});', '#61afef'),
]

y_code = 92
for line, col in code_lines:
    draw.text((470, y_code), line, fill=col)
    y_code += 28

img.save('pdf_assets/screen_folder_files.jpg', quality=95)
print('✓ Successfully generated pdf_assets/screen_folder_files.jpg')

# =========================================================================
# 2. PROCESS AND ENHANCE USER INTERFACE SCREENSHOTS
# =========================================================================
# A. User Management (Admin Dashboard)
# media_1795456292055_e576f40a.jpg has browser on left 0 to 675
users_img_path = os.path.join(media_dir, 'media_1795456292055_e576f40a.jpg')
if os.path.exists(users_img_path):
    im_u = Image.open(users_img_path)
    # Crop exactly browser viewport (skip desktop/kali on right)
    # The browser window is roughly (0, 0, 672, 384)
    crop_u = im_u.crop((0, 0, 672, 384))
    # Resize up with high quality Lanczos filter to 1200x685 for crispness
    res_u = crop_u.resize((1200, 685), Image.Resampling.LANCZOS)
    enhancer = ImageEnhance.Sharpness(res_u)
    sharp_u = enhancer.enhance(1.4)
    sharp_u.save('pdf_assets/screen_user_management.jpg', quality=95)
    print('✓ Enhanced pdf_assets/screen_user_management.jpg')

# B. Bill Detail & Refill Resubmit Modal (HR Role)
bill_img_path = os.path.join(media_dir, 'media_1795538443721_6989a3f2.jpg')
if os.path.exists(bill_img_path):
    im_b = Image.open(bill_img_path)
    crop_b = im_b.crop((0, 0, 672, 384))
    res_b = crop_b.resize((1200, 685), Image.Resampling.LANCZOS)
    enhancer_b = ImageEnhance.Sharpness(res_b)
    sharp_b = enhancer_b.enhance(1.4)
    sharp_b.save('pdf_assets/screen_bill_resubmit.jpg', quality=95)
    print('✓ Enhanced pdf_assets/screen_bill_resubmit.jpg')

# C. Reports & Financial Summary
reports_img_path = os.path.join(media_dir, 'media_1795360265800_5db37c0d.jpg')
if os.path.exists(reports_img_path):
    im_r = Image.open(reports_img_path)
    res_r = im_r.resize((1200, 671), Image.Resampling.LANCZOS)
    enhancer_r = ImageEnhance.Sharpness(res_r)
    sharp_r = enhancer_r.enhance(1.3)
    sharp_r.save('pdf_assets/screen_reports.jpg', quality=95)
    print('✓ Enhanced pdf_assets/screen_reports.jpg')

# D. Advocates Directory
adv_img_path = os.path.join(media_dir, 'media_1795359458244_994041bd.jpg')
if os.path.exists(adv_img_path):
    im_a = Image.open(adv_img_path)
    res_a = im_a.resize((1200, 707), Image.Resampling.LANCZOS)
    enhancer_a = ImageEnhance.Sharpness(res_a)
    sharp_a = enhancer_a.enhance(1.3)
    sharp_a.save('pdf_assets/screen_advocates.jpg', quality=95)
    print('✓ Enhanced pdf_assets/screen_advocates.jpg')

print('All assets prepared!')
