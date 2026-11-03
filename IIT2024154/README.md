# SQL Injection Authentication Bypass Lab (Variant 1)

## 1. Project Overview

This repository contains a complete, locally runnable educational demonstration web application built for the **Web Server Security** assignment at IIIT Allahabad. It specifically models and defends against:

- **Assigned Category:** SQL Injection
- **Assigned Variant:** Variant 1: Authentication Bypass
- **Implemented Mitigation:** Parameterized SQL Queries (Prepared Statements)

The application provides a side-by-side comparative laboratory containing two isolated implementations sharing the same underlying SQLite database:
1. **Vulnerable Login (`/api/login/vulnerable`):** Constructs SQL commands by concatenating unsanitized user input directly into query strings, allowing an attacker to inject SQL syntax and bypass password authentication.
2. **Secure Login (`/api/login/secure`):** Implements the same authentication logic using parameterized queries with prepared statement placeholders (`?`), neutralizing SQL injection attempts while preserving normal authentication.

---

## 2. What is SQL Injection Authentication Bypass?

In standard database-backed authentication, the server executes a query verifying both the username and password:
```sql
SELECT * FROM users WHERE username = '<input_user>' AND password = '<input_pass>';
```

When user input is directly concatenated without parameterization:
- An attacker submits a crafted username such as: `admin' --` with an arbitrary wrong password.
- The resulting SQL query becomes:
  ```sql
  SELECT * FROM users WHERE username = 'admin' --' AND password = 'arbitrary_wrong_password';
  ```
- In SQLite (and standard SQL), `--` denotes the start of a single-line comment.
- The SQL parser discards everything after `--`. The password verification clause `AND password = ...` is completely ignored.
- The database evaluates only `WHERE username = 'admin'`, matches the administrator record, and grants full unauthorized access.

---

## 3. Project Directory Structure

```
CS_LAB/
├── package.json                   # Project configuration and test scripts
├── server.js                      # Express server (strictly bound to localhost 127.0.0.1:3000)
├── database.js                    # SQLite database management and initial seed data
├── routes/
│   ├── vulnerable-login.js        # Intentionally vulnerable endpoint (string concatenation)
│   └── secure-login.js            # Mitigated endpoint (parameterized queries)
├── public/
│   ├── index.html                 # Modern cybersecurity operations dashboard UI
│   ├── style.css                  # Dark-mode styling, tokens, and responsive layout
│   └── script.js                  # Frontend async fetch logic & live SQL query inspector
├── tests/
│   └── authentication.test.js     # 10 automated integration tests using node:test
├── DEMONSTRATION_SCRIPT.md        # Natural 2–3 minute video presentation script
├── REPORT.md                      # Comprehensive academic report with AST analysis
└── README.md                      # Setup and reproduction documentation
```

---

## 4. Prerequisites & Requirements

- **Operating System:** Windows, macOS, or Linux
- **Node.js:** Node.js v22.5.0 or newer (tested on Node.js v26.6.0)
  - Uses the official Node.js built-in `node:sqlite` driver (`DatabaseSync`), requiring **zero** native C++ compiler tools or `node-gyp`.
- **npm:** npm v10+ (tested on npm v11.18.0)
- **Web Browser:** Any modern browser (Google Chrome, Firefox, Edge, Safari)

---

## 5. Quick Start Instructions

### Step 1: Install Dependencies
Open a terminal in the project directory:
```bash
npm install
```
*(Dependencies: only `express`)*

### Step 2: Start the Local Application
```bash
npm start
```
The server will start and print the startup banner:
```text
================================================================
  IIIT Allahabad — Cyber Security Lab (IT-30001)
  SQL Injection Authentication Bypass Lab (Variant 1)
================================================================
  Local URL:        http://127.0.0.1:3000
  Vulnerable Route: POST http://127.0.0.1:3000/api/login/vulnerable
  Secure Route:     POST http://127.0.0.1:3000/api/login/secure
----------------------------------------------------------------
  Demonstration Payload:  admin' --
  Fictional Credentials:   admin / Admin@SecLab2026!
================================================================
```

### Step 3: Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:3000
```

---

## 6. How to Perform the Live Demonstration

The application UI features one-click quick-test pill buttons at the top to simplify live evaluation:

### Demonstration 1: Exploit Vulnerable Login (Authentication Bypass)
1. On the left side (**Vulnerable Login Implementation**):
   - In **Username**, enter: `admin' --`
   - In **Password**, enter: `wrongpassword123` *(or click the quick pill **"admin' --"**)*
2. Click **Test Vulnerable Login**.
3. **Observed Result:**
   - 🚨 Status Banner: **EXPLOITED — AUTHENTICATION BYPASSED (HTTP 200)**.
   - The user profile card displays **System Administrator** (`admin`).
   - The Live SQL Inspector reveals the constructed query with the password check truncated:
     `WHERE username = 'admin' --' AND password = 'wrongpassword123'`

### Demonstration 2: Attack Attempt Against Secure Login (Mitigated)
1. On the right side (**Secure Login Implementation**):
   - In **Username**, enter the identical payload: `admin' --`
   - In **Password**, enter: `wrongpassword123`
2. Click **Test Secure Login**.
3. **Observed Result:**
   - 🛡️ Status Banner: **INJECTION DEFENDED — ATTACK BLOCKED (HTTP 401)**.
   - The parameterized query treated `admin' --` strictly as a literal string value for the `username` column.
   - Since no user has that literal username, authentication cleanly fails.

### Demonstration 3: Legitimate Login Regression Check
1. On the right side (**Secure Login Implementation**):
   - In **Username**, enter: `admin`
   - In **Password**, enter: `Admin@SecLab2026!` *(or click the quick pill **"admin / Admin@SecLab2026!"**)*
2. Click **Test Secure Login**.
3. **Observed Result:**
   - ✅ Status Banner: **SECURE LOGIN SUCCESSFUL (HTTP 200)**.
   - Legitimate credentials work properly, verifying zero functional regression.

### Demonstration 4: Database Reset
- Click the **Reset Demo Database** button in the header at any time to restore the SQLite database to clean default seed accounts.

---

## 7. Fictional Demonstration Accounts

The local database (`database.sqlite`) is pre-seeded with these test credentials:

| Username | Role | Full Name | Demonstration Password |
|---|---|---|---|
| `admin` | Administrator | System Administrator | `Admin@SecLab2026!` |
| `alice` | Security Analyst | Alice Sharma | `Alice#Pass987` |
| `bob` | Research Student | Bob Kumar | `Bob#Secret456` |
| `faculty` | Course Instructor | Dr. Soumyadev Maity | `Faculty*Auth2026` |

---

## 8. Running Automated Integration Tests

To run the full automated verification test suite:
```bash
npm test
```

### Test Suite Output (10/10 Passed):
```text
▶ SQL Injection Authentication Bypass Lab — Comprehensive Test Suite
  ✔ TEST 1: Vulnerable Endpoint — Legitimate credentials authenticate successfully (167ms)
  ✔ TEST 2: Vulnerable Endpoint — Ordinary invalid credentials are rejected (28ms)
  ✔ TEST 3: Vulnerable Endpoint — SQL injection [admin' --] successfully bypasses authentication (13ms)
  ✔ TEST 4: Vulnerable Endpoint — SQL injection [' OR 1=1 --] tautology bypasses authentication (10ms)
  ✔ TEST 5: Secure Endpoint — Attack payload [admin' --] is strictly rejected (HTTP 401) (9ms)
  ✔ TEST 6: Secure Endpoint — Tautology payload [' OR 1=1 --] is strictly rejected (HTTP 401) (9ms)
  ✔ TEST 7: Secure Endpoint — Valid admin credentials succeed (Regression Test) (9ms)
  ✔ TEST 8: Secure Endpoint — Valid non-admin user (alice) succeeds (Regression Test) (8ms)
  ✔ TEST 9: Secure Endpoint — Invalid credentials for known user fail (HTTP 401) (9ms)
  ✔ TEST 10: Robustness — Malformed SQL injection (unclosed quote) is handled safely (15ms)
ℹ tests 10 | pass 10 | fail 0
```

---

## 9. Code Comparison: Flaw vs. Mitigation

### Vulnerable Approach ([`routes/vulnerable-login.js`](file:///c:/Users/prane/OneDrive/Desktop/CS_LAB/routes/vulnerable-login.js#L38-L45))
```javascript
// UNSAFE: Untrusted user input is directly concatenated into SQL query string
const vulnerableQuery = `SELECT id, username, password, role, full_name, email FROM users WHERE username = '${username}' AND password = '${password}'`;
const stmt = db.prepare(vulnerableQuery);
const user = stmt.get();
```

### Secure Approach ([`routes/secure-login.js`](file:///c:/Users/prane/OneDrive/Desktop/CS_LAB/routes/secure-login.js#L38-L45))
```javascript
// SAFE: Parameterized SQL query using positional parameter placeholders (?)
const secureQuery = 'SELECT id, username, password, role, full_name, email FROM users WHERE username = ? AND password = ?';
const stmt = db.prepare(secureQuery);
const user = stmt.get(username, password);
```

---

## 10. Summary of Other Mitigations (Theory)

As specified in Table 2(e) of the assignment handout:
1. **Input Validation with Allow-Lists:** Restricts input to accepted formats (e.g. alphanumeric usernames `^[a-zA-Z0-9_]{3,20}$`). Rejects malformed requests early, though cannot replace parameterization for fields requiring punctuation.
2. **Least-Privilege Database Accounts:** Ensures web application database users possess only necessary privileges (e.g. `SELECT` and `UPDATE`, never `DROP TABLE`, `GRANT`, or administrative procedures).
3. **Safe Error Handling:** Ensures internal database engine errors, table names, and query structures are never leaked in client responses, preventing error-based reconnaissance.

---

## 11. Educational Disclaimer

> **IMPORTANT:** This application is strictly an educational cybersecurity laboratory designed for IIIT Allahabad coursework (IT-30001). It binds exclusively to `127.0.0.1` (localhost). Never deploy the vulnerable endpoint on public or production networks. Never collect real user credentials.
