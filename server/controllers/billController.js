const Bill = require('../models/Bill');
const BillHistory = require('../models/BillHistory');
const Payment = require('../models/Payment');
const Advocate = require('../models/Advocate');

exports.createBill = async (req, res) => {
  try {
    const { advocate, originalBillNumber, billDate, submissionDate, claimedAmount, courtCaseNumber, courtName, caseDescription, department, remarks } = req.body;
    if (!advocate || !originalBillNumber || !billDate || !submissionDate || !claimedAmount || !courtCaseNumber || !courtName || !department) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const billData = { 
      advocate, 
      originalBillNumber, 
      billDate, 
      submissionDate, 
      claimedAmount: Number(claimedAmount), 
      courtCaseNumber, 
      courtName, 
      caseDescription, 
      department, 
      remarks, 
      createdBy: req.user._id, 
      status: 'DRAFT', 
      currentStage: 'HR' 
    };
    if (req.file) billData.billDocument = req.file.filename;
    const bill = await Bill.create(billData);
    await BillHistory.create({ 
      bill: bill._id, 
      action: 'Bill Registered', 
      newStatus: 'DRAFT', 
      remarks: 'Bill registered by HR in system', 
      performedBy: req.user._id, 
      performedByRole: req.user.role 
    });
    const populatedBill = await Bill.findById(bill._id).populate('advocate', 'name enrollmentNumber');
    res.status(201).json({ success: true, data: populatedBill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBills = async (req, res) => {
  try {
    const { search, status, stage, startDate, endDate, page = 1, limit = 20, myBills } = req.query;
    const query = {};

    if (search && search.trim()) {
      const matchingAdvocates = await Advocate.find({ name: { $regex: search.trim(), $options: 'i' } }).select('_id');
      const advocateIds = matchingAdvocates.map(a => a._id);
      query.$or = [
        { billId: { $regex: search.trim(), $options: 'i' } },
        { originalBillNumber: { $regex: search.trim(), $options: 'i' } },
        { courtCaseNumber: { $regex: search.trim(), $options: 'i' } },
        { advocate: { $in: advocateIds } }
      ];
    }

    if (status) query.status = status;
    if (stage) query.currentStage = stage;
    if (startDate || endDate) {
      query.submissionDate = {};
      if (startDate) query.submissionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.submissionDate.$lte = end;
      }
    }
    if (myBills === 'true') query.createdBy = req.user._id;

    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .populate('advocate', 'name enrollmentNumber mobile')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, data: bills, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('advocate')
      .populate('createdBy', 'name role')
      .populate('legalVerifiedBy', 'name role')
      .populate('gmApprovedBy', 'name role');

    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    const payments = await Payment.find({ bill: bill._id }).populate('recordedBy', 'name role').sort({ createdAt: -1 });
    const history = await BillHistory.find({ bill: bill._id }).populate('performedBy', 'name role').sort({ createdAt: 1 });
    res.json({ success: true, data: { bill, payments, history } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (!['DRAFT', 'RETURNED_TO_HR'].includes(bill.status)) {
      return res.status(400).json({ success: false, message: 'Bill cannot be edited in current status' });
    }
    const fields = ['originalBillNumber', 'billDate', 'submissionDate', 'courtCaseNumber', 'courtName', 'caseDescription', 'department', 'remarks'];
    fields.forEach(f => { if (req.body[f] !== undefined) bill[f] = req.body[f]; });
    if (req.body.claimedAmount) bill.claimedAmount = Number(req.body.claimedAmount);
    if (req.file) bill.billDocument = req.file.filename;
    await bill.save();
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBillHistory = async (req, res) => {
  try {
    const history = await BillHistory.find({ bill: req.params.id }).populate('performedBy', 'name role').sort({ createdAt: 1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    // Remove all associated payments and audit trail histories
    await Payment.deleteMany({ bill: bill._id });
    await BillHistory.deleteMany({ bill: bill._id });

    // Clean up uploaded document attachments if stored on disk
    const fs = require('fs');
    const path = require('path');
    if (bill.billDocument) {
      const docPath = path.join(__dirname, '../uploads', bill.billDocument);
      if (fs.existsSync(docPath)) {
        try { fs.unlinkSync(docPath); } catch (e) {}
      }
    }
    if (bill.sanctionLetterDocument) {
      const sanctionPath = path.join(__dirname, '../uploads', bill.sanctionLetterDocument);
      if (fs.existsSync(sanctionPath)) {
        try { fs.unlinkSync(sanctionPath); } catch (e) {}
      }
    }

    await Bill.findByIdAndDelete(req.params.id);
    try {
      const { removeStoredBill } = require('../utils/billStore');
      removeStoredBill(bill.billId);
      removeStoredBill(bill._id);
    } catch (err) {}
    res.json({ success: true, message: `Bill ${bill.billId} was permanently removed by Account Officer.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
