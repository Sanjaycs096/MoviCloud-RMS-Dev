# MoviCloud RMS — Restaurant Management System

A full-stack restaurant management platform with a **User-facing portal** (ordering, reservations, queue) and an **Admin dashboard** (menu, orders, inventory, staff, analytics).

| Service | Stack | Dev Port |
|---|---|---|
| User Frontend | React + Vite + Tailwind | `5174` |
| User Backend | Flask + MongoDB (pymongo) | `5000` |
| Admin Frontend | React + Vite + Tailwind | `5175` |
| Admin Backend | FastAPI + MongoDB (motor) | `8000` |

---

## Prerequisites

Make sure the following are installed before you begin:

- [Node.js 18+](https://nodejs.org/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/)

---

## Clone the Repository

```bash
git clone https://github.com/Sanjaycs096/MoviCloud-RMS-Dev.git
cd MoviCloud-RMS-Dev
```

---

## First-Time Setup

### 1 — User Backend (Flask)

```bash
cd User_side/backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2 — Admin Backend (FastAPI)

```bash
cd Admin_side/backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3 — User Frontend

```bash
cd User_side
npm install
```

### 4 — Admin Frontend

```bash
cd Admin_side/frontend
npm install
```

---

## Environment Variables

### User Backend — `User_side/backend/.env`

Create this file (or copy from `.env.example`):

```env
FLASK_ENV=development
FLASK_DEBUG=1
DATABASE_URL=sqlite:///restaurant.db
MONGODB_URI=mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/restaurant_db
CORS_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
API_PREFIX=/api
```

### Admin Backend — `Admin_side/backend/.env`

Create this file (or copy from `.env.example`):

```env
MONGODB_URI=mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/restaurant_db
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
```

### User Frontend — `User_side/.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

### Admin Frontend — `Admin_side/frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Running the Project

### Option A — Run Everything at Once (from `User_side/`)

```bash
cd User_side
npm run dev
```

This uses `concurrently` to start all 4 services together:

| What | URL |
|---|---|
| User Frontend | http://localhost:5174 |
| Admin Frontend | http://localhost:5175 |
| User API (Flask) | http://127.0.0.1:5000 |
| Admin API (FastAPI) | http://127.0.0.1:8000 |

> **Note:** Python virtual environments must already be activated (or their paths set up) before running `npm run dev`.

---

### Option B — Run Each Service Separately

**User Frontend**
```bash
cd User_side
npm run start:user
# → http://localhost:5174
```

**Admin Frontend**
```bash
cd Admin_side/frontend
npm run dev
# → http://localhost:5175
```

**User Backend (Flask)**
```bash
cd User_side/backend
# Activate venv first
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

python -m flask --app app:create_app run --host=127.0.0.1 --port=5000
# → http://127.0.0.1:5000
```

**Admin Backend (FastAPI)**
```bash
cd Admin_side/backend
# Activate venv first
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# → http://127.0.0.1:8000
# Swagger docs → http://127.0.0.1:8000/docs
```

---

## Default Login Credentials

### User Side

Users self-register via the **Register** tab on the login page.

### Admin Side

Seed default staff accounts by calling the seed endpoint once after the Admin backend is running:

```bash
curl -X POST "http://127.0.0.1:8000/api/seed?secret=seed123"
```

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Chef | chef@restaurant.com | chef123 |
| Waiter | waiter@restaurant.com | waiter123 |
| Cashier | cashier@restaurant.com | cashier123 |

---

## Project Structure

```
MoviCloud-RMS-Dev/
├── render.yaml                  # Render deployment blueprint (all 4 services)
│
├── User_side/
│   ├── src/                     # React frontend source
│   ├── backend/                 # Flask API
│   │   ├── app.py               # App factory
│   │   ├── wsgi.py              # Gunicorn entry point (production)
│   │   ├── mongo.py             # MongoDB collections
│   │   ├── models.py            # SQLAlchemy models (legacy)
│   │   ├── routes/              # API route blueprints
│   │   ├── Procfile             # Render start command
│   │   ├── runtime.txt          # Python version pin
│   │   └── requirements.txt
│   ├── package.json             # Root scripts (runs all 4 services)
│   └── vite.config.ts
│
└── Admin_side/
    ├── backend/                 # FastAPI API
    │   ├── app/
    │   │   ├── main.py          # FastAPI app + CORS + routers
    │   │   ├── db.py            # Motor async MongoDB client
    │   │   └── routes/          # FastAPI routers
    │   ├── Procfile
    │   ├── runtime.txt
    │   └── requirements.txt
    └── frontend/                # React admin dashboard
        ├── src/
        └── vite.config.ts
```

---

## Deploying to Render

The project includes a [render.yaml](render.yaml) blueprint that deploys all 4 services.

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect the repository `https://github.com/Sanjaycs096/MoviCloud-RMS-Dev.git`
4. Render will detect `render.yaml` and scaffold all 4 services
5. In the Render dashboard, set these **secret** env vars manually on each backend service:

**`rms-user-api`**
| Key | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/restaurant_db` |

**`rms-admin-api`**
| Key | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/restaurant_db` |
| `CORS_EXTRA_ORIGINS` | `https://rms-user-frontend.onrender.com,https://rms-admin-frontend.onrender.com` |

> Frontend `VITE_API_BASE_URL` / `VITE_API_URL` are auto-wired from backend service URLs via `fromService` in `render.yaml`.

---

## API Reference

| Endpoint | Backend | Description |
|---|---|---|
| `GET /api/health` | Flask | Health check |
| `POST /api/auth/register` | Flask | User registration |
| `POST /api/auth/login` | Flask | User login |
| `GET /api/menu` | Flask | Menu items |
| `POST /api/orders` | Flask | Place order |
| `GET /api/reservations` | Flask | Reservations |
| `POST /api/queue/join` | Flask | Join queue |
| `GET /api/queue/poll` | Flask | Poll queue status |
| `GET /api/health` | FastAPI | Admin health check |
| `GET /docs` | FastAPI | Swagger UI (admin API) |
| `GET /api/staff` | FastAPI | Staff management |
| `GET /api/menu` | FastAPI | Admin menu management |
| `GET /api/analytics` | FastAPI | Analytics |

---

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons, React Router  
**User Backend:** Python 3.11, Flask 3, pymongo, Flask-CORS, bcrypt, python-dotenv, Gunicorn  
**Admin Backend:** Python 3.11, FastAPI, Motor (async MongoDB), Pydantic v2, Uvicorn, APScheduler  
**Database:** MongoDB Atlas (shared cluster — `restaurant_db`)
#   M o v i C l o u d - R M S - D e v  
 