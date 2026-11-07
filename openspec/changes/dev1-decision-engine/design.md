# Design

## Context

`backend/app/services/` está vacío; el backend es FastAPI con un solo endpoint `/health` y pytest. El entorno local tiene Python 3.9 (Docker usa 3.12), así que el código debe correr en ambos. Requisitos en `specs/`; motivación en proposal.md.

## Goals / Non-Goals

**Goals:**
- Núcleo de decisión 100 % determinista, sin red ni DB, invocable como una función: `decide(trip, events, options, policy, now, compensation_requested=False)` (pura; las lecturas las hace `service.resolve`).
- Cada descarte y cada regla deja un motivo legible (trazabilidad para Dev 2 y el README).

- Vertical slice: `POST /api/v1/disruptions/{booking_id}/resolve` → `service.resolve()` → mocks + motor → respuesta JSON.

**Non-Goals:**
- Ejecutar la reubicación automáticamente: aunque la acción sea AUTO, el endpoint solo recomienda (el pasajero confirma después); idempotencia real y persistencia son de Dev 2.
- Notificar al pasajero en esta versión.
- IA en runtime.
- Zonas horarias: el caso compara horas locales del mismo aeropuerto (LIM).

## Decisions

**Estructura** — paquete `backend/app/services/disruption/`:
```
mocks.py     7 funciones con los JSON literales del examen; escrituras con estado en memoria
events.py    resolve_events(response) -> {segment_id: {status, gate, conflicts}}, discarded
facts.py     derive_facts(trip, resolved, compensation_requested) -> dict
policy.py    CONDITIONS = {"delay_minutes >= 180": lambda f: ..., ...}; evaluate(rules, facts)
options.py   select_option(options_resp, facts, entitlements, policy_version, now)
decision.py  decide(...) une todo y fija action AUTO/HUMAN
service.py   resolve(booking_id, now): lecturas -> decide -> si HUMAN create_human_case
```
La ruta vive en `backend/app/api/routes.py` (patrón existente) y solo llama `service.resolve`; mapea `BookingNotFound` → 404 y `UpstreamError` → 503. Los mocks lanzan esas excepciones (reserva desconocida, o falla simulable) para poder probarlas.
Alternativa descartada: arquitectura hexagonal con puertos/adaptadores. Para un examen de 2 h añade capas sin beneficio; las funciones puras ya permiten sustituir mocks.

**Datos como dicts** — se trabaja con los dicts del JSON tal cual. Alternativa descartada: modelos Pydantic de dominio; duplican el contrato y Dev 2 puede añadirlos en `schemas/` para la API.

**Condiciones como mapa cerrado** — la `condition` string es la llave de un dict a funciones. Alternativa descartada: parsear/evaluar expresiones (más código, y riesgo de ejecutar política mal escrita). Llave desconocida o hecho faltante → regla "no evaluable" → HUMAN.

**Jerarquía de fuentes** — confiables: `OPS_CORE`, `AIRPORT_FEED`; se descarta lo que esté en `sources_degraded` (no un nombre fijo). Aspecto `status` = DELAY|STATUS, aspecto `gate` = GATE_CHANGE. Conflicto = dos fuentes confiables distintas con valor distinto en el mismo aspecto → HUMAN.

**Constantes** — `MIN_CONNECTION_MINUTES = 60`; tabla mínima `AIRPORT_COUNTRY = {"SCL": "CL", "LIM": "PE", "MEX": "MX"}`; aeropuerto desconocido → `international` faltante → regla R2 no evaluable → HUMAN.

**Tiempo inyectado** — `now` es parámetro (no `datetime.now()`) para que el TTL sea testeable.

**Datos personales** — la decisión expone solo `passenger_id`, `type` y `age`; nunca email, teléfono ni `document_id`.

## Risks / Trade-offs

- [`delay_minutes` es el retraso del tramo, no el de llegada al destino final; con O1 la llegada final se retrasa ~13 h y R2 podría aplicar] → documentado como supuesto en el README; pregunta al PM.
- [MCT de 60 min y tabla de países son supuestos] → constantes en un solo lugar; fallan cerrado si falta el dato.
- [`fare_difference > 0` se descarta aunque la aerolínea podría absorberlo] → nunca se cobra automáticamente; queda para revisión humana.
- [Mocks con estado en memoria (idempotencia) no sobreviven reinicios] → suficiente para tests; persistencia es de Dev 2.
