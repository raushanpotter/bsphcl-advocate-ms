const Bill = require('../models/Bill');
const BillHistory = require('../models/BillHistory');

exports.getDashboard = async (req, res) => {
  try {
    const pending = await Bill.countDocuments({ currentStage: 'GM', status: 'LEGAL_VERIFIED' });
    const approved = await Bill.countDocuments({ status: { $in: ['APPROVED', 'PARTIALLY_PAID', 'PAID'] } });
    const rejected = await Bill.countDocuments({ status: 'REJECTED' });
    const recentBills = await Bill.find({ $or: [{ currentStage: 'GM' }, { status: { $in: ['APPROVED', 'PARTIALLY_PAID', 'PAID'] } }] }).populate('advocate', 'name').sort({ updatedAt: -1 }).limit(10);
    res.json({ success: true, data: { pending, approved, rejected, recentBills } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingBills = async (req, res) => {
  try {
    const bills = await Bill.find({ currentStage: 'GM', status: 'LEGAL_VERIFIED' }).populate('advocate', 'name enrollmentNumber mobile').populate('legalVerifiedBy', 'name').populate('createdBy', 'name').sort({ submittedToGMAt: 1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveBill = async (req, res) => {
  try {
    const { approvedAmount, sanctionLetterNumber, sanctionLetterDate, remarks } = req.body;
    if (!approvedAmount || Number(approvedAmount) <= 0) return res.status(400).json({ success: false, message: 'Approved amount is required and must be positive' });
    if (!sanctionLetterNumber || sanctionLetterNumber.trim() === '') return res.status(400).json({ success: false, message: 'Sanction letter number is required' });
    if (!sanctionLetterDate) return res.status(400).json({ success: false, message: 'Sanction letter date is required' });
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status !== 'LEGAL_VERIFIED' || bill.currentStage !== 'GM') return res.status(400).json({ success: false, message: 'Bill not in correct stage for GM approval' });
    bill.status = 'APPROVED';
    bill.currentStage = 'ACCOUNTS';
    bill.approvedAmount = Number(approvedAmount);
    bill.sanctionLetterNumber = sanctionLetterNumber;
    bill.sanctionLetterDate = new Date(sanctionLetterDate);
    if (req.file) bill.sanctionLetterDocument = req.file.filename;
    bill.gmApprovedBy = req.user._id;
    bill.gmApprovedAt = new Date();
    bill.submittedToAccountsAt = new Date();
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Approved by GM', previousStatus: 'LEGAL_VERIFIED', newStatus: 'APPROVED', remarks: `Approved Amount: Rs.${approvedAmount}. Sanction No: ${sanctionLetterNumber}. ${remarks || ''}`.trim(), performedBy: req.user._id, performedByRole: req.user.role });
    res.json({ success: true, message: 'Bill approved and forwarded to Accounts' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectBill = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || rejectionReason.trim() === '') return res.status(400).json({ success: false, message: 'Rejection reason is mandatory' });
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.currentStage !== 'GM') return res.status(400).json({ success: false, message: 'Bill not in GM stage' });
    const prevStatus = bill.status;
    bill.status = 'REJECTED';
    bill.currentStage = 'REJECTED';
    bill.rejectionReason = rejectionReason;
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Rejected by GM', previousStatus: prevStatus, newStatus: 'REJECTED', remarks: rejectionReason, performedBy: req.user._id, performedByRole: req.user.role });
    res.json({ success: true, message: 'Bill rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
