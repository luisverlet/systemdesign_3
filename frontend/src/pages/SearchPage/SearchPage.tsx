import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SearchPage.module.css'

export const SearchPage: React.FC = () => {
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const validateCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase()
    // Standard airline PNR format: 6 uppercase alphanumeric characters
    const pnrRegex = /^[A-Z0-9]{6}$/
    return pnrRegex.test(clean)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = bookingId.trim().toUpperCase()

    if (!clean) {
      setError('Please enter your 6-character booking reference.')
      return
    }

    if (!validateCode(clean)) {
      setError('Booking reference must consist of exactly 6 alphanumeric characters (e.g. ABC123).')
      return
    }

    setError(null)
    navigate(`/booking/${clean}`)
  }

  const handleDemoClick = (code: string) => {
    setBookingId(code)
    setError(null)
    navigate(`/booking/${code}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <span className={styles.badge}>Live Disruption Intelligence</span>
        <h2 className={styles.title}>Track Flight Contingencies &amp; Rebook</h2>
        <p className={styles.subtitle}>
          Enter your 6-character airline reservation reference (PNR) to inspect operational
          delays, missed connection alerts, and resolution actions.
        </p>
      </div>

      <div className={styles.searchCard}>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="bookingInput" className={styles.label}>
              Booking Reference (PNR)
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="bookingInput"
                type="text"
                maxLength={6}
                value={bookingId}
                onChange={(e) => {
                  setBookingId(e.target.value.toUpperCase())
                  if (error) setError(null)
                }}
                placeholder="e.g. ABC123"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {error && <span className={styles.errorMessage} role="alert">{error}</span>}
          </div>

          <button type="submit" className={styles.submitButton}>
            <span>Check Flight Status</span>
            <span>&rarr;</span>
          </button>
        </form>

        <div className={styles.demoSection}>
          <p className={styles.demoTitle}>Quick Demo Test Scenarios</p>
          <button
            type="button"
            className={styles.demoButton}
            onClick={() => handleDemoClick('ABC123')}
          >
            <div>
              <span className={styles.demoCode}>ABC123</span> &bull; Maria &amp; Tomás Silva
            </div>
            <span className={styles.demoTag}>Connection Missed (Minor)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
