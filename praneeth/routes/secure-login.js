/**
 * routes/secure-login.js
 * 
 * SECURE LOGIN IMPLEMENTATION (Mitigated with Parameterized Queries)
 * 
 * COURSE: Cyber Security (IT-30001) - Autumn Semester 2026
 * INSTITUTION: Indian Institute of Information Technology Allahabad (IIIT-A)
 * INSTRUCTOR: Dr. Soumyadev Maity
 * VULNERABILITY: SQL Injection (Variant 1: Authentication Bypass)
 * MITIGATION: Parameterized SQL Queries (Prepared Statements)
 * 
 * WHY PARAMETERIZATION DEFENDS AGAINST SQL INJECTION:
 * 1. Separation of Code and Data:
 *    The SQL query structure is defined statically with placeholders ('?').
 *    The SQL engine compiles and prepares the query structure (AST) BEFORE
 *    any user data is bound to it.
 * 
 * 2. Neutralization of Metacharacters:
 *    When user values are supplied during execution, the database engine treats
 *    them strictly as literal data values for that column.
 *    Metacharacters like single quotes ('), comment tokens (--), and boolean operators (OR)
 *    are never interpreted as syntax tokens.
 * 
 * 3. Verified Attack Ineffectiveness:
 *    If an attacker submits: "admin' --" as the username, SQLite literally searches
 *    for a record where:
 *       users.username == "admin' --"
 *    Because no account exists with that exact literal username, the query safely
 *    returns zero rows and authentication fails.
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.post('/', (req, res) => {
  const { username = '', password = '' } = req.body;

  // =========================================================================
  // MITIGATION IMPLEMENTATION: PARAMETERIZED SQL QUERY
  // User input is NEVER concatenated into the SQL statement string.
  // Instead, question mark (?) placeholders represent parameter slots.
  // =========================================================================
  const secureQuery = 'SELECT id, username, password, role, full_name, email FROM users WHERE username = ? AND password = ?';

  try {
    const db = getDb();

    // Prepare the static query statement
    const stmt = db.prepare(secureQuery);

    // Bind parameters safely at runtime.
    // The database engine ensures input values remain strictly literal data.
    const user = stmt.get(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid username or password.',
        queryTemplate: secureQuery,
        boundParameters: {
          username: username,
          password: '••••••••' // Redacted for security
        },
        endpoint: 'secure',
        analysis: {
          status: 'SECURE_REJECTION',
          explanation: 'The parameterized query treated the input strictly as a data literal. Any injected metacharacters (e.g. quotes, dashes) were evaluated literally rather than as SQL command syntax.'
        }
      });
    }

    // Legitimate credentials matched
    return res.status(200).json({
      success: true,
      message: `Authentication successful: Logged in securely as [${user.username}].`,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      },
      queryTemplate: secureQuery,
      boundParameters: {
        username: user.username,
        password: '••••••••'
      },
      endpoint: 'secure',
      analysis: {
        status: 'LEGITIMATE_AUTHENTICATION',
        explanation: 'User successfully authenticated using secure parameterized database lookup.'
      }
    });

  } catch (err) {
    // Safe generic error handling prevents leakage of internal schema or database engine details
    console.error('[SecureLogin Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication processing.',
      endpoint: 'secure'
    });
  }
});

module.exports = router;
