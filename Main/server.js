const express = require("express");
const session = require("express-session");
const axios = require("axios"); // Import axios for making HTTP requests
const MongoStore = require("connect-mongo"); // Import connect-mongo for session storage

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer"); // Import multer for file uploads

const path = require("path");

const app = express();

// Middleware to log incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} request for '${req.url}'`);
    next();
});

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

app.use(session({
    secret: "your_secret_key", // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: "mongodb+srv://jectpro932:project@cluster0.d4ywg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" }),
    cookie: { maxAge: 180 * 60 * 1000 } // Session expiration time
}));

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

const Document = require('./models/Document'); // Import the Document model
const isAuthenticated = require('./middleware/auth'); // Import the authentication middleware

app.post("/upload", isAuthenticated, upload.fields([{ name: 'insurance' }, { name: 'pollution' }, { name: 'rc' }, { name: 'license' }]), (req, res) => {
    const userId = req.user.id; // Now user ID is available in the request

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const documents = req.files; // Get all uploaded files
    const { validityInsurance, validityPollution, validityRC, validityLicense, vehicleNumber } = req.body; // Extract validity dates and vehicle number
    const savePromises = Object.keys(documents).map((fileKey, index) => {

        const documentName = fileKey === 'pollution' ? 'Pollution certificate' : 
                             fileKey === 'insurance' ? 'Insurance certificate' : 
                             fileKey === 'rc' ? 'Vehicle rc' : 
                             fileKey === 'license' ? 'Driving license' : 'unknown document';

        const file = documents[fileKey][0]; // Get the first file from each field
        const newDocument = new Document({
            validityDate: index === 0 ? validityInsurance : 
                          index === 1 ? validityPollution : 
                          index === 2 ? validityRC : 
                          index === 3 ? validityLicense : null, // Assign validity date based on index

            document_name: documentName, // Add the new field here
            userId: userId,
            fileName: file.originalname,
            fileType: file.mimetype,
            filePath: file.path,
            vehicleNumber: vehicleNumber // Add vehicle number here
        });

        return newDocument.save();
    });

    Promise.all(savePromises)
        .then(() => res.status(200).json({ message: "Files uploaded successfully", files: documents }))
        .catch(err => {
            console.error("Error saving document:", err); // Log the error details
            res.status(500).json({ message: "Error saving documents", error: err });
        });

});

app.get("/user/documents", isAuthenticated, async (req, res) => {
    const userId = req.user.id; // Now user ID is available in the request

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
    const documents = await Document.find({ userId: userId }).select('document_name filePath validityDate vehicleNumber');

        res.status(200).json(documents);
    } catch (error) {
        console.error("Error retrieving documents:", error);
        res.status(500).json({ message: "Error retrieving documents" });
    }

});

app.get("/user/profile", isAuthenticated, async (req, res) => {

    const userId = req.user.id; // Now user ID is available in the request

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    try {
        const user = await User.findById(userId).select("fullName phoneNumber email");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error retrieving user profile:", error);
        res.status(500).json({ message: "Error retrieving user profile" });
    }
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

        req.session.userId = user._id; // Set user ID in session
        res.status(200).json({ fullName: user.fullName, phoneNumber: user.phoneNumber, email: user.email, token: req.session.userId }); // Include token in response

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Serve Static Files
app.use(express.static('firstpage')); 
app.use("/uploads", express.static("uploads")); // Serve uploaded files statically

// OpenStreetMap Nominatim API for finding RTO offices
app.get("/api/rto", async (req, res) => {
    const { location } = req.query;
    if (!location) {
        return res.status(400).json({ message: "Location is required" });
    }

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: `RTO office ${location}`,
                format: "json",
                limit: 5
            }
        });

        if (!Array.isArray(response.data)) {
            console.error("Unexpected API response:", response.data);
            return res.status(500).json({ message: "Unexpected response from OpenStreetMap API" });
        }

        const results = response.data.map(place => ({
            name: place.display_name,
            lat: place.lat,
            lon: place.lon
        }));

        res.json(results);
    } catch (error) {
        console.error("Error fetching RTO locations:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Error retrieving RTO locations" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
