const express = require("express");
const router = express.Router();
const mediatorController = require("../controllers/mediatorController");
const authenticateJWT = require("../middleware/authMiddleware");

router.use(authenticateJWT, mediatorController.verifyMediator);

// Get active and flagged auctions
router.get("/auctions", mediatorController.getAuctions);

// Log mediator action
router.post("/action", mediatorController.logAction);

module.exports = router;
