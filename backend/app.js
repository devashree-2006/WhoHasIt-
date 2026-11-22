
const express = require("express");
const cors = require("cors");

const app = express();

// Import routes
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const lendingRoutes = require("./routes/lendingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Main API routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/lendings", lendingRoutes);
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("WhoHasIt Backend is Running!");
});

module.exports = app;
