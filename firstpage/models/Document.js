const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    document_name: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User" // Reference to the User model
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    uploadedAt: {


        type: Date,
        default: Date.now
    },
    validityDate: {
        type: Date
    }
});

module.exports = mongoose.model("Document", documentSchema);
