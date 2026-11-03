/**
 * server.js
 * 
 * Main Express server for the SQL Injection Authentication Bypass Lab.
 * 
 * COURSE: Cyber Security (IT-30001) - Autumn Semester 2026
 * INSTITUTION: Indian Institute of Information Technology Allahabad (IIIT-A)
 * INSTRUCTOR: Dr. Soumyadev Maity
 * ASSIGNMENT: Web Server Security — Exploitation and Mitigation
 * VULNERABILITY: SQL Injection (Variant 1: Authentication Bypass)
 */

const express = require('express');
const path = require('node:path');
const { initDatabase, resetDatabase, getPublicDemoAccounts } = require('./database');
const vulnerableLoginRouter = require('./routes/vulnerable-login');
const secureLoginRouter = require('./routes/secure-login');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1'; // Strictly bind to localhost for secure educational sandbox

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API endpoints
app.use('/api/login/vulnerable', vulnerableLoginRouter);
app.use('/api/login/secure', secureLoginRouter);

// Endpoint to retrieve public demonstration accounts for testing
app.get('/api/accounts', (req, res) => {
  try {
    const accounts = getPublicDemoAccounts();
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve demo accounts.' });
  }
});

// Endpoint to reset the local database to clean initial state
app.post('/api/reset', (req, res) => {
  try {
    resetDatabase();
    res.json({
      success: true,
      message: 'Database successfully reset to initial demonstration state with default accounts.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset database.' });
  }
});

// Endpoint for lab metadata and assignment verification
app.get('/api/info', (req, res) => {
  res.json({
    institution: 'Indian Institute of Information Technology Allahabad (IIIT-A)',
    course: 'Cyber Security (IT-30001)',
    semester: 'Autumn Semester 2026',
    instructor: 'Dr. Soumyadev Maity',
    assignment: 'Web Server Security: Exploitation and Mitigation',
    category: 'SQL Injection',
    variant: 'Variant 1: Authentication Bypass',
    mitigationImplemented: 'Parameterized SQL Queries (Prepared Statements)',
    status: 'Operational'
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.'
  });
});

// Start server if executed directly
if (require.main === module) {
  initDatabase();

  const server = app.listen(PORT, HOST, () => {
    console.log('================================================================');
    console.log('  IIIT Allahabad — Cyber Security Lab (IT-30001)');
    console.log('  SQL Injection Authentication Bypass Lab (Variant 1)');
    console.log('================================================================');
    console.log(`  Local URL:        http://${HOST}:${PORT}`);
    console.log(`  Vulnerable Route: POST http://${HOST}:${PORT}/api/login/vulnerable`);
    console.log(`  Secure Route:     POST http://${HOST}:${PORT}/api/login/secure`);
    console.log('----------------------------------------------------------------');
    console.log('  Demonstration Payload:  admin\' --');
    console.log('  Fictional Credentials:   admin / Admin@SecLab2026!');
    console.log('================================================================');
  });

  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down lab server...');
    server.close(() => {
      process.exit(0);
    });
  });
}

module.exports = app;
