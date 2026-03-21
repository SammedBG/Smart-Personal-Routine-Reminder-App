<p align="center">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Mobile-React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Notifications-Firebase_FCM-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
</p>

# 💊 Smart Personal Routine Reminder System

A **production-ready** personal routine and medicine reminder app with a **FastAPI** backend and a **React Native** mobile client. Manage daily routines — medicines, meals, hydration, sleep, exercise, and custom reminders — with cloud sync, offline-first capability, and push/local notifications.

---

## ✨ Features

### Core
- **🔐 Secure Authentication** — Registration, login, and logout with JWT access + refresh tokens. Passwords hashed with bcrypt. Tokens stored in the device Keychain/Keystore. Automatic token refresh with request queuing on 401.
- **💊 Smart Reminders** — Create and manage reminders with 6 types: medicine, food, water, sleep, exercise, and custom. Medicine reminders support dosage, quantity, before/after food, and duration tracking. Exercise reminders track type, duration, and intensity.
- **🔄 Repeat Scheduling** — Flexible scheduling: once, daily, weekly, or custom days. Automatic next-trigger computation with timezone-aware date handling and start/end date boundaries.
- **✅ Completion Tracking** — Mark reminders as done, skipped, snoozed, or missed. Full streak analytics with daily/weekly breakdown and completion rates.

### Sync & Offline
- **☁️ Cloud Sync** — Backend is the source of truth. Incremental sync via `GET /reminders/sync?since=...` ensures the mobile client stays up-to-date with minimal data transfer.
- **📴 Offline-First** — App reads and writes from local SQLite first. Failed writes are queued in an offline operation queue and flushed in-order when connectivity is restored.
- **🔃 Conflict Resolution** — Server-side version counter (`Reminder.version`) enables the client to detect stale data. Soft-deleted reminders are included in sync so clients can detect server-side deletions.

### Notifications
- **🔔 Push Notifications** — Firebase Cloud Messaging (FCM) delivers notifications even when the app is closed. Backend APScheduler checks for due reminders every 60 seconds.
- **📱 Local Notifications** — Scheduled natively on the device using `react-native-push-notification`, so reminders work fully offline without internet.
- **📲 Multi-Device** — Each device registers its FCM token; reminders are delivered to all of a user's active devices.

### Developer Experience
- **🧪 55 Tests** — 26 backend tests (pytest) + 29 mobile tests (Jest) covering auth, reminders, completions, stores, and edge cases.
- **🚀 CI/CD Pipeline** — 6-job GitHub Actions pipeline: backend lint (ruff), backend tests, Docker build, mobile lint + typecheck (TSC + ESLint), mobile tests (Jest), Android APK build.
- **🏗️ Clean Architecture** — Layered backend (Routes → Services → Repositories → Models) with FastAPI dependency injection. Mobile uses Zustand stores with API/DAO separation.

---

## 🏛️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Mobile App                        │
│  React Native · TypeScript · Zustand · SQLite        │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Screens │→ │  Stores  │→ │ API Client (Axios)│    │
│  └─────────┘  └──────────┘  └────────┬─────────┘    │
│       ↕            ↕                  │              │
│  ┌─────────┐  ┌──────────┐           │              │
│  │ Local   │  │ Offline  │           │              │
│  │ SQLite  │  │  Queue   │           │              │
│  └─────────┘  └──────────┘           │              │
└──────────────────────────────────────┼──────────────┘
                                       │ HTTPS
┌──────────────────────────────────────┼──────────────┐
│                  Backend API         │              │
│  FastAPI · Python 3.11 · Pydantic v2 │              │
│                                      ↓              │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Routes  │→ │ Services │→ │  Repositories    │   │
│  └─────────┘  └──────────┘  └────────┬─────────┘   │
│       ↕                              │              │
│  ┌─────────┐  ┌──────────┐  ┌───────┴──────────┐   │
│  │  Auth   │  │ Scheduler│  │ PostgreSQL/SQLite │   │
│  │ (JWT)   │  │(APSched) │  └──────────────────┘   │
│  └─────────┘  └────┬─────┘                          │
│                     │                                │
│               ┌─────┴──────┐                         │
│               │  Firebase  │                         │
│               │    FCM     │                         │
│               └────────────┘                         │
└──────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
SmartApp/
├── backend/
│   ├── app/
│   │   ├── api/v1/             # Route handlers (auth, users, reminders, completions, devices, health)
│   │   ├── core/               # Security (JWT, bcrypt), dependency injection
│   │   ├── db/                 # Async SQLAlchemy session & engine
│   │   ├── models/             # ORM models (User, Reminder, Device, CompletionRecord)
│   │   ├── schemas/            # Pydantic v2 request/response schemas
│   │   ├── repositories/       # Data access layer with query builders
│   │   ├── services/           # Business logic (auth, reminders, completions, devices)
│   │   ├── notifications/      # Firebase Cloud Messaging integration
│   │   ├── scheduler/          # APScheduler worker for due-reminder checks
│   │   ├── config.py           # Pydantic Settings (env vars)
│   │   └── main.py             # FastAPI app factory
│   ├── alembic/                # Database migration scripts
│   ├── tests/                  # pytest test suite (26 tests)
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Production container image
├── mobile/
│   ├── src/
│   │   ├── api/                # Axios client with auto-refresh interceptor
│   │   ├── db/                 # SQLite database, reminder DAO, offline queue
│   │   ├── navigation/         # React Navigation (auth stack + main tabs)
│   │   ├── screens/            # Login, Register, Today, Reminders, Analytics, Settings
│   │   ├── services/           # SecureStorage, SyncService, NotificationService
│   │   ├── store/              # Zustand stores (auth, reminders, completions)
│   │   ├── theme/              # Dark/light theme context
│   │   ├── components/         # Reusable UI components (DatePickerInline, etc.)
│   │   └── __tests__/          # Jest test suite (29 tests)
│   ├── android/                # Android native project
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/ci.yml   # 6-job CI pipeline
├── docker-compose.yml          # One-command backend + PostgreSQL
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Component | Requirement |
|-----------|-------------|
| **Backend** | Python 3.11+, PostgreSQL 14+ (or use SQLite for local dev) |
| **Mobile** | Node.js 18+, React Native CLI, Android Studio / Xcode |
| **Optional** | Docker & Docker Compose, Firebase project for FCM |

### Option 1 — Docker (Backend Only)

```bash
# 1. Clone the repository
git clone https://github.com/SammedBG/Smart-Personal-Routine-Reminder-App.git
cd Smart-Personal-Routine-Reminder-App

# 2. Create backend/.env from the example
cp backend/.env.example backend/.env
# Edit backend/.env and set strong JWT secrets

# 3. Start everything
docker compose up --build
```

| Service | URL |
|---------|-----|
| API | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/docs` |
| Health Check | `http://localhost:8000/api/v1/health` |

### Option 2 — Local Development

<details>
<summary><strong>Backend Setup</strong></summary>

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\Activate.ps1  # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET_KEY, JWT_REFRESH_SECRET_KEY, DATABASE_URL

# Run database migrations
cd ..
alembic -c backend/alembic.ini upgrade head

# Start the API server
uvicorn backend.app.main:app --reload --port 8000

# (In a separate terminal) Start the reminder scheduler
python -m backend.app.scheduler.apscheduler_worker
```

> **Note:** If `DATABASE_URL` is not set, the backend defaults to a local SQLite file (`backend/smart_routines.db`) — perfect for development.

</details>

<details>
<summary><strong>Mobile Setup</strong></summary>

```bash
cd mobile

# Install dependencies
npm install

# Apply patches
npx patch-package

# Set your API URL in src/config.ts
# For Android emulator: http://10.0.2.2:8000/api/v1
# For physical device: http://<your-ip>:8000/api/v1

# Start Metro bundler
npm start

# Run on Android (separate terminal)
npx react-native run-android

# Run on iOS (macOS only)
npx react-native run-ios
```

</details>

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user | ✗ |
| `POST` | `/auth/login` | Login, returns token pair | ✗ |
| `POST` | `/auth/refresh` | Refresh tokens (body: `refresh_token`) | ✗ |
| `POST` | `/auth/logout` | Revoke tokens | ✓ |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/users/me` | Get current user profile | ✓ |
| `PATCH` | `/users/me` | Update profile (full_name, timezone) | ✓ |
| `POST` | `/users/me/password` | Change password | ✓ |
| `DELETE` | `/users/me` | Delete account | ✓ |

### Reminders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/reminders` | List reminders (paginated) | ✓ |
| `POST` | `/reminders` | Create a reminder | ✓ |
| `GET` | `/reminders/{id}` | Get a specific reminder | ✓ |
| `PATCH` | `/reminders/{id}` | Update a reminder | ✓ |
| `DELETE` | `/reminders/{id}` | Soft-delete a reminder | ✓ |
| `POST` | `/reminders/{id}/toggle` | Toggle active/inactive | ✓ |
| `GET` | `/reminders/sync?since=` | Incremental sync | ✓ |

### Completions & Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/completions` | Record a completion action | ✓ |
| `GET` | `/completions/today` | Today's completion records (paginated) | ✓ |
| `GET` | `/completions/streak` | Streak info + weekly analytics | ✓ |

### Devices & System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/devices/register` | Register/update device FCM token | ✓ |
| `GET` | `/devices` | List registered devices | ✓ |
| `DELETE` | `/devices/{id}` | Remove a device | ✓ |
| `GET` | `/health` | Health check | ✗ |

> 📖 **Full interactive docs** are available at `/docs` (Swagger UI) or `/redoc` (ReDoc) when the server is running.

---

## ⚙️ Environment Variables

Create a `backend/.env` file based on the template below:

```env
# Database
DATABASE_URL=postgresql+asyncpg://app_user:app_password@localhost:5432/smart_routines
# Leave unset to use local SQLite (development only)

# JWT — generate strong secrets for production!
# python -c "import secrets; print(secrets.token_urlsafe(64))"
JWT_SECRET_KEY=your-secret-key-here
JWT_REFRESH_SECRET_KEY=your-refresh-secret-here

# Environment — set to 'production' to enforce strong secrets
ENVIRONMENT=development

# Firebase (optional — required for push notifications)
FIREBASE_CREDENTIALS_PATH=path/to/firebase-adminsdk.json

# Optional
# DEBUG=false
# SQLALCHEMY_ECHO=false
# BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

> ⚠️ **Security:** The app rejects insecure default JWT secrets (`CHANGE_ME`) in non-development environments.

---

## 🧪 Testing

### Backend Tests

```bash
# From the project root
python -m pytest backend/tests/ -v

# Output: 26 passed ✅
```

### Mobile Tests

```bash
cd mobile
npm test

# Output: 4 suites, 29 passed ✅
```

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| `authStore.test.ts` | 5 | Auth store: init, session, update, clear |
| `reminderStore.test.ts` | 8 | Reminder store: CRUD, types, nested details |
| `completionStore.test.ts` | 8 | Completion store: dedup logic, streak |
| `notificationHash.test.ts` | 8 | FNV-1a hash: determinism, collisions |

---

## 🔄 CI/CD Pipeline

The GitHub Actions pipeline runs on every push and PR to `main` and `develop`:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Backend · Lint  │  │  Backend · Test  │  │ Backend · Docker│
│  ruff check/fmt  │  │  pytest (26)     │  │  Image build    │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Mobile · Lint   │  │  Mobile · Jest   │  │ Mobile · Android│
│  TSC + ESLint    │  │  29 tests        │  │  Debug APK      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🛡️ Security

- **Password hashing** — bcrypt with automatic salt
- **JWT authentication** — Short-lived access tokens (30 min) + long-lived refresh tokens (7 days)
- **Token versioning** — Server-side `token_version` counter enables instant revocation of all tokens on logout
- **Secure storage** — Tokens stored in device Keychain (iOS) / Keystore (Android) via `react-native-keychain`
- **Rate limiting** — Login and registration endpoints are rate-limited (5 requests/min) via `slowapi`
- **CORS** — Configurable allowed origins
- **Input validation** — Pydantic v2 schemas enforce field types, max lengths, and patterns
- **Startup validation** — Insecure default JWT secrets are rejected in non-development environments

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** 0.115 | Async web framework |
| **Pydantic v2** | Schema validation & settings |
| **SQLAlchemy** 2.0 | Async ORM (PostgreSQL + SQLite) |
| **Alembic** | Database migrations |
| **APScheduler** | Background reminder scheduler |
| **Firebase Admin** | Push notifications (FCM) |
| **bcrypt** | Password hashing |
| **PyJWT** | JWT token encoding/decoding |
| **Loguru** | Structured logging |
| **slowapi** | Rate limiting |

### Mobile

| Technology | Purpose |
|------------|---------|
| **React Native** 0.76 | Cross-platform mobile framework |
| **TypeScript** 5.3 | Type safety |
| **Zustand** 4.5 | Lightweight state management |
| **Axios** | HTTP client with interceptors |
| **SQLite** | Local offline database |
| **react-native-keychain** | Secure token storage |
| **react-native-push-notification** | Local notifications |
| **Firebase Messaging** | Remote push notifications |
| **React Navigation** 6.x | Screen navigation |

### DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Container image for backend |
| **Docker Compose** | Backend + PostgreSQL orchestration |
| **GitHub Actions** | 6-job CI/CD pipeline |
| **Ruff** | Python linting & formatting |
| **ESLint** | TypeScript/React linting |
| **Jest** | Mobile unit testing |
| **pytest** | Backend unit testing |

---

## 📄 License

Private / All rights reserved. Adjust as needed.
