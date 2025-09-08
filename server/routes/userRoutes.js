const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/userController');
const requireAuth = require('../middleware/authMiddleware');

// Apply auth middleware to all user routes
router.use(requireAuth);

// @route   GET api/user/profile
router.get('/profile', getUserProfile);

module.exports = router;
