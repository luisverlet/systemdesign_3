# Agent Evals & Guardrails Specification

## Requirements

### Requirement: Human-in-the-Loop Action Guardrail
El sistema SHALL interceptar cualquier llamada a herramientas de escritura de alto impacto (`create_rebooking_request`) y MUST abortar la ejecución directa si la reserva involucra un menor de edad (Regla R5 activa).

#### Scenario: Intento de rebooking automático con menor en reserva
- **WHEN** el agente intenta invocar `create_rebooking_request` para una reserva con `group_includes_minor == true`
- **THEN** el sistema bloquea la acción, registra la denegación en auditoría y deriva a `create_human_case`

### Requirement: Manejo de Falla Upstream 503
El sistema SHALL capturar respuestas `503 UPSTREAM_TIMEOUT` en herramientas de escritura y MUST marcar el estado de la operación como `INDETERMINATE`.

#### Scenario: Timeout en rebooking
- **WHEN** el upstream de rebooking retorna 503
- **THEN** la traza registra `INDETERMINATE` y el sistema no reintenta automáticamente

### Requirement: Observabilidad y Auditoría de Trazas
El sistema SHALL escribir en formato JSONL un registro por cada interacción del agente conteniendo `trace_id`, latencia, herramientas llamadas en orden y evidencia sanitizada sin PII.

#### Scenario: Auditoría de conversación
- **WHEN** se completa la interacción del agente
- **THEN** se añade un registro a `logs/agent_trace.jsonl` conteniendo la trayectoria ejecutada y datos sensibles enmascarados

### Requirement: Evaluación de Trayectoria y Faithfulness
La suite de pruebas SHALL verificar que el agente ejecute la secuencia esperada de herramientas para los 4 casos core y que cada derecho otorgado posea un `policy_ref` válido.

#### Scenario: Evaluación de caso base
- **WHEN** se ejecuta la suite de evaluación para el caso Maria y Tomás
- **THEN** la trayectoria verifica que no se llamó a `create_rebooking_request` y que `policy_ref` coincide con `POL-DELAY-2026-03`
