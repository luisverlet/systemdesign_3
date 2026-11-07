# Change: Contrato compartido de Disruption Companion (Fase 0)

## Why
Los 3 roles trabajan en paralelo. Sin un contrato común (datos de entrada y respuesta del endpoint), Dev 1, Dev 2 y Dev 3 se bloquean entre sí.

## What Changes
- Esquemas Pydantic de request/response en `backend/app/schemas/disruption.py`.
- Fixtures con las respuestas literales de las herramientas del examen en `backend/app/integrations/fixtures/`.
- Respuesta de ejemplo del endpoint para el caso base en `frontend/src/mocks/resolve-ABC123.json`.
- Tipos TypeScript equivalentes en `frontend/src/types/disruption.ts`.

## Impact
- Specs afectadas: `disruption-contract` (nueva).
- Código afectado: `backend/app/schemas/`, `backend/app/integrations/fixtures/`, `frontend/src/mocks/`, `frontend/src/types/`.
- Responsable: Dev 2.
- Cualquier cambio posterior al contrato requiere PR propio y aviso al equipo.
