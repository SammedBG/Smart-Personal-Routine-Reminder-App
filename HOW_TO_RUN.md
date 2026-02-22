# How to Run the Smart Personal Routine Reminder System

## Step 1: Start the database (PostgreSQL)

You need PostgreSQL running with a database and user. Choose one:

### Option A – Docker (if you have Docker Desktop)

Open a terminal in this folder and run:

```bash
docker compose up -d db
```

Then edit `backend\.env` and set:

```env
POSTGRES_SERVER=localhost
```

(Leave other `POSTGRES_*` as in `.env.example`: user `app_user`, password `app_password`, db `smart_routines`.)

### Option B – PostgreSQL installed on your PC

1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create database and user (in `psql` or pgAdmin):

```sql
CREATE USER app_user WITH PASSWORD 'app_password';
CREATE DATABASE smart_routines OWNER app_user;
```

3. In `backend\.env` set:

```env
POSTGRES_SERVER=localhost
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_DB=smart_routines
```

---

## Step 2: Run the backend API

**Easiest:** double‑click **`run_backend.bat`** in this folder.

It will:

- Create a Python virtual environment in `backend\.venv` (first time only)
- Install dependencies (first time only)
- Run database migrations
- Start the API at **http://localhost:8000**

If migrations fail, the database is not running or `.env` is wrong. Fix Step 1 and try again.

**API docs (Swagger):** http://localhost:8000/docs  

**Health check:** http://localhost:8000/api/v1/health  

---

## Step 3 (optional): Run the mobile app

1. Open a terminal in this folder and run:

```bash
cd mobile
npm install
```

2. In `mobile\src\api\client.ts` set the API URL:
   - Android emulator: `http://10.0.2.2:8000/api/v1`
   - Physical phone (same Wi‑Fi): `http://YOUR_PC_IP:8000/api/v1` (e.g. `http://192.168.1.5:8000/api/v1`)

3. Run the app:

```bash
npm run android
```
or
```bash
npm run ios
```

---

## Summary

| What you want to do | What to do |
|---------------------|------------|
| Run the API only    | 1) Start PostgreSQL (Docker or local). 2) Double‑click `run_backend.bat`. |
| Run API + mobile    | Do the above, then `cd mobile`, `npm install`, set API URL in `client.ts`, `npm run android` or `npm run ios`. |
| Run everything with Docker | Set `POSTGRES_SERVER=db` in `backend\.env`, then run `docker compose up --build`. Run migrations once: `docker compose exec api alembic -c backend/alembic.ini upgrade head`. |

Your `backend\.env` already exists; ensure `POSTGRES_SERVER` is `localhost` when using `run_backend.bat` with Docker DB or local PostgreSQL.
