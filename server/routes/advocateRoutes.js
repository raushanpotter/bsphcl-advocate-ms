const express = require('express');
const router = express.Router();
const { createAdvocate, getAdvocates, getAdvocate, updateAdvocate, deleteAdvocate } = require('../controllers/advocateController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('ADMIN', 'HR'), createAdvocate);
router.get('/', getAdvocates);
router.get('/:id', getAdvocate);
router.put('/:id', authorize('ADMIN', 'HR'), updateAdvocate);
router.delete('/:id', authorize('ADMIN', 'HR'), deleteAdvocate);
module.exports = router;
