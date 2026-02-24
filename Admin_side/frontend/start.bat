@echo off
REM Start frontend dev server for MoviCloud RMS (Windows)
pushd "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  npm install
) else (
  echo Dependencies found, skipping install.
)
echo Starting frontend dev server...
npm run dev
popd
