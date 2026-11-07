import React from 'react'
import { Link } from 'react-router-dom'
import { useDataSource } from '../../context/DataSourceContext'
import styles from './Header.module.css'

export const Header: React.FC = () => {
  const { mode, setMode } = useDataSource()

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand} aria-label="Home">
        <span className={styles.logoIcon} role="img" aria-label="airplane">✈️</span>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>FlyCompanion</h1>
          <span className={styles.subtitle}>Disruption &amp; Rebooking Assistant</span>
        </div>
      </Link>

      <div className={styles.controls}>
        <div className={styles.modeSelector} role="radiogroup" aria-label="Data Source Mode">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'mock'}
            className={`${styles.modeOption} ${mode === 'mock' ? styles.modeOptionActive : ''}`}
            onClick={() => setMode('mock')}
          >
            <span className={`${styles.indicatorDot} ${styles.mockDot}`} />
            <span>Mock (Demo ABC123)</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={mode === 'live'}
            className={`${styles.modeOption} ${mode === 'live' ? styles.modeOptionActive : ''}`}
            onClick={() => setMode('live')}
          >
            <span className={`${styles.indicatorDot} ${styles.liveDot}`} />
            <span>Live Backend API</span>
          </button>
        </div>
      </div>
    </header>
  )
}
