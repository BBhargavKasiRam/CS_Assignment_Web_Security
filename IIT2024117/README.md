# Blind OS Command Injection — Variant 2

## Cyber Security (IT-30001)

**Institution:** Indian Institute of Information Technology Allahabad

**Assignment:** Web Server Security — Exploitation and Mitigation

**Category:** OS Command Injection

**Variant:** Variant 2 — Blind (Time-Based)

## Objective

To demonstrate how unsafe operating-system command execution allows blind command injection, and how strict input validation can prevent the attack.

## Technologies

- Python
- Flask
- HTML, CSS and JavaScript
- Windows CMD and PowerShell

## Vulnerability

The vulnerable Flask endpoint constructs an operating-system command using untrusted user input and executes it using Python's `subprocess.run()` with `shell=True`.

This permits command separators in user input to introduce additional commands.

## Exploit

The demonstration uses a benign five-second delay:

```text
127.0.0.1 & powershell -NoProfile -Command "Start-Sleep -Seconds 5"
```

Because the application suppresses command output, the injected command is detected by observing the increased execution time.

## Root Cause

The vulnerability occurs because untrusted input is incorporated directly into an operating-system shell command.

Using `shell=True` allows shell metacharacters supplied by the user to be interpreted as command syntax instead of ordinary data.

## Implemented Mitigation

The implemented primary mitigation is strict allow-list validation.

Only `127.0.0.1` is accepted by the secure endpoint. All other input, including the attack payload, is rejected.

The secure implementation additionally uses shell-free execution with an argument vector.

## Other Mitigations

**Avoid the shell:** Execute supported operations directly instead of constructing shell commands.

**Argument-vector execution:** Use an explicit executable and separate arguments with `shell=False`, so user input is not interpreted as shell syntax.

**Allow-list validation:** Accept only inputs that match explicitly permitted values or formats.

**Least privilege:** Run the server with minimal operating-system permissions to reduce the potential damage caused by a successful exploit. Least privilege does not itself eliminate injection.

## Running the Project

1. Create and activate a Python virtual environment.
2. Install dependencies using `python -m pip install -r requirements.txt`.
3. Run `python app.py`.
4. Open `http://127.0.0.1:5000`.
5. Test normal and injected inputs in Vulnerable Mode.
6. Test the same inputs in Secure Mode.
7. Run `python test_app.py` for automated verification.

## Conclusion

The experiment demonstrates how blind OS command injection can be identified through execution-time differences even when command output is hidden. Strict input validation blocks the demonstrated payload, while shell-free execution offers an additional layer of protection.