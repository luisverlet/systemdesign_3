## 1. Propuesta y Especificación
- [x] 1.1 proposal.md, design.md, tasks.md y spec.md de agent-evals

## 2. Guardrails HITL y Control de Acciones Críticas
- [x] 2.1 Implementar `backend/app/services/agent/controls.py` con `validate_action_execution`
- [x] 2.2 Bloqueo estricto de `create_rebooking_request` para menores (R5)
- [x] 2.3 Manejo y registro de error 503 upstream (`UPSTREAM_TIMEOUT`)

## 3. Observabilidad y Trazabilidad Estructurada
- [x] 3.1 Implementar `backend/app/core/telemetry.py` para generación de `agent_trace.jsonl`
- [x] 3.2 Sanitización y redacción de PII en telemetría

## 4. Suite de Evaluación de Trayectorias y Faithfulness
- [x] 4.1 Test Caso 1: Conversación objetivo (Maria y Tomás - bloqueo HITL)
- [x] 4.2 Test Caso 2: Manejo de fuentes contradictorias
- [x] 4.3 Test Caso 3: Ataque de inyección en `remarks` neutralizado
- [x] 4.4 Test Caso 4: Manejo resiliente de timeout 503
- [x] 4.5 Test Faithfulness: Verificación de referencias de políticas en beneficios
