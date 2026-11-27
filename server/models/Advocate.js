const mongoose = require('mongoose');

const advocateSchema = new mongoose.Schema({
  advocateId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  enrollmentNumber: { type: String, required: true, unique: true, trim: true },
  mobile: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, trim: true, default: '' },
  specialization: { type: String, trim: true, default: 'Empanelled Advocate' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

advocateSchema.pre('save', async function(next) {
  if (!this.isNew || this.advocateId) return next();
  const lastAdv = await mongoose.model('Advocate').findOne({ advocateId: /^ADV\/\d+$/ }).sort({ advocateId: -1 });
  let nextNum = 1;
  if (lastAdv && lastAdv.advocateId) {
    const match = lastAdv.advocateId.match(/^ADV\/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  // Guarantee uniqueness
  while (await mongoose.model('Advocate').findOne({ advocateId: `ADV/${String(nextNum).padStart(4, '0')}` })) {
    nextNum++;
  }
  this.advocateId = `ADV/${String(nextNum).padStart(4, '0')}`;
  next();
});

advocateSchema.index({ advocateId: 1 });
advocateSchema.index({ enrollmentNumber: 1 });
module.exports = mongoose.model('Advocate', advocateSchema);
