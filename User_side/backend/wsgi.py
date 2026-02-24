"""
WSGI entry point for Render / Gunicorn deployment.

The backend directory is a Python package (has __init__.py) and all modules
use relative imports (from .db import db, from ..mongo import ...).
Gunicorn running from the 'backend/' rootDir would import 'app' as a top-level
module which breaks relative imports.

This file adds the parent directory (User_side/) to sys.path so that the
package can be imported as 'backend.app', which keeps all relative imports
working correctly.
"""
from __future__ import annotations

import os
import sys

# Make sure 'User_side/' is on the path so `import backend` resolves correctly
_parent = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _parent not in sys.path:
    sys.path.insert(0, _parent)

from backend.app import create_app  # noqa: E402

application = create_app()
