import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DataSourceProvider } from '../../context/DataSourceContext'
import { Header } from './Header'

describe('Header component', () => {
  it('renders application branding and title', () => {
    render(
      <MemoryRouter>
        <DataSourceProvider>
          <Header />
        </DataSourceProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('FlyCompanion')).toBeInTheDocument()
    expect(screen.getByText('Disruption & Rebooking Assistant')).toBeInTheDocument()
  })

  it('allows switching between Mock and Live API data sources', () => {
    render(
      <MemoryRouter>
        <DataSourceProvider>
          <Header />
        </DataSourceProvider>
      </MemoryRouter>
    )

    const mockRadio = screen.getByRole('radio', { name: /mock/i })
    const liveRadio = screen.getByRole('radio', { name: /live backend api/i })

    expect(mockRadio).toBeInTheDocument()
    expect(liveRadio).toBeInTheDocument()

    fireEvent.click(liveRadio)
    expect(liveRadio).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(mockRadio)
    expect(mockRadio).toHaveAttribute('aria-checked', 'true')
  })
})
