#!/usr/bin/env bash
set -e

# Change to the project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== Malnad Roasters - Starting Local Environment ==="

# 1. Setup Backend
if [ ! -d "backend/.venv" ]; then
  echo "Setting up Python virtual environment..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -r backend/requirements.txt
fi

if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
fi

# 2. Setup Frontend
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

if [ ! -f "frontend/.env.local" ]; then
  cp frontend/.env.example frontend/.env.local
fi

# Trap termination signals to kill child processes
cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "Starting Backend API on http://localhost:8000 ..."
(cd backend && .venv/bin/python3 -m uvicorn app.main:app --reload --port 8000) &

# Start Frontend
echo "Starting Frontend UI on http://localhost:3000 ..."
(cd frontend && npm run dev) &

# Wait for both processes
wait
