# Spec Delta

## Purpose

Convertir la reserva y los eventos resueltos en hechos verificables y evaluarlos contra las reglas de política versionadas para obtener los derechos del pasajero y si se requiere aprobación humana.

## ADDED Requirements

### Requirement: Hechos derivados del viaje
El sistema SHALL derivar `delay_minutes` (retraso del tramo afectado), `international` (origen y destino en países distintos según códigos de aeropuerto conocidos), `group_includes_minor` (algún pasajero CHILD o INFANT) y `compensation_requested` (entrada explícita, por defecto falso).

#### Scenario: Hechos del caso base
- **WHEN** se evalúa la reserva ABC123 con el retraso de 160 minutos en S1
- **THEN** `delay_minutes = 160`, `international = true`, `group_includes_minor = true`, `compensation_requested = false`

### Requirement: Detección de conexión perdida
El sistema SHALL marcar `missed_connection = true` cuando la llegada estimada del tramo retrasado más un tiempo mínimo de conexión de 60 minutos sea posterior a la salida programada del tramo siguiente.

#### Scenario: Conexión perdida en Lima
- **WHEN** S1 llega 17:55 + 160 min = 20:35 y S2 sale 19:05
- **THEN** `missed_connection = true`

#### Scenario: Conexión en el límite
- **WHEN** la llegada estimada más 60 minutos es exactamente la salida del tramo siguiente
- **THEN** `missed_connection = false`

### Requirement: Evaluación de reglas acumulativa
El sistema SHALL evaluar todas las reglas de la política y devolver todas las que aplican con su `entitlement`, junto con la `version` de la política como `policy_ref`.

#### Scenario: Reglas del caso base
- **WHEN** se evalúa POL-DELAY-2026-03 con los hechos del caso base
- **THEN** aplican R3 (REBOOK_NO_FEE) y R5 (PRIORITY_HANDLING), no aplican R1, R2 ni R4, y `policy_ref = "POL-DELAY-2026-03"`

### Requirement: Aprobación humana obligatoria
Si alguna regla aplicada tiene `requires_human_approval = true`, el sistema SHALL marcar la evaluación como que requiere humano.

#### Scenario: Menor en el grupo
- **WHEN** aplica R5
- **THEN** la evaluación requiere aprobación humana

### Requirement: Condición desconocida falla cerrado
Si una regla trae una `condition` que el sistema no reconoce, o un hecho necesario falta, el sistema SHALL marcar la evaluación como que requiere humano y registrar la regla, sin lanzar error ni ignorarla.

#### Scenario: Regla nueva no soportada
- **WHEN** la política incluye una regla con `condition = "weather_event == true"`
- **THEN** la evaluación requiere humano y registra esa regla como no evaluable
