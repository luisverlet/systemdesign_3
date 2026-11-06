# Change: API, persistencia e idempotencia de Disruption Companion

## Why
La lógica de decisión (Dev 1) debe exponerse como servicio invocable, con trazabilidad de cada decisión y protección contra ejecuciones duplicadas de acciones de alto impacto (rebooking), tal como exige el caso.

## What Changes
- `POST /api/v1/disruptions/resolve`: consulta y decisión (usa contrato `ResolveResponse`); registra auditoría.
- `POST /api/v1/disruptions/rebooking`: crea solicitud de reubicación con idempotencia; maneja 201/409/503.
- `POST /api/v1/disruptions/escalate`: crea caso humano y notifica solo contenido validado (`policy_ref`).
- Tablas PostgreSQL `decision_audit` e `idempotency_record`, gestionadas con Alembic.
- Enmascarado de PII en logs/auditoría y manejadores de error uniformes.

## Impact
- Specs afectadas: `disruption-api` (nueva).
- Código afectado: `backend/app/api/`, `backend/app/models/`, `backend/app/db/`, `backend/app/core/`, `backend/app/services/resolve_orchestrator.py`.
- Depende de: `add-disruption-contract` (Fase 0); se integra con `add-disruption-engine` (Dev 1) vía stub hasta su merge.
- Responsable: Dev 2.

## Decisiones pendientes del equipo
- **A1** Creación del caso humano: automática al resolver (propuesto) o al confirmar el pasajero.
- **A2** Llave de idempotencia: header `Idempotency-Key` enviado por el cliente (propuesto) o derivada `booking_id+option_id`.
- **A3** Migraciones: Alembic (propuesto) o SQL en `db/init/`.
