# Startup Guide - MOVICLOUD RMS

## Quick Start

### Option 1: Start Everything (Recommended)
Double-click: **`start-all.bat`**

This will:
- Start the Backend API server (Admin_side)
- Start the Frontend development server (User_side)
- Open both in separate windows

### Option 2: Start Individual Components

**Frontend Only:**
Double-click: **`start-frontend.bat`**
- Runs the User interface at http://localhost:5173

**Backend Only:**
Double-click: **`start-backend.bat`**
- Runs the Admin API at http://localhost:8000

## First Time Setup

If this is your first time, double-click: **`install-dependencies.bat`**

This will:
1. Install Node.js packages for frontend
2. Create Python virtual environment
3. Install Python packages for backend

## Batch Files Explained

| File | Purpose |
|------|---------|
| `start-all.bat` | Start both frontend and backend |
| `start-frontend.bat` | Start only the frontend (User_side) |
| `start-backend.bat` | Start only the backend (Admin API) |
| `install-dependencies.bat` | Install all dependencies first time |

## URLs After Starting

- **Frontend (User Interface):** http://localhost:5173
- **Backend (Admin API):** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Requirements

### Frontend
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Backend
- Python 3.9 or higher
- pip (comes with Python)

## How to Use

1. **First Time:**
   - Run `install-dependencies.bat`
   - Wait for installation to complete

2. **Every Time:**
   - Run `start-all.bat`
   - Wait for both servers to start
   - Open browser to http://localhost:5173

3. **To Stop:**
   - Press `Ctrl+C` in each terminal window
   - Or simply close the windows

## Navigation Flow

1. Application opens at User home page
2. Click **Login** button (top-right)
3. Enter admin credentials
4. Access admin dashboard
5. Click **Logout** to return to user view

## Troubleshooting

### "Node is not recognized"
- Install Node.js from https://nodejs.org

### "Python is not recognized"  
- Install Python from https://python.org
- Make sure to check "Add to PATH" during installation

### Port already in use
- Frontend (5173): Close other Vite servers
- Backend (8000): Close other FastAPI/Uvicorn servers

### Dependencies fail to install
- Frontend: Delete `User_side/node_modules` and try again
- Backend: Delete `Admin_side/backend/venv` and try again

## Development

### Frontend Development
```powershell
cd User_side
npm run dev
```

### Backend Development
```powershell
cd Admin_side/backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

## Build for Production

### Frontend
```powershell
cd User_side
npm run build
```

Output will be in `User_side/dist`

### Backend
Backend is ready for deployment as-is. See deployment documentation for:
- Render.com
- Vercel
- AWS
- Azure

---

**For more details, see:**
- `QUICK_START.md` - Application usage guide
- `UNIFIED_NAVIGATION_GUIDE.md` - Testing guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
