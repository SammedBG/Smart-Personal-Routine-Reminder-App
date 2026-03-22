FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend /app/backend

# Copy alembic config (referenced from project root)
COPY backend/alembic.ini /app/backend/alembic.ini

ENV UVICORN_HOST=0.0.0.0 \
    UVICORN_PORT=8000

# Default: run migrations then start API server
CMD ["sh", "-c", "alembic -c backend/alembic.ini upgrade head && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"]
