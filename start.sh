#!/bin/bash
# start.sh - Render deployment startup script
# Works whether Render detects this as Node.js or Python service

set -e
echo "=== MoviCloud RMS Backend Startup ==="
echo "Working dir: $(pwd)"

# Find Python — try python3, python, or py
PYTHON=""
for cmd in python3 python py; do
  if command -v "$cmd" >/dev/null 2>&1; then
    PYTHON="$cmd"
    echo "Found Python: $(command -v $cmd)"
    $cmd --version
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "ERROR: Python not found. Trying system install..."
  # Render's Node.js images are Debian-based — Python3 is often pre-installed
  apt-get install -y python3 python3-pip 2>/dev/null || true
  PYTHON=python3
fi

# Install Python dependencies
echo "Installing Python dependencies..."
$PYTHON -m pip install --upgrade pip --quiet 2>/dev/null || \
  pip3 install --upgrade pip --quiet 2>/dev/null || true

$PYTHON -m pip install -r backend/requirements.txt --quiet 2>/dev/null || \
  pip3 install -r backend/requirements.txt --quiet 2>/dev/null

# Start the server
echo "Starting uvicorn on port ${PORT:-10000}..."
exec $PYTHON -m uvicorn server:app \
    --host 0.0.0.0 \
    --port "${PORT:-10000}" \
    --workers 1 \
    --timeout-keep-alive 75 \
    --timeout-graceful-shutdown 30
