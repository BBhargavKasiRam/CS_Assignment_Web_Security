require("dotenv").config();
const mysql = require("mysql2/promise");

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Adding payment_id column to transactions table...");
    await connection.query("ALTER TABLE transactions ADD COLUMN payment_id VARCHAR(255)");
    console.log("Column added successfully.");
  } catch (err) {
    if (err.code === "ER_DUP_COLUMN_NAME") {
      console.log("Column already exists.");
    } else {
      console.error("Error adding column:", err);
    }
  } finally {
    await connection.end();
  }
}

run();
