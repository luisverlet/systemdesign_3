## 1. OpenSpec Proposal & Tool Contracts
- [x] 1.1 Document proposal.md, design.md and specs/agent-core/spec.md

## 2. Prompt Injection Defense & Fixture Update
- [x] 2.1 Update `trip_context_ABC123.json` fixture with malicious `remarks` injection
- [x] 2.2 Implement `PromptInjectionDefense` sanitizer isolating tool returns as inert XML data

## 3. Tool Bindings & Schema Definition
- [x] 3.1 Define Pydantic schemas in `backend/app/schemas/agent.py` for structured agent output
- [x] 3.2 Implement typed tool bindings in `backend/app/services/agent/tools.py` using Part 1 deterministic services

## 4. System Prompt & Agent Engine
- [x] 4.1 Author system prompt and instruction guardrails in `backend/app/services/agent/prompts.py`
- [x] 4.2 Implement agent function calling loop and structured response generator in `backend/app/services/agent/engine.py`

## 5. Verification & Tests
- [x] 5.1 Unit tests for prompt injection neutralization
- [x] 5.2 End-to-end test of the agent solving target conversation for Maria and Tomás (ABC123)
