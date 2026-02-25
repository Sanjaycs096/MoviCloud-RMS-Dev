# 🚀 Local Development Quick Start

## Prerequisites
- **Python 3.10+** installed and in PATH
- **Node.js 18+** and npm installed
- MongoDB Atlas connection (already configured)

## Quick Start (Easy Way)

### Option 1: Start Everything at Once
```bash
start-all.bat
```
This will:
1. Create Python virtual environment (if needed)
2. Install all Python dependencies
3. Start unified backend on port 8000
4. Install all Node dependencies
5. Start frontend on port 5174
6. Open your browser automatically

**Open**: http://localhost:5174

### Option 2: Start Services Separately

**Terminal 1 - Backend:**
```bash
start-backend.bat
```

**Terminal 2 - Frontend:**
```bash
start-frontend.bat
```

## Access URLs

| Service | URL |
|---------|-----|
| **User App** | http://localhost:5174/ |
| **Admin App** | http://localhost:5174/admin |
| **User API (Flask)** | http://127.0.0.1:8000/api |
| **Admin API (FastAPI)** | http://127.0.0.1:8000/api/admin |
| **API Docs** | http://127.0.0.1:8000/api/admin/docs |

## Default Admin Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Chef | chef@restaurant.com | chef123 |
| Waiter | waiter@restaurant.com | waiter123 |
| Cashier | cashier@restaurant.com | cashier123 |

## Troubleshooting

### Blank Page?
- Make sure **both** backend and frontend are running
- Check console for errors (F12 → Console)
- Verify `.env.local` exists in `User_side/` folder

### Port Already in Use?
- Kill the process: `netstat -ano | findstr :8000` then `taskkill /PID <pid> /F`
- Change port in `start-backend.bat` (line with uvicorn)

### Backend Won't Start?
- Make sure Python is installed: `python --version`
- Delete `backend/venv` folder and run `start-backend.bat` again

### Frontend Won't Start?
- Delete `User_side/node_modules` and `Admin_side/frontend/node_modules`
- Run `start-frontend.bat` again (it will reinstall)

## Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (Vite + React)                │
│  Port: 5174                             │
│                                         │
│  /          → User App (Movies/Food)    │
│  /admin     → Admin Dashboard           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Unified Backend (Starlette)            │
│  Port: 8000                             │
│                                         │
│  /api/*        → Flask (User)           │
│  /api/admin/*  → FastAPI (Admin)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  MongoDB Atlas                          │
│  Database: restaurant_db                │
└─────────────────────────────────────────┘
```

## Development Notes

- Frontend auto-reloads on file changes
- Backend auto-reloads on .py file changes
- Database is shared between User and Admin sides
- Both User and Admin UIs are built together in production
