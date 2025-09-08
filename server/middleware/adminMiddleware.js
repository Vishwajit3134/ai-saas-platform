const supabase = require('../config/supabaseClient');

const requireAdmin = async (req, res, next) => {
    const userId = req.user.id; // This comes from the 'requireAuth' middleware

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        if (profile.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required.' }); // 403 Forbidden
        }

        next(); // User is an admin, proceed to the controller

    } catch (error) {
        res.status(500).json({ error: 'Server error while verifying admin role.' });
    }
};

module.exports = requireAdmin;
