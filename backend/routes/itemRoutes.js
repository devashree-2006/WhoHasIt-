
const express = require("express");
const router = express.Router();

const {
    addItem,
    getItems,
    updateItem,
    deleteItem
} = require("../controllers/itemController");

const protect = require("../middleware/authMiddleware");

// Add a new item
router.post("/", protect, addItem);

// Get all items
router.get("/", protect, getItems);

// Update an item
router.put("/:id", protect, updateItem);

// Delete an item
router.delete("/:id", protect, deleteItem);

module.exports = router;
