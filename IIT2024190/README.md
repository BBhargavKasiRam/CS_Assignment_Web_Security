# Web Server Security – OS Command Injection (Variant 1: In-band)

**Course:** Cyber Security (IT-30001), IIIT Allahabad | **Instructor:** Dr. Soumyadev Maity
**Category:** OS Command Injection | **Variant:** 1 – In-band (command output returned)

## Ownership declaration (Table 3)

| Member name | Roll number | Category | Variant implemented |
|---|---|---|---|
| Yasaswi | IIT2024190 | OS command injection | Variant 1 – In-band |

## Demonstration video

[Watch the demonstration video on Google Drive](https://drive.google.com/drive/folders/1KdUkPAJ7x-2on3mFm3r3s00vRbZ2xEMQ?usp=drive_link)

## 1. Introduction

A small "Network Diagnostic Utility" (Node.js + Express + HTML/CSS/JS). The user types a host and the server pings it with `ping -c 2` and shows the output on the page. Two versions are provided:

| File | Purpose |
|---|---|
| `server.vulnerable.js` | Intentionally vulnerable (uses `exec` + string concatenation) |
| `server.secure.js` | Mitigated (uses `execFile` + argument vector) |

Both serve the same frontend in `public/`. Both bind to `127.0.0.1` only, so the vulnerable app is never exposed to the network.

## 2. Vulnerability description

**OS command injection** happens when an application builds an operating-system command from user input and the input can change the command's meaning. **In-band** means the output of the injected command comes back to the attacker in the same HTTP response (here, shown on the webpage).

## 3. Vulnerable implementation (`server.vulnerable.js`)

```js
const command = 'ping -c 2 ' + host;   // user input concatenated into command
exec(command, (error, stdout, stderr) => {
  res.json({ command: command, output: stdout + stderr });   // output returned = in-band
});
```

## 4. Exact demonstration payload

```
127.0.0.1; whoami
```
(Also harmless: `127.0.0.1; id` and `127.0.0.1; pwd`.)

## 5. Root cause

User input is concatenated into a command string that `exec()` passes to `/bin/sh -c`. The shell treats `;` as a command separator, so the input is executed as code instead of being treated as data.

The shell receives `ping -c 2 127.0.0.1; whoami` and runs two commands: `ping -c 2 127.0.0.1`, then `whoami`. Both outputs go to stdout, and the server returns that stdout to the browser.

## 6. Mitigation implemented – parameterised execution with an argument vector

```js
const args = ['-c', '2', '--', host];
execFile('ping', args, (error, stdout, stderr) => { ... });
```

What changed:
- `exec` → `execFile`: no shell is started.
- The string is replaced by a program name plus an array of arguments. `host` is always exactly one argument.
- `--` marks the end of options, so input such as `-f` cannot be read as a ping option.

`;`, `&&`, `|` and `$()` have no special meaning because no shell exists to interpret them.

## 7. Before / after testing results

These results were produced by running the actual apps and sending requests with `curl` (the same request the webpage makes). Replace/add your own screenshots from your Ubuntu machine in `screenshots/`. The user shown by `whoami` will be your own Linux username.

| Test | Input | BEFORE (vulnerable) | AFTER (secure) |
|---|---|---|---|
| Normal | `127.0.0.1` | Ping output, 2 packets received | Ping output, 2 packets received |
| Payload | `127.0.0.1; whoami` | Ping output **plus the username** (`root` in the test sandbox) | `ping: 127.0.0.1; whoami: Name or service not known` – `whoami` did not run |
| Payload | `127.0.0.1; id; pwd` | Ping output plus `uid=0(root) ...` and `/home/.../web-server-security` | `ping: 127.0.0.1; id; pwd: Name or service not known` – neither ran |
| Option attempt | `-f` | not tested | `ping: -f: Name or service not known` – treated as a hostname |

The secure page displays the command as `execFile("ping", ["-c","2","--","127.0.0.1; whoami"])`, which shows that the whole payload is one argument.

## 8. Install and run (Ubuntu)

```bash
sudo apt update
sudo apt install -y nodejs npm iputils-ping    # skip what you already have
cd web-server-security
npm install

# BEFORE: vulnerable
npm run start:vulnerable      # open http://localhost:3000
# stop with Ctrl+C, then AFTER: secure
npm run start:secure          # open http://localhost:3000
```
Test only on your own machine. Use only harmless commands (`whoami`, `id`, `pwd`).

## 9. Other mitigations (theory)

**Avoid the shell.** The best fix is not to call an OS command at all: use a library or built-in API (for example a Node ICMP/DNS library or `dns.lookup`). Without a shell there is nothing to interpret metacharacters.

**Parameterised execution with an argument vector (implemented).** The program and its arguments are passed separately (`execFile`, `spawn` without `shell: true`). The OS receives the arguments as an array, so user input stays data and cannot become a new command. It is the command-line equivalent of SQL prepared statements.

**Allow-list validation.** Accept only input matching a strict known-good pattern, for example a valid IPv4 address or hostname (`/^[a-zA-Z0-9.-]{1,253}$/`), and reject everything else. It works because `; | & $ ( )` and spaces can never match. Validate on the server, use allow-lists rather than block-lists, and use it together with another fix as defence in depth.

**Least privilege.** Run the application as a low-privileged user, with minimal file permissions, and ideally in a container or sandbox. This does not stop injection, but it limits the damage if injection happens (for example the attacker cannot read secrets or modify system files).
