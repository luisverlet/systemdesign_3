# Spec Delta

## Purpose

Elegir de forma determinista la opción de reubicación que se recomienda al pasajero entre los candidatos y producir la decisión final del caso con su acción (AUTO o HUMAN).

## ADDED Requirements

### Requirement: Filtros de elegibilidad de opciones
Una opción SHALL ser elegible solo si: el pasajero tiene derecho REBOOK_NO_FEE, `type = REBOOK`, va del punto de conexión al destino final, sale después de la llegada estimada más 60 minutos, `seats_available` es mayor o igual al número de pasajeros, `fare_difference = 0` y `policy_ref` es la versión de política vigente. Cada opción descartada SHALL llevar su motivo.

#### Scenario: Opciones del caso base
- **WHEN** se filtran O1, O2 y O3 del caso base
- **THEN** O1 es elegible, O2 se descarta por asientos insuficientes y diferencia de tarifa, y O3 se descarta por no ser REBOOK

### Requirement: Opciones vencidas no se usan
El sistema SHALL descartar todas las opciones cuando el momento de decisión supera `_meta.retrieved_at + ttl_seconds`, y SHALL indicar que deben volver a consultarse.

#### Scenario: TTL vencido
- **WHEN** las opciones se recuperaron a las 11:02:35 con TTL 120 y se decide a las 11:05:00
- **THEN** no hay opción recomendada y el motivo es "options expired"

### Requirement: Desempate por llegada más temprana
Si varias opciones son elegibles, el sistema SHALL recomendar la de salida más temprana.

#### Scenario: Dos opciones elegibles
- **WHEN** son elegibles una opción del 2026-09-15 23:40 y otra del 2026-09-16 08:15
- **THEN** se recomienda la del 2026-09-15 23:40

### Requirement: Decisión final del caso
El sistema SHALL devolver una decisión con hechos, eventos descartados, reglas aplicadas, `policy_ref`, opción recomendada y `action`. `action` SHALL ser HUMAN si hay conflicto de fuentes, regla con aprobación humana, regla no evaluable o ninguna opción elegible; si no, AUTO. La decisión MUST NOT incluir email, teléfono ni `document_id`.

#### Scenario: Caso base ABC123
- **WHEN** se decide la reserva ABC123 con los datos del examen
- **THEN** `missed_connection = true`, reglas R3 y R5, opción O1, `action = HUMAN`, `policy_ref = "POL-DELAY-2026-03"` y sin datos personales sensibles

### Requirement: Mocks respetan los contratos del examen
Los sistemas simulados SHALL devolver las respuestas literales del examen, y las escrituras SHALL poder simular 201, 409 `DUPLICATE_REQUEST`, 503 `UPSTREAM_TIMEOUT`, 202 y 422 `UNVALIDATED_CONTENT` (mensaje sin `policy_ref`).

#### Scenario: Notificación sin policy_ref
- **WHEN** se llama `notify_passenger` con un mensaje sin `policy_ref`
- **THEN** responde 422 con `error = "UNVALIDATED_CONTENT"`

#### Scenario: Reubicación repetida
- **WHEN** se llama `create_rebooking_request` dos veces con la misma `idempotency_key`
- **THEN** la segunda responde 409 `DUPLICATE_REQUEST` con el mismo `request_id`
