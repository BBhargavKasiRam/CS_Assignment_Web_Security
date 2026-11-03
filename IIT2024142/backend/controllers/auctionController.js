const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// 🔥 Upload helper
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "bidvora" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// ✅ CREATE AUCTION (IMAGE MANDATORY)
exports.createAuction = async (req, res) => {
  try {
    const { title, description, starting_price, duration, mediator_id, commission } = req.body;

    if (!title || !description || !starting_price || !duration || !mediator_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔥 Image is REQUIRED
    if (!req.file) {
      return res.status(400).json({
        message: "Image is required to create an auction",
      });
    }

    // 🔐 Validate file type
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        message: "Only image files are allowed",
      });
    }

    const seller_id = req.user.id;
    const startPrice = Number(starting_price);
    const end_time = new Date(Date.now() + Number(duration) * 1000);

    // 🔥 Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);
    const imageUrl = result.secure_url;

    const [insertResult] = await db.query(
      `INSERT INTO auctions 
      (seller_id, mediator_id, title, description, starting_price, current_price, end_time, image, mediator_commission, mediator_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [seller_id, mediator_id, title, description, startPrice, startPrice, end_time, imageUrl, commission || 0]
    );

    return res.status(201).json({
      message: "Created successfully",
      auctionId: insertResult.insertId,
    });

  } catch (err) {
    console.error("CREATE AUCTION ERROR:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// ✅ UPDATE AUCTION (IMAGE OPTIONAL)
exports.updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, current_price } = req.body;
    const seller_id = req.user.id;

    const [results] = await db.query(
      "SELECT end_time, seller_id FROM auctions WHERE id = ?",
      [id]
    );
    
    if (results.length === 0)
      return res.status(404).json({ message: "Auction not found" });

    const auction = results[0];
    const isEnded = new Date(auction.end_time) <= new Date();

    if (isEnded) {
      return res.status(403).json({
        message: "This auction is closed and cannot be edited.",
      });
    }

    if (auction.seller_id !== seller_id) {
      return res.status(403).json({
        message: "Unauthorized to edit this listing.",
      });
    }

    let imageUrl = null;

    // 🔥 Upload new image if provided
    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          message: "Only image files are allowed",
        });
      }
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    let sql;
    let params;
    const priceNum = Number(current_price);

    if (imageUrl) {
      sql = `UPDATE auctions SET title = ?, description = ?, current_price = ?, image = ? WHERE id = ?`;
      params = [title, description, priceNum, imageUrl, id];
    } else {
      sql = `UPDATE auctions SET title = ?, description = ?, current_price = ? WHERE id = ?`;
      params = [title, description, priceNum, id];
    }

    await db.query(sql, params);
    return res.json({ message: "Listing updated successfully" });

  } catch (err) {
    console.error("UPDATE AUCTION ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ GET ALL AUCTIONS
exports.getAuctions = async (req, res) => {
  try {
    const { status, seller_id, mediator_id } = req.query;
    let query = `SELECT a.*, u.name AS seller_name FROM auctions a JOIN users u ON a.seller_id = u.id WHERE 1=1`;
    let params = [];

    // 🔥 Restrict public visibility unless assigned auctioneer has accepted
    if (!seller_id && !mediator_id) {
      query += ` AND (a.mediator_status = 'accepted' OR a.mediator_status IS NULL)`;
    }

    if (status === 'active') {
      query += ` AND a.end_time > UTC_TIMESTAMP()`;
    } else if (status === 'ended') {
      query += ` AND a.end_time <= UTC_TIMESTAMP()`;
    }

    if (seller_id) {
      query += ` AND a.seller_id = ?`;
      params.push(seller_id);
    }

    if (mediator_id) {
      query += ` AND a.mediator_id = ?`;
      params.push(mediator_id);
    }

    query += ` ORDER BY a.created_at DESC`;

    const [result] = await db.query(query, params);
    res.json(result);
  } catch (err) {
    console.error("GET AUCTIONS ERROR:", err);
    res.status(500).json({ message: "Error fetching" });
  }
};

// ✅ GET SINGLE AUCTION
exports.getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the auction details
    const [auctionResults] = await db.query(
      `SELECT a.*, u.name AS seller_name, m.name AS mediator_name 
       FROM auctions a 
       JOIN users u ON a.seller_id = u.id 
       LEFT JOIN users m ON a.mediator_id = m.id 
       WHERE a.id = ?`,
      [id]
    );

    if (auctionResults.length === 0)
      return res.status(404).json({ message: "Auction not found" });

    const auction = auctionResults[0];

    // 2. Fetch the bid history for this auction
    const [bidResults] = await db.query(
      `SELECT b.*, u.name AS user_name 
       FROM bids b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.auction_id = ? 
       ORDER BY b.amount DESC`,
      [id]
    );
    
    auction.bids = bidResults;
    res.json(auction);
  } catch (err) {
    console.error("GET AUCTION BY ID ERROR:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ✅ DELETE AUCTION
exports.deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const seller_id = req.user.id;

    // 1. Verify auction exists and belongs to the user
    const [results] = await db.query(
      "SELECT seller_id, end_time FROM auctions WHERE id = ?",
      [id]
    );

    if (results.length === 0)
      return res.status(404).json({ message: "Auction not found" });

    if (results[0].seller_id !== seller_id) {
      return res.status(403).json({
        message: "Unauthorized to delete this consignment.",
      });
    }

    const isEnded = new Date(results[0].end_time) <= new Date();
    if (!isEnded) {
      return res.status(403).json({
        message: "Cannot delete an active auction. Wait until it ends.",
      });
    }

    // 2. Delete related records in the correct dependency order
    await db.query("DELETE FROM muted_users WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM mediator_actions WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM chat_messages WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM mediator_messages WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM proxy_bids WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM bids WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM transactions WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM watchlist WHERE auction_id = ?", [id]);
    await db.query("DELETE FROM auctions WHERE id = ?", [id]);

    return res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    console.error("DELETE AUCTION ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ✅ ASSIGN MEDIATOR
exports.assignMediator = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediator_id, commission } = req.body;
    const seller_id = req.user.id;

    const [results] = await db.query(
      "SELECT seller_id FROM auctions WHERE id = ?",
      [id]
    );
    
    if (results.length === 0) return res.status(404).json({ message: "Auction not found" });
    if (results[0].seller_id !== seller_id) return res.status(403).json({ message: "Unauthorized" });

    await db.query(
      "UPDATE auctions SET mediator_id = ?, mediator_status = 'pending', mediator_commission = ? WHERE id = ?",
      [mediator_id, commission || 0, id]
    );
    
    res.json({ message: "Auctioneer assigned successfully. Waiting for acceptance." });
  } catch (err) {
    console.error("ASSIGN MEDIATOR ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ CLOSE AUCTION (MEDIATOR ONLY)
exports.closeAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [results] = await db.query(
      "SELECT mediator_id FROM auctions WHERE id = ?",
      [id]
    );
    
    if (results.length === 0) return res.status(404).json({ message: "Auction not found" });
    if (results[0].mediator_id !== user_id) return res.status(403).json({ message: "Unauthorized: Only the assigned auctioneer can lock the auction" });

    await db.query(
      "UPDATE auctions SET end_time = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    
    res.json({ message: "Auction locked successfully" });
  } catch (err) {
    console.error("CLOSE AUCTION ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ UPDATE MEDIATOR STATUS (Accept / Reject)
exports.updateMediatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const user_id = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [results] = await db.query(
      "UPDATE auctions SET mediator_status = ? WHERE id = ? AND mediator_id = ?",
      [status, id, user_id]
    );
    
    if (results.affectedRows === 0) return res.status(403).json({ message: "Unauthorized or auction not found" });
    res.json({ message: `Assignment ${status}` });
  } catch (err) {
    console.error("MEDIATOR STATUS ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ GET MEDIATOR MESSAGES
exports.getMediatorMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [results] = await db.query("SELECT seller_id, mediator_id FROM auctions WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Auction not found" });
    
    const auction = results[0];
    if (user_id !== auction.seller_id && user_id !== auction.mediator_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const [messages] = await db.query(
      `SELECT m.*, u.name as sender_name 
       FROM mediator_messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.auction_id = ? ORDER BY m.created_at ASC`,
      [id]
    );
    
    res.json(messages);
  } catch (err) {
    console.error("MEDIATOR MESSAGES ERROR:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// ✅ SEND MEDIATOR MESSAGE
exports.sendMediatorMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user_id = req.user.id;

    if (!message || !message.trim()) return res.status(400).json({ message: "Message is required" });

    const [results] = await db.query("SELECT seller_id, mediator_id FROM auctions WHERE id = ?", [id]);
    if (results.length === 0) return res.status(404).json({ message: "Auction not found" });
    
    const auction = results[0];
    if (user_id !== auction.seller_id && user_id !== auction.mediator_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await db.query(
      "INSERT INTO mediator_messages (auction_id, sender_id, message) VALUES (?, ?, ?)",
      [id, user_id, message]
    );
    
    res.status(201).json({ message: "Message sent" });
  } catch (err) {
    console.error("SEND MEDIATOR MESSAGE ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ✅ GET SELLER ANALYTICS
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;

    if (req.user.role !== "consignor" && req.user.role !== "auctioneer") {
      return res.status(403).json({ message: "Only consignors and auctioneers can access analytics" });
    }

    // Summary stats
    const statsSql = `
      SELECT 
        COUNT(id) AS total_auctions,
        SUM(CASE WHEN end_time <= UTC_TIMESTAMP() THEN 1 ELSE 0 END) AS total_sold,
        SUM(CASE WHEN end_time > UTC_TIMESTAMP() THEN 1 ELSE 0 END) AS active_auctions,
        SUM(CASE WHEN end_time <= UTC_TIMESTAMP() AND current_price > starting_price THEN current_price ELSE 0 END) AS total_revenue,
        AVG(CASE WHEN end_time <= UTC_TIMESTAMP() AND current_price > starting_price THEN current_price ELSE NULL END) AS average_sale_price,
        COUNT(CASE WHEN end_time <= UTC_TIMESTAMP() THEN 1 END) AS ended_auctions
      FROM auctions
      WHERE seller_id = ?
    `;

    // Revenue by month (last 6 months)
    const revenueSql = `
      SELECT 
        DATE_FORMAT(end_time, '%b %Y') AS month,
        DATE_FORMAT(end_time, '%Y-%m') AS month_key,
        SUM(CASE WHEN current_price > starting_price THEN current_price ELSE 0 END) AS revenue,
        COUNT(*) AS auctions_count
      FROM auctions
      WHERE seller_id = ? 
        AND end_time <= UTC_TIMESTAMP()
        AND end_time >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 MONTH)
      GROUP BY month_key, month
      ORDER BY month_key ASC
    `;

    // Top items by sale price
    const topItemsSql = `
      SELECT title, current_price AS sale_price, end_time
      FROM auctions
      WHERE seller_id = ? AND end_time <= UTC_TIMESTAMP() AND current_price > starting_price
      ORDER BY current_price DESC
      LIMIT 5
    `;

    const [statsResults] = await db.query(statsSql, [sellerId]);
    const analytics = statsResults[0] || {
      total_auctions: 0, total_sold: 0, active_auctions: 0,
      total_revenue: 0, average_sale_price: 0, ended_auctions: 0
    };

    const [revenueResults] = await db.query(revenueSql, [sellerId]);
    const [topItemsResults] = await db.query(topItemsSql, [sellerId]);

    res.json({
      ...analytics,
      revenueByMonth: revenueResults,
      topItems: topItemsResults
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};