export interface AgentOption {
  option_id: string
  type: string
  flight_number?: string | null
  origin?: string | null
  destination?: string | null
  date?: string | null
  departure?: string | null
  fare_difference?: number | null
  currency?: string | null
  seats_available?: number | null
  policy_ref: string
  confidence?: string
}

export interface AgentQueryRequest {
  booking_id: string
  message: string
}

export interface AgentResponse {
  booking_id: string
  what_happened: string
  entitlements: string[]
  options: AgentOption[]
  next_step: string
  policy_refs: string[]
  human_required: boolean
  passenger_reply: string
  tools_invoked: string[]
  metadata: Record<string, unknown>
}

