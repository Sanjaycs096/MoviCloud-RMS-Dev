# MoviCloud RMS (Restaurant Management System)

MoviCloud RMS is a comprehensive, feature-rich Restaurant Management System designed to streamline operations from order taking to backend analytics. This repository contains the **Frontend** application built with modern web technologies.

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

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.10 or higher) - for Backend
- MongoDB - for Database

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

### Windows Quick Start (`start.bat`)

A convenience Windows batch script `start.bat` is provided to simplify starting the frontend during development. The script:

- Verifies `node` and `npm` are available in `PATH`.
- Installs dependencies (uses `npm ci` when `package-lock.json` exists) if `node_modules` is missing.
- Runs the configured npm script (defaults to `dev`).

Usage (from the `frontend` folder):

Command Prompt or PowerShell:

```powershell
start.bat
```

Optional: pass an npm script name as the first argument. Example — start the `build` script:

```powershell
start.bat build
```

Direct npm alternatives (without the batch helper):

```bash
npm run dev
# or
npm run build
```

Troubleshooting

- If you see "Node.js is not installed or not in PATH", install Node.js from https://nodejs.org/ and re-open your terminal.
- If dependency installation fails, try running `npm ci` or `npm install` manually and inspect the error output.
- Ensure you run the script from the `frontend` folder (where `package.json` lives).

The `start.bat` file is intentionally conservative: it exits with a non-zero code on failures so CI or other tooling can detect problems.

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

## 🤝 Contribution Guidelines

1. **Branching**: Create a separate branch for your module features (e.g., `feature/menu-module`, `fix/billing-bug`).
2. **Components**: Keep components modular. If a file becomes too large (like `menu-management.tsx`), refactor it into smaller sub-components within a dedicated folder.
3. **Styling**: Use Tailwind utility classes. Avoid inline styles.
4. **Icons**: Use `lucide-react` for all icons.

---
*Created for the MoviCloud RMS Team.*
