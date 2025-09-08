const supabase = require('../config/supabaseClient');

// @route   GET /api/admin/users
// @desc    Get all users for the admin dashboard
const getAllUsers = async (req, res) => {
    try {
        // This is an admin-level function to get all users from the auth table
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Now get the corresponding profiles to fetch credits and roles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, credits, role');
        
        if (profileError) throw profileError;

        // Combine the data for a complete user list
        const combinedUsers = users.map(user => {
            const profile = profiles.find(p => p.id === user.id);
            return {
                id: user.id,
                email: user.email,
                credits: profile ? profile.credits : 'N/A',
                role: profile ? profile.role : 'N/A',
            };
        });

        res.json(combinedUsers);
    } catch (error) {
        console.error("Failed to fetch users:", error.message);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user from the platform
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // This is a special admin function to delete a user from the auth system.
        // The user's profile in the `profiles` table will be deleted automatically
        // if you have set up a cascading delete in your database.
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
        
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error("Failed to delete user:", error.message);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
};

module.exports = { getAllUsers, deleteUser };

