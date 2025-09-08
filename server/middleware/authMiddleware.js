const supabase = require('../config/supabaseClient');

const requireAuth = async (req, res, next) => {
    // 1. Get the Authorization header
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required.' });
    }

    // 2. The token is in the format "Bearer [TOKEN]"
    const token = authorization.split(' ')[1];

    try {
        // 3. Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            return res.status(401).json({ error: 'Request is not authorized.' });
        }

        // 4. Attach the user object to the request
        req.user = user;
        next(); // Proceed to the next function (the controller)

    } catch (error) {
        res.status(401).json({ error: 'Request is not authorized.' });
    }
};

module.exports = requireAuth;
