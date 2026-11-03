const db = require("../config/db");

// Verify mediator middleware logic
const verifyMediator = (req, res, next) => {
  if (req.user && req.user.role === 'auctioneer') {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Auctioneer access required." });
  }
};

// Fetch active auctions and flagged auctions for Mediator Dashboard
exports.getAuctions = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id, a.title, a.current_price, a.status, a.end_time, a.mediator_status, a.mediator_commission,
        u.name as seller_name,
        (SELECT COUNT(*) FROM mediator_actions ma WHERE ma.auction_id = a.id AND ma.action_type = 'flag_auction') as flag_count
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE a.status = 'active' AND a.mediator_id = ?
      ORDER BY flag_count DESC, a.created_at DESC
    `;

    const [results] = await db.query(query, [req.user.id]);
    res.json(results);
  } catch (err) {
    console.error("GET MEDIATOR AUCTIONS ERROR:", err);
    res.status(500).json({ message: "Server error fetching auctions" });
  }
};

// Log a mediator action
exports.logAction = async (req, res) => {
  try {
    const { auctionId, actionType, targetUserId, note } = req.body;
    const mediatorId = req.user.id;

    const query = `
      INSERT INTO mediator_actions (auction_id, mediator_id, action_type, target_user_id, note)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [auctionId, mediatorId, actionType, targetUserId || null, note || null]);
    res.json({ message: "Action logged successfully", actionId: result.insertId });
  } catch (err) {
    console.error("LOG MEDIATOR ACTION ERROR:", err);
    res.status(500).json({ message: "Server error logging action" });
  }
};

exports.verifyMediator = verifyMediator;

