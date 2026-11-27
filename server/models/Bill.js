const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billId: { type: String, unique: true },
  advocate: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate', required: true },
  originalBillNumber: { type: String, required: true, trim: true },
  billDate: { type: Date, required: true },
  submissionDate: { type: Date, required: true },
  claimedAmount: { type: Number, required: true, min: 0 },
  courtCaseNumber: { type: String, required: true, trim: true },
  courtName: { type: String, required: true, trim: true },
  caseDescription: { type: String, trim: true },
  department: { type: String, required: true, trim: true },
  remarks: { type: String, trim: true },
  billDocument: { type: String },
  currentStage: { type: String, enum: ['HR', 'LEGAL', 'GM', 'ACCOUNTS', 'COMPLETED', 'REJECTED'], default: 'HR' },
  status: {
    type: String,
    enum: ['DRAFT', 'HR_SUBMITTED', 'LEGAL_VERIFIED', 'RETURNED_TO_HR', 'APPROVED', 'REJECTED', 'PARTIALLY_PAID', 'PAID'],
    default: 'DRAFT'
  },
  legalRemarks: { type: String, trim: true },
  legalVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  legalVerifiedAt: { type: Date },
  returnRemarks: { type: String, trim: true },
  rejectionReason: { type: String, trim: true },
  approvedAmount: { type: Number, min: 0 },
  sanctionLetterNumber: { type: String, trim: true },
  sanctionLetterDate: { type: Date },
  sanctionLetterDocument: { type: String },
  gmApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gmApprovedAt: { type: Date },
  totalPaid: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedToLegalAt: { type: Date },
  submittedToGMAt: { type: Date },
  submittedToAccountsAt: { type: Date }
}, { timestamps: true });

billSchema.pre('save', async function(next) {
  if (!this.isNew || this.billId) return next();
  const year = new Date().getFullYear();
  const count = await mongoose.model('Bill').countDocuments();
  this.billId = `BSPHCL/ABM/${year}/${String(count + 1).padStart(4, '0')}`;
  next();
});

billSchema.index({ billId: 1 });
billSchema.index({ status: 1 });
billSchema.index({ currentStage: 1 });

billSchema.post('save', function(doc) {
  try {
    const { syncBillToStore } = require('../utils/billStore');
    syncBillToStore(doc._id);
  } catch (err) {
    // Non-blocking sync
  }
});

module.exports = mongoose.model('Bill', billSchema);
