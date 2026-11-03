const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../config/db");

// GET /api/orders - fetch auctions won by current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.image,
        a.current_price AS price,
        a.end_time,
        a.starting_price,
        u.name AS seller_name,
        a.seller_id,
        MAX(b.created_at) AS won_at,
        CASE WHEN t.id IS NOT NULL THEN 'Paid' ELSE 'Pending' END AS payment_status,
        t.shipping_status,
        t.tracking_number,
        t.courier_name
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      JOIN bids b ON b.auction_id = a.id AND b.user_id = ? AND b.amount = a.current_price
      LEFT JOIN transactions t ON t.auction_id = a.id
      WHERE a.end_time <= CURRENT_TIMESTAMP
      GROUP BY a.id, t.id
      ORDER BY won_at DESC
    `;

    const [results] = await db.query(sql, [userId]);
    res.json(results);
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ 
      message: "Error fetching orders",
      error: err.message 
    });
  }
});

module.exports = router;