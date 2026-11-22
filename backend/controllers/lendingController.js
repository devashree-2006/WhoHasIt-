
const Lending = require("../models/Lending");
const Item = require("../models/Item");
const User = require("../models/User");
const crypto = require("crypto");

// CREATE A LENDING RECORD
const createLending = async (req, res) => {
    try {
        const { itemId, borrowerId, expectedReturnDate } = req.body;

        if (!itemId || !borrowerId || !expectedReturnDate) {
            return res.status(400).json({
                message: "Please provide all required details"
            });
        }

        // Check if return date is valid and in the future
        const returnDate = new Date(expectedReturnDate);

        if (isNaN(returnDate.getTime()) || returnDate <= new Date()) {
            return res.status(400).json({
                message: "Please provide a valid future return date"
            });
        }

        // Find the item
        const item = await Item.findOne({
            _id: itemId,
            owner: req.user.id
        });

        if (!item) {
            return res.status(404).json({
                message: "Item not found or you are not its owner"
            });
        }

        if (item.availability !== "available") {
            return res.status(400).json({
                message: "This item is already lent"
            });
        }

        // Find the borrower
        const borrower = await User.findById(borrowerId);

        if (!borrower) {
            return res.status(404).json({
                message: "Borrower not found"
            });
        }

        if (borrower._id.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot lend an item to yourself"
            });
        }

        // Generate a unique token for QR-based return
        const qrToken = crypto.randomBytes(32).toString("hex");

        // Create lending record
        const lending = await Lending.create({
            item: item._id,
            lender: req.user.id,
            borrower: borrower._id,
            expectedReturnDate: returnDate,
            status: "lent",
            qrToken
        });

        // Update item availability
        item.availability = "lent";
        await item.save();

        res.status(201).json({
            message: "Item lent successfully",
            lending
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create lending record",
            error: error.message
        });
    }
};


// GET LENDING RECORDS
const getLendings = async (req, res) => {
    try {
        const lendings = await Lending.find({
            $or: [
                { lender: req.user.id },
                { borrower: req.user.id }
            ]
        })
        .populate("item", "name category")
        .populate("lender", "name email")
        .populate("borrower", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json({
            count: lendings.length,
            lendings
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch lending records",
            error: error.message
        });
    }
};


// CONFIRM ITEM RETURN
const confirmReturn = async (req, res) => {
    try {
        const { qrToken } = req.body;

        if (!qrToken) {
            return res.status(400).json({
                message: "QR token is required"
            });
        }

        // Find lending record using QR token
        const lending = await Lending.findOne({
            qrToken
        }).select("+qrToken");

        if (!lending) {
            return res.status(404).json({
                message: "Invalid QR code"
            });
        }

        // Only the lender can confirm the return
        if (lending.lender.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the lender can confirm the return"
            });
        }

        if (lending.status === "returned") {
            return res.status(400).json({
                message: "This item has already been returned"
            });
        }

        // Mark lending record as returned
lending.status = "returned";
lending.returnedAt = new Date();

await lending.save();

// Invalidate the QR token after successful return
await Lending.updateOne(
    { _id: lending._id },
    { $unset: { qrToken: 1 } }
);

// Make item available again
await Item.findByIdAndUpdate(lending.item, {
    availability: "available"
});

// Remove token from response
lending.qrToken = undefined;

        res.status(200).json({
            message: "Item return confirmed successfully",
            lending
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to confirm return",
            error: error.message
        });
    }
};

// BORROWER ACKNOWLEDGES ITEM RECEIPT
const acknowledgeLending = async (req, res) => {
    try {
        const lending = await Lending.findOne({
            _id: req.params.id,
            borrower: req.user.id
        });

        if (!lending) {
            return res.status(404).json({
                message: "Lending record not found"
            });
        }

        if (lending.status === "returned") {
            return res.status(400).json({
                message: "This item has already been returned"
            });
        }

        if (lending.borrowerAcknowledged) {
            return res.status(400).json({
                message: "You have already acknowledged this item"
            });
        }

        lending.borrowerAcknowledged = true;
        await lending.save();

        res.status(200).json({
            message: "Item receipt acknowledged successfully",
            lending
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to acknowledge item",
            error: error.message
        });
    }
};


// BORROWER REQUESTS RETURN DATE EXTENSION
const requestExtension = async (req, res) => {
    try {
        const { requestedReturnDate } = req.body;

        if (!requestedReturnDate || isNaN(new Date(requestedReturnDate).getTime())) {
            return res.status(400).json({
                message: "Please provide a valid requested return date"
            });
        }

        const lending = await Lending.findOne({
            _id: req.params.id,
            borrower: req.user.id
        });

        if (!lending) {
            return res.status(404).json({
                message: "Lending record not found"
            });
        }

        if (lending.status === "returned") {
            return res.status(400).json({
                message: "Item has already been returned"
            });
        }

        if (lending.extensionStatus === "pending") {
            return res.status(400).json({
                message: "An extension request is already pending"
            });
        }

        const newDate = new Date(requestedReturnDate);

        if (newDate <= lending.expectedReturnDate || newDate <= new Date()) {
            return res.status(400).json({
                message: "New return date must be later than the current return date and today"
            });
        }

        lending.requestedReturnDate = newDate;
        lending.extensionRequestedAt = new Date();
        lending.extensionStatus = "pending";

        await lending.save();

        res.status(200).json({
            message: "Extension request submitted successfully",
            lending
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to request extension",
            error: error.message
        });
    }
};


// LENDER APPROVES OR REJECTS EXTENSION
const respondToExtension = async (req, res) => {
    try {
        const { action } = req.body;

        if (!["approved", "rejected"].includes(action)) {
            return res.status(400).json({
                message: "Action must be approved or rejected"
            });
        }

        const lending = await Lending.findOne({
            _id: req.params.id,
            lender: req.user.id
        });

        if (!lending) {
            return res.status(404).json({
                message: "Lending record not found"
            });
        }

        if (lending.status === "returned") {
            return res.status(400).json({
                message: "Item has already been returned"
            });
        }

        if (lending.extensionStatus !== "pending") {
            return res.status(400).json({
                message: "No pending extension request found"
            });
        }

        if (action === "approved") {
            lending.expectedReturnDate = lending.requestedReturnDate;
        }

        lending.extensionStatus = action;

        await lending.save();

        res.status(200).json({
            message: `Extension request ${action} successfully`,
            lending
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to respond to extension request",
            error: error.message
        });
    }
};


module.exports = {
    createLending,
    getLendings,
    confirmReturn,
    acknowledgeLending,
    requestExtension,
    respondToExtension
};