const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer"); // Import multer for file uploads


const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors()); // Allow frontend to communicate with backend

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect("mongodb+srv://jectpro932:project@cluster0.d4ywg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// User schema
const User = mongoose.model("User", new mongoose.Schema({
    fullName: String,
    phoneNumber: String,
    email: String,
    password: String
}));



app.post("/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    res.status(200).json({ message: "File uploaded successfully", file: req.file });
});

// User Registration Endpoint

app.post("/register", async (req, res) => {
    console.log("Registration request received:", req.body);

    try {
        const { fullName, phoneNumber, email, password } = req.body;

        if (!fullName || !phoneNumber || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, phoneNumber, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", redirect: "/firstpage/signin.html" });
        console.log("User registered successfully:", newUser);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

// User Login Endpoint
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Serve Static Files
app.use(express.static('firstpage')); 
app.use("/uploads", express.static("uploads")); // Serve uploaded files statically

// Serve signin.html
app.get("/signin.html", (req, res) => {
    res.sendFile(__dirname + "/firstpage/signin.html");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
