#!/usr/bin/env bash
# Start ChillBillSpill — installs deps if needed, then launches the server.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Load .env if present
if [ -f "$ROOT/.env" ]; then
  export $(grep -v '^#' "$ROOT/.env" | xargs)
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY not set — LLM summarization will fail."
  echo "   Add it to .env or export ANTHROPIC_API_KEY=sk-ant-..."
  echo ""
fi

# Create and activate venv if it doesn't exist
if [ ! -d "$ROOT/.venv" ]; then
  echo "→ Creating virtual environment..."
  python3 -m venv "$ROOT/.venv"
fi

source "$ROOT/.venv/bin/activate"

echo "→ Installing dependencies..."
pip install -q -r "$ROOT/requirements.txt"

echo ""
echo "★ ChillBillSpill starting at http://localhost:8000"
echo "  Frontend: http://localhost:8000"
echo "  API:      http://localhost:8000/api/briefing?address=4500+Knox+Rd"
echo ""

cd "$ROOT/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
