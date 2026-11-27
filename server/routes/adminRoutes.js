const express = require('express');
const router = express.Router();
const { getDashboard, createUser, getUsers, updateUser, toggleUserStatus, resetPassword, changeUsername, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN'));
router.get('/dashboard', getDashboard);
router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/reset-password', resetPassword);
router.patch('/users/:id/change-username', changeUsername);
module.exports = router;
