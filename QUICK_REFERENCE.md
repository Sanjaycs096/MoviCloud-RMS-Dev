# Quick Reference Card - Unified Navigation

## 🎯 Quick Links

- **Installation:** See `QUICK_START.md`
- **Full Guide:** See `UNIFIED_NAVIGATION_GUIDE.md`
- **Architecture:** See `ARCHITECTURE_DIAGRAM.md`
- **Summary:** See `IMPLEMENTATION_SUMMARY.md`
- **Pre-Testing:** See `PRE_TESTING_CHECKLIST.md`

---

## 🚀 Start Application

```powershell
cd User_side
npm install
npm run dev
```

---

## 🔑 Default Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | User Home | No |
| `/menu` | Menu | No |
| `/cart` | Shopping Cart | No |
| `/orders` | Orders | No |
| `/login` | Admin Login | No |
| `/admin` | Admin Dashboard | **Yes** |
| `/admin/*` | Admin Modules | **Yes** |

---

## 🎨 UI Changes

| Component | Before | After |
|-----------|--------|-------|
| TopDashboard Button | Profile Icon | Login/Logout Icon |
| Button Action | Open Profile | Login → Navigate to /login<br>Logout → Clear session |
| Button Tooltip | "Profile" | "Admin Login" / "Logout (Name)" |

**Visual Appearance:** UNCHANGED (same position, styling, size)

---

## 🔐 Admin Credentials

Check: `Admin_side/backend/seed_data.py`

Typically:
- Email: `admin@restaurant.com`
- Email: `manager@restaurant.com`
- Email: `chef@restaurant.com`

---

## 📁 Modified Files (4)

1. `User_side/src/App.tsx` - Routing
2. `User_side/src/app/components/TopDashboard.tsx` - Button
3. `User_side/vite.config.ts` - Paths
4. `User_side/tsconfig.json` - Types

---

## 📁 New Files (3)

1. `User_side/src/utils/auth-manager.tsx`
2. `User_side/src/router/AdminLoginPage.tsx`
3. `User_side/src/router/AdminApp.tsx`

---

## 🧪 Quick Test Sequence

1. ✓ Open app → See User home
2. ✓ Click Login → See admin login
3. ✓ Login → See admin dashboard
4. ✓ Refresh → Still logged in
5. ✓ Logout → Back to User home

---

## 🐛 Common Issues

**Can't find module errors?**
→ Run `npm install` in User_side

**Login doesn't work?**
→ Start Admin backend first

**Styles look wrong?**
→ Clear cache, hard refresh (Ctrl+Shift+R)

**Redirect loop?**
→ Clear localStorage: `localStorage.clear()`

---

## 💡 Key Concepts

**Auth Manager:** Global state for admin authentication

**Route Guard:** Protects `/admin/*` routes from unauthorized access

**Lazy Loading:** Admin components load only when needed

**Wrappers:** Reuse Admin code without duplication

**Session:** Stored in `localStorage` as `rms_current_user`

---

## 🎯 Success Criteria

- [x] User modules load by default
- [x] Login button visible in header
- [x] Login page accessible at `/login`
- [x] Admin dashboard at `/admin` (protected)
- [x] Session persists on refresh
- [x] Logout clears session
- [x] No UI changes visible
- [x] No code duplication

---

## 📞 Support

**Documentation:**
- Quick Start: `QUICK_START.md`
- Testing Guide: `UNIFIED_NAVIGATION_GUIDE.md`
- Pre-flight Check: `PRE_TESTING_CHECKLIST.md`

**Troubleshooting:**
1. Check browser console
2. Check network tab
3. Verify backend is running
4. Review error messages

---

## 🏗️ Architecture Summary

```
User Opens App
    ↓
User Modules (Default)
    ↓
Click Login Button
    ↓
Admin Login Page
    ↓
Valid Credentials
    ↓
Admin Dashboard
    ↓
Click Logout
    ↓
Back to User Modules
```

---

## 🔧 Backend Requirements

**Must be running:**
```powershell
cd Admin_side/backend
python -m uvicorn app.main:app --reload
```

**Default URL:** `http://localhost:8000`

---

## 📊 Status

**Implementation:** ✅ Complete  
**Testing:** ⏳ Pending  
**Documentation:** ✅ Complete  
**Deployment:** ⏳ Pending  

---

**Version:** 1.0  
**Date:** February 24, 2026  
**By:** Movicloud Labs

---

Print this for quick reference! 📋
