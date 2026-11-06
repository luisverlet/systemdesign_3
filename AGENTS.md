<!-- OPENSPEC:START -->
# Instrucciones para Agentes de IA

Este repositorio usa **OpenSpec** (desarrollo guiado por especificaciones). Todo agente de IA DEBE:

1. Leer `openspec/AGENTS.md` (flujo de trabajo detallado) y `openspec/project.md` (contexto y convenciones) antes de cualquier cambio.
2. **No escribir código sin una propuesta aprobada** en `openspec/changes/<change-id>/` cuando el cambio sea: nueva funcionalidad, cambio de arquitectura, cambio de API/DB, o cambio que rompa compatibilidad.
3. Respetar la ubicación de archivos definida abajo.

<!-- OPENSPEC:END -->

## Mapa del repositorio (dónde va cada cosa)

| Ruta | Contenido | Quién lo toca |
|------|-----------|---------------|
| `openspec/project.md` | Contexto del proyecto, stack, convenciones | Equipo (consenso) |
| `openspec/specs/<capacidad>/spec.md` | **Verdad actual**: lo que el sistema YA hace | Solo vía archivado de cambios |
| `openspec/changes/<change-id>/` | **Propuestas**: lo que el sistema VA a hacer | Agentes y devs |
| `openspec/changes/archive/` | Cambios ya implementados y desplegados | Al cerrar un cambio |
| `backend/app/api/` | Routers FastAPI (endpoints) | Backend |
| `backend/app/services/` | Lógica de negocio | Backend |
| `backend/app/models/` | Modelos ORM (SQLAlchemy) | Backend |
| `backend/app/schemas/` | Esquemas Pydantic (request/response) | Backend |
| `backend/app/core/` | Config, seguridad, utilidades transversales | Backend |
| `backend/app/integrations/` | Adaptadores/mocks de sistemas externos (+ `fixtures/`) | Backend (Dev 1) |
| `docs/team-plan.md` | Reparto de tareas, ramas y orden de commits | Todos |
| `backend/app/db/` | Sesión de DB y migraciones (Alembic) | Backend |
| `backend/tests/` | Tests pytest | Backend |
| `frontend/src/pages/` | Vistas / rutas | Frontend |
| `frontend/src/components/` | Componentes reutilizables | Frontend |
| `frontend/src/services/` | Clientes HTTP hacia la API | Frontend |
| `db/init/` | Scripts SQL de inicialización de Postgres | Backend/DB |
| `docs/` | Documentación humana (ADRs, diagramas, guías) | Todos |

## Reglas rápidas
- Un cambio = una carpeta en `openspec/changes/` con `proposal.md`, `tasks.md`, (opcional) `design.md` y deltas en `specs/`.
- Marca tareas como `- [x]` en `tasks.md` a medida que las completes.
- No edites `openspec/specs/` directamente; se actualiza al archivar.
- No subas secretos: usa `.env` (ignorado) basado en `.env.example`.
- Todo debe correr con `docker compose up --build`.
