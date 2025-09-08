const supabase = require('../config/supabaseClient');

// @route   GET api/user/profile
// @desc    Get user profile data (email, credits)
// @access  Private
const getUserProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('email, credits')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        res.json(profile);

    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching profile.' });
    }
};

module.exports = {
    getUserProfile,
};
