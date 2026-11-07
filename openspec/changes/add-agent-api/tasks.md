## 1. OpenSpec Proposal & Contract Definition
- [x] 1.1 Document proposal.md, design.md, tasks.md, and specs/agent-api/spec.md

## 2. Agent API Endpoint
- [x] 2.1 Implement `POST /api/v1/agent/chat` in `backend/app/api/agent.py` using `AgentQueryRequest` and `DisruptionAgent`
- [x] 2.2 Register the agent router in `backend/app/api/routes.py`
- [x] 2.3 Implement automated tests in `backend/tests/test_agent_api.py` validating the endpoint with target conversation `ABC123`

## 3. Interactive Agent Chat Interface (Frontend)
- [ ] 3.1 Add agent client method `askAgent` in `frontend/src/services/disruptionApi.ts` supporting both live API and mock fallback
- [ ] 3.2 Create `AgentChatPage` component in `frontend/src/pages/AgentChat/` with chat timeline, quick-fill Maria query, agentic trajectory breakdown, and human review alerts
- [ ] 3.3 Register `/agent` route in `frontend/src/App.tsx` and add navigation tab in `frontend/src/components/Header/Header.tsx`
- [ ] 3.4 Add unit/integration tests for `AgentChatPage` in `frontend/src/pages/AgentChat/AgentChatPage.test.tsx`

## 4. Engineering Architecture Report (Part 2)
- [ ] 4.1 Update `docs/ENGINEERING_README.md` with:
  - Autonomy Boundary table (what LLM decides vs what is strictly deterministic/forbidden)
  - Agent Pattern rationale (Function Calling loop, latency, cost analysis)
  - Context & PII boundaries (`get_trip_context` fields included vs stripped)
  - Tools vs RAG technical justification
  - Mermaid architecture diagram

## 5. AI Usage Note & Final README
- [ ] 5.1 Update `docs/AI_USAGE_NOTE.md` covering LLM tools used, accepted/rejected suggestions, human decisions, and data forbidden from AI prompts
- [ ] 5.2 Update `README.md` with instructions for running the Agent Chat UI, testing the API, and Docker instructions
