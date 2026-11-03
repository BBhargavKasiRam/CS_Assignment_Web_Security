
import platform
import subprocess
import time
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cross-platform ping parameter: -n on Windows, -c on Unix/Linux/macOS
PING_PARAM = "-n" if platform.system().lower() == "windows" else "-c"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/vulnerable", methods=["POST"])
def vulnerable():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "")

    if not isinstance(target, str):
        return jsonify({"error": "Invalid input"}), 400

    # VULNERABILITY: User input is concatenated directly into a shell command.
    command = f"ping {PING_PARAM} 1 {target}"

    start = time.perf_counter()

    try:
        # Variant 2 (Blind): stdout and stderr are suppressed (DEVNULL) so no command
        # output is returned to the user. Execution can only be confirmed via time delay.
        subprocess.run(
            command,
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=12
        )
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Command timed out"}), 408
    except Exception as e:
        return jsonify({"error": f"Execution failed: {str(e)}"}), 500

    elapsed = time.perf_counter() - start

    return jsonify({
        "mode": "Vulnerable",
        "status": "Command completed",
        "time": round(elapsed, 2)
    })


@app.route("/api/secure", methods=["POST"])
def secure():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "")

    # MITIGATION 1: Strict allow-list validation
    if target != "127.0.0.1":
        return jsonify({
            "mode": "Secure",
            "status": "Blocked",
            "error": "Only 127.0.0.1 is allowed"
        }), 400

    start = time.perf_counter()

    try:
        # MITIGATION 2 & 3: Shell avoided (shell=False) and parameterized argument vector used
        result = subprocess.run(
            ["ping", PING_PARAM, "1", target],
            shell=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=5
        )
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Command timed out"}), 408
    except Exception as e:
        return jsonify({"error": f"Execution failed: {str(e)}"}), 500

    elapsed = time.perf_counter() - start

    return jsonify({
        "mode": "Secure",
        "status": "Diagnostic completed",
        "time": round(elapsed, 2),
        "exit_code": result.returncode
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
