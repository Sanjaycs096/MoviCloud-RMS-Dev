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

# CRITICAL: insert User_side/ at position 0 BEFORE any other path manipulation.
# This ensures `import backend` → User_side/backend/, not any other backend/ dir.
for p in (str(USER_SIDE), str(ADMIN_BACK)):
    if p not in sys.path:
        sys.path.insert(0, p)

# Purge any stale `backend` module that uvicorn/importlib may have loaded from
# the repo-root backend/ directory before our sys.path manipulation above.
for _key in list(sys.modules.keys()):
    if _key == "backend" or _key.startswith("backend."):
        del sys.modules[_key]

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
    _flask_ok = True
except Exception as e:
    import traceback
    print(f"[server.py] ✗ ERROR: Failed to create Flask app: {e}")
    traceback.print_exc()
    print("[server.py] ⚠ Running in degraded mode — user API unavailable")
    # Create a minimal Flask stub so Starlette routing doesn't crash
    from flask import Flask as _Flask
    flask_app = _Flask("rms-degraded")

    @flask_app.route("/", defaults={"path": ""})
    @flask_app.route("/<path:path>")
    def _flask_stub(path=""):
        from flask import jsonify
        return jsonify({"error": "User API unavailable — Flask init failed", "detail": str(e)}), 503

    _flask_ok = False

# ── 3. FastAPI admin sub-application ─────────────────────────────────────────
try:
    from admin_sub import admin_sub  # noqa: E402
    print(f"[server.py] ✓ Admin FastAPI app initialized")
    _admin_ok = True
except Exception as e:
    import traceback
    print(f"[server.py] ✗ Admin FastAPI import failed: {e}")
    traceback.print_exc()
    # Create a stub FastAPI app so the rest of the backend still works
    from fastapi import FastAPI as _FastAPI
    from starlette.responses import JSONResponse as _JSONResponse

    _stub = _FastAPI()

    @_stub.api_route("/{path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
    async def _admin_stub(path: str):
        return _JSONResponse({"error": "Admin service unavailable", "detail": str(e)}, status_code=503)

    admin_sub = _stub
    _admin_ok = False

# ── 4. Starlette routing ──────────────────────────────────────────────────────
from starlette.applications import Starlette          # noqa: E402
from starlette.middleware.wsgi import WSGIMiddleware   # noqa: E402
from starlette.routing import Mount, Route             # noqa: E402
from starlette.responses import JSONResponse           # noqa: E402


async def root_health(request):
    """Health check — non-blocking, always returns 200 so Render marks service healthy.
    MongoDB status is checked via cached client state only (no synchronous ping)."""
    import sys as _sys
    mongo_ok = False
    mongo_detail = "not checked"
    try:
        # Use the cached client — do NOT call client.admin.command("ping") here.
        # A synchronous ping blocks the async event loop for up to 10 s and causes
        # Render's health-check to time out, marking the service as unhealthy.
        from backend.mongo import _client as _mongo_client, MONGO_DB_NAME
        if _mongo_client is not None:
            mongo_ok = True
            mongo_detail = f"connected ({MONGO_DB_NAME})"
        else:
            # Background thread hasn't connected yet — report as warming-up, not error
            from backend.mongo import MONGO_URI as _uri
            if _uri and "@" in _uri:
                mongo_detail = "warming up (background connect in progress)"
            else:
                mongo_detail = "waiting for MONGODB_URI env var"
    except Exception as exc:
        mongo_detail = f"check error: {str(exc)[:80]}"

    # Count Flask routes
    flask_routes = []
    try:
        for rule in flask_app.url_map.iter_rules():
            flask_routes.append(rule.rule)
    except Exception:
        pass

    return JSONResponse({
        "status": "ok",          # Always "ok" so Render health check passes
        "service": "RMS Unified Backend",
        "version": "2.0",
        "mongodb": mongo_detail,
        "flask_routes": len(flask_routes),
        "flask_ok": _flask_ok,
        "api_prefix": os.getenv("API_PREFIX", "(not set)"),
        "python": _sys.version.split()[0],
        "admin_ok": _admin_ok,
    }, status_code=200)  # Always 200 so Render health check passes


async def dev_root(request):
    """Development root endpoint when frontend is not built."""
    return JSONResponse({
        "message": "RMS Backend - Development Mode",
        "frontend": "Not built - use separate dev server",
        "api_docs_admin": "/api/admin/docs",
    })


async def api_routes(request):
    """GET /api/debug/routes — list all registered Flask routes (for diagnostics)."""
    flask_routes = []
    try:
        for rule in sorted(flask_app.url_map.iter_rules(), key=lambda r: r.rule):
            flask_routes.append({
                "path": rule.rule,
                "methods": sorted(rule.methods - {"OPTIONS", "HEAD"}),
            })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    return JSONResponse({"flask_routes": flask_routes, "count": len(flask_routes)})


async def api_seed(request):
    """POST /api/seed — seeds MongoDB with menu items and admin staff."""
    secret = request.query_params.get("secret", "")
    expected = os.getenv("SEED_SECRET", "seed123")
    if secret != expected:
        return JSONResponse({"error": "forbidden"}, status_code=403)

    results = {}

    # ── 1. Seed user-side menu items into MongoDB ─────────────────────────────
    try:
        from backend.mongo import get_menu_collection, get_db as get_user_db
        from backend.seed import seed_menu_items as _seed_menu
        from backend.db import db as flask_db
        with flask_app.app_context():
            flask_db.create_all()
            _seed_menu(flask_db.session)
            flask_db.session.commit()

        # Mirror SQLite menu → MongoDB so User frontend can read it
        from backend.models import MenuItem
        menu_col = get_menu_collection()
        count = 0
        with flask_app.app_context():
            items = MenuItem.query.all()
            for item in items:
                doc = {
                    "id": item.id, "name": item.name,
                    "description": item.description or "",
                    "price": item.price,
                    "image": item.image or "",
                    "isVeg": bool(item.is_veg),
                    "category": item.category or "",
                    "available": bool(item.available),
                    "popular": bool(item.popular),
                    "todaysSpecial": bool(getattr(item, 'todays_special', False)),
                    "calories": item.calories or 0,
                    "prepTime": item.prep_time or "",
                    "offer": item.offer,
                }
                menu_col.update_one({"id": doc["id"]}, {"$setOnInsert": doc}, upsert=True)
                count += 1
        results["menu_items"] = f"seeded {count} items"
    except Exception as exc:
        results["menu_items"] = f"ERROR: {exc}"

    # ── 2. Seed admin staff into MongoDB via admin_sub seed endpoint ──────────
    try:
        import httpx
        port = os.getenv("PORT", "10000")
        resp = httpx.post(f"http://localhost:{port}/api/admin/seed?secret={expected}", timeout=10)
        results["admin_seed"] = resp.json()
    except Exception as exc:
        results["admin_seed"] = f"skipped: {exc}"

    return JSONResponse({"ok": True, "results": results})


routes = [
    # Health check endpoints (must be first - most specific)
    Route("/health", root_health),
    Route("/api/health", root_health),
    Route("/api/seed", api_seed, methods=["GET", "POST"]),
    Route("/api/debug/routes", api_routes),
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


# ── Lifespan: eagerly connect MongoDB at startup ──────────────────────────────
from contextlib import asynccontextmanager as _asynccontextmanager

@_asynccontextmanager
async def _lifespan(app_):
    """Fire-and-forget MongoDB pre-connect so the server is immediately ready.
    We yield FIRST (server accepts requests) then connect in a background thread.
    This prevents Render's health-check timeout during slow Atlas SRV resolution."""
    import asyncio, threading

    def _connect():
        try:
            from backend.mongo import _get_client, MONGO_DB_NAME
            client = _get_client()
            if client:
                print(f"[server.py] ✓ User MongoDB pre-connected ({MONGO_DB_NAME})")
            else:
                print("[server.py] ⚠ User MongoDB not ready at startup — will retry on first request")
        except Exception as exc:
            print(f"[server.py] ⚠ User MongoDB startup error: {exc}")

    threading.Thread(target=_connect, daemon=True, name="mongo-preconnect").start()
    yield  # server starts accepting requests IMMEDIATELY — no blocking wait

# ── 5. Custom CORS middleware ────────────────────────────────────────────────
#
# Starlette's built-in CORSMiddleware cannot introspect routes inside a
# WSGIMiddleware mount, so OPTIONS preflight requests get no CORS headers.
# This custom middleware handles CORS directly at the ASGI level.
#
_CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
_CORS_ALLOW_HEADERS = "Content-Type, Authorization, X-Requested-With, Accept, x-user-id, x-user-name"
_CORS_MAX_AGE = "86400"

# CORS headers injected on EVERY response — wildcard is safe because
# the frontend uses Authorization header (not cookies), so credentials=false.
_CORS_HEADERS = [
    (b"access-control-allow-origin",  b"*"),
    (b"access-control-allow-methods", _CORS_ALLOW_METHODS.encode()),
    (b"access-control-allow-headers", _CORS_ALLOW_HEADERS.encode()),
    (b"access-control-max-age",       _CORS_MAX_AGE.encode()),
]

_CORS_STRIP = {
    b"access-control-allow-origin",
    b"access-control-allow-credentials",
    b"access-control-allow-methods",
    b"access-control-allow-headers",
    b"access-control-expose-headers",
}


class CORSMiddleware:
    """Minimal ASGI CORS middleware — injects Access-Control-Allow-Origin: *
    on every response, including errors and WSGI-mounted Flask routes."""

    def __init__(self, app_):
        self.app = app_

    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        # Respond to OPTIONS preflight immediately — do NOT forward to Flask/FastAPI
        if scope["type"] == "http" and scope["method"] == "OPTIONS":
            await send({
                "type": "http.response.start",
                "status": 204,
                "headers": _CORS_HEADERS + [(b"content-length", b"0")],
            })
            await send({"type": "http.response.body", "body": b"", "more_body": False})
            return

        _headers_sent = False

        async def send_with_cors(message):
            nonlocal _headers_sent
            if message["type"] == "http.response.start":
                _headers_sent = True
                # Remove any CORS headers set downstream to avoid duplicates
                clean = [(k, v) for k, v in message.get("headers", [])
                         if k.lower() not in _CORS_STRIP]
                message = {**message, "headers": clean + _CORS_HEADERS}
            await send(message)

        try:
            await self.app(scope, receive, send_with_cors)
        except Exception as exc:
            # Inner app crashed — send a 500 with CORS headers so the
            # browser at least gets the error (not an opaque network failure)
            if not _headers_sent:
                import json as _json
                body = _json.dumps({"error": "Internal server error"}).encode()
                await send({
                    "type": "http.response.start",
                    "status": 500,
                    "headers": _CORS_HEADERS + [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(body)).encode()),
                    ],
                })
                await send({"type": "http.response.body", "body": body, "more_body": False})
            raise


app = CORSMiddleware(Starlette(debug=False, routes=routes, lifespan=_lifespan))

print("[server.py] ✓ CORS middleware configured (custom ASGI, covers WSGI mounts)")
print(f"[server.py] Flask OK:  {_flask_ok}")
print(f"[server.py] Admin OK:  {_admin_ok}")
print(f"[server.py] Python:    {sys.version.split()[0]}")
print(f"[server.py] Port:      {os.getenv('PORT', '8000')}")
print(f"[server.py] API prefix:{os.getenv('API_PREFIX', '')!r}")
print(f"[server.py] ✓ Application ready - waiting for requests...")


# ── 6. Auto-seed on first startup ────────────────────────────────────────────
# Seeds menu items into MongoDB and creates default admin staff accounts.
# Runs in a background thread so the server is ready immediately.
import threading as _threading

def _auto_seed():
    import time, sys as _sys
    time.sleep(8)  # wait for MongoDB connections to settle
    if not _flask_ok:
        print("[auto-seed] ⚠ Flask not initialized — skipping user-side seed")
        return
    try:
        # Mirror SQLite menu items to MongoDB
        from backend.mongo import get_menu_collection
        from backend.models import MenuItem
        from backend.db import db as flask_db

        menu_col = get_menu_collection()
        existing = menu_col.count_documents({})
        if existing == 0:
            with flask_app.app_context():
                flask_db.create_all()
                # Run seed if table is empty
                items = MenuItem.query.all()
                if not items:
                    from backend.seed import seed_menu_items, seed_offers, seed_tables, seed_notifications
                    seed_menu_items(flask_db.session)
                    seed_offers(flask_db.session)
                    seed_tables(flask_db.session)
                    seed_notifications(flask_db.session)
                    flask_db.session.commit()
                    items = MenuItem.query.all()

                count = 0
                for item in items:
                    doc = {
                        "id": item.id, "name": item.name,
                        "description": item.description or "",
                        "price": item.price, "image": item.image or "",
                        "isVeg": bool(item.is_veg), "category": item.category or "",
                        "available": bool(item.available), "popular": bool(item.popular),
                        "todaysSpecial": bool(getattr(item, 'todays_special', False)),
                        "calories": item.calories or 0,
                        "prepTime": item.prep_time or "", "offer": item.offer,
                    }
                    menu_col.update_one({"id": doc["id"]}, {"$setOnInsert": doc}, upsert=True)
                    count += 1
            print(f"[auto-seed] ✓ Seeded {count} menu items into MongoDB")
        else:
            print(f"[auto-seed] MongoDB already has {existing} menu items — skipping seed")
    except Exception as exc:
        print(f"[auto-seed] menu seed error: {exc}")

    # Seed admin staff via the admin sub seed endpoint
    if _admin_ok:
        try:
            import httpx
            port = os.getenv("PORT", "10000")
            secret = os.getenv("SEED_SECRET", "seed123")
            r = httpx.post(f"http://localhost:{port}/api/admin/seed?secret={secret}", timeout=15)
            data = r.json()
            print(f"[auto-seed] admin staff seed: created={data.get('created', '?')} errors={data.get('errors', [])}")
        except Exception as exc:
            print(f"[auto-seed] admin staff seed error: {exc}")


_threading.Thread(target=_auto_seed, daemon=True, name="auto-seed").start()


# ── 7. Keep-alive ping (Render free plan防sleep) ──────────────────────────────
# Render free-tier services spin down after 15 min of inactivity.
# This thread pings /health every 10 minutes to keep the service awake.
# On paid plans it's a no-op (the ping just succeeds cheaply).
def _keep_alive():
    import time, urllib.request, urllib.error
    port = os.getenv("PORT", "10000")
    url  = f"http://localhost:{port}/health"
    # Wait for server to fully start before first ping
    time.sleep(30)
    print(f"[keep-alive] Starting — pinging {url} every 10 minutes to prevent sleep")
    while True:
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                print(f"[keep-alive] ✓ ping OK ({resp.status})")
        except Exception as exc:
            print(f"[keep-alive] ⚠ ping failed: {exc}")
        time.sleep(600)  # 10 minutes

_threading.Thread(target=_keep_alive, daemon=True, name="keep-alive").start()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )
