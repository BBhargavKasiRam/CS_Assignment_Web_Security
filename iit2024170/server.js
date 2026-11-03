const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'iiita-cybersec-csrf-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // SameSite intentionally set to 'none' so the attacker page demo works
      // In production you would set this to 'Strict' or 'Lax'
      sameSite: 'lax',
      secure: false, // localhost is not HTTPS
    },
  })
);

// Simulated user database (in-memory)
const users = {
  navdeep: {
    username: 'navdeep',
    fullName: 'Navdeep',
    roll: 'IIT2024170',
    email: 'navdeep@iiita.ac.in',
    password: 'password123',
  },
};

// ── Helper: generate CSRF token ────────────────────────────────────────────────
function generateCsrfToken(req) {
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  return token;
}

// ── Helper: validate CSRF token ────────────────────────────────────────────────
function validateCsrfToken(req) {
  const submittedToken = req.body._csrf || req.headers['x-csrf-token'];
  return (
    req.session.csrfToken &&
    submittedToken &&
    crypto.timingSafeEqual(
      Buffer.from(req.session.csrfToken),
      Buffer.from(submittedToken)
    )
  );
}

// ── Helper: auth guard ─────────────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}

// ════════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// ── Home / Login page ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/profile');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// ── POST /login ────────────────────────────────────────────────────────────────
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    req.session.user = { ...user };
    delete req.session.user.password;
    // Store separate emails so the two demos don't interfere
    req.session.vulnerableEmail = user.email;
    req.session.secureEmail = user.email;
    return res.redirect('/profile');
  }
  res.status(401).send(`
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>Login Failed</title>
    <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#f87171;}
    .box{text-align:center;background:#1e293b;padding:3rem;border-radius:1rem;border:1px solid #334155;}
    a{color:#38bdf8;text-decoration:none;}</style></head>
    <body><div class="box"><h2>❌ Login Failed</h2><p>Invalid username or password.</p><br><a href="/">← Try Again</a></div></body></html>
  `);
});

// ── GET /profile (VULNERABLE — no CSRF token) ─────────────────────────────────
app.get('/profile', requireLogin, (req, res) => {
  const u = { ...req.session.user, email: req.session.vulnerableEmail };
  res.send(renderProfile(u, false));
});

// ── POST /update-email (VULNERABLE — no CSRF check) ───────────────────────────
app.post('/update-email', requireLogin, (req, res) => {
  const { email } = req.body;
  req.session.vulnerableEmail = email;
  res.redirect('/profile?updated=1');
});

// ── GET /profile-secure (MITIGATED — with CSRF token) ──────────────────────────
app.get('/profile-secure', requireLogin, (req, res) => {
  const u = { ...req.session.user, email: req.session.secureEmail };
  const token = generateCsrfToken(req);
  res.send(renderProfile(u, true, token));
});

// ── POST /update-email-secure (MITIGATED — validates CSRF token) ───────────────
app.post('/update-email-secure', requireLogin, (req, res) => {
  try {
    if (!validateCsrfToken(req)) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>CSRF Blocked</title>
        <style>
          body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#fbbf24;}
          .box{text-align:center;background:#1e293b;padding:3rem 4rem;border-radius:1rem;border:2px solid #dc2626;max-width:600px;}
          h1{color:#ef4444;font-size:2.5rem;margin-bottom:.5rem;}
          .shield{font-size:5rem;margin-bottom:1rem;}
          p{color:#94a3b8;line-height:1.7;font-size:1.05rem;}
          code{background:#334155;padding:.15rem .4rem;border-radius:.25rem;color:#f87171;font-size:.95rem;}
          a{color:#38bdf8;text-decoration:none;font-weight:600;}
          a:hover{text-decoration:underline;}
          .tag{display:inline-block;background:#7f1d1d;color:#fca5a5;padding:.25rem .75rem;border-radius:9999px;font-size:.85rem;margin-top:.5rem;}
        </style></head>
        <body><div class="box">
          <div class="shield">🛡️</div>
          <h1>403 Forbidden</h1>
          <span class="tag">CSRF Attack Blocked</span>
          <p style="margin-top:1.5rem;">The server <strong>rejected</strong> this request because the <code>_csrf</code> token was <strong>missing or invalid</strong>.</p>
          <p>The Anti-CSRF Synchronizer Token pattern successfully prevented the forged request from modifying your data.</p>
          <br>
          <a href="/profile-secure">← Back to Secure Profile</a>
        </div></body></html>
      `);
    }
  } catch {
    return res.status(403).send('CSRF token validation failed (length mismatch).');
  }

  const { email } = req.body;
  req.session.secureEmail = email;
  // Regenerate token after successful use
  generateCsrfToken(req);
  res.redirect('/profile-secure?updated=1');
});

// ── GET /attacker-page (simulated malicious external site) ─────────────────────
app.get('/attacker-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'attacker.html'));
});

// ── GET /attacker-page-secure (attacks the MITIGATED route) ────────────────────
app.get('/attacker-page-secure', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'attacker-secure.html'));
});

// ── GET /logout ────────────────────────────────────────────────────────────────
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ════════════════════════════════════════════════════════════════════════════════
//  PROFILE RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function renderProfile(user, isSecure, csrfToken) {
  const action = isSecure ? '/update-email-secure' : '/update-email';
  const label = isSecure ? 'Secure' : 'Vulnerable';
  const badgeColor = isSecure ? '#10b981' : '#ef4444';
  const attackerLink = isSecure ? '/attacker-page-secure' : '/attacker-page';
  const otherLink = isSecure ? '/profile' : '/profile-secure';
  const otherLabel = isSecure ? '🔓 Switch to Vulnerable Version' : '🛡️ Switch to Secure Version';
  const updated = ''; // handled via query param in JS

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile — ${label} | CSRF Demo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
    }

    /* Navbar */
    nav {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    nav .brand {
      font-size: 1.3rem;
      font-weight: 700;
      color: #38bdf8;
    }
    nav .brand span { color: #94a3b8; font-weight: 400; font-size: .9rem; }
    nav .nav-links { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
    nav a, nav button {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
      padding: .45rem 1rem;
      border-radius: .5rem;
      text-decoration: none;
      font-size: .875rem;
      cursor: pointer;
      transition: all .2s;
    }
    nav a:hover, nav button:hover { background: #475569; }
    nav .logout { background: #7f1d1d; border-color: #991b1b; color: #fca5a5; }
    nav .logout:hover { background: #991b1b; }

    /* Main */
    .container {
      max-width: 720px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .35rem 1rem;
      border-radius: 9999px;
      font-size: .8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      background: ${isSecure ? '#064e3b' : '#7f1d1d'};
      color: ${isSecure ? '#6ee7b7' : '#fca5a5'};
      border: 1px solid ${badgeColor};
    }

    /* Card */
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 1.5rem;
    }
    .card h2 {
      font-size: 1.35rem;
      margin-bottom: 1.25rem;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: .5rem;
    }

    /* Profile info */
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: .6rem 1rem;
      margin-bottom: 1.5rem;
    }
    .info-grid dt { color: #94a3b8; font-weight: 500; }
    .info-grid dd { color: #e2e8f0; font-weight: 600; }
    .email-val { color: #fbbf24 !important; }

    /* Form */
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: .35rem; color: #94a3b8; font-size: .9rem; }
    input[type="email"], input[type="text"] {
      width: 100%;
      padding: .65rem 1rem;
      background: #0f172a;
      border: 1px solid #475569;
      border-radius: .5rem;
      color: #e2e8f0;
      font-size: 1rem;
      outline: none;
      transition: border-color .2s;
    }
    input:focus { border-color: #38bdf8; }
    .btn {
      padding: .65rem 1.5rem;
      border: none;
      border-radius: .5rem;
      font-size: .95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s;
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }

    /* Alert */
    .alert {
      padding: .75rem 1rem;
      border-radius: .5rem;
      margin-bottom: 1rem;
      font-size: .9rem;
      display: none;
    }
    .alert-success { background: #064e3b; color: #6ee7b7; border: 1px solid #10b981; display: block; }
    .alert-info { background: #1e3a5f; color: #7dd3fc; border: 1px solid #0284c7; display: block; }

    /* How it works */
    .how-it-works { background: #0f172a; padding: 1.25rem; border-radius: .75rem; margin-top: 1rem; }
    .how-it-works h3 { color: #fbbf24; margin-bottom: .5rem; font-size: 1rem; }
    .how-it-works ol { padding-left: 1.25rem; color: #94a3b8; line-height: 1.8; font-size: .9rem; }
    .how-it-works code { background: #334155; padding: .1rem .35rem; border-radius: .25rem; color: #f87171; font-size: .85rem; }

    /* Footer */
    footer {
      text-align: center;
      padding: 2rem;
      color: #475569;
      font-size: .8rem;
    }
    footer a { color: #38bdf8; text-decoration: none; }

    @media (max-width: 600px) {
      .info-grid { grid-template-columns: 1fr; }
      nav { padding: .75rem 1rem; }
    }
  </style>
</head>
<body>
  <nav>
    <div class="brand">🔐 CSRF Demo <span>| IIIT Allahabad</span></div>
    <div class="nav-links">
      <a href="${otherLink}">${otherLabel}</a>
      <a href="${attackerLink}" style="background:#7f1d1d;border-color:#991b1b;color:#fca5a5;">⚔️ Attacker Page</a>
      <a href="/logout" class="logout">Logout</a>
    </div>
  </nav>

  <div class="container">
    <div class="badge">${isSecure ? '🛡️ CSRF Protection: ON (Synchronizer Token)' : '⚠️ CSRF Protection: OFF (Vulnerable)'}</div>

    <div id="update-alert" class="alert" style="display:none;"></div>

    <!-- Profile Card -->
    <div class="card">
      <h2>👤 User Profile</h2>
      <dl class="info-grid">
        <dt>Name</dt>       <dd>${user.fullName}</dd>
        <dt>Roll Number</dt> <dd>${user.roll}</dd>
        <dt>Username</dt>    <dd>${user.username}</dd>
        <dt>Email</dt>       <dd class="email-val" id="current-email">${user.email}</dd>
      </dl>
    </div>

    <!-- Update Email Card -->
    <div class="card">
      <h2>✏️ Update Email</h2>
      <form action="${action}" method="POST">
        ${csrfToken ? `<input type="hidden" name="_csrf" value="${csrfToken}">` : '<!-- ⚠️ NO CSRF TOKEN — VULNERABLE -->'}
        <div class="form-group">
          <label for="email">New Email Address</label>
          <input type="email" id="email" name="email" value="${user.email}" required>
        </div>
        <button type="submit" class="btn btn-primary">Update Email</button>
      </form>

      <div class="how-it-works">
        <h3>📖 How This ${isSecure ? 'Protection' : 'Vulnerability'} Works</h3>
        ${isSecure
          ? `<ol>
              <li>Server generates a <code>crypto.randomBytes(32)</code> token stored in the session.</li>
              <li>Token is embedded as a hidden <code>&lt;input name="_csrf"&gt;</code> in the form.</li>
              <li>On POST, the server compares the submitted token with the session token using <code>crypto.timingSafeEqual()</code>.</li>
              <li>An attacker <strong>cannot</strong> read the token (same-origin policy), so forged requests are <strong>rejected with 403</strong>.</li>
            </ol>`
          : `<ol>
              <li>The form POSTs to <code>/update-email</code> with only the <code>email</code> field.</li>
              <li>The server trusts the session cookie alone — <strong>no CSRF token is checked</strong>.</li>
              <li>An attacker page can craft a hidden form pointing to this endpoint.</li>
              <li>If the victim visits the attacker page while logged in, the browser <strong>auto-attaches the session cookie</strong>, and the email is silently changed.</li>
            </ol>`
        }
      </div>
    </div>

    <!-- Session Info -->
    <div class="card" style="border-color: #475569;">
      <h2>🍪 Session Info</h2>
      <dl class="info-grid">
        <dt>Logged in as</dt>  <dd>${user.username}</dd>
        <dt>Session Cookie</dt><dd style="color:#94a3b8;font-size:.8rem;word-break:break-all;">connect.sid (HttpOnly, auto-sent by browser)</dd>
        ${isSecure ? `<dt>CSRF Token</dt><dd style="color:#10b981;font-size:.75rem;word-break:break-all;">${csrfToken}</dd>` : `<dt>CSRF Token</dt><dd style="color:#ef4444;">None — vulnerable!</dd>`}
      </dl>
    </div>
  </div>

  <footer>
    CSRF Demo — Cybersecurity Assignment | <a href="https://iiita.ac.in">IIIT Allahabad</a> | Navdeep (IIT2024170)
  </footer>

  <script>
    // Show success alert if redirected after update
    const params = new URLSearchParams(window.location.search);
    if (params.get('updated') === '1') {
      const alert = document.getElementById('update-alert');
      alert.className = 'alert alert-success';
      alert.style.display = 'block';
      alert.innerHTML = '✅ Email updated successfully to <strong>' + document.getElementById('current-email').textContent + '</strong>';
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  </script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════════╗');
  console.log('  ║           🔐 CSRF DEMO — IIIT Allahabad                    ║');
  console.log('  ║           Cybersecurity Assignment                          ║');
  console.log('  ╠══════════════════════════════════════════════════════════════╣');
  console.log('  ║                                                             ║');
  console.log('  ║  🌐 App running at:  http://localhost:' + PORT + '                 ║');
  console.log('  ║                                                             ║');
  console.log('  ║  📄 Pages:                                                  ║');
  console.log('  ║     • Login:          http://localhost:' + PORT + '/               ║');
  console.log('  ║     • Profile:        http://localhost:' + PORT + '/profile        ║');
  console.log('  ║     • Profile Secure: http://localhost:' + PORT + '/profile-secure ║');
  console.log('  ║     • Attacker Page:  http://localhost:' + PORT + '/attacker-page  ║');
  console.log('  ║                                                             ║');
  console.log('  ║  🔑 Credentials:  navdeep / password123                     ║');
  console.log('  ║                                                             ║');
  console.log('  ╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});
