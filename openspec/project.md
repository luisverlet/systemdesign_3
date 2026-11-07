# Contexto del Proyecto

## Propósito
> TODO: Completar cuando se definan los requerimientos del sistema.

## Equipo
- 4 integrantes (completar nombres/roles).

## Stack tecnológico
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2
- **Frontend**: React 18 + Vite (JavaScript/TypeScript a definir)
- **Base de datos**: PostgreSQL 16
- **Infraestructura**: Docker + Docker Compose
- **Tests**: pytest (backend), Vitest (frontend)

## Convenciones

### Código
- Python: PEP 8, formateo con `ruff format`, lint con `ruff`. Tipado obligatorio en funciones públicas.
- React: componentes funcionales + hooks, nombres en PascalCase, un componente por archivo.
- Nombres de código en inglés; documentación puede ir en español.

### Arquitectura
- Backend por capas: `api` (routers) → `services` (negocio) → `models` (ORM). Los routers no acceden a la DB directamente.
- Comunicación front–back vía REST JSON bajo `/api/v1`.
- Configuración solo por variables de entorno.

### Git
- Rama principal: `main` (protegida). Trabajo en ramas: `feat/<change-id>`, `fix/<desc>`, `docs/<desc>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- Todo entra por Pull Request con al menos 1 revisión.

## Decisiones del equipo
- **D1 Políticas:** Rule Map (diccionario `condición -> función pura`).
- **D2 Backend:** arquitectura por capas `api -> services -> integrations / models`.
- **D3 Frontend:** React + TypeScript.
- **D4 MCT:** 15 min. `missed_connection = nueva_llegada + MCT > salida_siguiente`.
- **D5 Modificación relevante:**
  - `ACTIONABLE`: cancelación, conexión perdida o retraso >= 180 min -> evaluar políticas, ofrecer opciones o escalar.
  - `INFORMATIONAL`: retraso 30-179 min sin afectar conexión, o cambio de puerta -> solo notificar.
  - `NOT_RELEVANT`: retraso < 30 min o eventos de fuentes degradadas -> sin acción.
- **D6 Datos visibles:**
  - Etiqueta permanente del pasajero: nombre, documento (cédula) y nivel de fidelidad (`loyalty_tier`).
  - Email, teléfono, facturación y dirección: solo dentro de la cuenta del titular; nunca en notificaciones ni en la respuesta de disrupción.
  - Notificación de un vuelo: todos los datos del vuelo (número, origen, destino, horas programada/nueva, puerta, embarque, retraso, estado).
- **D6b Horarios derivados:** hora de embarque = salida - 20 min; hora en sala = embarque - 60 min (salida - 80 min). Se calculan sobre la salida vigente (con retraso si existe). Puerta sin dato -> `no disponible`.
- **D7 IA en runtime:** ninguna; mensajes por plantillas deterministas. Se evaluará un LLM más adelante para una utilidad puntual.

## Restricciones> TODO

## Dependencias externas
> TODO

## CONTEXTO ESPECIFICO (EXAMEN LITERAL)
# CONTEXTO COMPLETO Y ANÁLISIS: EXAMEN DISRUPTION COMPANION

Este documento contiene la transcripción íntegra y exacta del caso de estudio "Disruption Companion" de Nubara Airlines, seguido de un análisis detallado del dominio, los desafíos y la resolución del caso base.

---

# PARTE 1: TEXTO ORIGINAL DEL EXAMEN (TRANSCRIPCIÓN ÍNTEGRA)

**UNIVERSIDAD DE SANTANDER**
**Ingeniería de Sistemas**
**Análisis de Algoritmos**
**EXAMEN FINAL 2026-B**
**Case Exam**

## Case Exam — Disruption Companion
**Duration:** 2 hours maximum · Backend only · A finished application or deployment is not expected

**Name:** ____________________ **ID:** ____________________ **Date:** ____________________ **Grade:** ____________________

### 1. Context
A compact team at **Nubara Airlines** — Product Manager, Product Designer, Engineering Team Lead, and Software Engineer — is building a feature to help passengers whose flight has been modified. The product must help the passenger understand what happened and what their next step is, without giving out unverified information and without executing high-impact actions without the corresponding controls.

**Business goal.** Reduce passenger uncertainty and avoidable contacts to the call center while maintaining accuracy, security, and traceability. A first version should allow a passenger to:
1. look up the context of their trip;
2. understand whether there was a relevant modification and what it implies;
3. receive an actionable explanation or recommendation;
4. be referred to a person, or start a controlled action, when appropriate.

### 2. Available systems
You may assume that interfaces equivalent to the following exist. You do not have to use all of them. If you work with your own mocks, keep these contracts. The sample responses below are representative of what the tools return; use them as your working base.

| TOOL | TYPE | CONSIDERATION |
| :--- | :--- | :--- |
| `get_trip_context(booking_id)` | Read | May return partial information. |
| `get_operational_events(segment_ids)` | Read | Requires controlling timestamp, source, and freshness. |
| `get_eligible_options(trip_context)` | Read | Provides candidate options, not a final decision. |
| `get_policy_rules(scenario)` | Read | Versioned and verifiable rules. |
| `create_rebooking_request(option, idempotency_key)` | Write | High-impact action. |
| `create_human_case(reason, evidence)` | Write | Escalation to human operations. |
| `notify_passenger(message)` | Write | Must not send unvalidated information. |

**`get_trip_context("ABC123")`**
```json
{
  "booking_id": "ABC123",
  "passengers": [
    { "passenger_id": "P1", "name": "Maria Silva", 
      "type": "ADULT", "email": "maria.silva@example.com", 
      "phone": "+56 9 8765 4321", 
      "document_id": "12.345.678-9", 
      "loyalty_tier": "GOLD" },
    { "passenger_id": "P2", "name": "Tomás Silva", 
      "type": "CHILD", "age": 7 }
  ],
  "segments": [
    { "segment_id": "S1", "flight_number": "NB500", 
      "origin": "SCL", "destination": "LIM", 
      "date": "2026-09-15", "scheduled_departure": "14:30", 
      "scheduled_arrival": "17:55" },
    { "segment_id": "S2", "flight_number": "NB2410", 
      "origin": "LIM", "destination": "MEX", 
      "date": "2026-09-15", "scheduled_departure": "19:05", 
      "scheduled_arrival": "23:40" }
  ],
  "fare_conditions": { "changeable": true, 
    "refundable": false, "fare_family": "LIGHT" },
  "_meta": { "retrieved_at": "2026-09-15T11:02:31Z", 
    "completeness": "PARTIAL", "missing_fields": 
    ["fare_conditions.change_penalty_amount"] }
}
```

**`get_operational_events(["S1", "S2"])`**
```json
{
  "events": [
    { "event_id": "E-1001", "segment_id": "S1", 
      "type": "DELAY", "new_departure": "17:10", 
      "delay_minutes": 160, "source": "OPS_CORE", 
      "recorded_at": "2026-09-15T10:48:00Z" },
    { "event_id": "E-1007", "segment_id": "S1", 
      "type": "GATE_CHANGE", "gate": "24", 
      "source": "AIRPORT_FEED", 
      "recorded_at": "2026-09-15T10:55:30Z" },
    { "event_id": "E-1012", "segment_id": "S1", 
      "type": "STATUS", "status": "ON_TIME", 
      "source": "LEGACY_MIRROR", 
      "recorded_at": "2026-09-15T09:30:00Z" },
    { "event_id": "E-2003", "segment_id": "S2", 
      "type": "STATUS", "status": "SCHEDULED", 
      "source": "OPS_CORE", 
      "recorded_at": "2026-09-15T10:48:00Z" }
  ],
  "_meta": { "retrieved_at": "2026-09-15T11:02:33Z", 
    "sources_available": 
    ["OPS_CORE", "AIRPORT_FEED", "LEGACY_MIRROR"], 
    "sources_degraded": ["LEGACY_MIRROR"] }
}
```

**`create_rebooking_request(option, idempotency_key)`**
```
-> 201 { "request_id": "RBK-80231", "status": "PENDING_CONFIRMATION", 
         "expires_at": "2026-09-15T11:12:00Z" }
-> 409 { "error": "DUPLICATE_REQUEST", "request_id": "RBK-80231" }
-> 503 { "error": "UPSTREAM_TIMEOUT" } // actual result is indeterminate
```

**`create_human_case(reason, evidence)`**
```
-> 201 { "case_id": "HC-4471", "queue": "DISRUPTION_L2", "sla_minutes": 45 }
```

**`notify_passenger(message)`**
```
-> 202 { "notification_id": "NT-9912", 
         "channel": "PUSH", 
         "status": "QUEUED" }
-> 422 { "error": "UNVALIDATED_CONTENT", 
         "detail": "missing policy_ref" }
```

**`get_eligible_options(trip_context)`**
```json
{
  "options": [
    { "option_id": "O1", "type": "REBOOK", 
      "flight_number": "NB2412", "origin": "LIM", 
      "destination": "MEX", "date": "2026-09-16", 
      "departure": "08:15", "fare_difference": 0, 
      "seats_available": 4, 
      "policy_ref": "POL-DELAY-2026-03", 
      "confidence": "HIGH" },
    { "option_id": "O2", "type": "REBOOK", 
      "flight_number": "NB2450", "origin": "LIM", 
      "destination": "MEX", "date": "2026-09-15", 
      "departure": "23:40", 
      "fare_difference": 180000, "currency": "CLP", 
      "seats_available": 1, 
      "policy_ref": "POL-DELAY-2026-03", 
      "confidence": "MEDIUM" },
    { "option_id": "O3", "type": "REFUND", 
      "policy_ref": "POL-REFUND-2026-01", 
      "confidence": "LOW" }
  ],
  "_meta": { "retrieved_at": "2026-09-15T11:02:35Z", 
    "ttl_seconds": 120 }
}
```

**`get_policy_rules("DELAY")`**
```json
{
  "scenario": "DELAY", "version": "POL-DELAY-2026-03", 
  "effective_from": "2026-03-01", "rules": [
    { "rule_id": "R1", "condition": "delay_minutes >= 180", 
      "entitlement": "REBOOK_NO_FEE", 
      "requires_human_approval": false },
    { "rule_id": "R2", 
      "condition": "delay_minutes >= 240 AND international", 
      "entitlement": "MEAL_VOUCHER", 
      "requires_human_approval": false },
    { "rule_id": "R3", 
      "condition": "missed_connection == true", 
      "entitlement": "REBOOK_NO_FEE", 
      "requires_human_approval": false },
    { "rule_id": "R4", 
      "condition": "compensation_requested == true", 
      "entitlement": "CASH_COMPENSATION", 
      "requires_human_approval": true },
    { "rule_id": "R5", 
      "condition": "group_includes_minor == true", 
      "entitlement": "PRIORITY_HANDLING", 
      "requires_human_approval": true }
  ],
  "_meta": { "retrieved_at": "2026-09-15T11:02:36Z", 
    "superseded_versions": ["POL-DELAY-2025-11"] }
}
```

### 3. Constraints
*   Operational data may be outdated or contradictory across sources.
*   An incorrect recommendation can lead to cost, a complaint, or a policy violation.
*   Changing a booking or issuing compensation are high-impact actions.
*   Personal data must be protected and least privilege applied.
*   The first version must be operable by a small team.
*   Latency, cost per interaction, and model dependency must be considered.
*   There is no single correct solution.

### 4. Ambiguities you must resolve
The statement leaves these undefined on purpose. You may decide them, document them, or state what you would ask and whom.
*   What counts as a relevant modification.
*   What information may be shown to the passenger and what may not.
*   In which cases a recommendation may be delivered automatically.
*   In which cases a person must step in before acting or communicating.
*   What to do when sources give contradictory information.

### 5. Your task
Design a bounded first version of the product and implement a **backend technical vertical slice**: the logic that solves the base case — combining booking, events, and policies to determine what the passenger is entitled to — as an invocable service or function, with error handling and at least one validation or test. No screens or frontend are required.
1.  **Solve the base case.** From the available information, determine what happened to the trip and what should be offered or communicated to the passenger.
2.  **Design the handling of an ambiguous or complex query** in which the system must combine booking, operational events, and policies to reach an answer. Explain how the work is broken down, what context is retrieved, what stays deterministic, what is solved with AI or an agent, and where it stops to ask for human intervention.
3.  **Implement your backend vertical slice.**
**On using AI inside the product.** Incorporating AI at runtime is not mandatory. If you decide not to, explain what benefit you expected and why the risk, cost, or complexity does not justify it. Solving something deterministically can be an excellent engineering decision.

### 6. Deliverables

**1 — Technical evidence**
Your backend vertical slice. It must make it possible to verify at least one relevant decision of the case. Include:
*   instructions to review or run it;
*   scope actually implemented;
*   available tests or validations;
*   known limitations.

**2 — Engineering README (≤ 2 pages)**
*   problem understood and expected outcome;
*   assumptions and scope;
*   main decisions and discarded alternatives;
*   what stayed deterministic, AI-assisted, agentic, or human-controlled;
*   risks and next steps;
*   how you validated the solution.

**3 — AI Usage & Decision Note (≤ 1 page)**
*   AI tools used and what for;
*   outputs accepted, rejected, or modified, and how you validated them;
*   decisions you made personally;
*   what information you would never give to a model.

*You may use this table to show the step classification the README asks for (you may also include it directly in the README):*

| STEP | CLASSIFICATION | REASON | RISK | CONTROL / FALLBACK |
| :--- | :--- | :--- | :--- | :--- |
| ... | deterministic / AI-assisted / agentic / human | ... | ... | ... |

---

# PARTE 2: ANÁLISIS Y GUÍA DE RESOLUCIÓN DEL CASO

## 1. El Dominio del Problema y Desafíos
El sistema propuesto actúa como un orquestador para gestionar interrupciones de vuelos. El verdadero desafío no radica en la complejidad algorítmica clásica, sino en el **manejo de la fiabilidad de los datos, la idempotencia de las acciones y la evaluación de políticas críticas de negocio**. 

El sistema debe consumir múltiples APIs (lectura) y decidir si debe invocar APIs de alta sensibilidad (escritura) garantizando no realizar acciones perjudiciales para la aerolínea (costos) o el cliente.

## 2. Resolución de Ambigüedades (Sección 4 del examen)
*   **¿Qué cuenta como modificación relevante?** Cualquier cambio en `gate` (puerta) o un `delay` (retraso) que afecte los tiempos de escala al punto de amenazar una conexión, o que supere un umbral base (ej. > 30 mins).
*   **¿Qué mostrar al pasajero?** Se debe mostrar el evento operativo destilado (ej. "Tu vuelo está retrasado 160 min"), pero *nunca* datos internos crudos de las respuestas de API ni errores de la fuente, tampoco se deben garantizar reembolsos o compensaciones sin la confirmación final de la política o el agente.
*   **Decisión ante datos contradictorios:** Se utilizará un enfoque determinista basado en metadatos. Se ignoran fuentes listadas en `sources_degraded` (como `LEGACY_MIRROR`). Para fuentes activas, prevalece el evento con el `recorded_at` más reciente.
*   **Intervención humana (Cuándo escalar):** Siempre que la evaluación de `get_policy_rules` retorne `requires_human_approval: true` para cualquier regla aplicada.

## 3. Resolución del Caso Base (La historia de Maria y Tomás)
Evaluando los JSON de los mocks de manera estructurada:

1.  **Sanitización de Eventos:**
    *   Evento `E-1012` (`LEGACY_MIRROR` dice a tiempo a las 09:30): **Descartado** por ser de fuente degradada y de un timestamp muy antiguo.
    *   Evento `E-1001` (`OPS_CORE` dice 160 mins de retraso a las 10:48): **Aceptado** como fuente de verdad actual.
2.  **Análisis de Impacto en el Trip:**
    *   Vuelo 1 (SCL -> LIM) llegaba a las 17:55. Con 160 min de retraso, la nueva llegada estimada es ~20:35.
    *   Vuelo 2 (LIM -> MEX) sale a las 19:05.
    *   **Resultado:** El pasajero pierde físicamente la conexión (`missed_connection = true`).
3.  **Evaluación de Políticas (`DELAY`):**
    *   Regla `R1` (delay >= 180): False (es 160).
    *   Regla `R3` (`missed_connection == true`): **True**. Entitlement: `REBOOK_NO_FEE`.
    *   Regla `R5` (`group_includes_minor == true`): **True**. El pasajero P2 (Tomás) tiene `type: CHILD`, `age: 7`. Esto detona un `requires_human_approval: true`.
4.  **Acción Final a Ejecutar:**
    *   Debido a que aplica la Regla R5 y esta requiere aprobación humana, el sistema **no debe reubicar automáticamente** usando `create_rebooking_request`.
    *   El sistema debe generar un caso con `create_human_case` por el motivo "Connection missed with minor in group", y opcionalmente notificar al usuario de que su caso está siendo atendido prioritariamente.

## 4. Estrategia AI vs Determinista
*   **Componentes Deterministas (CORE):** Ingesta de datos, reconciliación de eventos basados en tiempo, cálculo matemático de tiempos de vuelo, y evaluación de reglas de negocio (`policy engine`). Estas áreas no admiten margen de error ("alucinaciones") por sus implicaciones legales y operativas.
*   **Componentes Asistidos por IA (OPCIONAL):** La redacción de la notificación (`notify_passenger`) podría usar un LLM para adaptar el tono ("Tu vuelo se retrasó, pero ya estamos manejando la situación para ti y Tomás"). Sin embargo, dadas las restricciones del examen sobre riesgo y costo, la arquitectura propuesta mantendrá todo **estrictamente determinista**, usando plantillas de texto para notificaciones, ya que mitiga al 100% el riesgo de prometer acciones no autorizadas.

# Plan de Acción y Distribución del Equipo (Fullstack Vertical Slice)


Aunque las instrucciones originales del examen indican que no se requieren pantallas ni frontend ("No screens or frontend are required"[cite: 2]), construir una interfaz para visualizar el flujo completo es una excelente decisión para demostrar dominio técnico en un escenario real.

A continuación, se detalla la nueva estructura del equipo y el roadmap ajustado para integrar el desarrollo frontend.

## 1. Distribución del Equipo (3 Desarrolladores)

Para mantener el equilibrio en la carga de trabajo y asegurar que cada miembro tenga un dominio claro, la división será la siguiente:

*   **Dev 1 (Core Backend y Algoritmia)**
    *   **Responsabilidad:** Implementar las interfaces de los sistemas externos (Mocks). Construir el motor de resolución de ambigüedades de datos (ej. comparar `OPS_CORE` vs `LEGACY_MIRROR` mediante timestamps) y el motor de evaluación de políticas.
    *   **Foco:** Lógica de negocio determinista, algoritmia del "Base Case" y pruebas unitarias.

*   **Dev 2 (Infraestructura, APIs y Persistencia)**
    *   **Responsabilidad:** Configurar el entorno Docker (API + PostgreSQL). Construir los endpoints de la API (orquestación del caso de uso), gestionar la trazabilidad en base de datos y manejar la llave de idempotencia para la acción de alto impacto (`create_rebooking_request`).
    *   **Foco:** Arquitectura de red, resiliencia, manejo de errores HTTP y redacción del *Engineering README*.

*   **Dev 3 (Frontend y Experiencia de Usuario)**
    *   **Responsabilidad:** Consumir la API construida por Dev 2. Crear la interfaz para que el pasajero ingrese su `booking_id`, visualice el contexto de su viaje, entienda si hubo modificaciones relevantes (como un retraso o pérdida de conexión) y seleccione opciones accionables (reprogramación o compensación).
    *   **Foco:** UI/UX, manejo de estados, validaciones en cliente y feedback visual del proceso.

---

## 2. Decisiones de Arquitectura y Stack Tecnológico

Antes de comenzar a codificar, el equipo debe tomar las siguientes decisiones fundamentales. Seleccionen una opción de cada categoría para que la IA genere el código en consecuencia:

### A. Stack Tecnológico Base
*   **Opción 1 (Ecosistema Node/JS):** Backend en Node.js (Express o NestJS) + Frontend en React (o Astro) con Tailwind CSS. Base de datos PostgreSQL.
*   **Opción 2 (Ecosistema Python/JS):** Backend en Python (FastAPI, excelente para validaciones de esquemas JSON rápidas) + Frontend en React con Tailwind CSS. Base de datos PostgreSQL.
*   **Opción 3 (Ecosistema Java/JS):** Backend en Java (Spring Boot) + Frontend en React. Base de datos PostgreSQL.

### B. Patrón para el Evaluador de Políticas (`get_policy_rules`)
*   **Opción 1 (Patrón Strategy):** Una clase o función dedicada para cada regla (ej. `EvaluateDelayTime`). Escalable y altamente testeable, ideal para principios SOLID, aunque requiere más código inicial.
*   **Opción 2 (Rule Map / Enfoque Funcional):** Un diccionario que asocia el string de la regla (ej. `"missed_connection == true"`) a funciones puras o lambdas. Rápido y conciso, pero puede ser difícil de mantener si las reglas se anidan mucho.

### C. Arquitectura del Backend
*   **Opción 1 (Hexagonal / Puertos y Adaptadores):** Separación estricta donde el dominio de vuelos no conoce las APIs ni la base de datos. Demuestra un alto nivel de diseño arquitectónico y facilita el uso de mocks para los sistemas externos.
*   **Opción 2 (Capas Tradicional):** Flujo Controller -> Service -> Integration/Repository. Más rápido de implementar y muy familiar, aunque acopla un poco más la lógica a los conectores externos.

---

## 3. Roadmap de Prompts (Ejecución Asistida por IA)

Una vez decididas las opciones de la sección anterior, utilizaremos esta secuencia paso a paso para construir el proyecto:

1.  **Paso 1: Setup del Repositorio y Contenedores.** Generación del `docker-compose.yml`, configuración inicial de la base de datos PostgreSQL (esquemas de auditoría e idempotencia) y el *scaffolding* básico del backend y frontend.
2.  **Paso 2: Capa de Integración Externa (Dev 1).** Creación de los conectores simulados (mocks) que retornarán los datos estáticos del examen (contexto, eventos, reglas) respetando los contratos.
3.  **Paso 3: Motor de Resolución y Reglas (Dev 1).** Desarrollo de la lógica que toma los eventos contradictorios, determina la verdad (resolviendo ambigüedades) y evalúa la elegibilidad del pasajero según el JSON de políticas.
4.  **Paso 4: Orquestación y Controladores (Dev 2).** Construcción del endpoint principal (ej. `POST /api/disruptions/resolve`) que consume la lógica de Dev 1, registra la decisión en PostgreSQL y retorna la respuesta procesada.
5.  **Paso 5: Implementación de la Interfaz (Dev 3).** Creación de los componentes de UI para buscar la reserva, mostrar el estado (ej. "Vuelo Retrasado") y pintar los botones de acción ("Reagendar", "Pedir Reembolso") conectados al backend.
6.  **Paso 6: Documentación Técnica (Dev 2).** Redacción final del *Engineering README* y la *AI Usage & Decision Note* documentando todas las decisiones tomadas durante los pasos 1 al 5.

TODO EL CODIGO ESCRITO DEBE SEGUIR LAS BUENAS PRACTICAS DE PROGRAMACION Y ESTAR EN INGLES, INSTRUCCIONES PUEDEN ESTAR EN ESPANOL 
