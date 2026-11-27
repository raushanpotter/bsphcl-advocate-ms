const User = require('../models/User');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

exports.getDashboard = async (req, res) => {
  try {
    const totalBills = await Bill.countDocuments();
    const pendingLegal = await Bill.countDocuments({ currentStage: 'LEGAL', status: 'HR_SUBMITTED' });
    const pendingGM = await Bill.countDocuments({ currentStage: 'GM', status: 'LEGAL_VERIFIED' });
    const approved = await Bill.countDocuments({ status: { $in: ['APPROVED', 'PARTIALLY_PAID', 'PAID'] } });
    const partiallyPaid = await Bill.countDocuments({ status: 'PARTIALLY_PAID' });
    const paid = await Bill.countDocuments({ status: 'PAID' });
    const rejected = await Bill.countDocuments({ status: 'REJECTED' });
    const amountAgg = await Bill.aggregate([{ $group: { _id: null, totalClaimed: { $sum: '$claimedAmount' }, totalApproved: { $sum: { $ifNull: ['$approvedAmount', 0] } }, totalPaid: { $sum: { $ifNull: ['$totalPaid', 0] } } } }]);
    const amounts = amountAgg[0] || { totalClaimed: 0, totalApproved: 0, totalPaid: 0 };
    const recentBills = await Bill.find().populate('advocate', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: { totalBills, pendingLegal, pendingGM, approved, partiallyPaid, paid, rejected, totalClaimed: amounts.totalClaimed, totalApproved: amounts.totalApproved, totalPaid: amounts.totalPaid, totalOutstanding: amounts.totalApproved - amounts.totalPaid, recentBills } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, username, password, role, department, email, phone } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ success: false, message: 'Name, username, password and role are required' });
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });
    const user = await User.create({ name, username, password, role, department, email, phone });
    res.status(201).json({ success: true, data: { id: user._id, name: user.name, username: user.username, role: user.role, isActive: user.isActive, department: user.department, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: allUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, username, department, email, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Username / User ID is already in use by another account' });
      user.username = cleanUsername;
    }

    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: { isActive: user.isActive }, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changeUsername = async (req, res) => {
  try {
    const { newUsername } = req.body;
    if (!newUsername || !newUsername.trim()) {
      return res.status(400).json({ success: false, message: 'New User ID (username) is required' });
    }
    const cleanUsername = newUsername.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'User ID must be at least 3 characters long' });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'User ID can only contain letters, numbers, underscores, dashes, and periods' });
    }
    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This User ID is already assigned to another account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.username = cleanUsername;
    await user.save();
    res.json({ success: true, message: 'User ID updated successfully', data: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Prevent deleting self
    if (req.user && req.user._id && targetId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in Admin account.' });
    }

    const user = await User.findById(targetId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Protect primary admin
    if (user.username === 'admin') {
      return res.status(400).json({ success: false, message: 'The primary system admin account cannot be deleted.' });
    }

    await User.findByIdAndDelete(targetId);
    res.json({ success: true, message: `User account "${user.name}" (${user.username}) was permanently deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
