## Context
Backend por capas (D2): `api` (routers FastAPI) → `services` (orquestación) → `integrations` (mocks de Dev 1) / `models` (ORM). Los routers no tocan la DB directamente.

## Decisions

### Modelo de datos
**`decision_audit`** – una fila por cada `/resolve`, `/rebooking`, `/escalate`.
| Columna | Tipo | Nota |
|---|---|---|
| id | UUID PK | |
| booking_id | VARCHAR(6) | index |
| action | VARCHAR(20) | RESOLVE / REBOOK / ESCALATE / NOTIFY |
| decision_type | VARCHAR(20) | AUTO_OFFER / HUMAN_REVIEW / INFO_ONLY / NO_ACTION |
| relevance | VARCHAR(20) | |
| policy_version | VARCHAR(40) | ej. POL-DELAY-2026-03 |
| applied_rules | JSONB | ["R3","R5"] |
| evidence | JSONB | event_ids aceptados/descartados, fuentes, `retrieved_at` (sin PII) |
| outcome | JSONB | request_id / case_id / notification_id / error |
| created_at | TIMESTAMPTZ | |

**`idempotency_record`**
| Columna | Tipo | Nota |
|---|---|---|
| key | VARCHAR(64) PK | |
| booking_id | VARCHAR(6) | |
| request_hash | CHAR(64) | SHA-256 del body; mismo key + otro body → 422 |
| status | VARCHAR(20) | IN_PROGRESS / SUCCEEDED / INDETERMINATE / FAILED |
| response | JSONB | respuesta almacenada para replay |
| created_at / updated_at | TIMESTAMPTZ | |

### Flujo de rebooking idempotente
1. Sin `Idempotency-Key` → 400.
2. Key existente con `SUCCEEDED` → devolver respuesta guardada (replay, sin llamar upstream).
3. Key existente `IN_PROGRESS` → 409.
4. Nueva → insertar `IN_PROGRESS`, llamar `create_rebooking_request`:
   - 201 → `SUCCEEDED`.
   - 409 `DUPLICATE_REQUEST` → `SUCCEEDED` con el `request_id` devuelto.
   - 503 `UPSTREAM_TIMEOUT` → `INDETERMINATE`; responder 202 `{status: "INDETERMINATE"}`; **no reintentar a ciegas**; reintento con la misma key reutiliza la key en upstream (que deduplica).
5. Rebooking prohibido si la última decisión del booking es `HUMAN_REVIEW` (→ 403 `HUMAN_APPROVAL_REQUIRED`) o la opción no está entre las elegibles / TTL vencido (→ 409 `OPTION_EXPIRED`).

### Notificación
Solo se envía si el mensaje lleva `policy_ref`; un 422 `UNVALIDATED_CONTENT` se registra y deriva a caso humano.

### Errores
Formato uniforme `{ "error": CODE, "detail": str, "trace_id": uuid }`. Fallo de lectura upstream → 502 `UPSTREAM_UNAVAILABLE`; datos `PARTIAL` no son error (se reportan en `missing_fields`).

### PII
Email, teléfono y documento nunca se escriben en logs ni en `decision_audit.evidence`.

## Alternatives considered
- Guardar idempotencia en memoria: descartado (se pierde al reiniciar, no sirve con >1 réplica).
- Event sourcing completo: descartado por tamaño de equipo.

## Risks
- 503 indeterminado puede dejar solicitudes huérfanas → se registran como `INDETERMINATE` para revisión humana.
