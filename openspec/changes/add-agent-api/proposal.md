# Change: Agent API Exposure, Passenger Chat Interface & Exam Documentation (Dev 3)

## Why
With the autonomous agent core implemented (Dev 1), the system requires an interface to expose the agentic capabilities to passengers and operational reviewers. According to decision **D13** in `openspec/documento_de_arquitectura_de_agente.md`, the agent must be exposed via a REST API endpoint (`POST /api/v1/agent/chat`) and integrated into the frontend with an interactive conversation view. Furthermore, comprehensive documentation answering all exam requirements (autonomy boundaries, agent pattern justification, context/PII management, tools vs RAG, and AI usage) must be completed.

## What Changes
1. **Agent API Endpoint (`backend/app/api/agent.py` & `routes.py`):**
   - Implement `POST /api/v1/agent/chat` accepting `AgentQueryRequest` and returning validated `AgentResponse`.
   - Wire with `DisruptionAgent.run()` and register in `api_router`.
   - Provide proper error handling (HTTP 422 for malformed PNR or empty message, HTTP 500/503 for upstream engine failures).

2. **Interactive Passenger Chat UI (`frontend/src/pages/AgentChat/`):**
   - Build a responsive chat interface supporting conversational interactions.
   - Include a 1-click preset button with the canonical exam query from Maria Silva:
     *"Hola, soy Maria. Mi vuelo a Lima está retrasado y viajo con mi hijo de 7 años. ¿Alcanzamos la conexión a México? Si no, cámbiennos al vuelo de esta noche. También quiero saber cuánto me van a pagar de compensación."*
   - Display conversational passenger reply alongside a collapsible/visual breakdown of agentic steps:
     - Tools invoked sequence (`get_trip_context`, `get_operational_events`, `get_policy_rules`, `get_eligible_options`, `create_human_case`).
     - Entitlements granted by policy.
     - Human-in-the-loop warning banner (Rule R5 trigger, Case `HC-4471`).
     - Available rebooking options.
   - Add navigation link in `Header.tsx` and route in `App.tsx`.

3. **Engineering Documentation & Deliverables:**
   - `docs/ENGINEERING_README.md`: Detail the 4 architectural points of Part A (Autonomy boundary, Agent pattern justification, Context & personal data, Tools vs RAG) and include the Mermaid system architecture diagram.
   - `docs/AI_USAGE_NOTE.md`: Complete the AI usage notes, accepted/rejected prompts, human decisions, and strictly prohibited data list.
   - `README.md`: Update instructions to document the agent endpoint, agent chat UI, and Docker instructions.

## Impact
- **Specs affected:** `specs/agent-api/spec.md`
- **Backend files:** `backend/app/api/agent.py`, `backend/app/api/routes.py`, `backend/tests/test_agent_api.py`
- **Frontend files:** `frontend/src/pages/AgentChat/`, `frontend/src/App.tsx`, `frontend/src/components/Header/Header.tsx`, `frontend/src/services/disruptionApi.ts`
- **Docs:** `docs/ENGINEERING_README.md`, `docs/AI_USAGE_NOTE.md`, `README.md`

