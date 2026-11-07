#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head || echo "Migrations already up to date or waiting for DB..."

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
