/**
 * tests/authentication.test.js
 * 
 * Automated Verification Suite for SQL Injection Authentication Bypass Lab
 * COURSE: Cyber Security (IT-30001) - Autumn Semester 2026
 * INSTITUTION: Indian Institute of Information Technology Allahabad (IIIT-A)
 * INSTRUCTOR: Dr. Soumyadev Maity
 * 
 * Tests both Vulnerable and Secure endpoints across 10 critical authentication scenarios:
 * 1. Vulnerable - Normal authentication with valid credentials succeeds.
 * 2. Vulnerable - Ordinary invalid credentials fail (HTTP 401).
 * 3. Vulnerable - Exploit 1: admin' -- bypasses authentication without password.
 * 4. Vulnerable - Exploit 2: ' OR 1=1 -- bypasses authentication without password.
 * 5. Secure - Same Exploit 1 (admin' --) is strictly rejected (HTTP 401).
 * 6. Secure - Same Exploit 2 (' OR 1=1 --) is strictly rejected (HTTP 401).
 * 7. Secure - Normal authentication with valid admin credentials succeeds (HTTP 200).
 * 8. Secure - Normal authentication with valid non-admin user (alice) succeeds (HTTP 200).
 * 9. Secure - Ordinary invalid credentials fail (HTTP 401).
 * 10. Robustness - Malformed SQL injection (unclosed quote admin') handles error safely without crashing.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');
const { initDatabase, resetDatabase, closeDatabase } = require('../database');

let server;
let baseUrl;

// Helper to perform HTTP POST JSON requests
async function postJson(endpoint, payload) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  return { status: response.status, data };
}

describe('SQL Injection Authentication Bypass Lab — Comprehensive Test Suite', () => {

  before(() => {
    // Initialize clean database state and bind server to random available port
    initDatabase();
    resetDatabase();

    return new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`[Test Suite] Running tests against ephemeral server at ${baseUrl}`);
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      closeDatabase();
      server.close(() => {
        console.log('[Test Suite] Ephemeral test server closed.');
        resolve();
      });
    });
  });

  // =========================================================================
  // VULNERABLE ENDPOINT TESTS (/api/login/vulnerable)
  // =========================================================================

  test('TEST 1: Vulnerable Endpoint — Legitimate credentials authenticate successfully', async () => {
    const res = await postJson('/api/login/vulnerable', {
      username: 'admin',
      password: 'Admin@SecLab2026!'
    });

    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for valid credentials');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.bypassed, false, 'Legitimate login should not be flagged as bypass');
    assert.strictEqual(res.data.user.username, 'admin');
    assert.strictEqual(res.data.user.role, 'Administrator');
  });

  test('TEST 2: Vulnerable Endpoint — Ordinary invalid credentials are rejected', async () => {
    const res = await postJson('/api/login/vulnerable', {
      username: 'admin',
      password: 'IncorrectPassword123!'
    });

    assert.strictEqual(res.status, 401, 'Expected HTTP 401 for incorrect password');
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.user, undefined, 'User data must not be returned');
  });

  test('TEST 3: Vulnerable Endpoint — SQL injection [admin\' --] successfully bypasses authentication', async () => {
    // Attacker provides an arbitrary bogus password
    const res = await postJson('/api/login/vulnerable', {
      username: "admin' --",
      password: 'bogus_password_that_does_not_match'
    });

    assert.strictEqual(res.status, 200, 'Expected HTTP 200 due to SQL injection vulnerability');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.bypassed, true, 'Must be flagged as an unauthorized bypass');
    assert.strictEqual(res.data.user.username, 'admin');
    assert.strictEqual(res.data.user.role, 'Administrator');
    assert.match(res.data.executedQuery, /admin' --/, 'Executed query must show the injected comment');
  });

  test('TEST 4: Vulnerable Endpoint — SQL injection [\' OR 1=1 --] tautology bypasses authentication', async () => {
    const res = await postJson('/api/login/vulnerable', {
      username: "' OR 1=1 --",
      password: 'any_random_password'
    });

    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for tautology bypass');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.bypassed, true, 'Must be flagged as bypass');
    assert.ok(res.data.user.id, 'Should return first matching user in table');
  });

  // =========================================================================
  // SECURE ENDPOINT TESTS (/api/login/secure)
  // =========================================================================

  test('TEST 5: Secure Endpoint — Attack payload [admin\' --] is strictly rejected (HTTP 401)', async () => {
    const res = await postJson('/api/login/secure', {
      username: "admin' --",
      password: 'bogus_password_that_does_not_match'
    });

    assert.strictEqual(res.status, 401, 'Expected HTTP 401: Parameterized query must reject injection');
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.user, undefined, 'No user record should be granted');
    assert.strictEqual(res.data.endpoint, 'secure');
  });

  test('TEST 6: Secure Endpoint — Tautology payload [\' OR 1=1 --] is strictly rejected (HTTP 401)', async () => {
    const res = await postJson('/api/login/secure', {
      username: "' OR 1=1 --",
      password: 'any_random_password'
    });

    assert.strictEqual(res.status, 401, 'Expected HTTP 401: Tautology payload must fail on secure endpoint');
    assert.strictEqual(res.data.success, false);
    assert.strictEqual(res.data.user, undefined);
  });

  test('TEST 7: Secure Endpoint — Valid admin credentials succeed (Regression Test)', async () => {
    const res = await postJson('/api/login/secure', {
      username: 'admin',
      password: 'Admin@SecLab2026!'
    });

    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for legitimate credentials');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.username, 'admin');
    assert.strictEqual(res.data.user.role, 'Administrator');
  });

  test('TEST 8: Secure Endpoint — Valid non-admin user (alice) succeeds (Regression Test)', async () => {
    const res = await postJson('/api/login/secure', {
      username: 'alice',
      password: 'Alice#Pass987'
    });

    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for user alice');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.username, 'alice');
    assert.strictEqual(res.data.user.role, 'Security Analyst');
  });

  test('TEST 9: Secure Endpoint — Invalid credentials for known user fail (HTTP 401)', async () => {
    const res = await postJson('/api/login/secure', {
      username: 'alice',
      password: 'IncorrectPassword'
    });

    assert.strictEqual(res.status, 401, 'Expected HTTP 401 for wrong password');
    assert.strictEqual(res.data.success, false);
  });

  // =========================================================================
  // ROBUSTNESS & SAFE ERROR HANDLING TESTS
  // =========================================================================

  test('TEST 10: Robustness — Malformed SQL injection (unclosed quote) is handled safely', async () => {
    // An unclosed single quote would cause a raw SQLite syntax error
    const res = await postJson('/api/login/vulnerable', {
      username: "admin'",
      password: 'any'
    });

    // Server should not crash and should return HTTP 400 safely
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /SQL Syntax Error/i);
  });
});
