import os
import re
import socket
import subprocess
import time
import shutil
import stat
import json
import requests
import sys
from bs4 import BeautifulSoup

def kill_process_tree(proc):
    if not proc: return
    try:
        if os.name == 'nt':
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            proc.terminate()
    except Exception as e:
        print(f"Warning: Failed to kill process {proc.pid}: {e}")

# ===== INPUT =====
if len(sys.argv) < 2:
    print("❌ No repo URL provided")
    exit()

repo_url = sys.argv[1]

BASE_DIR = os.getcwd()
PROJECT_DIR = os.path.join(BASE_DIR, "project_temp")

# ===== CLEAN =====
def remove_readonly(func, path, _):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass

if os.path.exists(PROJECT_DIR):
    print("Cleaning old project...")
    for _ in range(5):
        try:
            shutil.rmtree(PROJECT_DIR, onerror=remove_readonly)
            break
        except Exception:
            time.sleep(1)

# ===== CLONE =====
print("\nCloning repository...")
if subprocess.run(f"git clone {repo_url} project_temp", shell=True).returncode != 0:
    print("❌ Clone failed")
    exit()

os.chdir(PROJECT_DIR)

# ===== DETECT FILES =====
files = []
for root, dirs, fs in os.walk("."):
    for f in fs:
        files.append(os.path.join(root, f))

is_node = any("package.json" in f for f in files)
is_python = any(f.endswith(".py") for f in files)

command = None
port = None

# ===== NODE =====
if is_node:
    print("\nDetected Node / React project")

    subprocess.run("npm install", shell=True)

    with open("package.json") as f:
        scripts = json.load(f).get("scripts", {})

    if "dev" in scripts:
        command = "npm run dev"
        port = "5173"
    elif "start" in scripts:
        command = "npm start"
        port = "3000"
    else:
        command = "npx vite"
        port = "5173"

# ===== PYTHON =====
elif is_python:
    print("\nDetected Python project")

    if os.path.exists("requirements.txt"):
        print("Installing Python dependencies...")
        subprocess.run("pip install -r requirements.txt", shell=True)

    entry_file = None
    for f in files:
        if f.endswith(("app.py", "main.py", "run.py")):
            entry_file = f
            break

    if entry_file:
        command = [sys.executable, entry_file]
        port = "5000"
    else:
        print("❌ No Python entry file found!")
        exit()

# ===== FAIL SAFE =====
if not command:
    print("❌ Unsupported project")
    exit()

print(f"\nRunning: {command}")

# ===== RUN APP =====
env = os.environ.copy()
env.pop("WERKZEUG_SERVER_FD", None)
env.pop("WERKZEUG_RUN_MAIN", None)

app = subprocess.Popen(
    command,
    cwd=PROJECT_DIR,
    env=env,
    shell=isinstance(command, str)
)

# ===== WAIT FOR SERVER =====
print("Waiting for server...")
start = time.time()
actual_port = None

while time.time() - start < 60:
    for p in [port, "8080", "3000", "5000", "5173"]:
        try:
            socket.create_connection(("127.0.0.1", int(p)), 2)
            actual_port = p
            break
        except:
            continue
    if actual_port:
        break
    time.sleep(2)

if not actual_port:
    print("❌ Server failed")
    kill_process_tree(app)
    exit()

port = actual_port
print(f"Server running at http://127.0.0.1:{port}")

# =================================
# 🔐 EXTRA TESTS
# =================================

def brute_force_test():
    try:
        for pwd in ["admin", "1234", "password"]:
            requests.post(f"http://127.0.0.1:{port}/login",
                          data={"username": "admin", "password": pwd},
                          timeout=2)
        return True
    except:
        return False

def rate_limit_test():
    success = 0
    for _ in range(20):
        try:
            r = requests.get(f"http://127.0.0.1:{port}", timeout=2)
            if r.status_code == 200:
                success += 1
        except:
            pass
    return success > 15

def input_validation_test():
    payload = "<script>alert(1)</script>"
    try:
        r = requests.post(f"http://127.0.0.1:{port}/login",
                          data={"username": payload, "password": payload},
                          timeout=2)
        return payload in r.text
    except:
        return False

bf = brute_force_test()
rl = rate_limit_test()
iv = input_validation_test()

# =================================
# 🔥 ZAP SCAN
# =================================

print("\nRunning ZAP scan...")

zap_cmd = (
    f'cd "C:\\Program Files\\ZAP\\Zed Attack Proxy" && '
    f'zap.bat -cmd -quickurl http://127.0.0.1:{port} '
    f'-quickout "{PROJECT_DIR}\\report.html"'
)

try:
    subprocess.run(zap_cmd, shell=True, timeout=180, stdin=subprocess.DEVNULL)
except subprocess.TimeoutExpired:
    print("⚠️ ZAP timeout (normal)")

kill_process_tree(app)

# =================================
# 📊 PARSE REPORT
# =================================

risk = {"High": 0, "Medium": 0, "Low": 0}
vulnerabilities = []

report_path = os.path.join(PROJECT_DIR, "report.html")

if os.path.exists(report_path):
    soup = BeautifulSoup(open(report_path, encoding="utf-8"), "html.parser")

    for row in soup.find_all("tr"):
        cols = row.find_all("td")

        if len(cols) == 2:
            lvl = cols[0].text.strip()
            num = re.search(r"\d+", cols[1].text)
            if lvl in risk and num:
                risk[lvl] = int(num.group())
        if len(cols) > 4:
            title = cols[1].text.strip()

            vulnerabilities.append({
                "risk": cols[0].text.strip(),
                "title": title,
                "description": cols[3].text.strip()
            })

# =================================
# 🤖 AI ANALYSIS
# =================================

def ai_analysis(data):
    try:
        prompt = f"""
You are a cybersecurity expert.

Analyze this scan result:

{json.dumps(data)}

IMPORTANT:
- Explain EACH vulnerability separately
- Use SIMPLE language

Return ONLY JSON:
{{
  "score": number,
  "summary": {{
    "critical": number,
    "medium": number,
    "low": number
  }},
  "explanation": {{
    "what": "",
    "why": "",
    "fix": ""
  }},
  "details": [
    {{
      "title": "",
      "risk": "",
      "description": "",
      "why": "",
      "fix": ""
    }}
  ]
}}
"""

        res = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=60
        )

        raw = res.json()["response"]

        match = re.search(r"\{.*\}", raw, re.DOTALL)

        if match:
            return json.loads(match.group(0))
        else:
            raise Exception("Invalid AI output")

    except Exception as e:
        print("AI ERROR:", e)

        return {
            "score": 40,
            "summary": {
                "critical": data["risk"].get("High", 0),
                "medium": data["risk"].get("Medium", 0),
                "low": data["risk"].get("Low", 0)
            },
            "explanation": {
                "what": "Scan completed but AI failed",
                "why": "AI service not running",
                "fix": "Run: ollama run llama3"
            },
            "details": [
                {
                    "title": v["title"],
                    "risk": v["risk"],
                    "description": v["description"],
                    "why": "This can expose your system",
                    "fix": "Apply proper security headers"
                }
                for v in data.get("vulnerabilities", [])
            ]
        }

# ===== CALL AI =====
ai_output = ai_analysis({
    "risk": risk,
    "vulnerabilities": vulnerabilities,
    "extra_tests": {
        "brute_force": bf,
        "rate_limit": rl,
        "input_validation": iv
    
    }
})
# ===== CALL AI =====
ai_output = ai_analysis({
    "risk": risk,
    "vulnerabilities": vulnerabilities,
    "extra_tests": {
        "brute_force": bf,
        "rate_limit": rl,
        "input_validation": iv
    }
})

# =========================================
# 🔥 FIX SCORE (REALISTIC)
# =========================================
high = risk.get("High", 0)
medium = risk.get("Medium", 0)
low = risk.get("Low", 0)

score = 100 - (high * 30 + medium * 15 + low * 5)
score = max(score, 10)

ai_output["score"] = score


# =========================================
# 🔥 FIX SUMMARY (MATCH UI)
# =========================================
ai_output["summary"] = {
    "critical": high,
    "medium": medium,
    "low": low
}


# =========================================
# 🔥 FORCE ALL VULNERABILITIES (IMPORTANT)
# =========================================
# =========================================
# 🔥 REMOVE DUPLICATES + MERGE AI
# =========================================

ai_details = ai_output.get("details", [])

seen_titles = set()
final_details = []

for v in vulnerabilities:
    title_key = v["title"].strip().lower()

    # 🚫 skip duplicates
    if title_key in seen_titles:
        continue

    seen_titles.add(title_key)

    match = next(
        (a for a in ai_details if title_key in a["title"].lower()),
        None
    )

    if match:
        final_details.append(match)
    else:
        final_details.append({
            "title": v["title"],
            "risk": v["risk"],
            "description": v["description"],
            "why": "This issue may affect system behavior.",
            "fix": "Apply recommended security improvements."
        })


# =========================================
# ADD CUSTOM TESTS (NO DUPLICATE CHECK NEEDED)
# =========================================

if bf:
    final_details.append({
        "title": "Brute Force Detection",
        "risk": "Medium",
        "description": "Multiple login attempts detected.",
        "why": "Attackers may try guessing passwords.",
        "fix": "Add account lock / rate limiting."
    })

if rl:
    final_details.append({
        "title": "Rate Limiting Missing",
        "risk": "Medium",
        "description": "Too many requests allowed.",
        "why": "Can lead to abuse or DoS.",
        "fix": "Add rate limiting."
    })

if iv:
    final_details.append({
        "title": "Input Validation Weak",
        "risk": "Low",
        "description": "User input not properly sanitized.",
        "why": "Can lead to injection attacks.",
        "fix": "Validate and sanitize inputs."
    })


ai_output["details"] = final_details
with open(os.path.join(PROJECT_DIR, "result.json"), "w") as f:
    json.dump(ai_output, f, indent=4)

print("✅ result.json generated")