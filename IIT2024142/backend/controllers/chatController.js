const db = require("../config/db");

exports.getChatHistory = async (req, res) => {
  try {
    const auctionId = req.params.auctionId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const query = `
      SELECT 
        cm.id, 
        cm.auction_id, 
        cm.user_id, 
        cm.message, 
        cm.is_system_message, 
        cm.created_at,
        u.name as user_name,
        u.role as user_role
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.auction_id = ?
      ORDER BY cm.created_at ASC
      LIMIT ?
    `;

    const [results] = await db.query(query, [auctionId, limit]);
    
    // Check for muted users in this room to communicate back to frontend
    const [mutedResults] = await db.query("SELECT user_id FROM muted_users WHERE auction_id = ?", [auctionId]);
    const mutedUsers = mutedResults.map(r => r.user_id);
    
    res.json({
        messages: results,
        mutedUsers: mutedUsers
    });
  } catch (err) {
    console.error("GET CHAT HISTORY ERROR:", err);
    res.status(500).json({ message: "Server error fetching chat history" });
  }
};

