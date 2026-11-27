const express = require('express');
const router = express.Router();
const { getSummary, getBillsReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN', 'ACCOUNTS', 'GM', 'HR'));
router.get('/summary', getSummary);
router.get('/bills', getBillsReport);
module.exports = router;
