# Disruption API Specification

## Requirements

### Requirement: Resolución auditada
El sistema SHALL registrar en `decision_audit` cada respuesta de `POST /disruptions/resolve` con decisión, versión de política, reglas aplicadas y evidencia, sin datos personales.

#### Scenario: Caso base auditado
- **WHEN** se resuelve `ABC123`
- **THEN** existe una fila con `decision_type = HUMAN_REVIEW`, `applied_rules = ["R3","R5"]` y `policy_version = POL-DELAY-2026-03`

### Requirement: Rebooking idempotente
`POST /disruptions/rebooking` SHALL derivar internamente una llave de idempotencia compuesta (`booking_id + option_id`) y MUST NOT crear más de una solicitud upstream por llave.

#### Scenario: Reintento con la misma opción y reserva
- **WHEN** se envía dos veces la misma solicitud de rebooking para un `booking_id` y `option_id`
- **THEN** la segunda respuesta es idéntica a la primera y no se llama de nuevo al sistema externo

#### Scenario: Timeout indeterminado
- **WHEN** el sistema externo responde 503 `UPSTREAM_TIMEOUT`
- **THEN** el registro queda `INDETERMINATE` y la API responde 202 con `status = INDETERMINATE`

### Requirement: Control humano antes de acciones de alto impacto
El sistema MUST rechazar un rebooking cuando la última decisión del booking requiere aprobación humana.

#### Scenario: Grupo con menor
- **WHEN** se intenta rebooking para `ABC123` tras una decisión `HUMAN_REVIEW`
- **THEN** la API responde 403 `HUMAN_APPROVAL_REQUIRED`

### Requirement: Notificación validada
El sistema MUST NOT enviar notificaciones al pasajero sin `policy_ref`.

#### Scenario: Mensaje sin referencia de política
- **WHEN** se intenta notificar sin `policy_ref`
- **THEN** no se envía, se audita el rechazo y se deriva a caso humano

