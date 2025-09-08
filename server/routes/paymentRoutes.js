const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const requireAuth = require('../middleware/authMiddleware');

// All payment routes should require authentication
router.use(requireAuth);

// @route   POST api/payment/create-order
router.post('/create-order', createOrder);

// @route   POST api/payment/webhook
// This is for Razorpay to send server-to-server updates
router.post('/webhook', verifyPayment);

module.exports = router;
