"""
backend/server.py — Unified entry point for MoviCloud RMS.

Routing:
    /api/admin/*  →  FastAPI  (Admin_side/backend/admin_sub.py)
    /api/*        →  Flask    (User_side/backend, API_PREFIX="")
    /*            →  Static   (User_side/dist — production only)

Run:
    uvicorn backend.server:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# ── 1. Add sub-project roots to Python path ──────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent          # repo root

USER_SIDE   = ROOT / "User_side"
ADMIN_BACK  = ROOT / "Admin_side" / "backend"
FRONTEND_DIST = USER_SIDE / "dist"

for p in (str(USER_SIDE), str(ADMIN_BACK)):
    if p not in sys.path:
        sys.path.insert(0, p)

# ── 2. Flask user backend ─────────────────────────────────────────────────────
# Set API_PREFIX="" BEFORE load_dotenv runs; Flask routes become /auth, /menu …
# Starlette will mount Flask at /api, yielding final paths /api/auth, /api/menu …
os.environ["API_PREFIX"] = ""

# Update CORS to accept requests from frontend
# In production, CORS_ORIGINS is set in render.yaml
if "CORS_ORIGINS" not in os.environ:
    os.environ["CORS_ORIGINS"] = "http://localhost:5174,http://127.0.0.1:5174,http://localhost:5000,http://127.0.0.1:5000,*"

print(f"[server.py] Python path: {sys.path[:3]}")  # Show first 3 paths
print(f"[server.py] ROOT: {ROOT}")
print(f"[server.py] USER_SIDE: {USER_SIDE}")
print(f"[server.py] ADMIN_BACK: {ADMIN_BACK}")

try:
    from backend.app import create_app as create_flask_app  # noqa: E402
    flask_app = create_flask_app()
    print(f"[server.py] ✓ Flask app created successfully")
    print(f"[server.py] Flask routes: {[str(rule) for rule in flask_app.url_map.iter_rules()][:10]}")  # Show first 10 routes
except Exception as e:
    print(f"[server.py] ✗ ERROR creating Flask app: {e}")
    import traceback
    traceback.print_exc()
    raise

# ── 3. FastAPI admin sub-application ─────────────────────────────────────────
try:
    from admin_sub import admin_sub  # noqa: E402
    print(f"[server.py] ✓ Admin FastAPI app imported successfully")
except Exception as e:
    print(f"[server.py] ✗ ERROR importing admin_sub: {e}")
    import traceback
    traceback.print_exc()
    raise

# ── 4. Starlette routing ──────────────────────────────────────────────────────
from starlette.applications import Starlette          # noqa: E402
from starlette.middleware.wsgi import WSGIMiddleware   # noqa: E402
from starlette.middleware.cors import CORSMiddleware   # noqa: E402
from starlette.routing import Mount, Route             # noqa: E402
from starlette.responses import JSONResponse           # noqa: E402


async def root_health(request):
    """Root health check - returns 200 OK even if MongoDB is not connected."""
    return JSONResponse({"status": "ok", "service": "RMS Unified Backend", "version": "2.0"})


async def dev_root(request):
    """Development root endpoint when frontend is not built."""
    return JSONResponse({
        "message": "RMS Backend - Development Mode",
        "frontend": "Not built - use separate dev server",
        "api_docs_admin": "/api/admin/docs",
    })


routes = [
    # Health check endpoints (must be first - most specific)
    Route("/health", root_health),
    Route("/api/health", root_health),
    # Admin FastAPI — mounted at /api/admin (most specific API path first)
    Mount("/api/admin", app=admin_sub),
    # User Flask  — mounted at /api
    Mount("/api", app=WSGIMiddleware(flask_app)),
]

# In production serve the pre-built Vite frontend (LAST - catches all remaining)
if FRONTEND_DIST.exists():
    from starlette.staticfiles import StaticFiles      # noqa: E402

    # Frontend static files - must handle SPA routing
    routes.append(
        Mount(
            "/",
            app=StaticFiles(directory=str(FRONTEND_DIST), html=True),
            name="frontend",
        )
    )
else:
    # Development: Simple root endpoint
    routes.insert(0, Route("/", dev_root))

app = Starlette(debug=False, routes=routes)

# ── 5. Add CORS middleware to handle preflight requests ──────────────────────
# Parse allowed origins from environment
cors_origins_env = os.getenv("CORS_ORIGINS", "https://rms-dev.onrender.com,http://localhost:5174")

# Check if wildcard is needed
if "*" in cors_origins_env:
    # Use regex pattern to allow all origins
    allowed_origins = ["*"]
    allow_credentials = False  # Can't use credentials with wildcard
else:
    # Parse specific origins
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )
