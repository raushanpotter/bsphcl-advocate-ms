const express = require('express');
const router = express.Router();
const { getDashboard, getPendingBills, verifyBill, returnBill, rejectBill } = require('../controllers/legalController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('LEGAL', 'ADMIN'));
router.get('/dashboard', getDashboard);
router.get('/pending', getPendingBills);
router.post('/bills/:id/verify', verifyBill);
router.post('/bills/:id/return', returnBill);
router.post('/bills/:id/reject', rejectBill);
module.exports = router;
