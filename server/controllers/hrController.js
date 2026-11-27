const Bill = require('../models/Bill');
const BillHistory = require('../models/BillHistory');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const total = await Bill.countDocuments({ createdBy: userId });
    const submitted = await Bill.countDocuments({ createdBy: userId, status: 'HR_SUBMITTED' });
    const returned = await Bill.countDocuments({ createdBy: userId, status: 'RETURNED_TO_HR' });
    const rejected = await Bill.countDocuments({ createdBy: userId, status: 'REJECTED' });
    const draft = await Bill.countDocuments({ createdBy: userId, status: 'DRAFT' });
    const recentBills = await Bill.find({ createdBy: userId }).populate('advocate', 'name').sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: { total, submitted, returned, rejected, draft, recentBills } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitToLegal = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (!['DRAFT', 'RETURNED_TO_HR'].includes(bill.status)) return res.status(400).json({ success: false, message: 'Bill cannot be submitted in current status' });
    const prevStatus = bill.status;
    bill.status = 'HR_SUBMITTED';
    bill.currentStage = 'LEGAL';
    bill.submittedToLegalAt = new Date();
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Submitted to Legal', previousStatus: prevStatus, newStatus: 'HR_SUBMITTED', remarks: 'Bill forwarded to Legal department for verification', performedBy: req.user._id, performedByRole: req.user.role });
    res.json({ success: true, message: 'Bill submitted to Legal successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resubmitToLegal = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status !== 'RETURNED_TO_HR') return res.status(400).json({ success: false, message: 'Bill is not in returned status' });

    // Update any refilled / corrected fields
    const fields = [
      'originalBillNumber', 'billDate', 'submissionDate', 
      'courtCaseNumber', 'courtName', 'caseDescription', 
      'department', 'remarks'
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined && req.body[f] !== '') bill[f] = req.body[f];
    });
    if (req.body.advocate) bill.advocate = req.body.advocate;
    if (req.body.claimedAmount) bill.claimedAmount = Number(req.body.claimedAmount);

    // If new document file was uploaded, update document reference
    if (req.file) {
      bill.billDocument = req.file.filename;
    }

    bill.status = 'HR_SUBMITTED';
    bill.currentStage = 'LEGAL';
    bill.submittedToLegalAt = new Date();
    await bill.save();

    const remarksText = req.body.resubmitRemarks || req.body.remarks || 'Corrections resolved and resubmitted to Legal';
    await BillHistory.create({
      bill: bill._id,
      action: 'Resubmitted to Legal',
      previousStatus: 'RETURNED_TO_HR',
      newStatus: 'HR_SUBMITTED',
      remarks: remarksText,
      performedBy: req.user._id,
      performedByRole: req.user.role
    });

    const populated = await Bill.findById(bill._id).populate('advocate', 'name enrollmentNumber mobile');
    res.json({ success: true, message: 'Bill corrections saved and resubmitted to Legal successfully', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
