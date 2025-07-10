const mongoose = require("mongoose");

// Check if the model already exists to prevent OverwriteModelError
if (mongoose.models.User) {
    module.exports = mongoose.models.User; // Return existing model if it exists
} else {
    const userSchema = new mongoose.Schema({
        fullName: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }
    });

    module.exports = mongoose.model("User", userSchema); // Export the User model
}
