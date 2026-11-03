const db = require("./config/db");

const queries = [
  "ALTER TABLE transactions ADD COLUMN shipping_status ENUM('Pending', 'Shipped', 'In Transit', 'Local Hub', 'Delivered') DEFAULT 'Pending'",
  "ALTER TABLE transactions ADD COLUMN tracking_number VARCHAR(100)",
  "ALTER TABLE transactions ADD COLUMN courier_name VARCHAR(100) DEFAULT 'Global Fine Art Logistics (GFAL)'"
];

async function migrate() {
  for (const query of queries) {
    try {
      await db.promise().query(query);
      console.log("Success:", query);
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
  process.exit();
}

migrate();
