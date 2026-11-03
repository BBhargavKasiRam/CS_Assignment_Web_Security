const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { addReview, getReviewsForUser } = require("../controllers/reviewController");

router.post("/", authMiddleware, addReview);
router.get("/:userId", getReviewsForUser);

module.exports = router;
