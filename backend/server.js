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
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/airport_survey";
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});