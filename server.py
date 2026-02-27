"""
server.py — Unified entry point for MoviCloud RMS.

This file lives at the repo root (not inside the backend/ package) so that
the name 'backend' is not already registered in sys.modules when we do
  from backend.app import create_app
which needs to resolve to User_side/backend/app.py.

Routing:
    /api/admin/*  →  FastAPI  (Admin_side/backend/admin_sub.py)
    /api/*        →  Flask    (User_side/backend, API_PREFIX="")
    /*            →  Static   (User_side/dist — production only)

Run:
    uvicorn server:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# ── 1. Add sub-project roots to Python path ──────────────────────────────────
ROOT = Path(__file__).resolve().parent          # repo root  (server.py is at root)

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
    os.environ["CORS_ORIGINS"] = "http://localhost:5174,http://127.0.0.1:5174,http://localhost:5000,http://127.0.0.1:5000"

print(f"[server.py] Starting RMS Unified Backend...")
print(f"[server.py] Python {sys.version}")
print(f"[server.py] Working directory: {os.getcwd()}")

try:
    # 'backend' is not yet in sys.modules (this file is at the root, not inside
    # the backend/ package).  With User_side/ at the front of sys.path, Python
    # correctly resolves 'backend' → User_side/backend/ here.
    from backend.app import create_app as create_flask_app  # noqa: E402
    flask_app = create_flask_app()
    print(f"[server.py] ✓ Flask app initialized")
except Exception as e:
    print(f"[server.py] ✗ ERROR: Failed to create Flask app: {e}")
    raise

# ── 3. FastAPI admin sub-application ─────────────────────────────────────────
try:
    from admin_sub import admin_sub  # noqa: E402
    print(f"[server.py] ✓ Admin FastAPI app initialized")
except Exception as e:
    print(f"[server.py] ✗ ERROR: Failed to import admin_sub: {e}")
    raise

# ── 4. Starlette routing ──────────────────────────────────────────────────────
from starlette.applications import Starlette          # noqa: E402
from starlette.middleware.wsgi import WSGIMiddleware   # noqa: E402
from starlette.routing import Mount, Route             # noqa: E402
from starlette.responses import JSONResponse           # noqa: E402
import re as _re                                       # noqa: E402


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

# ── 5. Custom CORS middleware ────────────────────────────────────────────────
#
# Starlette's built-in CORSMiddleware cannot introspect routes inside a
# WSGIMiddleware mount, so OPTIONS preflight requests get no CORS headers.
# This custom middleware handles CORS directly at the ASGI level.
#
_CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
_CORS_ALLOW_HEADERS = "Content-Type, Authorization, X-Requested-With, Accept, x-user-id, x-user-name"
_CORS_MAX_AGE = "86400"

# Origin pattern: allow any onrender.com subdomain + localhost dev
_CORS_ORIGIN_RE = _re.compile(
    r"^(https?://(?:[\w-]+\.)?onrender\.com|https?://(?:[\w-]+\.)?vercel\.app"
    r"|http://localhost(?::\d+)?|http://127\.0\.0\.1(?::\d+)?)$"
)

# Also accept any origin explicitly listed in env
_CORS_EXPLICIT = set(
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "").split(",")
    if o.strip()
)


def _cors_origin(origin: str | None) -> str | None:
    """Return the origin to echo back, or None if not allowed."""
    if not origin:
        return None
    if origin in _CORS_EXPLICIT:
        return origin
    if _CORS_ORIGIN_RE.match(origin):
        return origin
    return None


class CORSMiddleware:
    """Minimal ASGI CORS middleware that works with WSGI mounts."""

    def __init__(self, app_):
        self.app = app_

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        origin = (headers.get(b"origin") or b"").decode()
        allowed_origin = _cors_origin(origin) if origin else None

        if scope["type"] == "http" and scope["method"] == "OPTIONS" and allowed_origin:
            # Respond to preflight immediately — never forward to Flask/FastAPI
            response_headers = [
                (b"access-control-allow-origin",     allowed_origin.encode()),
                (b"access-control-allow-methods",    _CORS_ALLOW_METHODS.encode()),
                (b"access-control-allow-headers",    _CORS_ALLOW_HEADERS.encode()),
                (b"access-control-allow-credentials", b"true"),
                (b"access-control-max-age",           _CORS_MAX_AGE.encode()),
                (b"vary",                             b"Origin"),
                (b"content-length",                  b"0"),
            ]
            await send({"type": "http.response.start", "status": 204, "headers": response_headers})
            await send({"type": "http.response.body",  "body": b"", "more_body": False})
            return

        # For non-OPTIONS we forward to the app, then inject CORS headers
        if not allowed_origin:
            await self.app(scope, receive, send)
            return

        cors_headers_to_inject = [
            (b"access-control-allow-origin",      allowed_origin.encode()),
            (b"access-control-allow-credentials", b"true"),
            (b"vary",                             b"Origin"),
        ]

        async def send_with_cors(message):
            if message["type"] == "http.response.start":
                existing = [k for k, _ in message.get("headers", [])]
                # Strip any CORS headers already set downstream (Flask-CORS, FastAPI) to avoid duplicates
                clean = [
                    (k, v) for k, v in message.get("headers", [])
                    if k.lower() not in (
                        b"access-control-allow-origin",
                        b"access-control-allow-credentials",
                        b"access-control-allow-methods",
                        b"access-control-allow-headers",
                        b"access-control-expose-headers",
                    )
                ]
                message = {**message, "headers": clean + cors_headers_to_inject}
            await send(message)

        await self.app(scope, receive, send_with_cors)


app = CORSMiddleware(Starlette(debug=False, routes=routes))

print("[server.py] ✓ CORS middleware configured (custom ASGI, covers WSGI mounts)")
print(f"[server.py] ✓ Application ready - waiting for requests...")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )
