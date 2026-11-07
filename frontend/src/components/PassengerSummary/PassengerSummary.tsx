import React from 'react'
import { PassengerLabel } from '../../types/disruption'
import styles from './PassengerSummary.module.css'

interface PassengerSummaryProps {
  passengers: PassengerLabel[]
}

export const PassengerSummary: React.FC<PassengerSummaryProps> = ({ passengers }) => {
  if (!passengers || passengers.length === 0) {
    return null
  }

  return (
    <section className={styles.container} aria-label="Travelers">
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span>👥</span>
          <span>Travelers ({passengers.length})</span>
        </h3>
        <span className={styles.privacyBadge}>Protected Passenger Information</span>
      </div>

      <div className={styles.passengerGrid}>
        {passengers.map((p) => {
          const isMinor = p.type === 'CHILD' || p.type === 'INFANT'
          const avatarIcon = isMinor ? '🧒' : '👤'

          return (
            <div key={p.passenger_id} className={styles.passengerCard}>
              <div className={styles.avatar} aria-hidden="true">
                {avatarIcon}
              </div>
              <div className={styles.passengerInfo}>
                <span className={styles.passengerName}>{p.name}</span>
                <div className={styles.passengerMeta}>
                  <span className={styles.typeBadge}>{p.type}</span>
                  {p.loyalty_tier && (
                    <span className={styles.loyaltyBadge}>⭐ {p.loyalty_tier}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
