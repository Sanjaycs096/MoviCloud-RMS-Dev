#!/bin/bash
# start.sh - Render deployment startup script
# Works whether Render detects this as Node.js or Python service

echo "=== MoviCloud RMS Backend Startup ==="
echo "Working dir: $(pwd)"
echo "PATH: $PATH"

# Install Python dependencies if not already installed
if ! python3 -c "import uvicorn" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install --upgrade pip && pip3 install -r backend/requirements.txt || \
    pip install --upgrade pip && pip install -r backend/requirements.txt
fi

# Start the server
echo "Starting uvicorn..."
exec python3 -m uvicorn server:app \
    --host 0.0.0.0 \
    --port "${PORT:-10000}" \
    --workers 1 \
    --timeout-keep-alive 75 \
    --timeout-graceful-shutdown 30
