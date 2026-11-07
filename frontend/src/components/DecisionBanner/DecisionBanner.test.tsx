import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DecisionBanner } from './DecisionBanner'
import { Decision } from '../../types/disruption'

describe('DecisionBanner', () => {
  it('renders human review banner with case ID and priority notice', () => {
    const decision: Decision = {
      type: 'HUMAN_REVIEW',
      reason: 'Connection missed with minor in group',
      policy_version: 'POL-DELAY-2026-03',
      human_case_id: 'HC-4471',
    }

    render(<DecisionBanner decision={decision} />)

    expect(screen.getByText(/Priority Human Assistance in Progress/i)).toBeInTheDocument()
    expect(screen.getByText('HC-4471')).toBeInTheDocument()
    expect(screen.getByText(/Within 45 minutes/i)).toBeInTheDocument()
    expect(screen.getByText('POL-DELAY-2026-03')).toBeInTheDocument()
  })

  it('renders auto offer banner when type is AUTO_OFFER', () => {
    const decision: Decision = {
      type: 'AUTO_OFFER',
      reason: 'Automatic rebooking eligible',
      policy_version: null,
      human_case_id: null,
    }

    render(<DecisionBanner decision={decision} />)
    expect(screen.getByText(/Complimentary Resolution Options Available/i)).toBeInTheDocument()
  })
})
