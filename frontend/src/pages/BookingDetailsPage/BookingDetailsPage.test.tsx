import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DataSourceProvider } from '../../context/DataSourceContext'
import { BookingDetailsPage } from './BookingDetailsPage'
import * as disruptionApi from '../../services/disruptionApi'

describe('BookingDetailsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders base case ABC123 with human review banner, passengers, itinerary, and options', async () => {
    render(
      <MemoryRouter initialEntries={['/booking/ABC123']}>
        <DataSourceProvider>
          <Routes>
            <Route path="/booking/:bookingId" element={<BookingDetailsPage />} />
          </Routes>
        </DataSourceProvider>
      </MemoryRouter>
    )

    // Initially shows loading skeleton
    expect(screen.getByRole('status', { name: /loading flight data/i })).toBeInTheDocument()

    // Resolves mock data
    await waitFor(() => {
      expect(screen.getByText(/Priority Human Assistance in Progress/i)).toBeInTheDocument()
    })

    expect(screen.getByText('HC-4471')).toBeInTheDocument()
    expect(screen.getByText(/Maria Silva/i)).toBeInTheDocument()
    expect(screen.getByText(/Tomás Silva/i)).toBeInTheDocument()
    expect(screen.getByText('NB500')).toBeInTheDocument()
    expect(screen.getByText('NB2410')).toBeInTheDocument()
    expect(screen.getByText(/Critical Disruption: Missed Connection/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /action locked/i })).toHaveLength(2)
  })

  it('renders standard API error card when booking is not found', async () => {
    vi.spyOn(disruptionApi, 'fetchDisruption').mockRejectedValue(
      new disruptionApi.ApiError('Booking "NOTFND" could not be found.', 404)
    )

    render(
      <MemoryRouter initialEntries={['/booking/NOTFND']}>
        <DataSourceProvider>
          <Routes>
            <Route path="/booking/:bookingId" element={<BookingDetailsPage />} />
          </Routes>
        </DataSourceProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Unable to Retrieve Reservation/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Booking "NOTFND" could not be found/i)).toBeInTheDocument()
  })

  it('renders distillation error card when payload lacks distillable structure', async () => {
    vi.spyOn(disruptionApi, 'fetchDisruption').mockRejectedValue(
      new disruptionApi.DistillationError('No flight segments could be extracted for this itinerary.')
    )

    render(
      <MemoryRouter initialEntries={['/booking/CORRUPT']}>
        <DataSourceProvider>
          <Routes>
            <Route path="/booking/:bookingId" element={<BookingDetailsPage />} />
          </Routes>
        </DataSourceProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Itinerary Cannot Be Distilled/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/No flight segments could be extracted/i)).toBeInTheDocument()
  })
})
