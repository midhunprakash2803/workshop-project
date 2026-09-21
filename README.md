# RentIQ: QR-Based Rental Asset Tracking & Return Management System

**RentIQ** is a production-ready, full-stack web application designed for enterprise and campus asset tracking, digital return inspections, equipment reservation accountability, and automated overdue monitoring.

---

## Key Features

1. **RBAC & Multi-Role Governance**:
   - **ADMIN**: Full management across assets, categories, rental request approvals/rejections, maintenance tickets, audit trail logs, and live analytics dashboard.
   - **STAFF**: Fast QR scanning, checkout issue with pre-issue condition recording & photos, return inspection with post-condition verification, and damage reporting.
   - **BORROWER**: Browse available equipment catalog, scan/inspect asset details via QR, submit reservation requests with date picker and availability check, track active/past rentals.

2. **Asset Lifecycle State Machine Engine**:
   - Strict backend validation enforcing valid state progressions:
   - `AVAILABLE` ➔ `REQUESTED` ➔ `APPROVED` ➔ `ISSUED` (ACTIVE) ➔ `RETURN_INITIATED` ➔ `INSPECTION` ➔ `VERIFIED` ➔ `AVAILABLE`
   - Damage Branch: `INSPECTION` ➔ `DAMAGED` ➔ `MAINTENANCE` ➔ `AVAILABLE`
   - Rejections & Cancellations: `REQUESTED` ➔ `REJECTED` / `CANCELLED` ➔ `AVAILABLE`

3. **Overlapping Rental Prevention Algorithm**:
   - Strict date-interval check to eliminate double-booking:
   - An asset is unavailable if `(requested_start < existing_end) AND (requested_end > existing_start)` against any active rental or approved reservation.

4. **QR Code Generation & Camera Scanner**:
   - Unique QR token and direct link `/assets/{assetId}` generated for each asset.
   - Interactive QR modal with high-res PNG download and print-ready asset tag.
   - Live HTML5 camera scanner with device switching, photo upload fallback, and manual code lookup.

5. **Digital Return Inspection & Side-by-Side Comparison**:
   - Pre-issue baseline recording (condition: `EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`, checklist notes, and baseline photos).
   - Post-return inspection check-in with return remarks and photographic damage evidence upload via Multer.
   - Side-by-side accountability comparison modal displaying Stage 1 Pre-Issue vs Stage 2 Post-Return.
   - Automatic routing: Damaged items immediately generate a damage incident report and enter the `MAINTENANCE` queue.

6. **Overdue Detection Engine**:
   - Scheduled background cron job (`node-cron`) checking `due_date < NOW() AND status = 'ACTIVE'`.
   - Transitions rentals to `OVERDUE`, creates in-app alerts for borrowers and staff, and logs audit events.
   - On-demand trigger endpoint for instant admin execution.

7. **Audit Trail & In-App Notification Center**:
   - Structured logging of all system actions (user ID, before/after diffs, entity type, IP address, timestamp).
   - Real-time unread notification bell with mark-all-as-read functionality.

8. **Live Metrics Dashboard**:
   - Aggregate KPIs: Total Assets, Available Inventory, Active Deployments, Overdue Alerts, Maintenance Queue.
   - Visual category distribution and urgent overdue attention alerts.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Lucide Icons, Axios, QRCode.react, HTML5-QRCode.
- **Backend**: Node.js, Express.js RESTful API, JWT Auth, Bcrypt.js, Multer, Node-Cron, Morgan.
- **Database**: PostgreSQL (Prisma ORM) with local SQLite zero-friction development fallback.

---

## Directory Structure

```
new-rental/
├── backend/
│   ├── database/
│   │   ├── schema.sql            # PostgreSQL DDL with indexes & constraints
│   │   └── seed.sql              # Raw PostgreSQL seed statements
│   ├── prisma/
│   │   ├── schema.prisma         # Production PostgreSQL Prisma schema
│   │   ├── schema.sqlite.prisma  # Local SQLite Prisma schema
│   │   └── seed.js               # Prisma database seeder
│   ├── scripts/
│   │   └── setup-db.js           # Smart DB setup & migration runner
│   ├── src/
│   │   ├── config/               # Database & environment configuration
│   │   ├── controllers/          # API controllers (auth, assets, rentals, etc.)
│   │   ├── middleware/           # JWT auth, RBAC, Multer uploads, error handler
│   │   ├── routes/               # Express route definitions
│   │   ├── services/             # State machine, availability, cron, audit
│   │   └── server.js             # Server entry point
│   ├── test/                     # Unit & E2E API test suites
│   ├── uploads/                  # Evidence photo storage
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Common UI, QR scanner/viewer, inspection modals
│   │   ├── context/              # AuthContext & NotificationContext
│   │   ├── pages/                # Dashboard, Assets, Detail, Requests, Rentals, etc.
│   │   ├── services/             # Axios API client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Seed Accounts & Credentials

The system includes pre-configured demo accounts with 1-click login buttons on the login page:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **ADMIN** | `admin@rentiq.com` | `Admin@123` | Full system access, request approval/rejection, maintenance, audit trail |
| **STAFF** | `staff1@rentiq.com` | `Staff@123` | Scan QR, issue equipment, conduct digital return inspections, report damage |
| **STAFF** | `staff2@rentiq.com` | `Staff@123` | Scan QR, issue equipment, conduct digital return inspections, report damage |
| **BORROWER** | `borrower1@rentiq.com` | `Borrower@123` | Browse catalog, scan QR, submit reservation requests, track overdue |
| **BORROWER** | `borrower2@rentiq.com` | `Borrower@123` | Browse catalog, scan QR, submit reservation requests, track overdue |

---

## Local Development Setup

### 1. Backend Setup

```bash
cd backend
npm install

# Option A: Zero-friction local setup (runs immediately with SQLite)
npm run db:setup

# Option B: Run with PostgreSQL
# In backend/.env, set your PostgreSQL connection string:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/rentiq_db?schema=public"
# Then run:
npm run db:setup

# Run automated test suite
npm test

# Start backend server (runs on port 5000)
npm run dev
```

Verify backend health:
```bash
curl http://localhost:5000/api/health
# Response: {"status":"ok","service":"rentiq-backend-api",...}
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Vite development server (runs on port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Production Deployment Guide

### A. Database (Managed PostgreSQL)
Deploy using any managed PostgreSQL provider (Render PostgreSQL, Neon.tech, Supabase, or AWS RDS):
1. Create a new PostgreSQL database instance.
2. Obtain your connection URI:
   `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`
3. Push schema and seed data:
   ```bash
   cd backend
   # Set DATABASE_URL to your remote connection string
   npx prisma db push --schema=prisma/schema.prisma
   node prisma/seed.js
   ```
   Or execute `backend/database/schema.sql` and `backend/database/seed.sql` in your SQL console.

### B. Backend API (Render / Railway)
1. In Render, create a new **Web Service** connected to your repository with root directory `/backend`.
2. Build Command: `npm install && npx prisma generate --schema=prisma/schema.prisma`
3. Start Command: `node src/server.js`
4. Set Environment Variables:
   - `DATABASE_URL`: Your Managed PostgreSQL URI.
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: Secure random 64-char string.
   - `CLIENT_URL`: Your production frontend URL (e.g. `https://rentiq.vercel.app`).
   - `UPLOAD_DIR`: `uploads` (or connect AWS S3 / Cloudinary for cloud photo persistence).

### C. Frontend SPA (Vercel / Netlify)
1. In Vercel, import project with root directory `/frontend`.
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set Environment Variable:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://rentiq-api.onrender.com/api`).
