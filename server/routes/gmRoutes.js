const express = require('express');
const router = express.Router();
const { getDashboard, getPendingBills, approveBill, rejectBill } = require('../controllers/gmController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('GM', 'ADMIN'));
router.get('/dashboard', getDashboard);
router.get('/pending', getPendingBills);
router.post('/bills/:id/approve', upload.single('sanctionLetterDocument'), approveBill);
router.post('/bills/:id/reject', rejectBill);
module.exports = router;
