import React from 'react'
import { Option } from '../../types/disruption'
import styles from './OptionCard.module.css'

interface OptionCardProps {
  option: Option
  onSelect?: (option: Option) => void
  disabled?: boolean
  disabledReason?: string
}

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  onSelect,
  disabled = false,
  disabledReason,
}) => {
  const isFree = option.fare_difference === 0 || option.fare_difference === null

  return (
    <div className={styles.card} aria-label={`Option ${option.option_id}`}>
      <div className={styles.header}>
        <span className={styles.typeBadge}>
          {option.type === 'REBOOK' ? '🔄 Alternative Flight' : '💰 Refund Request'}
        </span>
        <span className={styles.confidenceBadge}>
          Confidence: {option.confidence}
        </span>
      </div>

      <div className={styles.flightDetails}>
        <div className={styles.flightRoute}>
          {option.flight_number ? (
            <span>
              {option.flight_number} &bull; {option.origin} &rarr; {option.destination}
            </span>
          ) : (
            <span>Full Ticket Cancellation &amp; Refund</span>
          )}
        </div>
        {option.departure && (
          <div className={styles.flightTiming}>
            📅 {option.date} &bull; Departure: {option.departure}
          </div>
        )}
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Fare Difference</span>
          <span className={`${styles.metricValue} ${isFree ? styles.fareFree : ''}`}>
            {isFree ? 'Free of Charge ($0.00)' : `${option.currency || '$'} ${option.fare_difference?.toLocaleString()}`}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Seats Available</span>
          <span className={styles.metricValue}>
            {option.seats_available !== null ? `${option.seats_available} seats left` : 'Guaranteed'}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.selectButton}
          disabled={disabled}
          onClick={() => onSelect?.(option)}
        >
          {disabled ? 'Action Locked' : 'Select This Alternative'}
        </button>
        {disabled && disabledReason && (
          <p className={styles.disabledNotice}>{disabledReason}</p>
        )}
      </div>
    </div>
  )
}
