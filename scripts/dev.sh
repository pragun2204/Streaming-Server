#!/usr/bin/env bash
set -e

echo "Starting Watch Party Development Stack..."

# 1. Start LiveKit if binary is installed
if command -v livekit-server &> /dev/null; then
    echo "[1/3] Starting LiveKit SFU..."
    livekit-server --dev &
fi

# 2. Start Backend
echo "[2/3] Starting FastAPI Backend on port 8000..."
cd apps/api
source .venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --reload --port 8000 &
cd ../..

# 3. Start Frontend
echo "[3/3] Starting Vite Frontend on port 5173..."
cd apps/web
npm run dev
