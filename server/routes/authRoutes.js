const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, changeUsername } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/change-username', protect, changeUsername);
module.exports = router;
