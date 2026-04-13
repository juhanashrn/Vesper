import requests

def detect_project(files_list):
    prompt = f"""
You are a software expert.

Analyze this project and tell:
1. Project type
2. Entry file
3. Command to run
4. Port

Files:
{files_list}

Respond clearly like:
Type:
Run file:
Command:
Port:
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )

    return response.json()["response"]