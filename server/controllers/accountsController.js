const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const BillHistory = require('../models/BillHistory');

exports.getDashboard = async (req, res) => {
  try {
    const awaitingPayment = await Bill.countDocuments({ currentStage: 'ACCOUNTS', status: 'APPROVED' });
    const partiallyPaid = await Bill.countDocuments({ status: 'PARTIALLY_PAID' });
    const paid = await Bill.countDocuments({ status: 'PAID' });
    const agg = await Bill.aggregate([{ $match: { currentStage: { $in: ['ACCOUNTS', 'COMPLETED'] } } }, { $group: { _id: null, totalApproved: { $sum: { $ifNull: ['$approvedAmount', 0] } }, totalPaid: { $sum: { $ifNull: ['$totalPaid', 0] } } } }]);
    const amounts = agg[0] || { totalApproved: 0, totalPaid: 0 };
    const recentPayments = await Payment.find().populate({ path: 'bill', populate: { path: 'advocate', select: 'name' } }).populate('recordedBy', 'name').sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: { awaitingPayment, partiallyPaid, paid, totalApproved: amounts.totalApproved, totalPaid: amounts.totalPaid, totalOutstanding: amounts.totalApproved - amounts.totalPaid, recentPayments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingBills = async (req, res) => {
  try {
    const bills = await Bill.find({ currentStage: 'ACCOUNTS', status: { $in: ['APPROVED', 'PARTIALLY_PAID'] } }).populate('advocate', 'name enrollmentNumber mobile').populate('gmApprovedBy', 'name').sort({ submittedToAccountsAt: 1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMode, transactionReference, remarks } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be positive' });
    if (!paymentDate) return res.status(400).json({ success: false, message: 'Payment date is required' });
    if (!paymentMode) return res.status(400).json({ success: false, message: 'Payment mode is required' });
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    if (!['APPROVED', 'PARTIALLY_PAID'].includes(bill.status)) return res.status(400).json({ success: false, message: 'Bill is not in payable status' });
    if (bill.currentStage !== 'ACCOUNTS') return res.status(400).json({ success: false, message: 'Bill is not in Accounts stage' });
    const outstanding = bill.approvedAmount - (bill.totalPaid || 0);
    if (Number(amount) > outstanding + 0.01) return res.status(400).json({ success: false, message: `Payment amount Rs.${amount} exceeds outstanding amount Rs.${outstanding.toFixed(2)}` });
    const payment = await Payment.create({ bill: bill._id, amount: Number(amount), paymentDate: new Date(paymentDate), paymentMode, transactionReference, remarks, recordedBy: req.user._id });
    const prevStatus = bill.status;
    bill.totalPaid = (bill.totalPaid || 0) + Number(amount);
    if (bill.totalPaid >= bill.approvedAmount) {
      bill.status = 'PAID';
      bill.currentStage = 'COMPLETED';
    } else {
      bill.status = 'PARTIALLY_PAID';
    }
    await bill.save();
    await BillHistory.create({ bill: bill._id, action: 'Payment Recorded', previousStatus: prevStatus, newStatus: bill.status, remarks: `Rs.${Number(amount).toLocaleString('en-IN')} paid via ${paymentMode}${transactionReference ? '. Ref: ' + transactionReference : ''}`, performedBy: req.user._id, performedByRole: req.user.role });
    res.status(201).json({ success: true, data: payment, billStatus: bill.status, totalPaid: bill.totalPaid, outstanding: bill.approvedAmount - bill.totalPaid, message: bill.status === 'PAID' ? 'Bill fully paid!' : 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ bill: req.params.id }).populate('recordedBy', 'name').sort({ createdAt: -1 });
    const bill = await Bill.findById(req.params.id).populate('advocate', 'name');
    res.json({ success: true, data: payments, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
