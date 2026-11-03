const db = require("../config/db");

// We'll attach io to this module from server.js
let io;
exports.setIo = (socketIo) => { io = socketIo; };

exports.placeBid = async (req, res) => {
  const { auction_id, amount } = req.body;
  const userId = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch auction details (Lock for update to prevent race conditions)
    const [auctions] = await connection.query(
      `SELECT a.*, u.name AS seller_name FROM auctions a 
       JOIN users u ON a.seller_id = u.id 
       WHERE a.id = ? FOR UPDATE`,
      [auction_id]
    );

    if (auctions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Auction not found" });
    }

    const auction = auctions[0];

    // 2. Validation
    if (new Date(auction.end_time) <= new Date()) {
      await connection.rollback();
      return res.status(400).json({ message: "Auction has ended" });
    }

    if (auction.seller_id === userId) {
      await connection.rollback();
      return res.status(403).json({ message: "You cannot place a bid on your own auction." });
    }

    if (Number(amount) <= Number(auction.current_price)) {
      await connection.rollback();
      return res.status(400).json({
        message: `Bid must be higher than $${Number(auction.current_price).toLocaleString()}`,
      });
    }

    // 3. Update current price
    await connection.query(
      "UPDATE auctions SET current_price = ? WHERE id = ?",
      [amount, auction_id]
    );

    // 4. Anti-sniping logic
    const SNIPE_THRESHOLD_MS = 3 * 60 * 1000;
    const EXTENSION_MS = 3 * 60 * 1000;
    const now = new Date();
    const endTime = new Date(auction.end_time);
    const remaining = endTime - now;

    let newEndTime = null;
    let wasExtended = false;

    if (remaining > 0 && remaining < SNIPE_THRESHOLD_MS) {
      newEndTime = new Date(endTime.getTime() + EXTENSION_MS);
      wasExtended = true;
      await connection.query(
        "UPDATE auctions SET end_time = ? WHERE id = ?",
        [newEndTime, auction_id]
      );
    }

    // 5. Insert bid
    const [insertResult] = await connection.query(
      `INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)`,
      [auction_id, userId, amount]
    );

    // 6. Record in chat (System Message)
    const [userResult] = await connection.query("SELECT name FROM users WHERE id = ?", [userId]);
    const userName = userResult?.[0]?.name || "Anonymous";
    const chatMsg = `A new bid of $${Number(amount).toLocaleString()} has been placed by ${userName}!`;
    
    await connection.query(
      "INSERT INTO chat_messages (auction_id, user_id, message, is_system_message) VALUES (?, NULL, ?, 1)",
      [auction_id, chatMsg]
    );

    await connection.commit();

    // 7. Broadcast and Response (Outside transaction for performance)
    const bidData = {
      id: insertResult.insertId,
      auction_id,
      user_id: userId,
      user_name: userName,
      amount: Number(amount),
      created_at: new Date().toISOString(),
      wasExtended,
      newEndTime: newEndTime ? newEndTime.toISOString() : null,
    };

    if (io) {
      const roomName = `auction:${String(auction_id)}`;
      io.to(roomName).emit("newBid", bidData);
      if (wasExtended) {
        io.to(roomName).emit("timerExtended", {
          newEndTime: newEndTime.toISOString(),
          extensionMinutes: 3,
        });
      }
    }

    res.json({
      message: wasExtended
        ? "Bid placed! Timer extended by 3 minutes (anti-snipe protection)"
        : "Bid placed successfully!",
      bid: bidData,
      wasExtended,
      newEndTime: newEndTime ? newEndTime.toISOString() : null,
    });

    // 8. Auto-bid (Proxy Bid) Logic - Triggered asynchronously
    handleProxyBids(auction_id, userId, amount).catch(err => console.error("Proxy bid error:", err));

  } catch (err) {
    await connection.rollback();
    console.error("Bid placement error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};

// Extracted Proxy Bid Logic for cleaner code
async function handleProxyBids(auction_id, lastBidderId, currentAmount) {
  const [proxyResults] = await db.query(
    `SELECT * FROM proxy_bids WHERE auction_id = ? AND user_id != ? AND max_bid_amount > ? ORDER BY max_bid_amount DESC LIMIT 1`,
    [auction_id, lastBidderId, currentAmount]
  );

  if (proxyResults.length === 0) return;

  const proxyBid = proxyResults[0];
  const increment = 10;
  let autoBidAmount = Number(currentAmount) + increment;
  if (autoBidAmount > proxyBid.max_bid_amount) autoBidAmount = proxyBid.max_bid_amount;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check if someone else hasn't outbid since we started this async function
    const [latestAuction] = await connection.query("SELECT current_price FROM auctions WHERE id = ? FOR UPDATE", [auction_id]);
    if (latestAuction[0].current_price >= autoBidAmount) {
      await connection.rollback();
      return;
    }

    await connection.query("UPDATE auctions SET current_price = ? WHERE id = ?", [autoBidAmount, auction_id]);
    const [autoInsert] = await connection.query("INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)", [auction_id, proxyBid.user_id, autoBidAmount]);
    
    const [userResult] = await connection.query("SELECT name FROM users WHERE id = ?", [proxyBid.user_id]);
    const autoUserName = userResult?.[0]?.name || "Auto Bidder";
    
    const autoChatMsg = `Auto-bid of $${Number(autoBidAmount).toLocaleString()} placed for ${autoUserName}`;
    const [chatResult] = await connection.query("INSERT INTO chat_messages (auction_id, user_id, message, is_system_message) VALUES (?, NULL, ?, 1)", [auction_id, autoChatMsg]);

    await connection.commit();

    if (io) {
      const roomName = `auction:${String(auction_id)}`;
      const autoBidData = {
        id: autoInsert.insertId,
        auction_id,
        user_id: proxyBid.user_id,
        user_name: autoUserName,
        amount: Number(autoBidAmount),
        created_at: new Date().toISOString(),
        isAutoBid: true
      };
      io.to(roomName).emit("newBid", autoBidData);
      io.to(roomName).emit("newChatMessage", {
        id: chatResult.insertId,
        auction_id: String(auction_id),
        user_id: null,
        user_name: "System",
        message: autoChatMsg,
        is_system_message: 1,
        created_at: new Date().toISOString()
      });
    }
  } catch (err) {
    await connection.rollback();
    console.error("Auto-bid error:", err);
  } finally {
    connection.release();
  }
}


exports.setProxyBid = async (req, res) => {
  const { auction_id, max_bid_amount } = req.body;
  const user_id = req.user.id;

  if (!auction_id || !max_bid_amount) {
    return res.status(400).json({ message: "Auction ID and max bid amount are required" });
  }

  try {
    const [auctions] = await db.query(`SELECT a.* FROM auctions a WHERE a.id = ?`, [auction_id]);
    
    if (auctions.length === 0) return res.status(404).json({ message: "Auction not found" });
    const auction = auctions[0];

    if (new Date(auction.end_time) <= new Date()) {
      return res.status(400).json({ message: "Auction has ended" });
    }

    if (auction.seller_id === user_id) {
      return res.status(403).json({ message: "You cannot place a proxy bid on your own auction." });
    }

    if (Number(max_bid_amount) <= Number(auction.current_price)) {
      return res.status(400).json({
        message: `Max bid must be higher than current price $${Number(auction.current_price).toLocaleString()}`,
      });
    }

    // Check if user already has a proxy bid
    const [existing] = await db.query(
      "SELECT id FROM proxy_bids WHERE auction_id = ? AND user_id = ?",
      [auction_id, user_id]
    );

    if (existing.length > 0) {
      await db.query("UPDATE proxy_bids SET max_bid_amount = ? WHERE id = ?", [max_bid_amount, existing[0].id]);
      res.json({ message: "Proxy bid updated successfully!" });
    } else {
      await db.query("INSERT INTO proxy_bids (auction_id, user_id, max_bid_amount) VALUES (?, ?, ?)", [auction_id, user_id, max_bid_amount]);
      res.json({ message: "Proxy bid set successfully! We will automatically bid for you." });
    }
  } catch (err) {
    console.error("Set proxy bid error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProxyBid = async (req, res) => {
  const { auctionId } = req.params;
  const userId = req.user.id;

  try {
    const [results] = await db.query(
      "SELECT max_bid_amount FROM proxy_bids WHERE auction_id = ? AND user_id = ?",
      [auctionId, userId]
    );
    res.json({ max_bid_amount: results.length > 0 ? results[0].max_bid_amount : null });
  } catch (err) {
    console.error("Get proxy bid error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeProxyBid = async (req, res) => {
  const { auctionId } = req.params;
  const userId = req.user.id;

  try {
    await db.query("DELETE FROM proxy_bids WHERE auction_id = ? AND user_id = ?", [auctionId, userId]);
    res.json({ message: "Proxy bid removed successfully" });
  } catch (err) {
    console.error("Remove proxy bid error:", err);
    res.status(500).json({ message: "Server error" });
  }
};