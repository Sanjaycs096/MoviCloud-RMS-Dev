#!/bin/bash
# start.sh - Render deployment startup script
# Works whether Render detects this as Node.js or Python service
# NOTE: do NOT use set -e here — we need to handle failures gracefully

echo "=== MoviCloud RMS Backend Startup ==="
echo "Working dir: $(pwd)"
echo "PATH: $PATH"
echo "Checking for Python..."

# Find Python — try python3, python, or py
PYTHON=""
for cmd in python3.11 python3.10 python3.9 python3 python py; do
  if command -v "$cmd" >/dev/null 2>&1; then
    PYTHON="$cmd"
    echo "Found Python binary: $cmd at $(command -v $cmd)"
    $cmd --version 2>&1
    break
  fi
done

# If still not found, try common Render paths
if [ -z "$PYTHON" ]; then
  for path in /usr/bin/python3 /usr/local/bin/python3 /opt/render/project/.venv/bin/python /usr/bin/python; do
    if [ -f "$path" ]; then
      PYTHON="$path"
      echo "Found Python at: $path"
      $path --version 2>&1
      break
    fi
  done
fi

# Last-resort: try apt-get (works on Render's Debian base images)
if [ -z "$PYTHON" ]; then
  echo "ERROR: Python not found in PATH or common locations."
  echo "Attempting system package install..."
  apt-get update -qq 2>/dev/null && apt-get install -y python3 python3-pip 2>/dev/null
  if command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
    echo "Installed python3 successfully."
  else
    echo "FATAL: Cannot find or install Python. Aborting."
    exit 1
  fi
fi

echo "Using Python: $PYTHON"

# Install/upgrade pip quietly
echo "Upgrading pip..."
"$PYTHON" -m pip install --upgrade pip --quiet 2>&1 || \
  pip3 install --upgrade pip --quiet 2>&1 || \
  echo "pip upgrade failed (continuing anyway)"

# Install Python dependencies
echo "Installing backend requirements..."
REQ_FILE="backend/requirements.txt"
if [ ! -f "$REQ_FILE" ]; then
  REQ_FILE="requirements.txt"
fi

if [ -f "$REQ_FILE" ]; then
  "$PYTHON" -m pip install -r "$REQ_FILE" --quiet 2>&1
  if [ $? -ne 0 ]; then
    echo "pip install failed, retrying without --quiet for details..."
    "$PYTHON" -m pip install -r "$REQ_FILE" 2>&1
  fi
else
  echo "WARNING: No requirements.txt found at $REQ_FILE"
fi

# Verify uvicorn is available
if ! "$PYTHON" -m uvicorn --version >/dev/null 2>&1; then
  echo "uvicorn not found, installing directly..."
  "$PYTHON" -m pip install uvicorn[standard] fastapi 2>&1
fi

echo "=== Dependencies installed, starting uvicorn ==="
echo "Port: ${PORT:-10000}"

exec "$PYTHON" -m uvicorn server:app \
    --host 0.0.0.0 \
    --port "${PORT:-10000}" \
    --workers 1 \
    --timeout-keep-alive 75 \
    --timeout-graceful-shutdown 30
