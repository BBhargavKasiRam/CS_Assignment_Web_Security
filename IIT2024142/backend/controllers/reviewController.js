const db = require("../config/db");

exports.addReview = async (req, res) => {
  try {
    const { auction_id, reviewee_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (!auction_id || !reviewee_id || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Only allow review after auction ends and transaction exists
    const [transactions] = await db.query(
      "SELECT id FROM transactions WHERE auction_id = ?",
      [auction_id]
    );
    
    if (transactions.length === 0) {
      return res.status(400).json({ message: "You can only review after a transaction is created." });
    }

    // Ensure user hasn't already reviewed this auction
    const [existingReviews] = await db.query(
      "SELECT id FROM reviews WHERE auction_id = ? AND reviewer_id = ?",
      [auction_id, reviewer_id]
    );
    
    if (existingReviews.length > 0) {
      return res.status(400).json({ message: "You have already reviewed this transaction." });
    }

    await db.query(
      "INSERT INTO reviews (auction_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [auction_id, reviewer_id, reviewee_id, rating, comment || null]
    );
    
    res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error("ADD REVIEW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [results] = await db.query(
      `SELECT 
        r.id, r.rating, r.comment, r.created_at,
        u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const totalReviews = results.length;
    const averageRating = totalReviews > 0 
      ? (results.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : 0;

    res.json({
      totalReviews,
      averageRating: Number(averageRating),
      reviews: results
    });
  } catch (err) {
    console.error("GET REVIEWS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

