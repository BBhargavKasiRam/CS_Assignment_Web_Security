const express = require("express");
const router = express.Router();
const { placeBid, setProxyBid, getProxyBid, removeProxyBid } = require("../controllers/bidController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, placeBid);
router.post("/proxy", authMiddleware, setProxyBid);
router.get("/proxy/:auctionId", authMiddleware, getProxyBid);
router.delete("/proxy/:auctionId", authMiddleware, removeProxyBid);

module.exports = router;
