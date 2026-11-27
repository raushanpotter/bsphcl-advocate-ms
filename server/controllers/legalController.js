const Bill = require('../models/Bill');
const BillHistory = require('../models/BillHistory');

exports.getDashboard = async (req, res) => {
  try {
    const pending = await Bill.countDocuments({ currentStage: 'LEGAL', status: 'HR_SUBMITTED' });
    const verified = await Bill.countDocuments({ legalVerifiedBy: { $exists: true } });
    const returned = await Bill.countDocuments({ status: 'RETURNED_TO_HR' });
    const rejected = await Bill.countDocuments({ status: 'REJECTED' });
    const recentBills = await Bill.find({ $or: [{ currentStage: 'LEGAL' }, { status: 'LEGAL_VERIFIED' }, { status: 'RETURNED_TO_HR' }] }).populate('advocate', 'name').sort({ updatedAt: -1 }).limit(10);
    res.json({ success: true, data: { pending, verified, returned, rejected, recentBills } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingBills = async (req, res) => {
  try {
    const bills = await Bill.find({ currentStage: 'LEGAL', status: 'HR_SUBMITTED' }).populate('advocate', 'name enrollmentNumber mobile').populate('createdBy', 'name').sort({ submittedToLegalAt: 1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyBill = async (req, res) => {
  try {
    const { legalRemarks } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status !== 'HR_SUBMITTED' || bill.currentStage !== 'LEGAL') return res.status(400).json({ success: false, message: 'Bill not in correct stage for verification' });
    bill.status = 'LEGAL_VERIFIED';
    bill.currentStage = 'GM';
    bill.legalRemarks = legalRemarks;
    bill.legalVerifiedBy = req.user._id;
    bill.legalVerifiedAt = new Date();
    bill.submittedToGMAt = new Date();
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Verified by Legal', previousStatus: 'HR_SUBMITTED', newStatus: 'LEGAL_VERIFIED', remarks: legalRemarks || 'Bill verified by Legal department', performedBy: req.user._id, performedByRole: req.user.role });
    res.json({ success: true, message: 'Bill verified and forwarded to GM' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.returnBill = async (req, res) => {
  try {
    const { returnRemarks } = req.body;
    if (!returnRemarks || returnRemarks.trim() === '') return res.status(400).json({ success: false, message: 'Return remarks are mandatory' });
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.currentStage !== 'LEGAL') return res.status(400).json({ success: false, message: 'Bill not in Legal stage' });
    const prevStatus = bill.status;
    bill.status = 'RETURNED_TO_HR';
    bill.currentStage = 'HR';
    bill.returnRemarks = returnRemarks;
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Returned to HR', previousStatus: prevStatus, newStatus: 'RETURNED_TO_HR', remarks: returnRemarks, performedBy: req.user._id, performedByRole: req.user.role });
    res.json({ success: true, message: 'Bill returned to HR with remarks' });
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
    if (bill.currentStage !== 'LEGAL') return res.status(400).json({ success: false, message: 'Bill not in Legal stage' });
    const prevStatus = bill.status;
    bill.status = 'REJECTED';
    bill.currentStage = 'REJECTED';
    bill.rejectionReason = rejectionReason;
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Rejected by Legal', previousStatus: prevStatus, newStatus: 'REJECTED', remarks: rejectionReason, performedBy: req.user._id, performedByRole: req.user.role });
    res.json({ success: true, message: 'Bill rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
