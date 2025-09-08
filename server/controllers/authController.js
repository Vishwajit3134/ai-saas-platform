const supabase = require('../config/supabaseClient');

// @route   POST api/auth/register
// @desc    Register a new user
const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide an email and password.' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        // Supabase sends a confirmation email. The user is in the system but needs to confirm.
        res.status(201).json({ message: 'Registration successful! Please check your email to confirm your account.', user: data.user });

    } catch (error) {
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

// @route   POST api/auth/login
// @desc    Authenticate user and get token
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide an email and password.' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Login successful!', session: data.session, user: data.user });

    } catch (error) {
        res.status(500).json({ error: 'Server error during login.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};

