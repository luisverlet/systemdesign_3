# Spec Delta

## Purpose

Exponer la resolución de una disrupción como un servicio HTTP invocable que va de la reserva a la decisión y deja escalado a operaciones humanas cuando la política lo exige.

## ADDED Requirements

### Requirement: Resolver una reserva por HTTP
El sistema SHALL exponer `POST /api/v1/disruptions/{booking_id}/resolve` que consulta los sistemas de lectura, ejecuta el motor de decisión y responde 200 con la decisión.

#### Scenario: Caso base por API
- **WHEN** se llama `POST /api/v1/disruptions/ABC123/resolve`
- **THEN** responde 200 con `missed_connection = true`, reglas R3 y R5, opción O1, `action = "HUMAN"` y `policy_ref = "POL-DELAY-2026-03"`

### Requirement: Escalamiento humano controlado
Cuando la decisión es HUMAN, el sistema SHALL crear un caso humano con el motivo y la evidencia (sin datos personales sensibles) y SHALL incluir el `case_id` en la respuesta. El sistema MUST NOT crear una solicitud de reubicación en ese caso.

#### Scenario: Caso humano creado
- **WHEN** la decisión del caso base es HUMAN
- **THEN** la respuesta incluye `human_case.case_id = "HC-4471"` y no se llamó a `create_rebooking_request`

### Requirement: Errores de entrada y de sistemas
El sistema SHALL responder 404 si la reserva no existe y 503 si una lectura de sistema externo falla, sin devolver una decisión parcial.

#### Scenario: Reserva desconocida
- **WHEN** se llama `POST /api/v1/disruptions/ZZZ999/resolve`
- **THEN** responde 404

#### Scenario: Sistema de eventos caído
- **WHEN** `get_operational_events` falla
- **THEN** responde 503 y no se crea ningún caso ni notificación

### Requirement: Respuesta sin datos personales sensibles
La respuesta del endpoint MUST NOT contener email, teléfono ni `document_id` de ningún pasajero.

#### Scenario: Respuesta limpia
- **WHEN** se resuelve ABC123
- **THEN** el cuerpo de la respuesta no contiene "maria.silva@example.com", "+56 9 8765 4321" ni "12.345.678-9"
