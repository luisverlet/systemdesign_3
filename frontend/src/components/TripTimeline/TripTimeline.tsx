import React from 'react'
import { FlightView, Impact } from '../../types/disruption'
import { FlightCard } from '../FlightCard/FlightCard'
import styles from './TripTimeline.module.css'

interface TripTimelineProps {
  flights: FlightView[]
  impact?: Impact
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ flights, impact }) => {
  if (!flights || flights.length === 0) {
    return <p>No flight segments available.</p>
  }

  const missedConnection = impact?.missed_connection ?? false

  return (
    <section className={styles.timeline} aria-label="Flight Itinerary">
      <div className={styles.timelineHeader}>
        <h3 className={styles.title}>Flight Itinerary</h3>
        <span className={styles.segmentsCount}>
          {flights.length} {flights.length === 1 ? 'flight segment' : 'connecting segments'}
        </span>
      </div>

      <div className={styles.segmentList}>
        {flights.map((flight, index) => {
          // If connection is missed, the subsequent flight (index > 0) is impacted
          const isThisFlightMissed = index > 0 && missedConnection

          return (
            <React.Fragment key={flight.segment_id || index}>
              {/* If there is a connection break between S1 and S2 */}
              {index > 0 && missedConnection && (
                <div className={styles.connectionAlert} role="alert">
                  <span className={styles.alertIcon} aria-hidden="true">⚠️</span>
                  <div className={styles.alertContent}>
                    <h4 className={styles.alertTitle}>Critical Disruption: Missed Connection</h4>
                    <p className={styles.alertDescription}>
                      Inbound flight delay causes you to arrive after the minimum connection time for your next flight.
                    </p>
                    {impact?.reasons && impact.reasons.length > 0 && (
                      <ul className={styles.alertReasons}>
                        {impact.reasons.map((reason, rIdx) => (
                          <li key={rIdx}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {index > 0 && !missedConnection && (
                <div className={styles.connectionSafe}>
                  <span>&darr; Transfer Connection &bull; Min Connection Time Valid &darr;</span>
                </div>
              )}

              <FlightCard
                flight={flight}
                isMissedConnection={isThisFlightMissed}
              />
            </React.Fragment>
          )
        })}
      </div>
    </section>
  )
}
