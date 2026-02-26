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

from backend.app import create_app as create_flask_app  # noqa: E402

flask_app = create_flask_app()

# ── 3. FastAPI admin sub-application ─────────────────────────────────────────
from admin_sub import admin_sub  # noqa: E402

# ── 4. Starlette routing ──────────────────────────────────────────────────────
from starlette.applications import Starlette          # noqa: E402
from starlette.middleware.wsgi import WSGIMiddleware   # noqa: E402
from starlette.routing import Mount                    # noqa: E402

routes = [
    # Admin FastAPI — mounted at /api/admin (prefix stripped → /staff, /menu …)
    Mount("/api/admin", app=admin_sub),
    # User Flask  — mounted at /api       (prefix stripped → /auth, /menu …)
    Mount("/api", app=WSGIMiddleware(flask_app)),
]

# In production serve the pre-built Vite frontend
if FRONTEND_DIST.exists():
    from starlette.staticfiles import StaticFiles      # noqa: E402

    routes.append(
        Mount(
            "/",
            app=StaticFiles(directory=str(FRONTEND_DIST), html=True),
            name="frontend",
        )
    )

app = Starlette(routes=routes)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )
