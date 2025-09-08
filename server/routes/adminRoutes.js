const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const requireAuth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

// Protect all admin routes
router.use(requireAuth, requireAdmin);

// Define routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
