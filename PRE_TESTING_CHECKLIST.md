# Pre-Testing Verification Checklist

Before running `npm run dev`, verify these files were created/modified correctly:

## ✓ Modified Files

### 1. User_side/src/App.tsx
- [ ] Imports BrowserRouter, Routes, Route, Navigate
- [ ] Imports lazy and Suspense from React
- [ ] Imports AuthManager and useAuthManager
- [ ] Creates AdminRouteGuard component
- [ ] Creates AppRouter component with route logic
- [ ] Wraps everything with BrowserRouter > AuthManager
- [ ] Lazy loads AdminLoginPage and AdminApp

**Quick Check:**
```powershell
Select-String -Path "User_side/src/App.tsx" -Pattern "AuthManager|AdminRouteGuard|Suspense"
```

---

### 2. User_side/src/app/components/TopDashboard.tsx
- [ ] Imports LogIn and LogOut icons (removed User icon)
- [ ] Imports useAuthManager hook
- [ ] Imports useNavigate from react-router-dom
- [ ] Creates handleAuthButtonClick function
- [ ] Button shows LogIn when not authenticated
- [ ] Button shows LogOut when authenticated
- [ ] onClick calls handleAuthButtonClick

**Quick Check:**
```powershell
Select-String -Path "User_side/src/app/components/TopDashboard.tsx" -Pattern "LogIn|LogOut|handleAuthButtonClick"
```

---

### 3. User_side/vite.config.ts
- [ ] Imports path module
- [ ] Has '@' alias pointing to './src'
- [ ] Has '@admin' alias pointing to '../Admin_side/frontend/src'
- [ ] Has optimizeDeps config

**Quick Check:**
```powershell
Select-String -Path "User_side/vite.config.ts" -Pattern "@admin"
```

---

### 4. User_side/tsconfig.json
- [ ] Has paths object with "@/*": ["src/*"]
- [ ] Has paths object with "@admin/*": ["../Admin_side/frontend/src/*"]
- [ ] Include array has both "src" and "../Admin_side/frontend/src"

**Quick Check:**
```powershell
Select-String -Path "User_side/tsconfig.json" -Pattern "@admin"
```

---

## ✓ New Files Created

### 5. User_side/src/utils/auth-manager.tsx
- [ ] File exists
- [ ] Exports AuthManager component
- [ ] Exports useAuthManager hook
- [ ] Exports UserRole and AdminUser types
- [ ] Creates AuthManagerContext
- [ ] Checks localStorage for 'rms_current_user'
- [ ] Provides isAdminAuthenticated state
- [ ] Provides logoutAdmin function

**Quick Check:**
```powershell
Test-Path "User_side/src/utils/auth-manager.tsx"
```

---

### 6. User_side/src/router/AdminLoginPage.tsx
- [ ] File exists
- [ ] Imports from '@admin/app/components/login-page'
- [ ] Imports from '@admin/utils/auth-context'
- [ ] Imports from '@admin/utils/system-config-context'
- [ ] Imports '@admin/styles/index.css'
- [ ] Wraps LoginPage with AuthProvider and SystemConfigProvider
- [ ] Exports AdminLoginPage function

**Quick Check:**
```powershell
Test-Path "User_side/src/router/AdminLoginPage.tsx"
```

---

### 7. User_side/src/router/AdminApp.tsx
- [ ] File exists
- [ ] Imports from '@admin/app/App'
- [ ] Imports '@admin/styles/index.css'
- [ ] Exports AdminApp function
- [ ] Returns AdminAppComponent directly

**Quick Check:**
```powershell
Test-Path "User_side/src/router/AdminApp.tsx"
```

---

## ✓ Verification Commands

Run these to verify files exist and have correct content:

```powershell
# Navigate to project root
cd c:\Users\sanja\project\MOVICLOUD_RMS

# Check all modified files exist
$files = @(
    "User_side\src\App.tsx",
    "User_side\src\app\components\TopDashboard.tsx",
    "User_side\vite.config.ts",
    "User_side\tsconfig.json",
    "User_side\src\utils\auth-manager.tsx",
    "User_side\src\router\AdminLoginPage.tsx",
    "User_side\src\router\AdminApp.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file MISSING!" -ForegroundColor Red
    }
}

# Check critical imports
Write-Host "`nChecking critical imports..." -ForegroundColor Yellow

# Check App.tsx has AuthManager
if (Select-String -Path "User_side\src\App.tsx" -Pattern "AuthManager" -Quiet) {
    Write-Host "✓ App.tsx imports AuthManager" -ForegroundColor Green
} else {
    Write-Host "✗ App.tsx missing AuthManager" -ForegroundColor Red
}

# Check TopDashboard has LogIn
if (Select-String -Path "User_side\src\app\components\TopDashboard.tsx" -Pattern "LogIn" -Quiet) {
    Write-Host "✓ TopDashboard imports LogIn icon" -ForegroundColor Green
} else {
    Write-Host "✗ TopDashboard missing LogIn icon" -ForegroundColor Red
}

# Check vite config has @admin alias
if (Select-String -Path "User_side\vite.config.ts" -Pattern "@admin" -Quiet) {
    Write-Host "✓ vite.config.ts has @admin alias" -ForegroundColor Green
} else {
    Write-Host "✗ vite.config.ts missing @admin alias" -ForegroundColor Red
}

Write-Host "`nVerification complete!" -ForegroundColor Cyan
```

---

## ✓ Admin_side Verification

Ensure Admin_side components exist:

```powershell
# Check Admin files that will be imported
$adminFiles = @(
    "Admin_side\frontend\src\app\App.tsx",
    "Admin_side\frontend\src\app\components\login-page.tsx",
    "Admin_side\frontend\src\utils\auth-context.tsx",
    "Admin_side\frontend\src\utils\system-config-context.tsx",
    "Admin_side\frontend\src\styles\index.css"
)

Write-Host "`nChecking Admin_side files..." -ForegroundColor Yellow

foreach ($file in $adminFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file MISSING!" -ForegroundColor Red
    }
}
```

---

## ✓ Documentation Verification

```powershell
# Check documentation files
$docs = @(
    "QUICK_START.md",
    "UNIFIED_NAVIGATION_GUIDE.md",
    "ARCHITECTURE_DIAGRAM.md",
    "IMPLEMENTATION_SUMMARY.md"
)

Write-Host "`nChecking documentation..." -ForegroundColor Yellow

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "✓ $doc" -ForegroundColor Green
    } else {
        Write-Host "✗ $doc MISSING!" -ForegroundColor Red
    }
}
```

---

## ✓ Final Pre-Flight Check

Before starting the dev server:

```powershell
# Navigate to User_side
cd User_side

# 1. Check package.json exists
Write-Host "1. Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✓ package.json exists" -ForegroundColor Green
} else {
    Write-Host "✗ package.json missing!" -ForegroundColor Red
}

# 2. Install dependencies
Write-Host "`n2. Installing dependencies..." -ForegroundColor Yellow
npm install

# 3. Check for TypeScript errors (optional, may show errors before running)
Write-Host "`n3. TypeScript check..." -ForegroundColor Yellow
Write-Host "Note: Errors are expected until npm install completes" -ForegroundColor Cyan

# 4. List key dependencies
Write-Host "`n4. Verifying key dependencies..." -ForegroundColor Yellow
npm list react react-dom react-router-dom 2>$null

Write-Host "`n✓ Pre-flight check complete!" -ForegroundColor Green
Write-Host "Ready to run: npm run dev" -ForegroundColor Cyan
```

---

## ✓ Expected Warnings

You may see these warnings (they're OK):

1. **"Cannot find module 'react'"** - Before npm install
2. **Peer dependency warnings** - Safe to ignore
3. **TypeScript errors in IDE** - Will resolve after install
4. **Vite optimization warnings** - Normal on first run

---

## 🚀 Ready to Start?

If all checks pass:

```powershell
cd User_side
npm run dev
```

Then open browser to the URL shown (usually http://localhost:5173)

---

## 🐛 If Something's Wrong

1. **Files missing?**
   - Re-check file paths
   - Ensure you saved all changes

2. **Import errors?**
   - Run `npm install` in User_side
   - Restart dev server
   - Clear browser cache

3. **Type errors?**
   - Restart TypeScript server in VSCode
   - Close and reopen VSCode

4. **Still stuck?**
   - Check UNIFIED_NAVIGATION_GUIDE.md troubleshooting section
   - Review browser console errors
   - Check network tab for failed requests

---

Save this file and run through each checklist before testing!
