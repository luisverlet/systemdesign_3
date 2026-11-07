# Nubara Airlines — Disruption Companion
## Engineering README & Technical Architecture Report

**Equipo de Desarrollo:** Dev 1 (Core Engine), Dev 2 (API, Infra & Persistence), Dev 3 (Frontend & UX)  
**Fecha:** Noviembre 2026 · **Stack:** FastAPI, PostgreSQL 16, SQLAlchemy 2, Alembic, Docker Compose, React/TS

---

### 1. Entendimiento del Problema y Resultado Esperado
Nubara Airlines requería un asistente operativo ante disrupciones de vuelos para reducir la incertidumbre del pasajero y la saturación del centro de llamadas. 

El desafío central radicaba en resolver la ambigüedad y contradicción de eventos operacionales en tiempo real, aplicando políticas corporativas estrictas sin incurrir en costos indebidos (como compensaciones o reubicaciones no autorizadas) ni violaciones de privacidad (PII).

**Resultado esperado:** Un servicio orquestador capaz de:
1. Reconciliar eventos contradictorios basándose en frescura temporal (`recorded_at`) y confiabilidad de la fuente.
2. Determinar si existe impacto accionable (ej. conexión física perdida considerando un tiempo mínimo de conexión MCT de 15 minutos).
3. Evaluar reglas de negocio versionadas (`get_policy_rules`).
4. Bloquear acciones de alto impacto si aplican condiciones sensibles (como la presencia de menores de edad en el grupo), derivando obligatoriamente a revisión humana.

---

### 2. Supuestos y Alcance Implementado
* **Alcance Técnico:** Vertical slice backend completo: API REST (`/resolve`, `/rebooking`, `/escalate`), persistencia en PostgreSQL con migraciones Alembic, trazabilidad con `X-Trace-Id` y auditoría en `decision_audits`.
* **Idempotencia:** La acción de alto impacto (`create_rebooking_request`) implementa control de idempotencia con clave compuesta derivada (`booking_id:option_id`), persistida en `idempotency_records` para soportar reintentos y mitigar fallos concurrentes o timeouts indeterminados (HTTP 503).
* **MCT (Minimum Connecting Time):** Se fijó en 15 minutos. Si `nueva_llegada_S1 + 15 min > salida_programada_S2`, la conexión se marca como rota (`missed_connection = true`).
* **Horarios Derivados:** En ausencia de feeds específicos, el embarque se calcula como `salida_vigente - 20 min` y la hora en sala como `salida_vigente - 80 min`.

---

### 3. Clasificación de Pasos del Sistema

| PASO / ETAPA | CLASIFICACIÓN | MOTIVO TÉCNICO | RIESGO ASOCIADO | CONTROL / FALLBACK |
| :--- | :--- | :--- | :--- | :--- |
| **Ingesta y Sanitización de Eventos** | **Determinista** | Fuentes degradadas (`LEGACY_MIRROR`) deben descartarse sin ambigüedad por regla estricta. | Falsa alarma o ignorar un retraso real. | Filtro determinista por lista `sources_degraded` y selección por timestamp `recorded_at` más reciente. |
| **Cálculo de Impacto en Itinerario** | **Determinista** | Aritmética de fechas y horas contra el umbral MCT de 15 minutos. | Alucinación o error de cálculo en tiempos de conexión. | Lógica algorítmica pura con validación de tipos `datetime`. |
| **Evaluación de Políticas de Negocio** | **Determinista** | Las reglas contractuales (`R1` a `R5`) conllevan obligaciones legales y financieras. | Otorgar compensaciones en efectivo o cambios gratuitos indebidos. | Motor de reglas tipo *Rule Map* (funciones puras) mapeadas a esquemas Pydantic inmutables. |
| **Acciones de Alto Impacto (Rebooking)** | **Human-Controlled** *(cuando aplique)* | La presencia de un menor (P2 Tomás, 7 años) activa la regla `R5`, obligando a aprobación humana. | Reubicar a un menor separado de su tutor o en vuelos sin asistencia. | Guardrail en backend que rechaza rebooking directo con HTTP 403 (`HUMAN_APPROVAL_REQUIRED`). |
| **Generación de Notificaciones** | **Determinista** *(Plantillas)* | Se descartó el uso de LLM en tiempo de ejecución para evitar promesas no verificables al cliente. | Un modelo generativo podría prometer reembolsos no aprobados. | Respuestas basadas en plantillas parametrizadas con validación de `policy_ref`. |

---

### 4. Decisiones Clave y Alternativas Descartadas

* **Arquitectura por Capas vs. Hexagonal:** Se optó por una arquitectura por capas tradicional (`api -> services -> models/integrations`). *Alternativa descartada:* Hexagonal pura; se consideró sobreingeniería innecesaria dado el tiempo y alcance de la prueba.
* **Evaluador de Políticas:** Se adoptó el patrón **Rule Map** (mapeo funcional de condiciones a predicados ejecutables) en lugar del patrón Strategy completo, permitiendo alta legibilidad y cobertura de pruebas inmediata.
* **Idempotencia Derivada vs. Header Cliente:** Se seleccionó clave derivada en backend (`booking_id + option_id`) para evitar delegar la seguridad transaccional a la implementación del cliente.
* **Sin IA en el Runtime:** Se decidió no integrar modelos generativos en la ruta crítica de toma de decisiones. El riesgo financiero y legal de una alucinación en políticas aéreas supera cualquier ganancia estética en el texto.

---

### 5. Riesgos y Siguientes Pasos
1. **Timeouts Indeterminados (HTTP 503):** Si el sistema de rebooking upstream falla por timeout, el registro queda marcado como `INDETERMINATE`. Como siguiente paso se debe implementar un worker asíncrono de conciliación (outbox pattern).
2. **Caducidad de Opciones (TTL):** Las opciones de vuelo tienen un TTL de 120 segundos. El siguiente incremento debe revalidar el TTL antes de enviar la orden de reubicación.
