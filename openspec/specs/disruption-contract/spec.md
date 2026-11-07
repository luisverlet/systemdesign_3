# Disruption Contract Specification

## Requirements

### Requirement: Consulta de disrupción por reserva
El sistema SHALL exponer `POST /api/v1/disruptions/resolve` que recibe `{ "booking_id": string }` (6 caracteres alfanuméricos en mayúscula) y devuelve un `ResolveResponse`.

#### Scenario: booking_id inválido
- **WHEN** se envía un `booking_id` que no cumple el formato
- **THEN** el sistema responde 422 sin consultar sistemas externos

#### Scenario: Caso base ABC123
- **WHEN** se consulta `ABC123`
- **THEN** la respuesta indica `impact.relevance = ACTIONABLE`, `impact.missed_connection = true`, reglas aplicadas R3 y R5, y `decision.type = HUMAN_REVIEW`

### Requirement: Datos personales expuestos
La respuesta SHALL incluir por pasajero solo nombre, tipo, documento y nivel de fidelidad. Email, teléfono, facturación y dirección MUST NOT aparecer.

#### Scenario: Pasajero con email y teléfono
- **WHEN** el contexto del viaje trae `email` y `phone`
- **THEN** esos campos no aparecen en `ResolveResponse.passengers`

### Requirement: Datos del vuelo y horarios derivados
Cada vuelo SHALL incluir número, origen, destino, fecha, horarios programados y estimados, puerta (o `null`), retraso, estado, hora de embarque (salida vigente − 20 min) y hora en sala (embarque − 60 min), con `times_estimated = true` cuando son calculados.

#### Scenario: Vuelo con retraso
- **WHEN** S1 sale 14:30 con 160 min de retraso
- **THEN** `estimated_departure = 17:10`, `boarding_time = 16:50`, `lounge_time = 15:50`

### Requirement: Trazabilidad de eventos
La respuesta SHALL listar todos los eventos operacionales recibidos indicando si fueron aceptados y, si no, el motivo de descarte.

#### Scenario: Fuente degradada
- **WHEN** un evento proviene de una fuente en `sources_degraded`
- **THEN** aparece con `accepted = false` y `discard_reason = SOURCE_DEGRADED`

