import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SearchPage } from './SearchPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('SearchPage', () => {
  it('renders booking search form with demo button', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/booking reference/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check flight status/i })).toBeInTheDocument()
    expect(screen.getByText(/ABC123/)).toBeInTheDocument()
  })

  it('shows error when submitting empty reference', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    )

    const submitBtn = screen.getByRole('button', { name: /check flight status/i })
    fireEvent.click(submitBtn)

    expect(screen.getByRole('alert')).toHaveTextContent(/please enter your 6-character booking reference/i)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows error when entering invalid format', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    )

    const input = screen.getByLabelText(/booking reference/i)
    fireEvent.change(input, { target: { value: 'AB1' } })

    const submitBtn = screen.getByRole('button', { name: /check flight status/i })
    fireEvent.click(submitBtn)

    expect(screen.getByRole('alert')).toHaveTextContent(/must consist of exactly 6 alphanumeric characters/i)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to booking details when valid 6-char PNR is submitted', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    )

    const input = screen.getByLabelText(/booking reference/i)
    fireEvent.change(input, { target: { value: 'abc123' } })

    const submitBtn = screen.getByRole('button', { name: /check flight status/i })
    fireEvent.click(submitBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/booking/ABC123')
  })

  it('navigates directly when clicking the demo scenario button', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    )

    const demoBtn = screen.getByText(/ABC123/).closest('button')
    expect(demoBtn).not.toBeNull()
    fireEvent.click(demoBtn!)

    expect(mockNavigate).toHaveBeenCalledWith('/booking/ABC123')
  })
})
