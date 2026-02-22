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

### Android setup (required for `npm run android`)

**Full step-by-step guide:** see **[mobile/ANDROID_SETUP.md](mobile/ANDROID_SETUP.md)** (install JDK 17, Android Studio, emulator, and PATH).

Short version – you need these installed and set up **before** running the app:

1. **Java Development Kit (JDK) 17**  
   - Download: https://adoptium.net/ (Temurin 17 LTS) or use the JDK that comes with Android Studio.  
   - Set **JAVA_HOME** to the JDK folder (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot`).  
   - In PowerShell (current user):  
     `[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot', 'User')`  
     (Replace the path with your actual JDK path.)  
   - Restart the terminal (or restart VS Code) after changing env vars.

2. **Android Studio**  
   - Install from https://developer.android.com/studio .  
   - In Android Studio: **Settings → Appearance & Behavior → System Settings → Android SDK**:
     - Install **Android SDK Platform** (e.g. API 34) and **Android SDK Build-Tools**.
     - Note the **Android SDK Location** (e.g. `C:\Users\YourName\AppData\Local\Android\Sdk`).
   - Add to your **PATH** (User environment variable):
     - `%ANDROID_HOME%\platform-tools` (so `adb` works)
     - Optionally set **ANDROID_HOME** to the SDK location above.

3. **Emulator or device**  
   - **Emulator:** In Android Studio go to **Tools → Device Manager**, create a virtual device (AVD) and start it.  
   - **Physical device:** Enable **Developer options** and **USB debugging**, connect via USB, and allow debugging when prompted.

### Run the app

1. Open a terminal. **If you’re in the project root** (`Smart Personal Routine Reminder App`), run:

```bash
cd mobile
npm install --legacy-peer-deps
```

   **If you’re already in the `mobile` folder**, just run:

```bash
npm install --legacy-peer-deps
```

2. In `mobile\src\api\client.ts` set the API URL:
   - Android emulator: `http://10.0.2.2:8000/api/v1`
   - Physical phone (same Wi‑Fi): `http://YOUR_PC_IP:8000/api/v1` (e.g. `http://192.168.1.5:8000/api/v1`)

3. Start an emulator (or connect a device), then run:

```bash
npm run android
```

   (Run this from the **`mobile`** folder. Don’t run `cd mobile` again if you’re already there.)

---

## Summary

| What you want to do | What to do |
|---------------------|------------|
| Run the API only    | 1) Start PostgreSQL (Docker or local). 2) Double‑click `run_backend.bat`. |
| Run API + mobile    | Do the above. Install JDK 17 + Android Studio and set JAVA_HOME (see Step 3). Then `cd mobile`, `npm install --legacy-peer-deps`, set API URL in `client.ts`, start emulator, and `npm run android`. |
| Run everything with Docker | Set `POSTGRES_SERVER=db` in `backend\.env`, then run `docker compose up --build`. Run migrations once: `docker compose exec api alembic -c backend/alembic.ini upgrade head`. |

Your `backend\.env` already exists; ensure `POSTGRES_SERVER` is `localhost` when using `run_backend.bat` with Docker DB or local PostgreSQL.
