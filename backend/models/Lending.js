
const mongoose = require("mongoose");

const lendingSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        lender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        lendingDate: {
            type: Date,
            default: Date.now
        },

        expectedReturnDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["lent", "returned"],
            default: "lent"
        },

        borrowerAcknowledged: {
            type: Boolean,
            default: false
        },

        // Extension request details
        extensionStatus: {
            type: String,
            enum: ["none", "pending", "approved", "rejected"],
            default: "none"
        },

        requestedReturnDate: {
            type: Date,
            default: null
        },

        extensionRequestedAt: {
            type: Date,
            default: null
        },

        qrToken: {
            type: String,
            unique: true,
            sparse: true,
            select: false
        },

        returnedAt: {
            type: Date,
            default: null
        },

        lastReminderDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Lending = mongoose.model("Lending", lendingSchema);

module.exports = Lending;
