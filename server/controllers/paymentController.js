const Razorpay = require('razorpay');
require('dotenv').config();
const supabase = require('../config/supabaseClient');
const crypto =require('crypto');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
    // We now expect 'notes' to be passed from the frontend
    const { amount, currency = 'INR', notes = {} } = req.body;

    if (!amount) {
        return res.status(400).json({ error: 'Amount is required.' });
    }

    const options = {
        amount, // Amount in the smallest currency unit (e.g., paise)
        currency,
        receipt: `receipt_order_${new Date().getTime()}`,
        notes, // Pass the user_id and credits_to_add to Razorpay
    };

    try {
        const order = await instance.orders.create(options);
        if (!order) {
            return res.status(500).send("Error creating order");
        }
        res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: error.message || 'Failed to create Razorpay order.' });
    }
};

const verifyPayment = async (req, res) => {
    // ... (This logic is for the next step, but we'll keep it here)
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).json({ error: 'Invalid signature.' });
    }
    
    // Process the event
    // ...

    res.status(200).json({ status: 'ok' });
};

module.exports = {
    createOrder,
    verifyPayment,
};

