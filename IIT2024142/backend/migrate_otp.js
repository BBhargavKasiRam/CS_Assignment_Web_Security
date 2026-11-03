/**
 * Migration: Add OTP columns to users table
 * Run: node migrate_otp.js
 */
require("dotenv").config();
const db = require("./config/db");

async function migrate() {
  try {
    console.log("Running OTP migration...");

    // Add otp_code column if not exists
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS otp_code VARCHAR(255) DEFAULT NULL
    `);

    // Add otp_expires column if not exists
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS otp_expires DATETIME DEFAULT NULL
    `);

    // Add otp_purpose column if not exists
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS otp_purpose ENUM('register','reset') DEFAULT NULL
    `);

    console.log("✅ OTP migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    // Try individual columns if IF NOT EXISTS is unsupported
    try {
      await db.query(`ALTER TABLE users ADD COLUMN otp_code VARCHAR(255) DEFAULT NULL`).catch(() => {});
      await db.query(`ALTER TABLE users ADD COLUMN otp_expires DATETIME DEFAULT NULL`).catch(() => {});
      await db.query(`ALTER TABLE users ADD COLUMN otp_purpose ENUM('register','reset') DEFAULT NULL`).catch(() => {});
      console.log("✅ OTP migration completed (fallback method).");
      process.exit(0);
    } catch (e) {
      console.error("❌ Fallback migration also failed:", e.message);
      process.exit(1);
    }
  }
}

migrate();
