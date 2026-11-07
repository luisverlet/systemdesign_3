## ADDED Requirements

### Requirement: Agent Chat HTTP Endpoint
The API SHALL expose an endpoint `POST /api/v1/agent/chat` that accepts an `AgentQueryRequest` body containing a 6-character alphanumeric `booking_id` and a natural language `message`, executes the agentic disruption workflow, and returns a 200 OK status code with an `AgentResponse` body.

#### Scenario: Successful execution of target conversation query
- **WHEN** an HTTP POST request is sent to `/api/v1/agent/chat` with `{"booking_id": "ABC123", "message": "Hola, soy Maria..."}`
- **THEN** the API returns HTTP 200 with an `AgentResponse` containing `what_happened`, `entitlements`, `options`, `policy_refs`, `human_required: true`, and `passenger_reply`

#### Scenario: Invalid booking reference rejection
- **WHEN** an HTTP POST request is sent to `/api/v1/agent/chat` with an invalid `booking_id` format (e.g., `"INVALID_PNR"`)
- **THEN** the API returns HTTP 422 Unprocessable Entity

### Requirement: Interactive Chat Interface for Passenger Inquiry
The frontend application SHALL provide an interactive conversation page at route `/agent` accessible from the top navigation bar, allowing passengers and evaluators to submit natural language inquiries for any booking.

#### Scenario: Single-click pre-fill of Maria & Tomás query
- **WHEN** a user navigates to the Agent Chat page and clicks the quick-action button for Maria & Tomás
- **THEN** the booking input is populated with "ABC123" and the text area is populated with Maria's query

#### Scenario: Displaying agent response and trajectory details
- **WHEN** the agent chat request completes successfully
- **THEN** the conversational reply is displayed to the user along with a visual breakdown of the tools invoked, policy entitlements, and the human intervention status

