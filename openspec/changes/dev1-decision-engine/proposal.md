# Proposal

## Why

El caso "Disruption Companion" exige decidir, sin errores, qué le pasó al viaje de un pasajero y a qué tiene derecho, combinando reserva, eventos operativos contradictorios y políticas versionadas. Hoy el backend solo tiene `/health`; falta el núcleo de decisión determinista sobre el que Dev 2 (API/DB) y Dev 3 (UI) construyen.

## What Changes

- Mocks de los 7 sistemas externos con los contratos y respuestas literales del examen, incluidos los errores de escritura (409 `DUPLICATE_REQUEST`, 503 `UPSTREAM_TIMEOUT`, 422 `UNVALIDATED_CONTENT`).
- Resolución de eventos operativos: descarta fuentes en `sources_degraded`, solo confía en `OPS_CORE` y `AIRPORT_FEED`, resuelve por (segmento, aspecto) y escala cuando dos fuentes sanas se contradicen.
- Derivación de hechos del viaje: `delay_minutes` (del tramo), `international`, `missed_connection` (tiempo mínimo de conexión 60 min), `group_includes_minor`, `compensation_requested`.
- Evaluación de políticas con un conjunto cerrado de condiciones conocidas; una condición desconocida falla cerrado (escala a humano). Las reglas se suman; cualquier `requires_human_approval` lleva la decisión a humano.
- Selección de opción de reubicación con filtros explícitos y desempate por llegada más temprana.
- Decisión final del caso base: conexión perdida, R3 + R5, opción O1, acción HUMAN, `policy_ref` `POL-DELAY-2026-03`.
- Vertical slice de backend: endpoint `POST /api/v1/disruptions/{booking_id}/resolve` que orquesta mocks → motor → decisión; si la acción es HUMAN crea el caso humano (mock) y devuelve su `case_id`. Errores: 404 reserva desconocida, 503 si una lectura falla.
- Pruebas unitarias pytest que verifican cada pieza y el caso base completo.

## Capabilities

### New Capabilities
- `operational-event-resolution`: cómo el sistema decide qué eventos operativos son verdad cuando las fuentes están degradadas o se contradicen.
- `disruption-policy-evaluation`: hechos del viaje y evaluación de reglas de política hacia derechos y necesidad de aprobación humana.
- `rebooking-option-selection`: filtrado y elección de la opción de reubicación recomendada y la decisión final (AUTO o HUMAN).
- `disruption-resolution-api`: endpoint invocable que resuelve una reserva de punta a punta y escala a humano cuando corresponde.

### Modified Capabilities
- (ninguna)

## Impact

- Código nuevo en `backend/app/services/disruption/` (funciones puras, sin DB ni red).
- Nueva ruta en `backend/app/api/routes.py` bajo `/api/v1`.
- Tests nuevos en `backend/tests/`.
- Sin cambios de DB ni dependencias. Fuera de alcance: persistencia/auditoría en Postgres, ejecución automática de reubicación con idempotencia real (Dev 2), frontend (Dev 3).
