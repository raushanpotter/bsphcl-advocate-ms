const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Advocate = require('../models/Advocate');

exports.getSummary = async (req, res) => {
  try {
    const total = await Bill.countDocuments();
    const byStatus = await Bill.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, totalClaimed: { $sum: '$claimedAmount' }, totalApproved: { $sum: { $ifNull: ['$approvedAmount', 0] } } } }]);
    const totalPaymentsAgg = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalAdvocates = await Advocate.countDocuments();
    res.json({ success: true, data: { total, byStatus, totalPayments: totalPaymentsAgg[0]?.total || 0, totalAdvocates } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBillsReport = async (req, res) => {
  try {
    const { startDate, endDate, status, format, dateType } = req.query;
    const query = {};
    if (status) query.status = status;

    // Date range filter: support submissionDate (default), billDate, or createdAt
    if (startDate || endDate) {
      const field = dateType === 'billDate' ? 'billDate' : (dateType === 'createdAt' ? 'createdAt' : 'submissionDate');
      query[field] = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query[field].$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query[field].$lte = end;
      }
    }

    const bills = await Bill.find(query)
      .populate('advocate', 'name enrollmentNumber mobile email')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const headers = [
        'Bill ID',
        'Advocate Name',
        'Bar Enrollment Number',
        'Advocate Mobile',
        'Advocate Email',
        'Original Bill Number',
        'Court Case Number',
        'Court Name',
        'Department',
        'Bill Date',
        'Submission Date',
        'Claimed Amount (INR)',
        'Approved Amount (INR)',
        'Total Paid (INR)',
        'Outstanding Liability (INR)',
        'Status',
        'Current Stage',
        'Sanction Letter Number',
        'Sanction Letter Date',
        'Registered By'
      ];

      const rows = [headers];
      bills.forEach(b => {
        const approved = Number(b.approvedAmount || 0);
        const paid = Number(b.totalPaid || 0);
        const outstanding = approved > paid ? approved - paid : 0;
        rows.push([
          b.billId || '',
          b.advocate?.name || '',
          b.advocate?.enrollmentNumber || '',
          b.advocate?.mobile || '',
          b.advocate?.email || '',
          b.originalBillNumber || '',
          b.courtCaseNumber || '',
          b.courtName || '',
          b.department || '',
          b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '',
          b.submissionDate ? new Date(b.submissionDate).toLocaleDateString('en-IN') : '',
          Number(b.claimedAmount || 0),
          approved,
          paid,
          outstanding,
          b.status || '',
          b.currentStage || '',
          b.sanctionLetterNumber || '',
          b.sanctionLetterDate ? new Date(b.sanctionLetterDate).toLocaleDateString('en-IN') : '',
          b.createdBy?.name || ''
        ]);
      });

      const csvContent = rows
        .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=bsphcl_bills_report.csv');
      return res.status(200).send(csvContent);
    }

    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
