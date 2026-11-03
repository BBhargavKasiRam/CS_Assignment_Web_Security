/**
 * script.js
 * 
 * Frontend interactive logic for SQL Injection Authentication Bypass Lab.
 * IIIT Allahabad | Cyber Security (IT-30001) | Autumn 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  initFormHandlers();
  initPillButtons();
  initTabs();
  initResetButton();
});

/**
 * Handle form submissions for both vulnerable and secure endpoints.
 */
function initFormHandlers() {
  const vulnForm = document.getElementById('vulnerable-form');
  const secForm = document.getElementById('secure-form');

  vulnForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('vuln-username').value;
    const password = document.getElementById('vuln-password').value;
    await submitVulnerableLogin(username, password);
  });

  secForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('sec-username').value;
    const password = document.getElementById('sec-password').value;
    await submitSecureLogin(username, password);
  });
}

/**
 * Submit credentials to the vulnerable login endpoint.
 */
async function submitVulnerableLogin(username, password) {
  const submitBtn = document.getElementById('vuln-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Executing Query...';

  try {
    const res = await fetch('/api/login/vulnerable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    renderVulnerableResult(res.status, data);
  } catch (err) {
    renderVulnerableResult(500, {
      success: false,
      message: `Network or Server Connection Error: ${err.message}`,
      executedQuery: '--'
    });
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Test Vulnerable Login
    `;
  }
}

/**
 * Render the response from the vulnerable endpoint.
 */
function renderVulnerableResult(statusCode, data) {
  const box = document.getElementById('vuln-result-box');
  const badge = document.getElementById('vuln-status-badge');
  const codeSpan = document.getElementById('vuln-status-code');
  const msgEl = document.getElementById('vuln-result-message');
  const accCard = document.getElementById('vuln-account-card');
  const sqlCode = document.getElementById('vuln-sql-code');

  box.style.display = 'flex';
  codeSpan.textContent = `HTTP ${statusCode}`;
  sqlCode.textContent = data.executedQuery || '(No query captured)';

  if (statusCode === 200 && data.bypassed) {
    // CRITICAL: Exploitation Successful
    box.style.borderColor = 'var(--vuln-red)';
    badge.className = 'result-status-badge';
    badge.style.background = 'var(--vuln-red)';
    badge.style.color = '#ffffff';
    badge.textContent = '🚨 EXPLOITED — AUTHENTICATION BYPASSED';

    msgEl.innerHTML = `
      <span style="color: #f87171; font-weight: 700;">${data.message}</span>
      <p style="margin-top: 6px; font-size: 0.82rem; color: #cbd5e1;">
        The SQL injection payload neutralized the password verification clause. You were granted access without providing the correct password!
      </p>
    `;

    populateAccountCard('vuln', data.user);
    accCard.style.display = 'flex';

  } else if (statusCode === 200 && !data.bypassed) {
    // Legitimate login on vulnerable endpoint
    box.style.borderColor = 'var(--accent-blue)';
    badge.className = 'result-status-badge';
    badge.style.background = 'var(--accent-blue)';
    badge.style.color = '#ffffff';
    badge.textContent = '✅ LEGITIMATE LOGIN SUCCESSFUL';

    msgEl.innerHTML = `<span style="color: #93c5fd;">${data.message}</span>`;
    populateAccountCard('vuln', data.user);
    accCard.style.display = 'flex';

  } else if (statusCode === 400) {
    // Malformed SQL error
    box.style.borderColor = 'var(--accent-amber)';
    badge.className = 'result-status-badge';
    badge.style.background = 'var(--accent-amber)';
    badge.style.color = '#000000';
    badge.textContent = '⚠️ SQL SYNTAX ERROR';

    msgEl.innerHTML = `<span style="color: #fbbf24;">${data.message}</span>`;
    accCard.style.display = 'none';

  } else {
    // 401 or other failure
    box.style.borderColor = 'var(--border-color)';
    badge.className = 'result-status-badge';
    badge.style.background = 'rgba(148, 163, 184, 0.2)';
    badge.style.color = 'var(--text-muted)';
    badge.textContent = '❌ ACCESS DENIED';

    msgEl.innerHTML = `<span style="color: var(--text-muted);">${data.message || 'Authentication failed.'}</span>`;
    accCard.style.display = 'none';
  }
}

/**
 * Submit credentials to the secure login endpoint.
 */
async function submitSecureLogin(username, password) {
  const submitBtn = document.getElementById('sec-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Evaluating Parameters...';

  try {
    const res = await fetch('/api/login/secure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    renderSecureResult(res.status, data, username);
  } catch (err) {
    renderSecureResult(500, {
      success: false,
      message: `Network or Server Connection Error: ${err.message}`
    }, username);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Test Secure Login
    `;
  }
}

/**
 * Render the response from the secure endpoint.
 */
function renderSecureResult(statusCode, data, rawUsername) {
  const box = document.getElementById('sec-result-box');
  const badge = document.getElementById('sec-status-badge');
  const codeSpan = document.getElementById('sec-status-code');
  const msgEl = document.getElementById('sec-result-message');
  const accCard = document.getElementById('sec-account-card');
  const sqlCode = document.getElementById('sec-sql-code');

  box.style.display = 'flex';
  codeSpan.textContent = `HTTP ${statusCode}`;

  const queryInfo = [
    `SQL Statement Template:`,
    data.queryTemplate || 'SELECT id, username, password, role, full_name, email FROM users WHERE username = ? AND password = ?',
    '',
    `Bound Parameters:`,
    `$1 (username) = "${rawUsername}"`,
    `$2 (password) = "••••••••"`
  ].join('\n');
  sqlCode.textContent = queryInfo;

  const isAttackPayload = rawUsername.includes("'") || rawUsername.includes("--") || rawUsername.toLowerCase().includes("or");

  if (statusCode === 200) {
    // Legitimate login success
    box.style.borderColor = 'var(--secure-green)';
    badge.className = 'result-status-badge';
    badge.style.background = 'var(--secure-green)';
    badge.style.color = '#ffffff';
    badge.textContent = '✅ SECURE LOGIN SUCCESSFUL';

    msgEl.innerHTML = `<span style="color: #6ee7b7; font-weight: 600;">${data.message}</span>`;
    populateAccountCard('sec', data.user);
    accCard.style.display = 'flex';

  } else if (statusCode === 401 && isAttackPayload) {
    // Attack Attempt Blocked by Parameterized Defense
    box.style.borderColor = 'var(--secure-green)';
    badge.className = 'result-status-badge';
    badge.style.background = 'rgba(16, 185, 129, 0.2)';
    badge.style.color = '#34d399';
    badge.style.border = '1px solid rgba(16, 185, 129, 0.5)';
    badge.textContent = '🛡️ INJECTION DEFENDED — ATTACK BLOCKED';

    msgEl.innerHTML = `
      <span style="color: #34d399; font-weight: 700;">Attack Neutralized! Authentication Denied (HTTP 401).</span>
      <p style="margin-top: 6px; font-size: 0.82rem; color: #cbd5e1;">
        The parameterized query treated <code>${escapeHtml(rawUsername)}</code> strictly as literal string data.
        The database checked for an exact match against <code>username</code> rather than executing the metacharacters as SQL logic.
      </p>
    `;
    accCard.style.display = 'none';

  } else {
    // Normal invalid credentials
    box.style.borderColor = 'var(--border-color)';
    badge.className = 'result-status-badge';
    badge.style.background = 'rgba(148, 163, 184, 0.2)';
    badge.style.color = 'var(--text-muted)';
    badge.style.border = 'none';
    badge.textContent = '❌ ACCESS DENIED';

    msgEl.innerHTML = `<span style="color: var(--text-muted);">${data.message || 'Invalid credentials.'}</span>`;
    accCard.style.display = 'none';
  }
}

/**
 * Populate user profile details inside the account result card.
 */
function populateAccountCard(prefix, user) {
  if (!user) return;
  document.getElementById(`${prefix}-avatar`).textContent = (user.username || 'U')[0].toUpperCase();
  document.getElementById(`${prefix}-user-fullname`).textContent = user.full_name || 'N/A';
  document.getElementById(`${prefix}-user-role`).textContent = user.role || 'User';
  document.getElementById(`${prefix}-user-username`).textContent = user.username || 'N/A';
  document.getElementById(`${prefix}-user-email`).textContent = user.email || 'N/A';
  document.getElementById(`${prefix}-user-id`).textContent = user.id || 'N/A';
}

/**
 * Initialize test pill buttons for one-click payload testing.
 */
function initPillButtons() {
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const u = pill.getAttribute('data-user');
      const p = pill.getAttribute('data-pass');
      fillForm(u, p);
    });
  });
}

/**
 * Fill both vulnerable and secure forms with specified credentials.
 */
function fillForm(username, password) {
  document.getElementById('vuln-username').value = username;
  document.getElementById('vuln-password').value = password;

  document.getElementById('sec-username').value = username;
  document.getElementById('sec-password').value = password;
}

/**
 * Clear the vulnerable login form and hide results.
 */
function clearVulnForm() {
  document.getElementById('vuln-username').value = '';
  document.getElementById('vuln-password').value = '';
  document.getElementById('vuln-result-box').style.display = 'none';
}

/**
 * Clear the secure login form and hide results.
 */
function clearSecForm() {
  document.getElementById('sec-username').value = '';
  document.getElementById('sec-password').value = '';
  document.getElementById('sec-result-box').style.display = 'none';
}

/**
 * Initialize interactive tabs in educational panel.
 */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      const targetContent = document.getElementById(target);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

/**
 * Initialize Reset Database button.
 */
function initResetButton() {
  const resetBtn = document.getElementById('btn-reset-db');
  resetBtn.addEventListener('click', async () => {
    if (!confirm('Reset local SQLite database to initial seed accounts?')) return;

    resetBtn.disabled = true;
    resetBtn.innerText = 'Resetting DB...';

    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Database reset successfully.');
      clearVulnForm();
      clearSecForm();
    } catch (err) {
      alert(`Error resetting database: ${err.message}`);
    } finally {
      resetBtn.disabled = false;
      resetBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Reset Demo Database
      `;
    }
  });
}

/**
 * Utility to escape HTML strings.
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
