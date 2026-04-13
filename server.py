from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
import time
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_TEMP = os.path.join(BASE_DIR, "project_temp")
RESULT_FILE = os.path.join(PROJECT_TEMP, "result.json")

app = Flask(__name__)
CORS(app)

# ===== RUN SCAN =====
@app.route("/scan", methods=["POST"])
def scan():
    repo = request.json.get("repo")

    if not repo:
        return jsonify({"error": "No repo provided"})

    try:
        if os.path.exists(RESULT_FILE):
            os.remove(RESULT_FILE)

        creationflags = getattr(subprocess, 'CREATE_NEW_PROCESS_GROUP', 0)
        
        subprocess.Popen(
            [sys.executable, os.path.join(BASE_DIR, "main_pipeline.py"), repo],
            cwd=BASE_DIR,
            shell=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creationflags
        )

        return jsonify({"status": "started"})
    except Exception as e:
        return jsonify({"error": str(e)})


# ===== GET RESULT (WAIT UNTIL READY) =====
@app.route("/result", methods=["GET"])
def get_result():
    # wait for file
    for _ in range(30):
        if os.path.exists(RESULT_FILE):
            with open(RESULT_FILE) as f:
                return jsonify(json.load(f))
        time.sleep(2)

    return jsonify({"status": "processing"})


if __name__ == "__main__":
    app.run(port=8000, debug=True, use_reloader=False)