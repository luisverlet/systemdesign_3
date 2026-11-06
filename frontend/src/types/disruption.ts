// Espejo de backend/app/schemas/disruption.py. Mantener sincronizado.

export interface PassengerLabel {
  passenger_id: string
  name: string
  type: 'ADULT' | 'CHILD' | 'INFANT' | string
  document_id: string | null
  loyalty_tier: string | null
}

export type FlightStatus = 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'CANCELLED'

export interface FlightView {
  segment_id: string
  flight_number: string
  origin: string
  destination: string
  date: string
  scheduled_departure: string
  scheduled_arrival: string
  estimated_departure: string
  estimated_arrival: string
  gate: string | null
  delay_minutes: number
  status: FlightStatus
  boarding_time: string
  lounge_time: string
  times_estimated: boolean
}

export interface ReconciledEvent {
  event_id: string
  segment_id: string
  type: string
  source: string
  recorded_at: string
  accepted: boolean
  discard_reason: 'SOURCE_DEGRADED' | 'SUPERSEDED' | null
}

export type Relevance = 'ACTIONABLE' | 'INFORMATIONAL' | 'NOT_RELEVANT'

export interface Impact {
  relevance: Relevance
  missed_connection: boolean
  reasons: string[]
}

export interface AppliedRule {
  rule_id: string
  condition: string
  entitlement: string
  requires_human_approval: boolean
}

export interface Option {
  option_id: string
  type: 'REBOOK' | 'REFUND' | string
  flight_number: string | null
  origin: string | null
  destination: string | null
  date: string | null
  departure: string | null
  fare_difference: number | null
  currency: string | null
  seats_available: number | null
  policy_ref: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | string
}

export type DecisionType = 'AUTO_OFFER' | 'HUMAN_REVIEW' | 'INFO_ONLY' | 'NO_ACTION'

export interface Decision {
  type: DecisionType
  reason: string
  policy_version: string | null
  human_case_id: string | null
}

export interface ResolveRequest {
  booking_id: string
}

export interface ResolveResponse {
  booking_id: string
  passengers: PassengerLabel[]
  flights: FlightView[]
  events: ReconciledEvent[]
  impact: Impact
  applied_rules: AppliedRule[]
  options: Option[]
  decision: Decision
  message: string
  data_completeness: 'COMPLETE' | 'PARTIAL'
  missing_fields: string[]
  generated_at: string
}
