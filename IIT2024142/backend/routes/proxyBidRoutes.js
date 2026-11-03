const express = require("express");
const router = express.Router();
const proxyBidController = require("../controllers/proxyBidController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, proxyBidController.setProxyBid);
router.get("/:auction_id", authenticateToken, proxyBidController.getProxyBid);
router.delete("/:auction_id", authenticateToken, proxyBidController.removeProxyBid);

module.exports = router;
