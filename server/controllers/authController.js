const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Please provide username and password' });
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, username: user.username, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changeUsername = async (req, res) => {
  try {
    const { newUsername, password } = req.body;
    if (!newUsername || !newUsername.trim()) {
      return res.status(400).json({ success: false, message: 'New User ID (username) is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Current password is required to confirm identity' });
    }
    const cleanUsername = newUsername.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'User ID must be at least 3 characters long' });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'User ID can only contain letters, numbers, underscores, dashes, and periods' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    if (cleanUsername === user.username) {
      return res.status(400).json({ success: false, message: 'New User ID is identical to your current User ID' });
    }

    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ success: false, message: 'This User ID is already taken by another account' });

    user.username = cleanUsername;
    await user.save();
    res.json({
      success: true,
      message: 'User ID updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        department: user.department,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
