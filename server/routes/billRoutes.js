const express = require('express');
const router = express.Router();
const { createBill, getBills, getBill, updateBill, getBillHistory, deleteBill } = require('../controllers/billController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.post('/', authorize('HR', 'ADMIN'), upload.single('billDocument'), createBill);
router.get('/', getBills);
router.get('/:id', getBill);
router.put('/:id', authorize('HR', 'ADMIN'), upload.single('billDocument'), updateBill);
router.delete('/:id', authorize('ACCOUNTS'), deleteBill);
router.get('/:id/history', getBillHistory);
module.exports = router;
