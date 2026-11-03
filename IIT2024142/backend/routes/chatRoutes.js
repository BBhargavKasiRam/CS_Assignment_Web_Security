const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authenticateJWT = require("../middleware/authMiddleware");

// Get chat history for an auction
router.get("/:auctionId", chatController.getChatHistory);

module.exports = router;
