# 🔍 Deployment Troubleshooting Guide

## Recent Fixes Applied (Latest: Feb 27, 2026)

### ✅ Fixed Issues:
1. **Added Starlette dependency** - Was missing from requirements.txt
2. **Created backend/__init__.py** - Proper Python package structure  
3. **Fixed CORS configuration** - No more "blocked by CORS" errors
4. **Graceful MongoDB handling** - Server starts even if DB connection fails
5. **Added detailed logging** - Can now see exactly what's failing

### 🔧 Current Deployment:

**Commit**: `5a294b6`  
**Changes**:
- Enhanced startup logging to diagnose 404 errors
- MongoDB connection won't crash Flask startup
- Better route ordering in Starlette

---

## 📋 How to Check if Deploy Fixed the Issues

### Step 1: View Render Logs

1. Go to: https://dashboard.render.com
2. Select: **rms-backend**
3. Click: **Logs** tab
4. **Look for these log messages**:

```
[server.py] Python path: [...]
[server.py] ROOT: /opt/render/project/src
[server.py] USER_SIDE: /opt/render/project/src/User_side
[server.py] ADMIN_BACK: /opt/render/project/src/Admin_side/backend
[server.py] ✓ Flask app created successfully
[server.py] Flask routes: ['/health', '/menu', '/auth/login', ...]
[server.py] ✓ Admin FastAPI app imported successfully
```

### Step 2: Test Health Endpoint

Open in browser or use curl:
```
https://rms-backend.onrender.com/health
```

**Should return**:
```json
{
  "status": "ok",
  "service": "RMS Unified Backend",
  "version": "2.0"
}
```

### Step 3: Test API Endpoints

**Test notifications endpoint**:
```
https://rms-backend.onrender.com/api/notifications
```

**Test register endpoint** (POST):
```bash
curl -X POST https://rms-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","phone":"1234567890","address":"Test"}'
```

---

## 🐛 If Still Getting 404 Errors

### Check 1: Flask Routes Not Registered

**In Render Logs, look for**:
```
[server.py] ✗ ERROR creating Flask app: ModuleNotFoundError: No module named 'backend'
```

**Solution**: The sys.path is not set correctly. Run this fix:
```bash
# Update render.yaml startCommand to:
startCommand: cd .. && uvicorn backend.server:app --host 0.0.0.0 --port $PORT --workers 1
```

### Check 2: Import Errors

**In Render Logs, look for**:
```
ImportError: cannot import name 'create_app'
```

**Solution**: User_side backend dependencies missing. Update `backend/requirements.txt` to include all Flask deps.

### Check 3: MongoDB URI Not Set

**In Render Logs, look for**:
```
[User Backend] WARNING: MONGODB_URI not set
```

**Solution**: Set in Render dashboard:
1. Go to rms-backend → Environment
2. Add: `MONGODB_URI` = `mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/restaurant_db`
3. Click "Save Changes"

---

## ✅ Expected Working State

### Render Logs Should Show:
```
[server.py] ✓ Flask app created successfully
[server.py] Flask routes: ['/static/<path:filename>', '/', '/health', '/menu', '/menu-items', ...]
[server.py] ✓ Admin FastAPI app imported successfully
[User Backend] ✓ MongoDB connected successfully to database: restaurant_db
[admin_sub] ✓ MongoDB connected successfully
[admin_sub] ✓ Scheduler started successfully
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:10000
```

### Browser Console Should Show:
- ✅ No CORS errors
- ✅ No 404 errors  
- ✅ API calls return data (or 500 if MongoDB not connected)
- ✅ Registration/Login works

### Frontend Should:
- ✅ Load without errors
- ✅ Show menu items
- ✅ Registration form submits successfully
- ✅ Notifications API works

---

## 📊 Render Deployment Timeline

| Step | Duration | What Happens |
|------|----------|--------------|
| Build | 1-2 min | Installs dependencies from requirements.txt |
| Deploy | 30 sec | Starts uvicorn server |
| Health Check | 10 sec | Render pings /health |
| Live | - | ✅ Service is accessible |

**Total**: ~2-3 minutes from git push to live

---

## 🆘 Emergency Rollback

If deployment completely breaks:

```bash
# Roll back to last working commit
git revert HEAD
git push origin main
```

Or in Render dashboard:
1. Go to rms-backend → Manual Deploy
2. Select previous commit from dropdown
3. Click "Deploy"

---

## 📞 Next Steps if Still Broken

1. **Share Render logs** - Copy from dashboard and share
2. **Share browser console** - Press F12, copy errors
3. **Test health endpoint** - Verify basic connectivity
4. **Check environment vars** - Confirm MONGODB_URI is set

**Last Updated**: Feb 27, 2026 - Commit 5a294b6
