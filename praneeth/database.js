/**
 * database.js
 * 
 * Database setup and initialization for the SQL Injection Authentication Bypass Lab.
 * Uses Node.js standard built-in SQLite driver (node:sqlite DatabaseSync).
 * 
 * COURSE: Cyber Security (IT-30001) - Autumn Semester 2026
 * INSTITUTION: Indian Institute of Information Technology Allahabad (IIIT-A)
 * INSTRUCTOR: Dr. Soumyadev Maity
 * VULNERABILITY: SQL Injection (Variant 1: Authentication Bypass)
 * 
 * IMPORTANT EDUCATIONAL NOTE:
 * In this demonstration lab, demonstration passwords are stored in plaintext strictly
 * to make the raw SQL query comparisons transparent and directly inspectable for learning.
 * In production systems, passwords MUST NEVER be stored in plaintext; they must be hashed
 * using a robust, salted cryptographic key derivation function such as Argon2id or bcrypt.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Persistent SQLite database file in project root
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

let dbInstance = null;

// Fictional demonstration credentials used across all tests and demonstrations
const DEMO_ACCOUNTS = [
  {
    username: 'admin',
    password: 'Admin@SecLab2026!',
    role: 'Administrator',
    full_name: 'System Administrator',
    email: 'admin@lab.local'
  },
  {
    username: 'alice',
    password: 'Alice#Pass987',
    role: 'Security Analyst',
    full_name: 'Alice Sharma',
    email: 'alice@lab.local'
  },
  {
    username: 'bob',
    password: 'Bob#Secret456',
    role: 'Research Student',
    full_name: 'Bob Kumar',
    email: 'bob@lab.local'
  },
  {
    username: 'faculty',
    password: 'Faculty*Auth2026',
    role: 'Course Instructor',
    full_name: 'Dr. Soumyadev Maity',
    email: 'faculty@iiita.ac.in'
  }
];

/**
 * Get or create the SQLite database instance.
 */
function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
  }
  return dbInstance;
}

/**
 * Initialize database tables and seed fictional accounts.
 * Safe to run repeatedly; does not create duplicate entries.
 */
function initDatabase() {
  const db = getDb();

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default demonstration users if not already present
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const countResult = checkStmt.get();

  if (countResult.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO users (username, password, role, full_name, email)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const acc of DEMO_ACCOUNTS) {
      insertStmt.run(acc.username, acc.password, acc.role, acc.full_name, acc.email);
    }
    console.log(`[Database] Initialized and seeded ${DEMO_ACCOUNTS.length} fictional demonstration accounts.`);
  }

  return db;
}

/**
 * Reset database to fresh default demonstration state.
 * Useful for restoring clean state before a live viva or video recording.
 */
function resetDatabase() {
  const db = getDb();
  db.exec('DROP TABLE IF EXISTS users;');
  initDatabase();
  console.log('[Database] Reset complete: Database restored to initial seed state.');
}

/**
 * Returns demo accounts (excluding passwords for safety in public responses).
 */
function getPublicDemoAccounts() {
  return DEMO_ACCOUNTS.map(({ password, ...rest }) => rest);
}

/**
 * Returns raw demo accounts for automated testing assertions.
 */
function getDemoAccounts() {
  return DEMO_ACCOUNTS;
}

/**
 * Close database connection (used during teardown in test suites).
 */
function closeDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // Ignore if already closed
    }
    dbInstance = null;
  }
}

module.exports = {
  DB_PATH,
  getDb,
  initDatabase,
  resetDatabase,
  getPublicDemoAccounts,
  getDemoAccounts,
  closeDatabase
};
