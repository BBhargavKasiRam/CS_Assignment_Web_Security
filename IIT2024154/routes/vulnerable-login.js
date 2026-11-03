/**
 * routes/vulnerable-login.js
 * 
 * VULNERABLE LOGIN IMPLEMENTATION (Deliberately Insecure)
 * 
 * COURSE: Cyber Security (IT-30001) - Autumn Semester 2026
 * INSTITUTION: Indian Institute of Information Technology Allahabad (IIIT-A)
 * INSTRUCTOR: Dr. Soumyadev Maity
 * VULNERABILITY: SQL Injection (Variant 1: Authentication Bypass)
 * 
 * ROOT CAUSE ANALYSIS:
 * The application constructs SQL commands by directly concatenating unsanitized
 * user inputs (`username` and `password`) into the SQL query string.
 * 
 * Because the SQL interpreter does not distinguish between SQL syntax and user data,
 * an attacker can inject metacharacters (such as single quotes `'` and comment dashes `--`)
 * to manipulate the Abstract Syntax Tree (AST) of the query.
 * 
 * By providing a payload like:
 *   admin' --
 * The resulting SQL query becomes:
 *   SELECT id, username, password, role, full_name, email 
 *   FROM users 
 *   WHERE username = 'admin' --' AND password = 'any_password'
 * 
 * In SQLite, `--` tells the parser that the rest of the line is a comment.
 * The `AND password = ...` clause is completely discarded, causing the database
 * to authenticate as 'admin' regardless of what password was entered.
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.post('/', (req, res) => {
  const { username = '', password = '' } = req.body;

  // =========================================================================
  // FLAW IDENTIFICATION (CODE PATH CONTAINING THE VULNERABILITY)
  // Untrusted user input is directly concatenated into the raw SQL string.
  // =========================================================================
  const vulnerableQuery = `SELECT id, username, password, role, full_name, email FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const db = getDb();

    // The database prepares and executes the attacker-tainted SQL string directly
    const stmt = db.prepare(vulnerableQuery);
    const user = stmt.get();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid username or password.',
        executedQuery: vulnerableQuery,
        endpoint: 'vulnerable'
      });
    }

    // Determine if an unauthorized bypass occurred:
    // If the entered password does not match the true database password,
    // the user only authenticated because SQL injection compromised the query logic!
    const isBypassed = user.password !== password;

    return res.status(200).json({
      success: true,
      bypassed: isBypassed,
      message: isBypassed
        ? `CRITICAL SECURITY ALERT: Authentication Bypassed! Logged in as [${user.username}] without a valid password.`
        : `Authentication successful: Logged in as [${user.username}] using valid credentials.`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      },
      executedQuery: vulnerableQuery,
      endpoint: 'vulnerable',
      analysis: isBypassed
        ? {
            status: 'EXPLOITED',
            vulnerability: 'SQL Injection Authentication Bypass (CWE-89)',
            injectedPayload: username,
            explanation: "The payload closed the username string literal and commented out the password verification logic using '--'. The database evaluated only the username condition."
          }
        : {
            status: 'LEGITIMATE',
            explanation: 'The query executed with matching username and password credentials.'
          }
    });

  } catch (err) {
    // Graceful error handling: Malformed SQL injections (e.g. unclosed quote "admin'")
    // trigger a database syntax error. We capture this safely without crashing the node process.
    return res.status(400).json({
      success: false,
      message: `Database SQL Syntax Error: ${err.message}`,
      executedQuery: vulnerableQuery,
      endpoint: 'vulnerable',
      error: 'Malformed SQL syntax caused by unhandled quotation metacharacters.'
    });
  }
});

module.exports = router;
