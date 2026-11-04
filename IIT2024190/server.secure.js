// ============================================================
// SECURE VERSION
// Mitigation: parameterised execution with an argument vector (execFile)
// ============================================================
const express = require('express');
const { execFile } = require('child_process'); // execFile() does NOT start a shell
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ping', (req, res) => {
  const host = String(req.body.host || '');

  // ---------- SECURE CODE (start) ----------
  // Program name and arguments are kept SEPARATE (an argument vector).
  // 'host' is passed as ONE argument. No shell parses it, so ; && | $() are plain text.
  // ('--' tells ping that everything after it is a hostname, never an option.)
  const args = ['-c', '2', '--', host];

  execFile('ping', args, (error, stdout, stderr) => {
    res.json({ command: 'execFile("ping", ' + JSON.stringify(args) + ')', output: stdout + stderr });
  });
  // ---------- SECURE CODE (end) ----------
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('[SECURE] running at http://localhost:' + PORT);
});
