# Smart Personal Routine Reminder System

This repository contains a production-ready Smart Personal Routine Reminder System with:

- FastAPI + PostgreSQL backend
- React Native (TypeScript) mobile app
- JWT authentication
- FCM push notifications and local notifications
- Offline support with SQLite caching and background sync

## Running with Docker

1. Ensure Docker is installed.
2. Create `backend/.env` as described in `backend/README.md`.
3. Start services:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:8000/api/v1`.

## Running locally

See `backend/README.md` and `mobile/README.md` for backend and mobile setup instructions.

