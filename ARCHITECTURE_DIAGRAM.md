# Architecture Diagram - Unified Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOVICLOUD RMS APPLICATION                        │
│                        (User_side as Entry Point)                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           User Opens Browser                             │
│                                   ↓                                      │
│                            Loads User_side/                             │
│                         index.html → main.tsx                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              App.tsx Router                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              BrowserRouter + AuthManager Wrapper                  │  │
│  │  (Wraps entire app with global auth state management)            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         AppRouter Logic                           │  │
│  │  • Checks current route                                           │  │
│  │  • Checks auth state (isAdminAuthenticated)                       │  │
│  │  • Routes to appropriate component                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   ↓
                    ┌──────────────┴──────────────┐
                    │                             │
            Route Starts With:              Route Equals:
                /admin/*                        /login
                    │                             │
                    ↓                             ↓
        ┌───────────────────────┐   ┌───────────────────────┐
        │   AdminRouteGuard     │   │  AdminLoginPage.tsx   │
        │ (Check auth status)   │   │  (Lazy loaded)        │
        └───────────────────────┘   └───────────────────────┘
                    │                             │
         ┌──────────┴──────────┐                  │
         │                     │                  │
    isAuthenticated?      NOT Authenticated       │
         │                     │                  │
         ↓                     ↓                  ↓
    ┌─────────┐         ┌──────────┐      ┌──────────┐
    │ AdminApp│         │ Redirect │      │  Render  │
    │  .tsx   │         │ to /login│      │  Login   │
    │ (Lazy)  │         └──────────┘      │   Page   │
    └─────────┘                           └──────────┘
         │                                       │
         │                                       │
         ↓                                       ↓
    ┌─────────────────────┐            ┌──────────────────┐
    │   ADMIN DASHBOARD   │            │  ADMIN LOGIN UI  │
    │  (from Admin_side)  │            │ (from Admin_side)│
    │                     │            │                  │
    │ • AuthProvider      │            │ • Email input    │
    │ • SystemConfig      │            │ • Password input │
    │ • All Admin Modules │            │ • Submit button  │
    └─────────────────────┘            └──────────────────┘
                                                │
                                        Login Success
                                                ↓
                                    Save to localStorage:
                                    'rms_current_user'
                                                ↓
                                        Navigate to /admin
                                                ↓
                                        (See Admin Dashboard)


                    All Other Routes (/, /menu, /cart, etc.)
                                    ↓
                    ┌───────────────────────────────┐
                    │    FigmaApp (User Modules)    │
                    │  • LoyaltyProvider            │
                    │  • NotificationsProvider      │
                    │  • TopDashboard               │
                    │  • All User Components        │
                    └───────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │      TopDashboard Header      │
                    │  ┌─────────────────────────┐  │
                    │  │  [Cart] [Notif] [Login] │  │
                    │  │           OR             │  │
                    │  │  [Cart] [Notif][Logout] │  │
                    │  └─────────────────────────┘  │
                    │                               │
                    │  Click Login → navigate('/login')
                    │  Click Logout → logoutAdmin() │
                    └───────────────────────────────┘
