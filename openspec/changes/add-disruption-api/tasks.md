## 1. Propuesta
- [x] 1.1 proposal.md, design.md, tasks.md, spec
- [x] 1.2 Equipo resuelve A1, A2, A3 y aprueba PR

## 2. Persistencia
- [x] 2.1 Configurar Alembic en `backend/app/db/migrations/`
- [x] 2.2 Modelos `DecisionAudit`, `IdempotencyRecord`
- [x] 2.3 Migración inicial 0001_initial_tables.py

## 3. Endpoints
- [x] 3.1 `POST /disruptions/resolve` (stub con mock) + auditoría
- [x] 3.2 `POST /disruptions/rebooking` con idempotencia (201/409/503)
- [x] 3.3 `POST /disruptions/escalate` + notify con `policy_ref`

## 4. Transversal
- [ ] 4.1 Manejadores de error uniformes
- [ ] 4.2 Enmascarado de PII en logs/auditoría

## 5. Integración
- [ ] 5.1 Reemplazar stub por motor de Dev 1

## 6. Tests
- [ ] 6.1 resolve ABC123 → HUMAN_REVIEW + fila de auditoría
- [ ] 6.2 rebooking: replay misma key, 409, 503 → INDETERMINATE
- [ ] 6.3 rebooking bloqueado si HUMAN_REVIEW
- [ ] 6.4 notify sin policy_ref → no se envía
