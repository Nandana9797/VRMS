const User = require('../models/User'); // Corrected the path to the User model



// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        // Validate the token and fetch the user
        User.findById(token)
            .then(user => {
                req.user = user; // Populate req.user with user data
                next(); // Proceed to the next middleware or route handler
            })
            .catch(err => {
                console.error("Error fetching user:", err);
                res.status(500).json({ message: "Internal server error" });
            });
    } else if (req.session.userId) {

        User.findById(req.session.userId)
            .then(user => {
                req.user = user; // Populate req.user with user data
                next(); // Proceed to the next middleware or route handler
            })
            .catch(err => {
                console.error("Error fetching user:", err);
                res.status(500).json({ message: "Internal server error" });
            });
    } else {
        res.status(401).json({ message: "User not authenticated" });
    }
};

module.exports = isAuthenticated;
