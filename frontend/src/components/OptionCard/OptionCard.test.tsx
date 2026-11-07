import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OptionCard } from './OptionCard'
import { Option } from '../../types/disruption'

const mockOption: Option = {
  option_id: 'O1',
  type: 'REBOOK',
  flight_number: 'NB2412',
  origin: 'LIM',
  destination: 'MEX',
  date: '2026-09-16',
  departure: '08:15',
  fare_difference: 0,
  currency: null,
  seats_available: 4,
  policy_ref: 'POL-DELAY-2026-03',
  confidence: 'HIGH',
}

describe('OptionCard', () => {
  it('renders rebooking option details and free of charge indicator', () => {
    render(<OptionCard option={mockOption} />)

    expect(screen.getByText(/NB2412/)).toBeInTheDocument()
    expect(screen.getByText(/Free of Charge/i)).toBeInTheDocument()
    expect(screen.getByText(/4 seats left/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select this alternative/i })).toBeEnabled()
  })

  it('disables selection when disabled prop and reason are provided', () => {
    render(
      <OptionCard
        option={mockOption}
        disabled={true}
        disabledReason="Self-service locked under case HC-4471"
      />
    )

    const btn = screen.getByRole('button', { name: /action locked/i })
    expect(btn).toBeDisabled()
    expect(screen.getByText(/Self-service locked under case HC-4471/i)).toBeInTheDocument()
  })

  it('triggers onSelect when clicked while enabled', () => {
    const handleSelect = vi.fn()
    render(<OptionCard option={mockOption} onSelect={handleSelect} />)

    const btn = screen.getByRole('button', { name: /select this alternative/i })
    fireEvent.click(btn)
    expect(handleSelect).toHaveBeenCalledWith(mockOption)
  })
})
