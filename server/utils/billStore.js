const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '../data');
const storePath = path.join(dataDir, 'persistent_bills.json');

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getStoredBills() {
  try {
    ensureDir();
    if (!fs.existsSync(storePath)) return [];
    const content = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Failed to read persistent bills file:', err.message);
    return [];
  }
}

function writeStoredBills(list) {
  try {
    ensureDir();
    fs.writeFileSync(storePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write persistent bills file:', err.message);
  }
}

function removeStoredBill(billIdentifier) {
  try {
    ensureDir();
    const list = getStoredBills();
    const idStr = String(billIdentifier || '').trim();
    const filtered = list.filter(b => b.billId !== idStr && String(b._id || '') !== idStr);
    writeStoredBills(filtered);
  } catch (err) {
    console.error('Failed to remove persistent bill from storage:', err.message);
  }
}

async function syncBillToStore(billIdOrDoc) {
  try {
    if (!billIdOrDoc) return;
    const Bill = mongoose.model('Bill');
    const Payment = mongoose.model('Payment');
    const BillHistory = mongoose.model('BillHistory');

    let bill;
    if (billIdOrDoc._id) {
      bill = await Bill.findById(billIdOrDoc._id).populate('advocate');
    } else if (mongoose.isValidObjectId(billIdOrDoc)) {
      bill = await Bill.findById(billIdOrDoc).populate('advocate');
    } else {
      bill = await Bill.findOne({ billId: billIdOrDoc }).populate('advocate');
    }

    if (!bill) return;

    const payments = await Payment.find({ bill: bill._id }).sort({ createdAt: 1 }).lean();
    const history = await BillHistory.find({ bill: bill._id }).sort({ createdAt: 1 }).lean();

    const snapshot = {
      billId: bill.billId,
      advocateEnrollment: bill.advocate?.enrollmentNumber || '',
      advocateName: bill.advocate?.name || '',
      originalBillNumber: bill.originalBillNumber,
      billDate: bill.billDate,
      submissionDate: bill.submissionDate,
      claimedAmount: bill.claimedAmount,
      courtCaseNumber: bill.courtCaseNumber,
      courtName: bill.courtName,
      caseDescription: bill.caseDescription,
      department: bill.department,
      remarks: bill.remarks,
      billDocument: bill.billDocument,
      currentStage: bill.currentStage,
      status: bill.status,
      legalRemarks: bill.legalRemarks,
      legalVerifiedAt: bill.legalVerifiedAt,
      returnRemarks: bill.returnRemarks,
      rejectionReason: bill.rejectionReason,
      approvedAmount: bill.approvedAmount,
      sanctionLetterNumber: bill.sanctionLetterNumber,
      sanctionLetterDate: bill.sanctionLetterDate,
      sanctionLetterDocument: bill.sanctionLetterDocument,
      gmApprovedAt: bill.gmApprovedAt,
      totalPaid: bill.totalPaid || 0,
      submittedToLegalAt: bill.submittedToLegalAt,
      submittedToGMAt: bill.submittedToGMAt,
      submittedToAccountsAt: bill.submittedToAccountsAt,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
      payments: payments.map(p => ({
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMode: p.paymentMode,
        referenceNumber: p.referenceNumber,
        voucherNumber: p.voucherNumber,
        remarks: p.remarks,
        createdAt: p.createdAt
      })),
      history: history.map(h => ({
        action: h.action,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        remarks: h.remarks,
        performedByRole: h.performedByRole,
        createdAt: h.createdAt
      }))
    };

    const list = getStoredBills();
    const existingIndex = list.findIndex(b => b.billId === snapshot.billId);
    if (existingIndex >= 0) {
      list[existingIndex] = snapshot;
    } else {
      list.push(snapshot);
    }
    writeStoredBills(list);
  } catch (err) {
    console.error('Error syncing bill to persistent storage:', err.message);
  }
}

async function restoreStoredBills(adminUser) {
  try {
    const Bill = mongoose.model('Bill');
    const Advocate = mongoose.model('Advocate');
    const Payment = mongoose.model('Payment');
    const BillHistory = mongoose.model('BillHistory');

    const storedBills = getStoredBills();
    if (!storedBills || storedBills.length === 0) return;

    for (const sBill of storedBills) {
      let existingBill = await Bill.findOne({ billId: sBill.billId });
      
      // Find matching advocate
      let advocate = null;
      if (sBill.advocateEnrollment) {
        advocate = await Advocate.findOne({
          enrollmentNumber: sBill.advocateEnrollment.trim().toUpperCase()
        });
      }
      if (!advocate && sBill.advocateName) {
        advocate = await Advocate.findOne({ name: sBill.advocateName });
      }
      if (!advocate) {
        // Fallback to first available active advocate
        advocate = await Advocate.findOne({ isActive: true });
      }

      if (!advocate) {
        console.warn(`Cannot restore bill ${sBill.billId}: No advocate found in database.`);
        continue;
      }

      if (!existingBill) {
        existingBill = new Bill({
          billId: sBill.billId,
          advocate: advocate._id,
          originalBillNumber: sBill.originalBillNumber,
          billDate: sBill.billDate,
          submissionDate: sBill.submissionDate,
          claimedAmount: sBill.claimedAmount,
          courtCaseNumber: sBill.courtCaseNumber,
          courtName: sBill.courtName,
          caseDescription: sBill.caseDescription,
          department: sBill.department,
          remarks: sBill.remarks,
          billDocument: sBill.billDocument,
          currentStage: sBill.currentStage,
          status: sBill.status,
          legalRemarks: sBill.legalRemarks,
          legalVerifiedAt: sBill.legalVerifiedAt,
          returnRemarks: sBill.returnRemarks,
          rejectionReason: sBill.rejectionReason,
          approvedAmount: sBill.approvedAmount,
          sanctionLetterNumber: sBill.sanctionLetterNumber,
          sanctionLetterDate: sBill.sanctionLetterDate,
          sanctionLetterDocument: sBill.sanctionLetterDocument,
          gmApprovedAt: sBill.gmApprovedAt,
          totalPaid: sBill.totalPaid || 0,
          submittedToLegalAt: sBill.submittedToLegalAt,
          submittedToGMAt: sBill.submittedToGMAt,
          submittedToAccountsAt: sBill.submittedToAccountsAt,
          createdBy: adminUser?._id,
          createdAt: sBill.createdAt || new Date(),
          updatedAt: sBill.updatedAt || new Date()
        });
        await existingBill.save();
        console.log(`✓ Restored persistent bill: ${sBill.billId} [${sBill.status} / ${sBill.currentStage}]`);
      } else {
        // Sync any updated status or payments
        let changed = false;
        if (existingBill.status !== sBill.status) { existingBill.status = sBill.status; changed = true; }
        if (existingBill.currentStage !== sBill.currentStage) { existingBill.currentStage = sBill.currentStage; changed = true; }
        if (existingBill.approvedAmount !== sBill.approvedAmount) { existingBill.approvedAmount = sBill.approvedAmount; changed = true; }
        if (existingBill.totalPaid !== sBill.totalPaid) { existingBill.totalPaid = sBill.totalPaid; changed = true; }
        if (changed) await existingBill.save();
      }

      // Restore child payments
      if (sBill.payments && sBill.payments.length > 0) {
        for (const p of sBill.payments) {
          const pExists = await Payment.findOne({
            bill: existingBill._id,
            amount: p.amount,
            referenceNumber: p.referenceNumber
          });
          if (!pExists) {
            await Payment.create({
              bill: existingBill._id,
              amount: p.amount,
              paymentDate: p.paymentDate,
              paymentMode: p.paymentMode,
              referenceNumber: p.referenceNumber,
              voucherNumber: p.voucherNumber,
              remarks: p.remarks,
              recordedBy: adminUser?._id,
              createdAt: p.createdAt || new Date()
            });
          }
        }
      }

      // Restore history trail
      if (sBill.history && sBill.history.length > 0) {
        for (const h of sBill.history) {
          const hExists = await BillHistory.findOne({
            bill: existingBill._id,
            action: h.action,
            newStatus: h.newStatus,
            createdAt: h.createdAt
          });
          if (!hExists) {
            await BillHistory.create({
              bill: existingBill._id,
              action: h.action,
              previousStatus: h.previousStatus,
              newStatus: h.newStatus,
              remarks: h.remarks,
              performedBy: adminUser?._id,
              performedByRole: h.performedByRole || 'SYSTEM',
              createdAt: h.createdAt || new Date()
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error restoring persistent bills:', err.message);
  }
}

module.exports = {
  getStoredBills,
  writeStoredBills,
  removeStoredBill,
  syncBillToStore,
  restoreStoredBills
};
