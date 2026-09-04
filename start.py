"""
MaintAI Single-URL Full-Stack Application Launcher.
Boots internal FastAPI RAG backend on 127.0.0.1:8000 and Vite frontend on localhost:3000.
Exposes a single application URL: http://localhost:3000
"""

import os
import sys
import time
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

def start_application():
    print("=" * 60)
    print(" Starting MaintAI Industrial Troubleshooting Copilot...")
    print("=" * 60)

    # 1. Start Internal FastAPI Backend Daemon
    print("[1/2] Initializing internal RAG engine & backend services...")
    backend_cmd = [sys.executable, "main.py"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT
    )

    # Give backend a moment to pre-index sample manuals
    time.sleep(3)

    # 2. Start Frontend Web Server (Vite)
    print("[2/2] Launching unified full-stack interface...")
    frontend_cmd = "npm run dev"
    
    print("
" + "=" * 60)
    print(" ✓ MaintAI Application Ready!")
    print(" → Full-Stack URL: http://localhost:3000")
    print("=" * 60 + "
")

    try:
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=FRONTEND_DIR,
            shell=True
        )
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("
Shutting down MaintAI services...")
        backend_proc.terminate()
        if 'frontend_proc' in locals():
            frontend_proc.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_application()
