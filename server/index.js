require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Import the cors package
const supabase = require('./config/supabaseClient');

// Import all route files
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// --- Middleware ---

// 2. Enable CORS for all incoming requests from any origin.
// This is the solution for the "fetch failed" / "Network Error".
app.use(cors()); 

// 3. This is a conditional body parser for security.
// If the request is for the Razorpay webhook, it uses a raw body parser.
// For all other requests, it uses the standard JSON parser.
// This is critical for the webhook's signature verification to work.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// --- API Routes ---
// Assign the imported routes to their base paths
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);


// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

