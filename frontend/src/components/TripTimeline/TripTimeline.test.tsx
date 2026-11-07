import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TripTimeline } from './TripTimeline'
import { FlightView, Impact } from '../../types/disruption'

const mockFlights: FlightView[] = [
  {
    segment_id: 'S1',
    flight_number: 'NB500',
    origin: 'SCL',
    destination: 'LIM',
    date: '2026-09-15',
    scheduled_departure: '14:30',
    scheduled_arrival: '17:55',
    estimated_departure: '17:10',
    estimated_arrival: '20:35',
    gate: '24',
    delay_minutes: 160,
    status: 'DELAYED',
    boarding_time: '16:50',
    lounge_time: '15:50',
    times_estimated: true,
  },
  {
    segment_id: 'S2',
    flight_number: 'NB2410',
    origin: 'LIM',
    destination: 'MEX',
    date: '2026-09-15',
    scheduled_departure: '19:05',
    scheduled_arrival: '23:40',
    estimated_departure: '19:05',
    estimated_arrival: '23:40',
    gate: null,
    delay_minutes: 0,
    status: 'SCHEDULED',
    boarding_time: '18:45',
    lounge_time: '17:45',
    times_estimated: true,
  },
]

const mockImpact: Impact = {
  relevance: 'ACTIONABLE',
  missed_connection: true,
  reasons: [
    'S1 retrasado 160 min: llegada estimada 20:35',
    'Conexión S2 sale 19:05 (< 20:35 + 15 min MCT)',
  ],
}

describe('TripTimeline and FlightCard', () => {
  it('renders all flight segments with route and status badges', () => {
    render(<TripTimeline flights={mockFlights} impact={mockImpact} />)

    expect(screen.getByText('NB500')).toBeInTheDocument()
    expect(screen.getByText('NB2410')).toBeInTheDocument()
    expect(screen.getByText('SCL')).toBeInTheDocument()
    expect(screen.getAllByText('LIM')).toHaveLength(2)
    expect(screen.getByText('MEX')).toBeInTheDocument()
    expect(screen.getAllByText(/Departure Gate/i)).toHaveLength(2)
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('+160 min delay')).toBeInTheDocument()
  })

  it('renders prominent missed connection warning banner when connection is broken', () => {
    render(<TripTimeline flights={mockFlights} impact={mockImpact} />)

    expect(screen.getByText(/Critical Disruption: Missed Connection/i)).toBeInTheDocument()
    expect(screen.getByText(/S1 retrasado 160 min/i)).toBeInTheDocument()
  })

  it('renders empty message if flight list is empty', () => {
    render(<TripTimeline flights={[]} />)
    expect(screen.getByText(/No flight segments available/i)).toBeInTheDocument()
  })
})
