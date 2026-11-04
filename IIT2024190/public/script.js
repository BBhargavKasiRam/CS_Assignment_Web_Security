const hostInput = document.getElementById('host');
const runBtn = document.getElementById('runBtn');
const cmdBox = document.getElementById('cmd');
const outBox = document.getElementById('output');

async function runPing() {
  outBox.textContent = 'Running...';
  try {
    const response = await fetch('/api/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: hostInput.value })
    });
    const data = await response.json();
    cmdBox.textContent = data.command;     // textContent: no HTML injection (keeps demo to ONE vuln)
    outBox.textContent = data.output || '(no output)';
  } catch (err) {
    outBox.textContent = 'Request failed: ' + err.message;
  }
}

runBtn.addEventListener('click', runPing);
hostInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runPing(); });
