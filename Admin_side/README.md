# MoviCloud RMS (Restaurant Management System)

MoviCloud RMS is a comprehensive, feature-rich Restaurant Management System designed to streamline operations from order taking to backend analytics. This repository contains the **Frontend** application built with modern web technologies.

## ✅ Latest Updates (Feb 4, 2026)

**Backend & Database Integration Complete!** 🎉

- ✅ Backend API fully connected to MongoDB
- ✅ Delivery Module: Real-time rider & order tracking
- ✅ Inventory Module: Live ingredient management
- ✅ Auto-refresh every 10 seconds
- ✅ All API endpoints working with live data

**See**: [CONTRIBUTIONS.md](CONTRIBUTIONS.md) for detailed summary


---

## 🚀 Project Overview

This project is structured to be developed by a team of 14 developers (2 UI, 7 Backend, 7 Frontend), split into specific functional modules.

### Tech Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend**: Python
- **Database**: MongoDB
- **Integration**: REST APIs
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for Frontend

## 📦 Module Responsibilities

The application is divided into 14 core modules. Please refer to this list to know which files correspond to your assigned module.

| # | Module Name | Responsibilities | Key Components / Directories |
|---|---|---|---|
| **1** | **Admin Module** | Dashboard, User/Role Management, Branch, Tax/Discount Config | `admin-dashboard.tsx`, `settings/role-based-access.tsx`, `settings/tax-service.tsx` |
| **3** | **Menu Management** | Categories, Items, Stock, Customization, Availability | `menu-management.tsx` |
| **4** | **Order Management** | New Orders, Status Tracking (Placed/Ready/Served), KOT, Split/Merge | `order-management.tsx`, `quick-order-pos.tsx` |
| **5** | **Kitchen Module** | Live Order Queue, Prep Status, Priority Handling | `kitchen-display.tsx` |
| **6** | **Billing & Payment** | Bill Gen, Tax Calc, Payment Modes, Invoices, Refunds | `billing-payment.tsx`, `payment-dialog.tsx` |
| **7** | **Inventory Management** | Stock Tracking, Auto-deduction, Alerts, Suppliers | `inventory-management.tsx` |
| **8** | **Staff Management** | Onboarding, Roles, Shifts, Attendance, Performance | `staff-management.tsx` |
| **9** | **Table Management** | Layout, Availability, Waiter Assignment, Reservations | `table-management.tsx` |
| **10** | **Delivery Management** | Delivery Partners, Tracking, Address/Routes | `delivery-management.tsx` |
| **11** | **Offers & Loyalty** | Coupons, Promo Codes, Loyalty Points, Membership | `offers-loyalty.tsx` |
| **12** | **Reports & Analytics** | Sales Reports, Item Analysis, Peak Hours, Staff Perf | `reports-analytics.tsx` |
| **13** | **Notification Module** | Order Alerts, Payment Confirmations, Reminders | `notification-management.tsx`, `settings/notification-settings.tsx` |
| **14** | **Security & Settings** | RBAC, Audit Logs, Backup, System Config | `settings/` (Audit, Backup, System Config, Account) |

> **Note**: Module 2 is reserved/skipped in the current numbering scheme.

## 🛠️ Getting Started

### 🚀 Quick Start (Recommended)

See **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** for complete setup guide with all available resources!

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.10 or higher) - for Backend
- MongoDB - for Database (✅ Already configured with MongoDB Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd RMS
   ```
3. Install Frontend dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the frontend development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Mock Data Mode

The application currently supports a **Mock Data** mode for frontend development without a live backend.

- Toggle `USE_MOCK_DATA` in `src/utils/mock-data.ts`.
- When `true`, the app uses static data defined in the same file.
- When `false`, it attempts to connect to the Python Backend via REST API.

## 📂 Project Structure

```text
src/
├── app/
│   ├── components/         # Core Feature Components
│   │   ├── ui/             # Reusable UI components (Buttons, Inputs, etc.)
│   │   ├── settings/       # Settings & Security Sub-modules
│   │   └── ...             # Feature-specific components (e.g., order-management.tsx)
│   └── ...
├── utils/
│   ├── mock-data.ts        # Mock data for all modules
│   └── ...
├── App.tsx                 # Main Application Layout & Routing
└── main.tsx                # Entry Point
```

## 🐛 Recent Bug Fixes

### Fixed Issues (February 2, 2026)

1. **order-management.tsx (Line 214)** - TypeError: Cannot read properties of undefined (reading 'split')
   - **Issue**: `generateOrderDisplayId()` function was attempting to call `.split()` on undefined `order.id`
   - **Fix**: Added null/undefined check and optional parameter handling. Function now returns `#UNKNOWN` if ID is unavailable
   - **Changed**: Added proper type annotation `orderId: string | undefined` and guard clause

2. **kitchen-display.tsx (Line 137)** - TypeError: Cannot read properties of undefined (reading 'split')
   - **Issue**: Order ID display was directly calling `.split()` without checking if `order.id` exists
   - **Fix**: Added optional chaining (`?.`) and fallback value (`|| 'UNKNOWN'`) for safer ID extraction
   - **Changed**: `order.id.split('-')[1]?.slice(0, 6).toUpperCase()` → `order.id?.split('-')[1]?.slice(0, 6).toUpperCase() || 'UNKNOWN'`

---

## 🤝 Contribution Guidelines

1. **Branching**: Create a separate branch for your module features (e.g., `feature/menu-module`, `fix/billing-bug`).
2. **Components**: Keep components modular. If a file becomes too large (like `menu-management.tsx`), refactor it into smaller sub-components within a dedicated folder.
3. **Styling**: Use Tailwind utility classes. Avoid inline styles.
4. **Icons**: Use `lucide-react` for all icons.

---
*Created for the MoviCloud RMS Team.*

