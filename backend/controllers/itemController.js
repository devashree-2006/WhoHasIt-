
const Item = require("../models/Item");

// ADD ITEM
const addItem = async (req, res) => {
    try {
        const { name, description, category } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                message: "Item name and category are required"
            });
        }

        const item = await Item.create({
            name,
            description,
            category,
            owner: req.user.id
        });

        res.status(201).json({
            message: "Item added successfully",
            item
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add item",
            error: error.message
        });
    }
};


// GET ALL ITEMS OF LOGGED-IN USER
const getItems = async (req, res) => {
    try {
        const items = await Item.find({
            owner: req.user.id
        });

        res.status(200).json({
            count: items.length,
            items
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch items",
            error: error.message
        });
    }
};

// UPDATE ITEM
const updateItem = async (req, res) => {
    try {
        const { name, description, category } = req.body;

        const updates = {};

        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided for update"
            });
        }

        const updatedItem = await Item.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user.id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedItem) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        res.status(200).json({
            message: "Item updated successfully",
            item: updatedItem
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update item",
            error: error.message
        });
    }
};




// DELETE ITEM
const deleteItem = async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        if (item.availability === "lent") {
            return res.status(400).json({
                message: "Cannot delete an item while it is lent"
            });
        }

        await Item.findByIdAndDelete(item._id);

        res.status(200).json({
            message: "Item deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete item",
            error: error.message
        });
    }
};

module.exports = {
    addItem,
    getItems,
    updateItem,
    deleteItem
};
