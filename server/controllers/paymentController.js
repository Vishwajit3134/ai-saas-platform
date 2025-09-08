const Razorpay = require('razorpay');
require('dotenv').config();
const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', notes = {} } = req.body;

        if (!amount) {
            console.error("Create Order failed: Amount is missing from request body.");
            return res.status(400).json({ error: 'Amount is required.' });
        }
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Create Order failed: Razorpay API keys are not configured on the server.");
            return res.status(500).json({ error: 'Payment gateway is not configured correctly.' });
        }

        const options = {
            amount,
            currency,
            receipt: `receipt_order_${new Date().getTime()}`,
            notes,
        };
        
        console.log("Attempting to create Razorpay order with options:", options);
        const order = await instance.orders.create(options);
        
        if (!order) {
            console.error("Razorpay order creation returned a null response.");
            return res.status(500).json({ error: "Failed to create order with Razorpay." });
        }

        res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });

    } catch (error) {
        // This will log the exact error from Razorpay to your Render logs.
        console.error('CRITICAL ERROR in createOrder:', error);
        res.status(500).json({ error: error.message || 'An internal server error occurred while creating the payment order.' });
    }
};

const verifyPayment = async (req, res) => {
    // ... verifyPayment logic ...
    res.status(200).json({ status: 'ok' });
};


module.exports = {
    createOrder,
    verifyPayment,
};

