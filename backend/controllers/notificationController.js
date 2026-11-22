
const Notification = require("../models/Notification");

// CREATE NOTIFICATION
const createNotification = async (req, res) => {
    try {
        const { recipient, message, type, relatedLending } = req.body;

        if (!recipient || !message) {
            return res.status(400).json({
                message: "Recipient and message are required"
            });
        }

        const notification = await Notification.create({
            recipient,
            message,
            type,
            relatedLending
        });

        res.status(201).json({
            message: "Notification created successfully",
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create notification",
            error: error.message
        });
    }
};


// GET USER NOTIFICATIONS
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id
        })
        .sort({ createdAt: -1 });

        res.status(200).json({
            count: notifications.length,
            notifications
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};


// MARK NOTIFICATION AS READ
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user.id
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update notification",
            error: error.message
        });
    }
};


module.exports = {
    createNotification,
    getNotifications,
    markAsRead
};
