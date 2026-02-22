# Smart Personal Routine Reminder System

A production-ready Smart Personal Routine Reminder System with a **FastAPI** backend and a **React Native** mobile app. Users can manage daily routines including medicine, food, water, sleep, and custom reminders with cloud sync, offline support, and push and local notifications.

## Features

- **User authentication** – Registration, login, logout with JWT (access + refresh tokens). Passwords hashed with bcrypt; tokens stored securely on device.
- **Reminder management** – Create, read, update, delete, and enable/disable reminders. Types: medicine, food, water, sleep, custom. Repeat: once, daily, weekly, custom days.
- **Cloud sync** – Backend is the source of truth. App caches reminders in SQLite and syncs when online; incremental sync via `GET /reminders/sync?since=...`.
- **Offline support** – App reads and writes reminders from local SQLite first; syncs changes when connectivity is restored.
- **Notifications** – Local notifications on device (work offline). Push notifications via Firebase Cloud Messaging (FCM); backend scheduler sends reminders when due.
- **Multi-device** – Each device registers its FCM token; reminders are delivered to all of a user’s active devices.

## Architecture

- **Backend**: FastAPI, PostgreSQL (SQLAlchemy async), JWT auth, Firebase Admin SDK for FCM, APScheduler worker for due-reminder checks.
- **Mobile**: React Native (TypeScript), Zustand, Axios, SQLite (react-native-sqlite-storage), Keychain (secure tokens), FCM + local notifications.

## Prerequisites

- **Backend**: Python 3.11+, PostgreSQL 14+, (optional) Docker.
- **Mobile**: Node.js 18+, React Native environment (Android Studio / Xcode), Firebase project for FCM.

## Quick Start

### Option 1: Docker (backend only)

1. Create `backend/.env` (see [Backend README](backend/README.md) or copy from `backend/.env.example` if present).
2. From the project root:

```bash
docker-compose up --build
```

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/v1/health`
- PostgreSQL is on port 5432; run migrations before first use (see Backend README).

### Option 2: Local backend + mobile

1. **Backend**: Follow [backend/README.md](backend/README.md) (venv, `.env`, PostgreSQL, migrations, uvicorn, scheduler).
2. **Mobile**: Follow [mobile/README.md](mobile/README.md) (npm install, API URL, Firebase, run Android/iOS).

## Project Structure

```
Smart Personal Routine Reminder App/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Auth, users, reminders, devices, health
│   │   ├── core/              # Security (JWT, password), dependencies
│   │   ├── db/                # Session, base models
│   │   ├── models/            # User, Reminder, Device
│   │   ├── schemas/           # Pydantic request/response
│   │   ├── repositories/      # DB access layer
│   │   ├── services/          # Auth, reminder, device logic
│   │   ├── notifications/     # FCM send
│   │   └── scheduler/         # APScheduler reminder job
│   ├── alembic/               # Migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── mobile/
│   ├── src/
│   │   ├── api/               # Axios client, authApi, reminderApi
│   │   ├── db/                # SQLite DB + reminder DAO
│   │   ├── navigation/        # Auth stack, main tabs
│   │   ├── screens/           # Login, Register, Today, Reminders, Settings
│   │   ├── services/          # SecureStorage, SyncService, NotificationService
│   │   └── store/             # Zustand auth + reminder stores
│   ├── package.json
│   └── README.md
├── docker-compose.yml
└── README.md
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user (email, password, full_name) |
| POST | `/api/v1/auth/login` | Login; returns access_token, refresh_token |
| POST | `/api/v1/auth/refresh` | Refresh tokens (body: refresh_token) |
| POST | `/api/v1/auth/logout` | Revoke refresh (requires Bearer) |
| GET | `/api/v1/users/me` | Current user profile |
| GET | `/api/v1/reminders` | List reminders |
| POST | `/api/v1/reminders` | Create reminder |
| GET | `/api/v1/reminders/{id}` | Get reminder |
| PATCH | `/api/v1/reminders/{id}` | Update reminder |
| DELETE | `/api/v1/reminders/{id}` | Delete (soft) reminder |
| POST | `/api/v1/reminders/{id}/toggle` | Toggle active |
| GET | `/api/v1/reminders/sync?since=` | Incremental sync |
| POST | `/api/v1/devices/register` | Register/update device (FCM token) |
| GET | `/api/v1/health` | Health check |

## Environment Variables (Backend)

See `backend/README.md`. Main ones: `POSTGRES_*`, `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`, `FIREBASE_CREDENTIALS_PATH`.

## Deployment

- **Backend**: Run API (e.g. uvicorn with workers) and the scheduler process (e.g. `python -m backend.app.scheduler.apscheduler_worker`) behind a reverse proxy; use strong `JWT_*` and DB credentials; set `FIREBASE_CREDENTIALS_PATH` for FCM.
- **Mobile**: Build release (e.g. `cd mobile && npx react-native run-android --variant=release` or Xcode archive); set API base URL for production; configure FCM for production keys.

## License

Private / All rights reserved (adjust as needed).
