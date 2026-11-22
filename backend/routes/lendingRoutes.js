
const express = require("express");
const router = express.Router();

const {
    createLending,
    getLendings,
    confirmReturn,
    acknowledgeLending,
    requestExtension,
    respondToExtension
} = require("../controllers/lendingController");

const protect = require("../middleware/authMiddleware");

// Create a lending record
router.post("/", protect, createLending);

// Get all lending records
router.get("/", protect, getLendings);

// Confirm item return using QR token
router.post("/confirm-return", protect, confirmReturn);

// Borrower acknowledges item receipt
router.put("/:id/acknowledge", protect, acknowledgeLending);

// Borrower requests extension
router.post("/:id/extension", protect, requestExtension);

// Lender approves or rejects extension
router.put("/:id/extension/respond", protect, respondToExtension);

module.exports = router;
