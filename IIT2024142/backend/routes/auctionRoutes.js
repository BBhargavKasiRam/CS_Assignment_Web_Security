const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  assignMediator,
  closeAuction,
  updateMediatorStatus,
  getMediatorMessages,
  sendMediatorMessage,
  getSellerAnalytics,
} = require("../controllers/auctionController");

const authMiddleware = require("../middleware/authMiddleware");

// ✅ Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Routes
router.get("/seller-analytics", authMiddleware, getSellerAnalytics);
router.get("/", getAuctions);
router.get("/:id", getAuctionById);

// 🔥 Create auction (image REQUIRED)
router.post("/", authMiddleware, upload.single("image"), createAuction);

// 🔥 Update auction (image optional)
router.put("/:id", authMiddleware, upload.single("image"), updateAuction);

// 🔥 Delete auction
router.delete("/:id", authMiddleware, deleteAuction);

// 🔥 Assign Mediator
router.put("/:id/assign-mediator", authMiddleware, assignMediator);

// 🔥 Mediator Accept/Reject
router.put("/:id/mediator-status", authMiddleware, updateMediatorStatus);

// 🔥 Mediator Private Messages
router.get("/:id/mediator-messages", authMiddleware, getMediatorMessages);
router.post("/:id/mediator-messages", authMiddleware, sendMediatorMessage);

// 🔥 Close Auction
router.put("/:id/close", authMiddleware, closeAuction);

module.exports = router;