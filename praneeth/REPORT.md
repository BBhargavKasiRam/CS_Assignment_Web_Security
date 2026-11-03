# Technical Report: Web Server Security
## Exploitation and Mitigation of SQL Injection (Variant 1: Authentication Bypass)
### Department of Information Technology — Indian Institute of Information Technology Allahabad (IIIT-A)
**Course:** Cyber Security (IT-30001) | Autumn Semester 2026  
**Instructor:** Dr. Soumyadev Maity  
**Submission Deadline:** 03 November 2026 (Tuesday), 23:59 IST  

---

## Table 3. Ownership Declaration

| Member Name | Roll Number | Category | Variant Implemented | Implemented Mitigation |
|---|---|---|---|---|
| *(Student Name)* | *(Roll Number)* | SQL Injection | Variant 1: Authentication Bypass | Parameterized SQL Queries (Prepared Statements) |

---

## 1. Executive Summary & Objective

In modern web applications, relational databases back critical business logic, specifically user identity authentication. When user-supplied parameters are incorporated directly into Structured Query Language (SQL) statements without boundary isolation, the application becomes vulnerable to **SQL Injection (SQLi, CWE-89)**.

The objective of this project is to provide a complete, locally reproducible, and robust academic laboratory demonstrating:
1. How untrusted user input concatenated into an authentication SQL query permits an unauthorized attacker to bypass credential validation (**Authentication Bypass**).
2. The fundamental root cause at the lexical and syntactic levels of database query engines.
3. The implementation of the industry-standard primary defense: **Parameterized SQL Queries (Prepared Statements)**.
4. Empirical proof that the identical attack payload fails deterministically against the mitigated endpoint, while legitimate authentication continues to operate without regression.
5. The theoretical foundations of complementary defense-in-depth measures: input validation using allow-lists, least-privilege database accounts, and safe error handling.

---

## 2. Introduction to SQL Injection (CWE-89)

SQL Injection occurs when user-controllable data is concatenated or interpolated directly into an SQL command string, allowing the input to alter the syntactic structure of the query. Classified as **CWE-89: Improper Neutralization of Special Elements used in an SQL Command**, it has consistently ranked among the most destructive web application security vulnerabilities on the OWASP Top 10 (A03:2021 — Injection).

The danger of SQL injection stems from the dual role of characters in text-based programming and query languages:
- **Data Elements:** Values meant to be matched, stored, or filtered (e.g., `"john"`, `"password123"`).
- **Control Metacharacters:** Characters that instruct the parser how to segment statements, delimit literals, and evaluate logic (e.g., `'`, `"`, `--`, `;`, `OR`, `AND`, `UNION`).

When an application fails to enforce a rigid architectural separation between the **control plane** (SQL command logic) and the **data plane** (untrusted user inputs), malicious users can supply control metacharacters that hijack the database engine's interpreter.

---

## 3. Description of Variant 1: Authentication Bypass

In a standard authentication workflow, an application queries the database to confirm whether a user exists with a matching username and password pair:

```sql
SELECT id, username, role FROM users WHERE username = '<USER_INPUT>' AND password = '<PASS_INPUT>';
```

Under normal circumstances, the query requires **both** conditions to evaluate to `TRUE`:
1. `users.username` must equal the provided username literal.
2. `users.password` must equal the provided password literal.

If either condition is `FALSE`, the query returns zero rows (`NULL`), and authentication fails.

### The Authentication Bypass Mechanism

In **Variant 1 (Authentication Bypass)**, an attacker exploits unsafe string concatenation to manipulate the boolean logic of the `WHERE` clause. This can be achieved through two primary vectors:

#### Vector A: Comment Truncation (Targeted Account Takeover)
The attacker injects a single quote to terminate the string literal, followed by the database single-line comment sequence (`--` in SQLite, PostgreSQL, and Oracle; `#` or `-- ` in MySQL):

- **Payload:** `admin' --`
- **Password:** `arbitrary_wrong_password`
- **Resulting Query:**
  ```sql
  SELECT id, username, role FROM users WHERE username = 'admin' --' AND password = 'arbitrary_wrong_password';
  ```
The database parser recognizes `--` as the start of a comment and discards all subsequent characters on the line. The password comparison clause `AND password = '...'` is never executed. Because a user named `admin` exists in the database, the query returns the record, and the application mistakenly grants full administrative privileges without a valid password.

#### Vector B: Tautology Manipulation (Arbitrary Account Access)
The attacker injects a boolean condition that always evaluates to `TRUE` (a tautology), regardless of the credentials in the database:

- **Payload:** `' OR 1=1 --`
- **Resulting Query:**
  ```sql
  SELECT id, username, role FROM users WHERE username = '' OR 1=1 --' AND password = '...';
  ```
Because `1=1` is unconditionally `TRUE`, the `WHERE` clause evaluates to `TRUE` for every row in the `users` table. The database returns the first record found (commonly the initial administrator account created at database initialization), allowing an unauthenticated intruder access to the system.

---

## 4. Application Architecture

To ensure strict reproducibility, zero reliance on external or paid cloud services, and clean isolation, the demonstration system was constructed using the following local stack:

```
sql-injection-lab/
├── package.json                   # Project manifest, dependencies, and test scripts
├── server.js                      # Express HTTP server bound to 127.0.0.1:3000
├── database.js                    # SQLite connection, schema initialization, and seeding
├── routes/
│   ├── vulnerable-login.js        # Deliberately vulnerable endpoint (string concatenation)
│   └── secure-login.js            # Mitigated endpoint (parameterized queries)
├── public/
│   ├── index.html                 # Academic dashboard with side-by-side comparison
│   ├── style.css                  # Modern cyber-security dark-mode design system
│   └── script.js                  # Asynchronous client-side form submission & query inspector
├── tests/
│   └── authentication.test.js     # 10 automated integration tests using node:test
├── DEMONSTRATION_SCRIPT.md        # 2–3 minute timed video narration script
├── REPORT.md                      # Comprehensive academic and technical documentation
└── README.md                      # Reproduction instructions and ownership declaration
```

### Technical Stack Details
- **Runtime Environment:** Node.js (v26.6.0 LTS/Current)
- **Web Framework:** Express.js (v5.3.0)
- **Database Engine:** SQLite 3 utilizing Node.js standard built-in `node:sqlite` (`DatabaseSync`), guaranteeing zero external compilation dependencies and 100% deterministic local behavior.
- **Frontend:** Responsive Vanilla HTML5, CSS3 (custom CSS custom property tokens, glassmorphic dark theme), and Vanilla JavaScript (Fetch API).
- **Test Runner:** Built-in `node:test` and `node:assert` modules.

---

## 5. Database Setup & Seed Data

The database initializes automatically when `server.js` or `tests/authentication.test.js` runs. It creates a local persistent SQLite database file (`database.sqlite`) in the project root.

### Schema Definition
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Demonstration Accounts
To ensure reproducible testing, the database is pre-seeded with four fictional demonstration accounts:

| ID | Username | Role | Full Name | Email | Demonstration Password |
|---|---|---|---|---|---|
| 1 | `admin` | Administrator | System Administrator | admin@lab.local | `Admin@SecLab2026!` |
| 2 | `alice` | Security Analyst | Alice Sharma | alice@lab.local | `Alice#Pass987` |
| 3 | `bob` | Research Student | Bob Kumar | bob@lab.local | `Bob#Secret456` |
| 4 | `faculty` | Course Instructor | Dr. Soumyadev Maity | faculty@iiita.ac.in | `Faculty*Auth2026` |

> **Educational Security Notice:** In this academic laboratory, demonstration passwords are stored in plaintext strictly to make the raw SQL string comparisons transparent and directly inspectable for learning. In production systems, passwords **MUST NEVER** be stored in plaintext; they must be hashed using a robust, salted cryptographic key derivation function such as **Argon2id** or **bcrypt** with an appropriate work factor.

---

## 6. Vulnerable Implementation Analysis

The vulnerable implementation is encapsulated in [`routes/vulnerable-login.js`](file:///c:/Users/prane/OneDrive/Desktop/CS_LAB/routes/vulnerable-login.js).

### Flawed Source Code (Lines 34–48)
```javascript
router.post('/', (req, res) => {
  const { username = '', password = '' } = req.body;

  // FLAW: Untrusted user input is directly concatenated into the SQL statement
  const vulnerableQuery = `SELECT id, username, password, role, full_name, email FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const db = getDb();

    // The database engine parses and executes attacker-controlled syntax
    const stmt = db.prepare(vulnerableQuery);
    const user = stmt.get();
    ...
```

### Why the Flaw Exists
The developer attempted to authenticate the user by dynamically generating SQL using JavaScript template literals (`${username}`). Because no syntactic sanitization or parameter binding occurs:
1. The untrusted `username` variable transitions directly into the SQL statement buffer.
2. The database receives a raw text string containing both SQL commands and user input in an undivided sequence.
3. The SQL lexer tokenizes characters supplied by the user (such as `'` and `--`) as language grammar tokens rather than data literals.

---

## 7. Demonstration Payload & Observed Results

### Test Setup
- **Endpoint:** `POST /api/login/vulnerable`
- **Headers:** `Content-Type: application/json`
- **Target Account:** `admin` (System Administrator)
- **Bogus Password:** `wrongpassword123`

### Injected Payload
```text
admin' --
```

### Constructed SQL Statement
```sql
SELECT id, username, password, role, full_name, email 
FROM users 
WHERE username = 'admin' --' AND password = 'wrongpassword123'
```

### Observed Server Response (HTTP 200 OK)
```json
{
  "success": true,
  "bypassed": true,
  "message": "CRITICAL SECURITY ALERT: Authentication Bypassed! Logged in as [admin] without a valid password.",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Administrator",
    "full_name": "System Administrator",
    "email": "admin@lab.local"
  },
  "executedQuery": "SELECT id, username, password, role, full_name, email FROM users WHERE username = 'admin' --' AND password = 'wrongpassword123'",
  "endpoint": "vulnerable",
  "analysis": {
    "status": "EXPLOITED",
    "vulnerability": "SQL Injection Authentication Bypass (CWE-89)",
    "injectedPayload": "admin' --",
    "explanation": "The payload closed the username string literal and commented out the password verification logic using '--'. The database evaluated only the username condition."
  }
}
```

The application granted full administrative access to an unauthenticated client who provided an invalid password.

---

## 8. Root-Cause Analysis (Compiler & AST Perspective)

To rigorously explain why this exploit succeeds, consider how the SQLite database engine processes SQL queries through lexical analysis, parsing, and query plan generation.

```
VULNERABLE EXECUTION FLOW (String Concatenation):

[ Attacker Input: "admin' --" ] + [ Password: "wrong" ]
                     │
                     ▼
      [ Concatenated String Buffer ]
"SELECT * FROM users WHERE username = 'admin' --' AND password = 'wrong'"
                     │
                     ▼
             [ SQL Lexer / Parser ]
       Breaks into Tokens:
       - KEYWORD(SELECT)
       - IDENTIFIER(users)
       - KEYWORD(WHERE)
       - IDENTIFIER(username)
       - OPERATOR(=)
       - LITERAL('admin')
       - COMMENT(--' AND password = 'wrong')  ◄── Discarded by Lexer!
                     │
                     ▼
        [ Abstract Syntax Tree (AST) ]
                 WHERE
                   │
         ┌─────────┴─────────┐
      username               =
                             │
                         'admin'
     (Password verification node is completely missing from AST!)
                     │
                     ▼
     [ Evaluates TRUE for admin record -> ACCESS GRANTED ]
```

When user input is concatenated into the query string, it enters the compiler **prior to parsing**. The metacharacters alter the query's **Abstract Syntax Tree (AST)**. The AST generated by the compiler contains only a single binary expression (`username = 'admin'`). The intended conjunction operator (`AND`) and the second operand (`password = ...`) do not exist in the compiled syntax tree.

---

## 9. Implemented Mitigation: Parameterized Queries

The industry-standard mitigation for SQL Injection is the use of **Parameterized Queries** (also known as **Prepared Statements** with bound parameters).

This mitigation was implemented in [`routes/secure-login.js`](file:///c:/Users/prane/OneDrive/Desktop/CS_LAB/routes/secure-login.js).

### Mitigated Source Code (Lines 34–48)
```javascript
router.post('/', (req, res) => {
  const { username = '', password = '' } = req.body;

  // MITIGATION: Parameterized SQL Query with positional placeholders (?)
  const secureQuery = 'SELECT id, username, password, role, full_name, email FROM users WHERE username = ? AND password = ?';

  try {
    const db = getDb();

    // The SQL statement template is pre-compiled ONCE by the database engine
    const stmt = db.prepare(secureQuery);

    // Untrusted values are bound strictly as data in the second phase
    const user = stmt.get(username, password);
    ...
```

### Why Parameterization Works

Parameterized queries fundamentally alter the execution workflow:

```
SECURE EXECUTION FLOW (Parameterized / Prepared Statement):

Phase 1: Query Compilation
[ Static Template: "SELECT * FROM users WHERE username = ? AND password = ?" ]
                     │
                     ▼
             [ SQL Lexer / Parser ]
                     │
                     ▼
        [ Abstract Syntax Tree (AST) ]
                 WHERE
                   │
         ┌─────────┴─────────┐
        AND                  │
   ┌─────┴─────┐       ┌─────┴─────┐
username       ?     password      ?
  (Structure is compiled and locked permanently!)

-------------------------------------------------------------------------
Phase 2: Data Binding & Execution
[ Parameter Values: $1 = "admin' --", $2 = "wrong" ]
                     │
                     ▼
         [ Bound Execution Engine ]
SQLite compares column literal:
users.username == "admin' --"  (Evaluates to FALSE: no user has this literal name)
                     │
                     ▼
       [ 0 Rows Returned -> HTTP 401 ACCESS DENIED ]
```

1. **Pre-compilation and Syntax Locking:** The query template is parsed and compiled into an AST before user input is supplied. The positions of command tokens, table names, and logical operators are fixed.
2. **Strict Data Typing:** Placeholders (`?`) can only accept data literals. Even if the data string contains single quotes (`'`), dashes (`--`), semicolons (`;`), or keywords (`OR`), the SQL engine treats them purely as characters of text. The parser is **never** invoked a second time on parameter data.
3. **Attack Ineffectiveness:** When `admin' --` is supplied to `stmt.get(username, password)`, the database searches for a user whose literal username equals the 9-character string `admin' --`. Because no such account exists, the query safely returns `undefined`, and authentication is denied.

---

## 10. Empirical Before-and-After Comparison

The table below contrasts the behavior of the application across identical inputs before and after applying the parameterized query mitigation:

| Scenario / Test Case | Username Input | Password Input | Vulnerable Endpoint (`/api/login/vulnerable`) | Secure Endpoint (`/api/login/secure`) | Security Evaluation |
|---|---|---|---|---|---|
| **Normal Valid User** | `admin` | `Admin@SecLab2026!` | **HTTP 200 OK**<br>Access Granted | **HTTP 200 OK**<br>Access Granted | Both allow legitimate users |
| **Normal Invalid Pass** | `admin` | `WrongPass!` | **HTTP 401**<br>Access Denied | **HTTP 401**<br>Access Denied | Both reject bad passwords |
| **Exploit: Comment Truncation** | `admin' --` | `any_password` | **HTTP 200 OK**<br>🚨 **EXPLOITED (Bypass Succeeded)** | **HTTP 401**<br>🛡️ **BLOCKED (Attack Neutralized)** | Mitigation successfully prevents bypass |
| **Exploit: Tautology** | `' OR 1=1 --` | `any_password` | **HTTP 200 OK**<br>🚨 **EXPLOITED (Bypass Succeeded)** | **HTTP 401**<br>🛡️ **BLOCKED (Attack Neutralized)** | Mitigation successfully prevents bypass |
| **Exploit: Other User Takeover** | `faculty' --` | `dummy` | **HTTP 200 OK**<br>🚨 **EXPLOITED (Instructor Bypassed)** | **HTTP 401**<br>🛡️ **BLOCKED (Attack Neutralized)** | Targeted injection prevented |
| **Malformed Injection** | `admin'` | `any` | **HTTP 400**<br>⚠️ SQL Syntax Error | **HTTP 401**<br>🛡️ Normal literal search | Secure handles malformed inputs safely |

---

## 11. Theory of Other Mitigation Techniques

Per the assignment requirements (Table 2e), one primary defense was implemented in code (Parameterized Queries), while the remaining three mitigation options discussed in lecture slides are analyzed theoretically below:

### 1. Input Validation Using Allow-Lists (Defense-in-Depth)
- **Concept:** Input validation inspects incoming user data before it reaches application business logic or database queries, verifying that it conforms strictly to expected syntactic rules (type, length, character set, and format).
- **Allow-Listing vs. Deny-Listing:** Deny-listing (blacklisting forbidden characters like `'` or `--`) is notoriously fragile because attackers frequently bypass filters using character encoding variants, hexadecimal encoding, Unicode normalization quirks, or alternative SQL syntax. In contrast, **allow-listing** strictly defines what is permitted (e.g., regex `^[a-zA-Z0-9_.]{3,30}$` for usernames).
- **Limitation:** While allow-listing provides vital defense-in-depth, **it does not replace parameterization**. Many legitimate applications must accept arbitrary text (such as names with apostrophes like *O'Neill*, email addresses, or free-form comments). Parameterization guarantees safety regardless of the input's character set.

### 2. Principle of Least Privilege for Database Accounts
- **Concept:** An application's database service account should only possess the minimum permissions required to perform its authorized duties.
- **Implementation Strategy:**
  - The web application user should never connect as a database superuser (such as `sa`, `postgres`, `root`, or `DBA`).
  - Permissions should be restricted at the table level: the authentication module requires `SELECT` on the `users` table and `UPDATE` on `last_login`, but must **never** possess `DROP TABLE`, `ALTER TABLE`, `CREATE USER`, or `GRANT` privileges.
  - Dangerous administrative stored procedures and functions (e.g., `xp_cmdshell` in MS SQL, file system reading functions like `LOAD_FILE()` in MySQL, or `ATTACH DATABASE` in SQLite) should be strictly disabled or denied.
- **Security Impact:** If a SQL injection vulnerability exists, least privilege limits the **blast radius**, preventing an attacker from wiping the database, writing web shells to disk, or executing arbitrary operating system commands.

### 3. Safe Error Handling and Information Disclosure Prevention
- **Concept:** Database exceptions, internal query strings, table names, and stack traces must never be returned to end users in HTTP responses.
- **Mechanism:** Attackers frequently leverage detailed error messages to map database schemas, determine database engine versions, and confirm character injection boundaries (**Error-Based SQL Injection**).
- **Defense Implementation:** Applications must implement centralized exception handlers that catch database errors, log the technical details securely to an internal, access-controlled monitoring file, and return an opaque, generic status message to the client (e.g., `HTTP 401: Invalid credentials` or `HTTP 500: An unexpected internal error occurred`).

---

## 12. Automated Test Results

To verify the security claims, a comprehensive test suite was written in [`tests/authentication.test.js`](file:///c:/Users/prane/OneDrive/Desktop/CS_LAB/tests/authentication.test.js) and executed against the live application using `node --test`.

### Test Execution Transcript
```text
> sql-injection-auth-bypass-lab@1.0.0 test
> node --test tests/authentication.test.js

[Database] Initialized and seeded 4 fictional demonstration accounts.
[Database] Reset complete: Database restored to initial seed state.
[Test Suite] Running tests against ephemeral server at http://127.0.0.1:51299
▶ SQL Injection Authentication Bypass Lab — Comprehensive Test Suite
  ✔ TEST 1: Vulnerable Endpoint — Legitimate credentials authenticate successfully (167.8435ms)
  ✔ TEST 2: Vulnerable Endpoint — Ordinary invalid credentials are rejected (28.9301ms)
  ✔ TEST 3: Vulnerable Endpoint — SQL injection [admin' --] successfully bypasses authentication (13.4867ms)
  ✔ TEST 4: Vulnerable Endpoint — SQL injection [' OR 1=1 --] tautology bypasses authentication (10.2126ms)
  ✔ TEST 5: Secure Endpoint — Attack payload [admin' --] is strictly rejected (HTTP 401) (9.4879ms)
  ✔ TEST 6: Secure Endpoint — Tautology payload [' OR 1=1 --] is strictly rejected (HTTP 401) (9.727ms)
  ✔ TEST 7: Secure Endpoint — Valid admin credentials succeed (Regression Test) (9.5369ms)
  ✔ TEST 8: Secure Endpoint — Valid non-admin user (alice) succeeds (Regression Test) (8.2586ms)
  ✔ TEST 9: Secure Endpoint — Invalid credentials for known user fail (HTTP 401) (9.3109ms)
[Test Suite] Ephemeral test server closed.
  ✔ TEST 10: Robustness — Malformed SQL injection (unclosed quote) is handled safely (15.681ms)
✔ SQL Injection Authentication Bypass Lab — Comprehensive Test Suite (471.7796ms)
ℹ tests 10
ℹ suites 1
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1724.4313
```

### Test Verification Summary
- **Vulnerability Verified:** Tests 3 and 4 definitively prove that `admin' --` and `' OR 1=1 --` bypass authentication in the vulnerable implementation, returning HTTP 200 and setting `bypassed: true`.
- **Mitigation Verified:** Tests 5 and 6 prove that the same attack payloads against the secure endpoint return HTTP 401 with zero records returned.
- **Regression Freedom Verified:** Tests 7 and 8 demonstrate that legitimate users (`admin` and `alice`) authenticate normally on the secure endpoint with HTTP 200.
- **Robustness Verified:** Test 10 confirms that malformed syntax is caught cleanly without terminating the application process.

---

## 13. Conclusion

This laboratory successfully demonstrates the full lifecycle of **SQL Injection Variant 1: Authentication Bypass**:
1. **Exploitation:** Direct concatenation of user input into SQL statements breaks the boundary between instructions and data. By injecting `' --`, an attacker comments out the password verification logic, gaining unauthorized access to administrative accounts.
2. **Mitigation:** Refactoring the query to use **parameterized queries with prepared statements** ensures that database statements are compiled prior to parameter binding. User input is strictly treated as literal column data, rendering injection impossible.
3. **Defense-in-Depth:** Combining parameterized queries with allow-list input validation, least-privilege database user permissions, and safe error handling establishes a resilient web server architecture aligned with industry security standards.
