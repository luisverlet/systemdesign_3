import {
  ResolveResponse,
  RebookingRequest,
  RebookingResponse,
  EscalateRequest,
  EscalateResponse,
} from '../types/disruption'
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
