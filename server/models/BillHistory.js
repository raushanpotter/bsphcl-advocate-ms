const mongoose = require('mongoose');

const billHistorySchema = new mongoose.Schema({
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  action: { type: String, required: true },
  previousStatus: { type: String },
  newStatus: { type: String },
  remarks: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByRole: { type: String }
}, { timestamps: true });

billHistorySchema.post('save', function(doc) {
  try {
    const { syncBillToStore } = require('../utils/billStore');
    syncBillToStore(doc.bill);
  } catch (err) {}
});

module.exports = mongoose.model('BillHistory', billHistorySchema);
