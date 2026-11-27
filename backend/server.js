
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const startReminderJob = require("./utils/reminderJob");

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and start server
const startServer = async () => {
    await connectDB();

    // Start automatic return reminders
    startReminderJob();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log("Automatic reminder job started!");
    });
};

startServer();
