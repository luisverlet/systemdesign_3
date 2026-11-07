# Tasks

## 1. Mocks de sistemas externos

- [x] 1.1 Crear `backend/app/services/disruption/mocks.py` con las 4 lecturas (JSON literales del examen) y verificar en `tests/test_disruption_mocks.py` que `get_trip_context("ABC123")` y `get_policy_rules("DELAY")` devuelven los valores del examen
- [x] 1.2 Añadir las 3 escrituras con estado en memoria (201/409 por `idempotency_key`, 503 simulable, 202/422 por `policy_ref`) y verificar con tests de 409 y 422

## 2. Resolución de eventos

- [x] 2.1 Implementar `events.py` (descarte por `sources_degraded` y fuente no confiable, resolución por segmento y aspecto) y verificar con test que S1 queda DELAY 160 + puerta 24 y E-1012 descartado
- [x] 2.2 Implementar detección de conflicto entre fuentes confiables y verificar con test OPS_CORE vs AIRPORT_FEED que marca conflicto con ambos `event_id`

## 3. Hechos y políticas

- [x] 3.1 Implementar `facts.py` (delay, international, missed_connection con MCT 60, minor, compensation) y verificar con tests del caso base y del límite exacto de conexión
- [x] 3.2 Implementar `policy.py` con mapa cerrado de condiciones y verificar con tests que aplican R3+R5, requiere humano y una condición desconocida queda no evaluable

## 4. Opciones y decisión final

- [x] 4.1 Implementar `options.py` (filtros con motivo, TTL, desempate por salida más temprana) y verificar con tests de O1 elegida, O2/O3 descartadas, TTL vencido y desempate
- [x] 4.2 Implementar `decision.py` `decide(trip, events, options, policy, now, compensation_requested=False)` (pura; las lecturas las hace `service.resolve`) y verificar con test del caso base: missed_connection, R3+R5, O1, HUMAN, POL-DELAY-2026-03 y sin email/teléfono/document_id

## 5. Vertical slice HTTP

- [x] 5.1 Implementar `service.py` `resolve(booking_id, now)` (lecturas, decide, caso humano si HUMAN, excepciones `BookingNotFound`/`UpstreamError`) y verificar con test que el caso base crea HC-4471 y no llama a rebooking
- [x] 5.2 Añadir `POST /api/v1/disruptions/{booking_id}/resolve` en `routes.py` y verificar con `TestClient`: 200 caso base, 404 `ZZZ999`, 503 con eventos caídos, y cuerpo sin email/teléfono/document_id
- [x] 5.3 Ejecutar `cd backend && python -m pytest` y verificar que toda la suite pasa (incluido `test_health`)
