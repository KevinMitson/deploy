require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/airport_survey";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error details:', {
      error: error.message,
      uri: mongoURI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://***:***@'), // Hide credentials in logs
      name: error.name,
      code: error.code
    });
    process.exit(1);
  }
};

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  location: String,
  rating: String,
  reasons: String,
  createdAt: { type: Date, default: Date.now },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

// API Routes
app.post("/api/feedback", async (req, res) => {
  try {
    const { location, rating, reasons } = req.body;
    const newFeedback = new Feedback({ location, rating, reasons });
    await newFeedback.save();
    res.status(201).json(newFeedback);
  } catch (err) {
    console.error("Error saving feedback:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    
    // Add date filtering if dates are provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const feedback = await Feedback.find(query)
      .select('location rating reasons createdAt')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).send("Server error");
  }
});

// Ensure MongoDB is connected before starting the server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();