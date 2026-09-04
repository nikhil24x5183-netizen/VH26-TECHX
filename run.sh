#!/usr/bin/env bash
set -e

echo "Starting Factory Floor RAG Troubleshooting Assistant..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

source .venv/bin/activate

if [ ! -d "data/chroma_db" ]; then
    echo "[1/3] Generating synthetic manuals and building knowledge base..."
    python -m src.generator.create_manuals
    python -m src.ingestion.build_index
fi

echo "[2/3] Starting FastAPI backend on http://127.0.0.1:8000..."
uvicorn src.api.app:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 3

echo "[3/3] Starting Streamlit UI on http://localhost:8501..."
streamlit run ui/app.py --server.port 8501

kill $BACKEND_PID || true
