const db = require("../config/db");

exports.setProxyBid = async (req, res) => {
  try {
    const { auction_id, max_bid_amount } = req.body;
    const user_id = req.user.id;

    if (!auction_id || !max_bid_amount) {
      return res.status(400).json({ message: "Auction ID and max bid amount are required" });
    }

    // Check if it's their own auction
    const [results] = await db.query(
      "SELECT seller_id FROM auctions WHERE id = ?",
      [auction_id]
    );
    
    if (results.length === 0) return res.status(404).json({ message: "Auction not found" });
    if (results[0].seller_id === user_id) {
      return res.status(403).json({ message: "You cannot place a proxy bid on your own auction." });
    }

    // Check if proxy bid already exists
    const [proxyResults] = await db.query(
      "SELECT id FROM proxy_bids WHERE auction_id = ? AND user_id = ?",
      [auction_id, user_id]
    );

    if (proxyResults.length > 0) {
      // Update
      await db.query(
        "UPDATE proxy_bids SET max_bid_amount = ? WHERE auction_id = ? AND user_id = ?",
        [max_bid_amount, auction_id, user_id]
      );
      res.json({ message: "Proxy bid updated" });
    } else {
      // Insert
      await db.query(
        "INSERT INTO proxy_bids (auction_id, user_id, max_bid_amount) VALUES (?, ?, ?)",
        [auction_id, user_id, max_bid_amount]
      );
      res.json({ message: "Proxy bid set" });
    }
  } catch (err) {
    console.error("SET PROXY BID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProxyBid = async (req, res) => {
  try {
    const { auction_id } = req.params;
    const user_id = req.user.id;

    const [results] = await db.query(
      "SELECT max_bid_amount FROM proxy_bids WHERE auction_id = ? AND user_id = ?",
      [auction_id, user_id]
    );
    
    if (results.length === 0) return res.json({ max_bid_amount: null });
    res.json({ max_bid_amount: results[0].max_bid_amount });
  } catch (err) {
    console.error("GET PROXY BID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeProxyBid = async (req, res) => {
  try {
    const { auction_id } = req.params;
    const user_id = req.user.id;

    await db.query(
      "DELETE FROM proxy_bids WHERE auction_id = ? AND user_id = ?",
      [auction_id, user_id]
    );
    res.json({ message: "Proxy bid removed" });
  } catch (err) {
    console.error("REMOVE PROXY BID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

