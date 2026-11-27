const express = require('express');
const router = express.Router();
const { getDashboard, getPendingBills, recordPayment, getPayments } = require('../controllers/accountsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ACCOUNTS', 'ADMIN'));
router.get('/dashboard', getDashboard);
router.get('/pending', getPendingBills);
router.post('/bills/:id/payments', recordPayment);
router.get('/bills/:id/payments', getPayments);
module.exports = router;
