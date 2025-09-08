const supabase = require('../config/supabaseClient');

// @route   POST api/auth/register
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
            console.error("Supabase registration error:", error.message);
            return res.status(400).json({ error: error.message });
        }
        
        res.status(201).json({ message: 'Registration successful! Please check your email to confirm your account.', user: data.user });

    } catch (error) {
        console.error("Server error during registration:", error);
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
            // This will print the exact Supabase error to your Render logs
            console.error("Supabase login error:", error.message);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Login successful!', session: data.session, user: data.user });

    } catch (error) {
        console.error("Server error during login:", error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};

