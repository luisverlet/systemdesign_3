# Contexto del Proyecto

## Propósito
> TODO: Completar cuando se definan los requerimientos del sistema.

## Equipo
- 4 integrantes (completar nombres/roles).

## Stack tecnológico
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2
- **Frontend**: React 18 + Vite (JavaScript/TypeScript a definir)
- **Base de datos**: PostgreSQL 16
- **Infraestructura**: Docker + Docker Compose
- **Tests**: pytest (backend), Vitest (frontend)

## Convenciones

### Código
- Python: PEP 8, formateo con `ruff format`, lint con `ruff`. Tipado obligatorio en funciones públicas.
- React: componentes funcionales + hooks, nombres en PascalCase, un componente por archivo.
- Nombres de código en inglés; documentación puede ir en español.

### Arquitectura
- Backend por capas: `api` (routers) → `services` (negocio) → `models` (ORM). Los routers no acceden a la DB directamente.
- Comunicación front–back vía REST JSON bajo `/api/v1`.
- Configuración solo por variables de entorno.

### Git
- Rama principal: `main` (protegida). Trabajo en ramas: `feat/<change-id>`, `fix/<desc>`, `docs/<desc>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- Todo entra por Pull Request con al menos 1 revisión.

## Restricciones
> TODO

## Dependencias externas
> TODO
