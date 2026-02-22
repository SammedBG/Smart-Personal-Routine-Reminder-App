# Smart Personal Routine Reminder API

FastAPI backend for the Smart Personal Routine Reminder App. Uses PostgreSQL, JWT auth, and Firebase Cloud Messaging (FCM) for push notifications. An APScheduler worker runs separately to send due-reminder notifications.

## Prerequisites

- Python 3.11+
- PostgreSQL 14+ (or use `docker-compose up db` from repo root)
- Firebase project with a service account key (for FCM)

## Setup

1. **Virtual environment and dependencies**

```bash
# From repo root
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

2. **Environment variables**

Copy the example env and edit:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set at least:

- `POSTGRES_*` – match your PostgreSQL instance (use same values as `docker-compose` if you use `docker-compose up db`).
- `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY` – use long random strings in production.
- `FIREBASE_CREDENTIALS_PATH` – absolute path to your Firebase service account JSON file (FCM will be disabled if unset).

3. **Database**

Ensure PostgreSQL is running, then run migrations:

```bash
# From repo root, with venv activated
alembic -c backend/alembic.ini upgrade head
```

4. **Run the API**

```bash
uvicorn backend.app.main:app --reload --app-dir .
```

API base: `http://localhost:8000`  
OpenAPI docs: `http://localhost:8000/docs`  
Health: `http://localhost:8000/api/v1/health`

5. **Run the scheduler (separate process)**

In another terminal, with the same venv and `.env`:

```bash
python -m backend.app.scheduler.apscheduler_worker
```

This job runs every minute, finds due reminders, sends FCM notifications, and updates `next_trigger_at`.

## Project layout

- `app/main.py` – FastAPI app, CORS, router includes.
- `app/config.py` – Pydantic settings from env.
- `app/db/` – Async engine, session, base and models.
- `app/models/` – User, Reminder, Device (SQLAlchemy).
- `app/schemas/` – Pydantic request/response (user, reminder, device).
- `app/core/` – JWT + password hashing, `get_current_user` dependency.
- `app/repositories/` – User, Reminder, Device repositories.
- `app/services/` – Auth, Reminder, Device business logic.
- `app/api/v1/` – Routers: health, auth, users, reminders, devices.
- `app/notifications/fcm.py` – Firebase Admin init and FCM send.
- `app/scheduler/apscheduler_worker.py` – Due-reminder job and entrypoint.
- `alembic/` – Migrations.

## Docker

From repo root:

```bash
docker-compose up --build
```

This starts PostgreSQL, the API, and the scheduler. Create `backend/.env` first (see above). Run migrations once (e.g. in a one-off API container or locally against the same DB).

## Testing

Install dev deps if needed, then from repo root:

```bash
pytest backend/tests -v
```

(Add `backend/tests` and pytest when you add tests.)

## Production

- Use a proper WSGI/ASGI server (e.g. uvicorn with multiple workers) behind a reverse proxy (nginx, Caddy).
- Run the scheduler as a separate process or container.
- Set strong `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY`.
- Prefer env or secrets for DB URL and Firebase path; do not commit `.env` or service account JSON.
