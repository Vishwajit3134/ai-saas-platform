const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const requireAuth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

// Protect all admin routes: a user must be logged in AND have the 'admin' role.
router.use(requireAuth, requireAdmin);

// @route   GET /api/admin/users
// @desc    Get a list of all users
router.get('/users', getAllUsers);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a specific user
router.delete('/users/:id', deleteUser);

module.exports = router;

