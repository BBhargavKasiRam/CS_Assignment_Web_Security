const db = require("./config/db");

const optimize = async () => {
  console.log("🚀 Starting database optimization...");
  
  const indexes = [
    { table: "bids", name: "idx_auction_amount", columns: "(auction_id, amount)" },
    { table: "auctions", name: "idx_end_time_status", columns: "(end_time, status)" },
    { table: "chat_messages", name: "idx_auction_created", columns: "(auction_id, created_at)" },
    { table: "proxy_bids", name: "idx_auction_user", columns: "(auction_id, user_id)" },
    { table: "transactions", name: "idx_auction_id", columns: "(auction_id)" }
  ];

  for (const idx of indexes) {
    try {
      // Check if index exists (MySQL specific)
      const [existing] = await db.query(`
        SELECT COUNT(1) as count 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = ? 
        AND index_name = ?
      `, [idx.table, idx.name]);

      if (existing[0].count === 0) {
        console.log(`Adding index ${idx.name} to ${idx.table}...`);
        await db.query(`CREATE INDEX ${idx.name} ON ${idx.table} ${idx.columns}`);
      } else {
        console.log(`Index ${idx.name} already exists on ${idx.table}.`);
      }
    } catch (err) {
      console.error(`Error adding index ${idx.name}:`, err.message);
    }
  }

  console.log("✅ Optimization complete!");
  process.exit(0);
};

optimize();
