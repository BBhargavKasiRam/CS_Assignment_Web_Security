
import json
import platform
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE_URL = "http://127.0.0.1:5000"

NORMAL = "127.0.0.1"
if platform.system().lower() == "windows":
    ATTACK = (
        '127.0.0.1 & powershell -NoProfile '
        '-Command "Start-Sleep -Seconds 5"'
    )
else:
    ATTACK = "127.0.0.1; sleep 5"


def send_request(route, target):
    payload = json.dumps({"target": target}).encode("utf-8")

    req = Request(
        BASE_URL + route,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    start = time.perf_counter()

    try:
        with urlopen(req, timeout=15) as response:
            status = response.status
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        status = error.code
        data = json.loads(error.read().decode("utf-8"))

    elapsed = time.perf_counter() - start
    return status, data, elapsed


def show(name, passed, elapsed):
    result = "PASS" if passed else "FAIL"
    print(f"{name}: {result} ({elapsed:.2f} seconds)")


print("\nBLIND COMMAND INJECTION - AUTOMATED TESTS\n")

try:
    status, data, normal_time = send_request(
        "/api/vulnerable", NORMAL
    )
    show(
        "1. Normal vulnerable request",
        status == 200,
        normal_time
    )

    status, data, attack_time = send_request(
        "/api/vulnerable", ATTACK
    )
    show(
        "2. Time-based injection",
        status == 200 and attack_time - normal_time >= 4,
        attack_time
    )

    status, data, secure_time = send_request(
        "/api/secure", ATTACK
    )
    show(
        "3. Same payload blocked",
        status == 400 and data.get("status") == "Blocked"
        and secure_time < 4,
        secure_time
    )

    status, data, valid_time = send_request(
        "/api/secure", NORMAL
    )
    show(
        "4. Secure normal request",
        status == 200 and data.get("exit_code") == 0,
        valid_time
    )

except Exception as error:
    print("Test error:", error)
    print("Ensure Flask is running on 127.0.0.1:5000.")
