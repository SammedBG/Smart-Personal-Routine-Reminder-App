# Smart Personal Routine Reminder API

FastAPI backend for the Smart Personal Routine Reminder App.

## Setup

1. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. Create a `.env` file in `backend/`:

```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_DB=smart_routines
JWT_SECRET_KEY=CHANGE_ME
JWT_REFRESH_SECRET_KEY=CHANGE_ME_REFRESH
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
```

3. Run PostgreSQL (or `docker-compose up db`) and apply migrations:

```bash
alembic -c backend/alembic.ini upgrade head
```

4. Start the API:

```bash
uvicorn backend.app.main:app --reload
```

5. Start the scheduler (in another terminal):

```bash
python -m backend.app.scheduler.apscheduler_worker
```

