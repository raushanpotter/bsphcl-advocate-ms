const express = require('express');
const router = express.Router();
const { getDashboard, submitToLegal, resubmitToLegal } = require('../controllers/hrController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('HR', 'ADMIN'));
router.get('/dashboard', getDashboard);
router.post('/bills/:id/submit', submitToLegal);
router.post('/bills/:id/resubmit', upload.single('billDocument'), resubmitToLegal);
module.exports = router;
