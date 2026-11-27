const Advocate = require('../models/Advocate');
const Bill = require('../models/Bill');
const { saveStoredAdvocate, removeStoredAdvocate } = require('../utils/advocateStore');

exports.createAdvocate = async (req, res) => {
  try {
    const { name, enrollmentNumber, mobile, email, address, specialization } = req.body;
    if (!name || !enrollmentNumber) return res.status(400).json({ success: false, message: 'Name and enrollment number are required' });
    const cleanEnrollment = enrollmentNumber.trim().toUpperCase();
    const existing = await Advocate.findOne({ enrollmentNumber: cleanEnrollment });
    if (existing) return res.status(400).json({ success: false, message: 'Enrollment number already exists' });
    const advocate = await Advocate.create({ 
      name: name.trim(), 
      enrollmentNumber: cleanEnrollment, 
      mobile: (mobile || '').trim(), 
      email: (email || '').trim().toLowerCase(), 
      address: (address || '').trim(), 
      specialization: (specialization || 'Empanelled Advocate').trim(), 
      createdBy: req.user._id 
    });
    // Persist to backup store for survival across server restarts
    saveStoredAdvocate(advocate);
    res.status(201).json({ success: true, data: advocate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdvocates = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { enrollmentNumber: { $regex: search, $options: 'i' } }, { mobile: { $regex: search, $options: 'i' } }];
    if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
    const total = await Advocate.countDocuments(query);
    const advocates = await Advocate.find(query).sort({ createdAt: -1 }).skip((page - 1) * Number(limit)).limit(Number(limit));
    res.json({ success: true, data: advocates, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdvocate = async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.id);
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });
    const bills = await Bill.find({ advocate: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: advocate, bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAdvocate = async (req, res) => {
  try {
    const { name, enrollmentNumber, mobile, email, address, specialization, isActive } = req.body;
    const advocate = await Advocate.findById(req.params.id);
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    // If enrollment number is changed, ensure it is unique
    if (enrollmentNumber && enrollmentNumber.trim().toUpperCase() !== advocate.enrollmentNumber) {
      const cleanEnrollment = enrollmentNumber.trim().toUpperCase();
      const existing = await Advocate.findOne({ enrollmentNumber: cleanEnrollment, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bar Council Enrollment number already exists for another advocate' });
      }
      advocate.enrollmentNumber = cleanEnrollment;
    }

    if (name) advocate.name = name.trim();
    if (mobile) advocate.mobile = mobile.trim();
    if (email !== undefined) advocate.email = email.trim().toLowerCase();
    if (address !== undefined) advocate.address = address.trim();
    if (specialization !== undefined) advocate.specialization = specialization.trim();
    if (isActive !== undefined) advocate.isActive = isActive;

    await advocate.save();
    saveStoredAdvocate(advocate);
    res.json({ success: true, data: advocate, message: 'Advocate updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAdvocate = async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.id);
    if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

    // Check if advocate is associated with any bills
    const billCount = await Bill.countDocuments({ advocate: req.params.id });
    if (billCount > 0) {
      if (req.query.force === 'true') {
        const Payment = require('../models/Payment');
        const BillHistory = require('../models/BillHistory');
        const bills = await Bill.find({ advocate: req.params.id });
        const billIds = bills.map(b => b._id);
        await Payment.deleteMany({ bill: { $in: billIds } });
        await BillHistory.deleteMany({ bill: { $in: billIds } });
        await Bill.deleteMany({ advocate: req.params.id });
        await Advocate.findByIdAndDelete(req.params.id);
        removeStoredAdvocate(advocate.enrollmentNumber);
        return res.json({ success: true, message: `Advocate "${advocate.name}" and ${billCount} associated bill(s) were deleted successfully.` });
      }

      return res.status(400).json({
        success: false,
        hasBills: true,
        billCount,
        message: `Advocate "${advocate.name}" has ${billCount} registered bill(s). To delete, confirm deleting associated bills or deactivate the advocate.`
      });
    }

    await Advocate.findByIdAndDelete(req.params.id);
    removeStoredAdvocate(advocate.enrollmentNumber);
    res.json({ success: true, message: `Advocate "${advocate.name}" (${advocate.enrollmentNumber}) was deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
