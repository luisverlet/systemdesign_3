import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DataSourceProvider } from '../../context/DataSourceContext'
import { AgentChatPage } from './AgentChatPage'
import * as disruptionApi from '../../services/disruptionApi'

describe('AgentChatPage', () => {
  it('renders page header and initial form values', () => {
    render(
      <MemoryRouter>
        <DataSourceProvider>
          <AgentChatPage />
        </DataSourceProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('AI Disruption Companion Agent')).toBeInTheDocument()
    expect(screen.getByLabelText(/ódigo de reserva/i)).toHaveValue('ABC123')
    expect((screen.getByLabelText(/onsulta del pasajero/i) as HTMLTextAreaElement).value).toContain('Hola, soy Maria')
    expect(screen.getByTestId('submit-agent-query-btn')).toBeInTheDocument()
  })

  it('resets and reapplies Maria preset when requested', () => {
    render(
      <MemoryRouter>
        <DataSourceProvider>
          <AgentChatPage />
        </DataSourceProvider>
      </MemoryRouter>
    )

    const clearBtn = screen.getByText('Limpiar')
    fireEvent.click(clearBtn)

    expect(screen.getByLabelText(/ódigo de reserva/i)).toHaveValue('')
    expect(screen.getByLabelText(/onsulta del pasajero/i)).toHaveValue('')

    const presetBtn = screen.getByTestId('preset-maria-btn')
    fireEvent.click(presetBtn)

    expect(screen.getByLabelText(/ódigo de reserva/i)).toHaveValue('ABC123')
    expect((screen.getByLabelText(/onsulta del pasajero/i) as HTMLTextAreaElement).value).toContain('Hola, soy Maria')
  })

  it('submits query and renders conversational reply and HITL banner', async () => {
    vi.spyOn(disruptionApi, 'askAgent').mockResolvedValueOnce({
      booking_id: 'ABC123',
      what_happened: 'Vuelo retrasado 160 min y conexión perdida.',
      entitlements: ['REBOOK_NO_FEE'],
      options: [
        {
          option_id: 'O1',
          type: 'REBOOK',
          flight_number: 'NB2412',
          origin: 'LIM',
          destination: 'MEX',
          policy_ref: 'POL-DELAY-2026-03',
        },
      ],
      next_step: 'Derivado a agente humano HC-4471',
      policy_refs: ['POL-DELAY-2026-03'],
      human_required: true,
      passenger_reply: 'Hola María, tu caso fue derivado prioritariamente bajo el caso HC-4471.',
      tools_invoked: [
        'get_trip_context',
        'get_operational_events',
        'get_policy_rules',
        'get_eligible_options',
        'create_human_case',
      ],
      metadata: { case_id: 'HC-4471' },
    })

    render(
      <MemoryRouter>
        <DataSourceProvider>
          <AgentChatPage />
        </DataSourceProvider>
      </MemoryRouter>
    )

    const submitBtn = screen.getByTestId('submit-agent-query-btn')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('hitl-banner')).toBeInTheDocument()
    })

    expect(screen.getByTestId('agent-reply-text')).toHaveTextContent(
      'Hola María, tu caso fue derivado prioritariamente bajo el caso HC-4471.'
    )
    expect(screen.getByText('get_trip_context()')).toBeInTheDocument()
    expect(screen.getByText('create_human_case()')).toBeInTheDocument()
    expect(screen.getByText(/REBOOK_NO_FEE/)).toBeInTheDocument()
  })

  it('renders API error banner when request fails', async () => {
    vi.spyOn(disruptionApi, 'askAgent').mockRejectedValueOnce(
      new disruptionApi.ApiError('Servicio de agente no disponible temporalmente', 503)
    )

    render(
      <MemoryRouter>
        <DataSourceProvider>
          <AgentChatPage />
        </DataSourceProvider>
      </MemoryRouter>
    )

    const submitBtn = screen.getByTestId('submit-agent-query-btn')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Servicio de agente no disponible temporalmente'
      )
    })
  })
})

