require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabaseClient');

// Import all route files
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes'); // 1. Import the new admin routes

const app = express();

// --- Middleware ---
app.use(cors());

// This is a conditional body parser for security.
// It is critical for the Razorpay webhook's signature verification to work.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    // For the webhook, we need the raw body
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    // For all other routes, parse JSON
    express.json()(req, res, next);
  }
});

// --- API Routes ---
// Assign the imported routes to their base paths
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes); // 2. Use the new admin routes


// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

