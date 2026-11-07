# Disruption UI Specification

## Requirements

### Requirement: Booking Search and Validation
The web interface SHALL provide an input form allowing passengers to query their booking reference (`booking_id`). The input MUST validate that the booking code consists of exactly 6 alphanumeric uppercase characters before dispatching any request.

#### Scenario: Valid booking reference submission
- **WHEN** the user inputs "ABC123" and submits the form
- **THEN** the router navigates to `/booking/ABC123` and initiates data retrieval

#### Scenario: Invalid booking reference
- **WHEN** the user inputs "123" or "ABC-1234"
- **THEN** the form displays an inline validation error message and does not submit

### Requirement: Header Data Source Switcher
The application header SHALL provide an interactive visual selector to switch between simulated mock data (`resolve-ABC123.json`) and the live backend API.

#### Scenario: Switching to mock mode
- **WHEN** the user selects "Mock: ABC123" from the header selector
- **THEN** the application resolves booking requests directly from local mock fixtures without network failure

#### Scenario: Switching to live API mode
- **WHEN** the user selects "Live API"
- **THEN** requests are routed to the FastAPI backend endpoint `POST /api/v1/disruptions/resolve`

### Requirement: Itinerary Presentation and Data Distillation
The flight itinerary SHALL display distilled operational metrics for each segment: flight number, origin, destination, estimated vs scheduled departure/arrival times, boarding time, lounge access recommendation time, and gate. Raw backend technical terms (such as `OPS_CORE` or `LEGACY_MIRROR`) MUST NOT be exposed to the user.

#### Scenario: Delayed flight with missed connection
- **WHEN** segment S1 has a 160-minute delay and connection S2 cannot be reached
- **THEN** S1 displays a high-visibility delayed badge, and S2 displays a connection missed alert with the computed time gap

#### Scenario: Distillation failure fallback
- **WHEN** the response payload lacks critical flight data required for distillation
- **THEN** the application renders a friendly error message instructing the passenger to contact airport support, avoiding blank screens or uncaught runtime crashes

### Requirement: Human Review and Decision Handling
When the resolved decision is `HUMAN_REVIEW`, the interface SHALL display a prominent status banner with the assigned support case ID and expected response window, and MUST disable automated self-service rebooking to avoid conflicting manual interventions.

#### Scenario: Displaying base case human review
- **WHEN** booking `ABC123` decision is `HUMAN_REVIEW` with case `HC-4471`
- **THEN** the interface renders an alert banner stating priority human review is in progress for the travel group, and self-service option selection is blocked with an informative tooltip

### Requirement: Passenger Privacy and PII Protection
The interface SHALL render only non-sensitive passenger identifiers (full name, passenger type like Adult/Child, and loyalty tier). Sensitive documents, telephone numbers, and billing addresses MUST remain hidden.

#### Scenario: Inspecting passenger details
- **WHEN** viewing booking `ABC123` with passengers Maria Silva and Tomás Silva
- **THEN** only names and passenger categories (Adult / Child) are visible on the card
