const db = require("../config/db");

exports.getMediators = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Use TRIM() and lower() for more robust matching
    let sql = `
      SELECT 
        u.id, u.name, u.email, u.profile_image, u.rating, u.items_sold,
        (SELECT COUNT(*) FROM auctions a WHERE a.mediator_id = u.id) as total_assignments
      FROM users u 
      WHERE u.role = 'mediator' OR u.role = 'auctioneer'
    `;
    let params = [];

    if (search) {
      // Trim search term and search within the name
      const cleanSearch = search.trim();
      sql += " AND LOWER(u.name) LIKE LOWER(?)";
      params.push(`%${cleanSearch}%`);
    }

    // Sort by popularity (total assignments + items sold)
    sql += " ORDER BY (total_assignments + items_sold) DESC, rating DESC";

    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("DB ERROR in getMediators:", err);
    res.status(500).json({ message: "Server error" });
  }
};

