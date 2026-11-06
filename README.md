# systemdesign_3

Proyecto en equipo con desarrollo guiado por especificaciones (**OpenSpec**) + agentes de IA.

## Stack
FastAPI (Python 3.12) · React + Vite · PostgreSQL 16 · Docker Compose

## Arranque rápido
```bash
cp .env.example .env
docker compose up --build
```
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/v1/health · Docs: http://localhost:8000/docs

## Cómo trabajamos
1. Lee [`AGENTS.md`](AGENTS.md) y [`openspec/AGENTS.md`](openspec/AGENTS.md).
2. Para cada funcionalidad: crea `openspec/changes/<change-id>/` copiando `_template/`.
3. Abre PR con la propuesta → revisión → implementación en rama `feat/<change-id>` → PR → archivar.

## Estructura
```
openspec/        # specs (verdad actual) + changes (propuestas)
backend/app/     # api · services · models · schemas · core · db
frontend/src/    # pages · components · services
db/init/         # SQL de inicialización
docs/adr/        # decisiones de arquitectura
```
