const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentDate: { type: Date, required: true },
  paymentMode: { type: String, enum: ['NEFT', 'RTGS', 'Cheque', 'Other'], required: true },
  transactionReference: { type: String, trim: true },
  remarks: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.post('save', function(doc) {
  try {
    const { syncBillToStore } = require('../utils/billStore');
    syncBillToStore(doc.bill);
  } catch (err) {}
});

module.exports = mongoose.model('Payment', paymentSchema);
