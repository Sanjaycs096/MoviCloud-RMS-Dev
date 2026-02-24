# Quick Start Guide - Unified Navigation

## Installation

Run these commands in order:

```powershell
# Navigate to User_side
cd User_side

# Install dependencies (if not already installed)
npm install

# Start the unified application
npm run dev
```

## What Changed?

### 1. **Profile Button → Login Button**
- Location: Top-right corner of header
- **Before:** User icon that opened profile page
- **After:** 
  - Shows **Login** icon when not authenticated
  - Shows **Logout** icon when admin is logged in

### 2. **New Routes Added**
- `/login` → Admin Login Page
- `/admin` → Admin Dashboard (protected)
- `/admin/*` → All admin modules

### 3. **User Routes (Unchanged)**
All existing user routes still work:
- `/` → Home
- `/menu` → Menu
- `/cart` → Cart
- `/orders` → Orders
- `/offers` → Offers & Loyalty
- `/tracking` → Order Tracking
- `/feedback` → Feedback
- `/settings` → Settings
- `/notifications` → Notifications

## Usage Flow

### For Regular Users
1. Open application
2. Browse menu, make orders, etc.
3. **No changes to user experience**

### For Admin Staff
1. Open application (starts at User home)
2. Click **Login** button (top-right)
3. Enter admin credentials
4. Access admin dashboard and all modules
5. Click **Logout** to return to user view

## Default Admin Credentials

Check your Admin_side backend seed data for credentials. Common defaults:

```
Admin Account:
Email: admin@restaurant.com
Password: [check backend/seed_data.py]

Manager Account:
Email: manager@restaurant.com
Password: [check backend/seed_data.py]
```

## Backend Requirements

Make sure the Admin backend is running:

```powershell
# In a separate terminal
cd Admin_side/backend
python -m uvicorn app.main:app --reload
```

The backend should be accessible at:
- Local: `http://localhost:8000`
- Production: Check `VITE_API_URL` in Admin_side

## Troubleshooting

### Problem: "Cannot find module" errors
**Solution:**
```powershell
cd User_side
rm -rf node_modules package-lock.json
npm install
```

### Problem: Login doesn't work
**Solution:**
1. Verify backend is running
2. Check browser console for errors
3. Ensure credentials are correct
4. Check network tab for API calls

### Problem: Redirect loop at /login
**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Refresh browser
3. Try logging in again

### Problem: Admin styles look different
**Solution:** This is expected - Admin has its own styling that applies when you're in admin routes

## File Changes Summary

### Modified Files
✓ `User_side/src/App.tsx` - Added routing logic  
✓ `User_side/src/app/components/TopDashboard.tsx` - Changed profile to login button  
✓ `User_side/vite.config.ts` - Added @admin alias  
✓ `User_side/tsconfig.json` - Added path mapping  

### New Files
✓ `User_side/src/utils/auth-manager.tsx` - Global auth state  
✓ `User_side/src/router/AdminLoginPage.tsx` - Login wrapper  
✓ `User_side/src/router/AdminApp.tsx` - Admin dashboard wrapper  

### Unchanged
✓ All User_side components  
✓ All Admin_side components  
✓ All styling and themes  
✓ All backend code  

## Testing Checklist

- [ ] Install dependencies
- [ ] Start dev server
- [ ] Open browser to localhost
- [ ] See User home page
- [ ] Click Login button (top-right)
- [ ] See Admin login page
- [ ] Enter credentials
- [ ] Login successful → Admin dashboard
- [ ] All admin modules work
- [ ] Refresh page → still logged in
- [ ] Click Logout → back to User home
- [ ] Try accessing /admin without login → redirect to /login

## Support

If you encounter issues:
1. Check `UNIFIED_NAVIGATION_GUIDE.md` for detailed documentation
2. Review browser console for errors
3. Check network tab for failed API calls
4. Verify backend is running and accessible

---

**Ready to test!** 🚀
