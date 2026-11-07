# Nubara Airlines — Disruption Companion
## AI Usage & Decision Note

**Equipo de Desarrollo:** Dev 1, Dev 2, Dev 3  
**Proyecto:** Examen Case Disruption Companion · 2026

---

### 1. Herramientas de IA Utilizadas y Propósito
Durante el desarrollo del proyecto se emplearon asistentes de código agéntico basados en LLM (Antigravity con Claude 3.5 Sonnet / Gemini) con los siguientes propósitos delimitados:
1. **Scaffolding y Estructura OpenSpec:** Aceleración en la generación de plantillas de especificación (`proposal.md`, `tasks.md`, `specs/`).
2. **Generación de Mocks y Esquemas Pydantic:** Creación mecánica de tipos de datos a partir de los contratos JSON literales del examen.
3. **Sugerencia de Pruebas Unitarias:** Creación de fixtures de prueba y validaciones de tipos.

---

### 2. Salidas Aceptadas, Rechazadas y Modificadas

* **Aceptado:**
  * Estructura base de modelos SQLAlchemy y sintaxis de migraciones Alembic.
  * Funciones de enmascarado de PII basadas en expresiones regulares (`core/security.py`).
* **Rechazado:**
  * **Sugerencia de usar LLM en runtime para redactar explicaciones al pasajero:** Fue **rechazada categóricamente**. Un modelo generativo podría alucinar sobre compensaciones económicas (violando la regla R4) o prometer reubicaciones no contempladas en `POL-DELAY-2026-03`.
  * **Uso de evaluación dinámica de reglas vía `eval()` de Python:** Rechazado por riesgos críticos de inyección de código y falta de determinismo.
* **Modificado:**
  * Los esquemas Pydantic generados inicialmente utilizaban nombres de campo que sombreaban tipos nativos (como `date: date | None`), lo cual causaba errores de ejecución. Fue corregido manualmente tipando con alias `Date`.
  * La clave de idempotencia propuesta por defecto era un header genérico de cliente; el equipo humano instruyó modificarla a una clave compuesta derivada en backend (`booking_id + option_id`) para evitar colisiones.

---

### 3. Decisiones Tomadas Personalmente por el Equipo Humano
1. **Resolución de Ambigüedad Operativa:** La regla de descartar cualquier evento proveniente de fuentes en `sources_degraded` (como `LEGACY_MIRROR`) y priorizar exclusivamente por `recorded_at` fue definida por el equipo.
2. **Tiempo Mínimo de Conexión (MCT):** Se fijó el umbral en 15 minutos exactos tras analizar los tiempos del caso base.
3. **Clasificación en 3 Niveles de Modificación:** Se definió el esquema de impacto: `ACTIONABLE` (retraso ≥ 180 min, conexión perdida o cancelación), `INFORMATIONAL` (retraso 30–179 min o cambio de puerta), y `NOT_RELEVANT` (< 30 min).
4. **Política de Privacidad y PII:** Se determinó explícitamente qué campos del pasajero son públicos en la vista de disrupción (`name`, `document_id`, `loyalty_tier`) y cuáles están prohibidos en la API y logs (`phone`, `email`, datos de facturación).

---

### 4. Información que NUNCA se enviaría a un Modelo de IA
En conformidad con los principios de menor privilegio y normativas de protección de datos (GDPR / Leyes locales de privacidad):
1. **Datos de Identificación Personal (PII) reales:** Nombres completos no anonimizados, números de documento de identidad/pasaporte sin enmascarar, números de teléfono, correos electrónicos y direcciones físicas de los pasajeros.
2. **Datos Financieros y Transaccionales:** Números de tarjetas de crédito/débito, códigos CVV, tokens de pasarelas de pago o montos específicos de penalidad bancaria.
3. **Credenciales e Infraestructura Interna:** Secretos de producción, cadenas de conexión a bases de datos (`DATABASE_URL`), claves API privadas de proveedores aéreos o certificados de autenticación.
4. **Reglas Operativas Confidenciales o No Publicadas:** Matrices de costos internos de la aerolínea, márgenes de sobreventa de vuelos o datos de auditoría legal que no formen parte de las políticas públicas para el pasajero.
