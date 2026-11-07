import {
  ResolveResponse,
  RebookingRequest,
  RebookingResponse,
  EscalateRequest,
  EscalateResponse,
} from '../types/disruption'
import { AgentQueryRequest, AgentResponse } from '../types/agent'
import mockABC123 from '../mocks/resolve-ABC123.json'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export class DistillationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DistillationError'
  }
}

/**
 * Validates that the payload contains required structures to be distilled cleanly for the passenger.
 */
export function validateDistillation(data: unknown): { valid: boolean; reason?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Received empty or non-object response from the flight service.' }
  }

  const response = data as Partial<ResolveResponse>

  if (!response.booking_id || typeof response.booking_id !== 'string') {
    return { valid: false, reason: 'Missing booking reference in the service response.' }
  }

  if (!Array.isArray(response.flights) || response.flights.length === 0) {
    return { valid: false, reason: 'No flight segments could be extracted for this itinerary.' }
  }

  for (const flight of response.flights) {
    if (!flight.flight_number || !flight.origin || !flight.destination) {
      return { valid: false, reason: 'One or more flight segments contain malformed route metadata.' }
    }
  }

  if (!response.decision || typeof response.decision.type !== 'string') {
    return { valid: false, reason: 'Flight operational decision could not be determined.' }
  }

  return { valid: true }
}

/**
 * Fetches disruption resolution from either local mock fixtures or live FastAPI backend.
 */
export async function fetchDisruption(
  bookingId: string,
  mode: 'mock' | 'live' = 'mock'
): Promise<ResolveResponse> {
  const normalizedId = bookingId.trim().toUpperCase()

  if (mode === 'mock') {
    // Simulate slight async network delay for realistic UX testing
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (normalizedId === 'ABC123') {
      const payload = mockABC123 as unknown as ResolveResponse
      const distillationCheck = validateDistillation(payload)
      if (!distillationCheck.valid) {
        throw new DistillationError(distillationCheck.reason || 'Failed to distill mock data.')
      }
      return payload
    }

    throw new ApiError(
      `Booking reference "${normalizedId}" was not found in demo mock fixtures. Try "ABC123".`,
      404
    )
  }

  // Live Backend API call
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/disruptions/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id: normalizedId }),
    })
  } catch {
    throw new ApiError(
      'Unable to connect to flight operations service. Please check your network or try again later.',
      503
    )
  }

  if (!response.ok) {
    let errorDetail = ''
    try {
      const errJson = await response.json()
      errorDetail = errJson.detail || errJson.message || ''
    } catch {
      // Fallback to HTTP status text
    }

    if (response.status === 404) {
      throw new ApiError(
        errorDetail || `Booking "${normalizedId}" could not be found. Please check your PNR reference.`,
        404
      )
    }

    if (response.status === 422) {
      throw new ApiError(
        errorDetail || 'Invalid booking reference format. Must be 6 uppercase alphanumeric characters.',
        422
      )
    }

    if (response.status === 409) {
      throw new ApiError(
        errorDetail || 'A rebooking conflict exists for this reservation.',
        409
      )
    }

    if (response.status === 503) {
      throw new ApiError(
        errorDetail || 'The flight operations engine is temporarily overloaded. Please retry.',
        503
      )
    }

    throw new ApiError(
      errorDetail || `Flight service returned an unexpected status: ${response.status}`,
      response.status
    )
  }

  const data = await response.json()
  const distillationCheck = validateDistillation(data)
  if (!distillationCheck.valid) {
    throw new DistillationError(
      distillationCheck.reason || 'The flight details cannot be distilled into a clear itinerary.'
    )
  }

  return data as ResolveResponse
}

/**
 * Dispatches an automated rebooking request for an eligible alternative option.
 */
export async function requestRebooking(
  payload: RebookingRequest,
  mode: 'mock' | 'live' = 'mock'
): Promise<RebookingResponse> {
  if (mode === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      request_id: `REQ-${Date.now()}`,
      status: 'CONFIRMED',
      booking_id: payload.booking_id,
      option_id: payload.option_id,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      message: `Rebooking successfully confirmed for option ${payload.option_id}.`,
    }
  }

  const response = await fetch(`${API_BASE_URL}/disruptions/rebooking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new ApiError(err.detail || 'Failed to complete rebooking request', response.status)
  }

  return response.json()
}

/**
 * Escalates a complex disruption case to human operations.
 */
export async function escalateCase(
  payload: EscalateRequest,
  mode: 'mock' | 'live' = 'mock'
): Promise<EscalateResponse> {
  if (mode === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      case_id: 'HC-4471',
      queue: 'AIRPORT_SPECIAL_CARE',
      sla_minutes: 45,
      booking_id: payload.booking_id,
    }
  }

  const response = await fetch(`${API_BASE_URL}/disruptions/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new ApiError(err.detail || 'Failed to escalate disruption case', response.status)
  }

  return response.json()
}

/**
 * Sends a natural language query to the AI Disruption Agent.
 */
export async function askAgent(
  request: AgentQueryRequest,
  mode: 'mock' | 'live' = 'mock'
): Promise<AgentResponse> {
  const normalizedId = request.booking_id.trim().toUpperCase()

  if (mode === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, 400))
    if (normalizedId === 'ABC123') {
      return {
        booking_id: 'ABC123',
        what_happened:
          'El vuelo NB500 (SCL -> LIM) presenta un retraso de 160 minutos con llegada estimada a las 20:35. La conexión NB2410 (LIM -> MEX) sale a las 19:05, provocando la pérdida física de la conexión (MCT 15 min no cumplido).',
        entitlements: ['REBOOK_NO_FEE'],
        options: [
          {
            option_id: 'O1',
            type: 'REBOOK',
            flight_number: 'NB2412',
            origin: 'LIM',
            destination: 'MEX',
            date: '2026-09-16',
            departure: '08:15',
            fare_difference: 0.0,
            currency: 'CLP',
            seats_available: 4,
            policy_ref: 'POL-DELAY-2026-03',
            confidence: 'HIGH',
          },
        ],
        next_step:
          'Caso escalado a atención humana prioritaria (Caso HC-4471, SLA 45 min) debido a la presencia de un menor en el grupo (Regla R5).',
        policy_refs: ['POL-DELAY-2026-03'],
        human_required: true,
        passenger_reply:
          'Hola María, entiendo tu preocupación al viajar con Tomás (7 años). Debido al retraso de 160 minutos en el vuelo NB500 a Lima, no alcanzarán la conexión programada a México (NB2410). Conforme a nuestra política de protección a menores (Regla R5), el cambio de vuelo no se realiza de forma automática para garantizar que viajen juntos en asientos asignados y con acompañamiento adecuado. Hemos abierto el caso prioritario HC-4471 en el mostrador del aeropuerto con un tiempo máximo de atención de 45 minutos. Te recomendamos la opción de mañana NB2412 a las 08:15 sin costo adicional. Respecto a la compensación económica, tu solicitud fue registrada para evaluación del equipo especializado conforme a la política vigente.',
        tools_invoked: [
          'get_trip_context',
          'get_operational_events',
          'get_policy_rules',
          'get_eligible_options',
          'create_human_case',
        ],
        metadata: {
          execution_mode: 'MOCK_TRAJECTORY',
          case_id: 'HC-4471',
        },
      }
    }

    throw new ApiError(
      `Booking reference "${normalizedId}" was not found in mock fixtures. Try "ABC123".`,
      404
    )
  }

  // Live Backend API call
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        booking_id: normalizedId,
        message: request.message,
        api_key: request.api_key ? request.api_key.trim() : undefined,
      }),
    })
  } catch {
    throw new ApiError(
      'Unable to connect to AI Agent service. Please check your network or try again later.',
      503
    )
  }

  if (!response.ok) {
    let errorDetail = ''
    try {
      const errJson = await response.json()
      errorDetail = errJson.detail || errJson.message || ''
    } catch {
      // Fallback
    }

    if (response.status === 422) {
      throw new ApiError(
        errorDetail || 'Invalid query format or missing parameters.',
        422
      )
    }

    throw new ApiError(
      errorDetail || `Agent service returned status code ${response.status}`,
      response.status
    )
  }

  return response.json()
}
