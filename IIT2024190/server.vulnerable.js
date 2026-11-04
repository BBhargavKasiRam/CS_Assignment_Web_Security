// ============================================================
// VULNERABLE VERSION - for educational use on localhost ONLY
// OS Command Injection, Variant 1 (In-band)
// ============================================================
const express = require('express');
const { exec } = require('child_process'); // exec() runs commands INSIDE A SHELL
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());                                   // lets us read JSON bodies
app.use(express.static(path.join(__dirname, 'public')));   // serves the frontend

app.post('/api/ping', (req, res) => {
  const host = req.body.host || '';

  // ---------- VULNERABLE CODE (start) ----------
  // User input is concatenated straight into a command string.
  const command = 'ping -c 2 ' + host;

  // exec() hands the whole string to /bin/sh -c "<string>".
  // The shell understands ; && || | $() and runs everything it finds.
  exec(command, (error, stdout, stderr) => {
    // In-band: whatever the command printed is sent back in the response.
    res.json({ command: command, output: stdout + stderr });
  });
  // ---------- VULNERABLE CODE (end) ----------
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('[VULNERABLE] running at http://localhost:' + PORT);
});
