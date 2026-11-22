
const cron = require("node-cron");
const Lending = require("../models/Lending");
const Notification = require("../models/Notification");

// Run every day at 9:00 AM
const startReminderJob = () => {
    cron.schedule("0 9 * * *", async () => {
        try {
            console.log("Checking lending records for reminders...");

            const now = new Date();

            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const tomorrow = new Date(startOfToday);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);

            const lendings = await Lending.find({
                status: "lent",
                expectedReturnDate: { $lte: tomorrow },
                $or: [
                    { lastReminderDate: null },
                    { lastReminderDate: { $lt: startOfToday } }
                ]
            });

            for (const lending of lendings) {
                const isOverdue = lending.expectedReturnDate < startOfToday;

                const message = isOverdue
                    ? "Your borrowed item is overdue. Please return it as soon as possible."
                    : "Your borrowed item is due tomorrow. Please remember to return it.";

                await Notification.create([
                    {
                        recipient: lending.borrower,
                        message,
                        type: "reminder",
                        relatedLending: lending._id
                    },
                    {
                        recipient: lending.lender,
                        message: isOverdue
                            ? "An item you lent is overdue."
                            : "An item you lent is due tomorrow.",
                        type: "reminder",
                        relatedLending: lending._id
                    }
                ]);

                lending.lastReminderDate = now;
                await lending.save();
            }

            console.log(`${lendings.length} lending records checked for reminders.`);

        } catch (error) {
            console.error("Reminder job failed:", error.message);
        }
    }, {
        timezone: "Asia/Kolkata"
    });
};

module.exports = startReminderJob;
