# Nubara Airlines — Disruption Companion
## Final Exam Case Study — Autonomous Vertical Slice Backend

Sistema orquestador para resolución de disrupciones de vuelos, conciliación de eventos operativos en tiempo real, evaluación determinista de políticas de aerolínea y ejecución idempotente de acciones de alto impacto.

---

### 1. Entregables Obligatorios del Examen
* **Entregable 1 (Technical Evidence):** Instrucciones de ejecución, alcance implementado y cobertura técnica descritos en este documento.
* **Entregable 2 (Engineering README):** Disponible en [`docs/ENGINEERING_README.md`](docs/ENGINEERING_README.md) (Problema, supuestos, tabla de clasificación determinista/humano, riesgos y decisiones de diseño).
* **Entregable 3 (AI Usage & Decision Note):** Disponible en [`docs/AI_USAGE_NOTE.md`](docs/AI_USAGE_NOTE.md) (Herramientas utilizadas, decisiones personales del equipo y política estricta de PII no compartida con modelos).

---

### 2. Alcance Implementado
1. **API REST FastAPI (`/api/v1`):**
   * `POST /disruptions/resolve`: Ingesta de `booking_id`, reconciliación de eventos (descarte de `LEGACY_MIRROR`, selección por frescura temporal), cálculo de conexión perdida (MCT = 15 min), evaluación de reglas de negocio (`POL-DELAY-2026-03`) y derivación automática a caso humano por regla R5 (menor en grupo).
   * `POST /disruptions/rebooking`: Reubicación con control estricto de idempotencia (`booking_id + option_id`) y bloqueo automático (HTTP 403) si el caso requiere aprobación humana.
   * `POST /disruptions/escalate`: Creación de caso en cola `DISRUPTION_L2` con sanitización estricta de PII.
2. **Persistencia & Auditoría (PostgreSQL 16 + Alembic):**
   * Tabla `decision_audits`: Historial inmutable de cada decisión, reglas aplicadas y evidencia operacional anonimizada.
   * Tabla `idempotency_records`: Almacenamiento de transacciones para garantizar respuesta idéntica y protección contra reintentos concurrentes o timeouts indeterminados (503).
3. **Seguridad y Trazabilidad:**
   * Enmascaramiento de datos sensibles de pasajeros (`core/security.py`).
   * Manejadores de error uniformes con `X-Trace-Id` en cabeceras.

---

### 3. Instrucciones de Ejecución

#### Requisitos Previos
* Docker y Docker Compose
* Git

#### Puesta en Marcha Rápida
```bash
# 1. Clonar repositorio y configurar variables de entorno
cp .env.example .env

# 2. Levantar la infraestructura completa (PostgreSQL + FastAPI + Frontend)
docker compose up --build
```

#### Verificación de Servicios
* **API Documentación Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
* **Frontend Web:** [http://localhost:5173](http://localhost:5173)

#### Ejecución de Pruebas Automatizadas
```bash
# Dentro del contenedor de backend o en entorno local con dependencias:
docker compose exec backend pytest -v
```

---

### 4. Limitaciones Conocidas
1. **Timeouts Indeterminados Upstream (HTTP 503):** El sistema registra el estado como `INDETERMINATE` y previene reintentos duplicados a ciegas; sin embargo, la reconciliación asíncrona final requiere intervención del agente humano de operaciones.
2. **Mocks de Integración:** Hasta la finalización del motor algorítmico de Dev 1, las lecturas operacionales del caso base `ABC123` se alimentan de los contratos fidedignos provistos en el examen (`fixtures/`).
