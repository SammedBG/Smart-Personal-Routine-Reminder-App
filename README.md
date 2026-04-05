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

## 🚢 Deployment

### Backend Deployment

The backend consists of **two processes** that must run simultaneously:

| Process | Command | Purpose |
|---------|---------|---------|
| **API Server** | `uvicorn backend.app.main:app` | Serves the REST API |
| **Scheduler** | `python -m backend.app.scheduler.apscheduler_worker` | Checks for due reminders every 60s, sends FCM push notifications |

#### Option A — Docker Compose (Recommended)

The simplest way to deploy. Runs PostgreSQL, the API, and the scheduler in containers.

```bash
# 1. Clone and configure
git clone https://github.com/SammedBG/Smart-Personal-Routine-Reminder-App.git
cd Smart-Personal-Routine-Reminder-App

# 2. Create production environment file
cp .env.example backend/.env
```

Edit `backend/.env` with production values:

```env
# REQUIRED — generate with: python -c "import secrets; print(secrets.token_urlsafe(64))"
JWT_SECRET_KEY=<your-64-char-random-string>
JWT_REFRESH_SECRET_KEY=<another-64-char-random-string>

# REQUIRED — must be 'production' to enforce strong secrets
ENVIRONMENT=production

# OPTIONAL — path to Firebase service account JSON (for push notifications)
FIREBASE_CREDENTIALS_PATH=/app/backend/firebase-adminsdk.json
```

```bash
# 3. (Optional) Copy Firebase credentials into the project
cp ~/your-firebase-adminsdk.json backend/firebase-adminsdk.json

# 4. Build and start all services
docker compose up -d --build

# 5. Verify
curl http://localhost:8000/api/v1/health
# → {"status": "ok"}
```

**What `docker compose up` does:**
1. Starts a **PostgreSQL 16** container with persistent volume storage
2. Waits for the database to be healthy (via `pg_isready` healthcheck)
3. Runs **Alembic migrations** (`alembic upgrade head`) to create/update tables
4. Starts the **API server** on port 8000
5. Starts the **scheduler worker** in a separate container

```
┌─────────────────────────────────────────────────┐
│              Docker Compose Stack                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ postgres │  │   api    │  │  scheduler   │  │
│  │  :5432   │←─│  :8000   │  │  (APSched)   │  │
│  │          │←─│          │  │              │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│       ↑                                         │
│   db_data                                       │
│   (volume)                                      │
└─────────────────────────────────────────────────┘
```

#### Option B — VPS / Cloud VM (Manual)

For more control over the deployment, run each component separately on a Linux server.

<details>
<summary><strong>Step 1 — Install Dependencies</strong></summary>

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y python3.11 python3.11-venv postgresql nginx certbot python3-certbot-nginx

# Create a dedicated user
sudo useradd -m -s /bin/bash smartapp
sudo su - smartapp
```

</details>

<details>
<summary><strong>Step 2 — Set Up PostgreSQL</strong></summary>

```bash
# Create database and user
sudo -u postgres psql <<EOF
CREATE USER smartapp_user WITH PASSWORD 'your-strong-db-password';
CREATE DATABASE smart_routines OWNER smartapp_user;
GRANT ALL PRIVILEGES ON DATABASE smart_routines TO smartapp_user;
EOF
```

</details>

<details>
<summary><strong>Step 3 — Deploy Application Code</strong></summary>

```bash
# Clone repository
cd /home/smartapp
git clone https://github.com/SammedBG/Smart-Personal-Routine-Reminder-App.git app
cd app

# Create virtual environment
python3.11 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt

# Configure environment
cp .env.example backend/.env
nano backend/.env
```

Set the following in `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://smartapp_user:your-strong-db-password@localhost:5432/smart_routines
JWT_SECRET_KEY=<generated-64-char-secret>
JWT_REFRESH_SECRET_KEY=<generated-64-char-secret>
ENVIRONMENT=production
FIREBASE_CREDENTIALS_PATH=/home/smartapp/app/backend/firebase-adminsdk.json
```

```bash
# Run database migrations
alembic -c backend/alembic.ini upgrade head
```

</details>

<details>
<summary><strong>Step 4 — Create Systemd Services</strong></summary>

**API Service** — `/etc/systemd/system/smartapp-api.service`:

```ini
[Unit]
Description=SmartApp API Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
User=smartapp
Group=smartapp
WorkingDirectory=/home/smartapp/app
Environment="PATH=/home/smartapp/app/backend/.venv/bin"
ExecStart=/home/smartapp/app/backend/.venv/bin/uvicorn backend.app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 4 \
    --access-log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Scheduler Service** — `/etc/systemd/system/smartapp-scheduler.service`:

```ini
[Unit]
Description=SmartApp Reminder Scheduler
After=network.target postgresql.service
Requires=postgresql.service

[Service]
User=smartapp
Group=smartapp
WorkingDirectory=/home/smartapp/app
Environment="PATH=/home/smartapp/app/backend/.venv/bin"
ExecStart=/home/smartapp/app/backend/.venv/bin/python -m backend.app.scheduler.apscheduler_worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start both services
sudo systemctl daemon-reload
sudo systemctl enable smartapp-api smartapp-scheduler
sudo systemctl start smartapp-api smartapp-scheduler

# Check status
sudo systemctl status smartapp-api
sudo systemctl status smartapp-scheduler

# View logs
sudo journalctl -u smartapp-api -f
sudo journalctl -u smartapp-scheduler -f
```

</details>

<details>
<summary><strong>Step 5 — Configure Nginx Reverse Proxy + SSL</strong></summary>

Create `/etc/nginx/sites-available/smartapp`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Request size limit (for image uploads, etc.)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed later)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/smartapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate (free, auto-renewing)
sudo certbot --nginx -d api.yourdomain.com
```

</details>

#### Option C — Cloud Platforms

<details>
<summary><strong>Google Cloud Run</strong></summary>

```bash
# Build and push the Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/smartapp-api .

# Deploy API
gcloud run deploy smartapp-api \
  --image gcr.io/YOUR_PROJECT/smartapp-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://...,JWT_SECRET_KEY=...,JWT_REFRESH_SECRET_KEY=...,ENVIRONMENT=production" \
  --allow-unauthenticated

# Deploy Scheduler (as a separate service)
gcloud run deploy smartapp-scheduler \
  --image gcr.io/YOUR_PROJECT/smartapp-api \
  --platform managed \
  --region us-central1 \
  --command "python","-m","backend.app.scheduler.apscheduler_worker" \
  --set-env-vars "DATABASE_URL=...,ENVIRONMENT=production" \
  --no-allow-unauthenticated \
  --min-instances 1
```

> **Note:** Cloud Run scales to zero by default. Set `--min-instances 1` for the scheduler so it runs continuously.

</details>

<details>
<summary><strong>Railway / Render / Fly.io</strong></summary>

These platforms auto-detect the Dockerfile:

1. Connect your GitHub repository
2. Set the environment variables in the dashboard (`DATABASE_URL`, `JWT_SECRET_KEY`, etc.)
3. Deploy two services from the same repo:
   - **API** — uses the default `CMD` from `Dockerfile`
   - **Scheduler** — override the start command to `python -m backend.app.scheduler.apscheduler_worker`
4. Add a PostgreSQL add-on and use the provided `DATABASE_URL`

</details>

#### Backend Production Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Set strong random `JWT_SECRET_KEY` (64+ chars) | ☐ |
| 2 | Set strong random `JWT_REFRESH_SECRET_KEY` (64+ chars) | ☐ |
| 3 | Set `ENVIRONMENT=production` | ☐ |
| 4 | Use PostgreSQL (not SQLite) with strong password | ☐ |
| 5 | Set up SSL/TLS (HTTPS) | ☐ |
| 6 | Configure `BACKEND_CORS_ORIGINS` for your mobile app's domain | ☐ |
| 7 | Copy Firebase service account JSON and set `FIREBASE_CREDENTIALS_PATH` | ☐ |
| 8 | Run `alembic upgrade head` before first start | ☐ |
| 9 | Start both the API server AND scheduler process | ☐ |
| 10 | Set up log rotation / monitoring | ☐ |
| 11 | Set up database backups (pg_dump cron) | ☐ |
| 12 | Verify health endpoint: `GET /api/v1/health` | ☐ |

---

### Mobile Deployment (Android)

#### Step 1 — Generate a Release Signing Key

You need a signing keystore to publish to the Play Store. **Keep this file safe — losing it means you can never update your app.**

```bash
cd mobile/android/app

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias smartapp-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- **Keystore password** — pick a strong password, save it securely
- **Key password** — can be the same as keystore password
- **Name, org, location** — your legal details for the certificate

#### Step 2 — Configure Gradle Signing

Create `mobile/android/keystore.properties` (🚫 DO NOT commit this file):

```properties
RELEASE_STORE_FILE=release.keystore
RELEASE_STORE_PASSWORD=your-keystore-password
RELEASE_KEY_ALIAS=smartapp-release
RELEASE_KEY_PASSWORD=your-key-password
```

Update `mobile/android/app/build.gradle` to use the keystore for release builds:

```gradle
// Add at the top of the android block, before signingConfigs:
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file(keystoreProperties['RELEASE_STORE_FILE'] ?: 'debug.keystore')
        storePassword keystoreProperties['RELEASE_STORE_PASSWORD'] ?: 'android'
        keyAlias keystoreProperties['RELEASE_KEY_ALIAS'] ?: 'androiddebugkey'
        keyPassword keystoreProperties['RELEASE_KEY_PASSWORD'] ?: 'android'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true           // Enable ProGuard/R8
        shrinkResources true         // Remove unused resources
        proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
}
```

#### Step 3 — Set Production API URL

Edit `mobile/src/config.ts` to point to your production backend:

```typescript
// For production, hardcode or use an environment variable
export const API_BASE_URL = 'https://api.yourdomain.com/api/v1';
```

> **Tip:** For a more flexible setup, create separate `config.dev.ts` and `config.prod.ts` files, or use [`react-native-config`](https://github.com/luggit/react-native-config) to read from `.env` files.

#### Step 4 — Set Up Firebase for Production

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. **Android app setup:**
   - Register your app with the **production** package name (`com.smartroutinetemp` or your custom ID)
   - Download `google-services.json`
   - Place it in `mobile/android/app/google-services.json`
3. **For the backend** (push notifications):
   - Go to Project Settings → Service Accounts
   - Generate a new private key JSON
   - Copy it to your production server and set `FIREBASE_CREDENTIALS_PATH`

#### Step 5 — Build the Release APK / AAB

```bash
cd mobile

# Install dependencies
npm install
npx patch-package

# Build release AAB (for Play Store)
cd android
chmod +x gradlew
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab

# Or build release APK (for direct distribution)
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

#### Step 6 — Test the Release Build

```bash
# Install the release APK on a connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Verify:
# ✓ App opens without crash
# ✓ Registration and login work
# ✓ Reminders create/sync correctly
# ✓ Push notifications arrive
# ✓ Local notifications fire when due
# ✓ Offline mode works (airplane mode → create reminder → go online → syncs)
```

#### Step 7 — Publish to Google Play Store

1. Create a [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)
2. Create a new app in the Play Console
3. Upload the `.aab` file from Step 5
4. Fill in the store listing:
   - **App name**: Smart Routine Reminder
   - **Short description**: Never miss a medicine, meal, or workout
   - **Full description**: Your full feature list
   - **Screenshots**: At least 2 phone screenshots
   - **Feature graphic**: 1024×500 banner image
   - **Category**: Health & Fitness or Productivity
5. Complete the content rating questionnaire
6. Set pricing (Free)
7. Submit for review

#### Mobile Production Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Generate a release signing keystore (keep backup!) | ☐ |
| 2 | Configure `keystore.properties` with release credentials | ☐ |
| 3 | Update `API_BASE_URL` to production HTTPS endpoint | ☐ |
| 4 | Add production `google-services.json` from Firebase | ☐ |
| 5 | Enable ProGuard/R8 (`minifyEnabled true`) | ☐ |
| 6 | Update `versionCode` and `versionName` in `build.gradle` | ☐ |
| 7 | Test the release build on a physical device | ☐ |
| 8 | Verify push notifications with production Firebase | ☐ |
| 9 | Verify offline mode and sync | ☐ |
| 10 | Add `keystore.properties` and `release.keystore` to `.gitignore` | ☐ |
| 11 | Upload `.aab` to Play Console and submit for review | ☐ |

---

### Mobile Deployment (iOS)

<details>
<summary><strong>iOS-specific steps</strong></summary>

#### Prerequisites
- macOS with Xcode 15+
- Apple Developer Program membership ($99/year)
- CocoaPods installed (`sudo gem install cocoapods`)

#### Build Steps

```bash
cd mobile/ios
pod install
cd ..

# Open in Xcode
open ios/SmartRoutineApp.xcworkspace   # use your .xcworkspace name
```

In Xcode:
1. Select your **Team** under Signing & Capabilities
2. Set the **Bundle Identifier** to match your App Store Connect entry
3. Add `GoogleService-Info.plist` (from Firebase Console) to the project
4. Enable **Push Notifications** capability
5. Enable **Background Modes** → Remote notifications
6. Select **Generic iOS Device** as the target
7. Product → Archive → Distribute App → App Store Connect

</details>

---

## 📄 License

Private / All rights reserved. Adjust as needed.
