# Change: Controles de Seguridad HITL, Observabilidad y Suite de Evaluaciones (Dev 2)

## Why
El agente de IA de Disruption Companion (Parte 2) interactúa con modelos generativos que interpretan lenguaje natural y ejecutan herramientas. Para garantizar seguridad operativa, financiera y legal, el sistema debe:
1. Imponer límites estrictos de autonomía (Human-in-the-Loop) impidiendo acciones de alto impacto (rebooking) sin autorización humana cuando existan menores en el itinerario (Regla R5).
2. Generar trazas de observabilidad estructuradas (`trace_id`, latencias, herramientas llamadas) con redacción rigurosa de PII para auditoría.
3. Proveer una suite de evaluación automatizada que evalúe la trayectoria de herramientas y el faithfulness de las respuestas.

## What Changes
- Implementación de guardrails de seguridad en `backend/app/services/agent/controls.py`.
- Módulo de observabilidad y trazabilidad estructurada en `backend/app/core/telemetry.py`.
- Suite de evaluación de trayectorias (4 casos core) y faithfulness en `backend/tests/agent_evals/`.
- Manejo resiliente ante fallas de escritura upstream (503 UPSTREAM_TIMEOUT).

## Impact
- Specs afectadas: `agent-evals` (nueva).
- Código afectado: `backend/app/services/agent/controls.py`, `backend/app/core/telemetry.py`, `backend/tests/agent_evals/`.
- Depende de: `add-agent-core` (Dev 1).
- Responsable: Dev 2.
