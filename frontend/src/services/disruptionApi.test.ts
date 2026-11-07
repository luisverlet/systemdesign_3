import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchDisruption,
  validateDistillation,
  ApiError,
  DistillationError,
} from './disruptionApi'

describe('disruptionApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Mock Mode', () => {
    it('successfully resolves base case ABC123 in mock mode', async () => {
      const data = await fetchDisruption('ABC123', 'mock')
      expect(data.booking_id).toBe('ABC123')
      expect(data.passengers).toHaveLength(2)
      expect(data.flights).toHaveLength(2)
      expect(data.decision.type).toBe('HUMAN_REVIEW')
      expect(data.impact.missed_connection).toBe(true)
    })

    it('normalizes lowercase booking reference input', async () => {
      const data = await fetchDisruption('abc123', 'mock')
      expect(data.booking_id).toBe('ABC123')
    })

    it('throws ApiError 404 for unknown mock booking', async () => {
      await expect(fetchDisruption('XYZ999', 'mock')).rejects.toThrow(ApiError)
      try {
        await fetchDisruption('XYZ999', 'mock')
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(404)
      }
    })
  })

  describe('validateDistillation', () => {
    it('returns valid for a complete payload', () => {
      const validPayload = {
        booking_id: 'ABC123',
        flights: [
          { flight_number: 'NB500', origin: 'SCL', destination: 'LIM' },
        ],
        decision: { type: 'HUMAN_REVIEW' },
      }
      expect(validateDistillation(validPayload).valid).toBe(true)
    })

    it('detects missing flight segments as distillation failure', () => {
      const invalidPayload = {
        booking_id: 'ABC123',
        flights: [],
        decision: { type: 'HUMAN_REVIEW' },
      }
      const check = validateDistillation(invalidPayload)
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('No flight segments')
    })

    it('detects malformed flight metadata', () => {
      const invalidPayload = {
        booking_id: 'ABC123',
        flights: [{ flight_number: '' }],
        decision: { type: 'HUMAN_REVIEW' },
      }
      const check = validateDistillation(invalidPayload)
      expect(check.valid).toBe(false)
      expect(check.reason).toContain('malformed route metadata')
    })
  })

  describe('Live API Mode', () => {
    it('calls POST /api/v1/disruptions/resolve and returns parsed JSON', async () => {
      const mockResponse = {
        booking_id: 'DEF456',
        flights: [{ flight_number: 'LA100', origin: 'SCL', destination: 'MIA' }],
        decision: { type: 'NO_ACTION' },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response)

      const result = await fetchDisruption('DEF456', 'live')
      expect(result.booking_id).toBe('DEF456')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/disruptions/resolve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ booking_id: 'DEF456' }),
        })
      )
    })

    it('handles 422 validation error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Invalid PNR format' }),
      } as unknown as Response)

      await expect(fetchDisruption('INVALID', 'live')).rejects.toThrow(ApiError)
      try {
        await fetchDisruption('INVALID', 'live')
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(422)
      }
    })

    it('handles 503 service unavailable error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service overloaded' }),
      } as unknown as Response)

      await expect(fetchDisruption('ABC123', 'live')).rejects.toThrow(ApiError)
      try {
        await fetchDisruption('ABC123', 'live')
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(503)
      }
    })

    it('handles network failure (fetch throws)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(fetchDisruption('ABC123', 'live')).rejects.toThrow(ApiError)
      try {
        await fetchDisruption('ABC123', 'live')
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(503)
      }
    })

    it('throws DistillationError when live API returns malformed flight data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ booking_id: 'ABC123', flights: [] }),
      } as unknown as Response)

      await expect(fetchDisruption('ABC123', 'live')).rejects.toThrow(DistillationError)
    })
  })
})
