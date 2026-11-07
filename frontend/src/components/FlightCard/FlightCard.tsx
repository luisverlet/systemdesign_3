import React from 'react'
import { FlightView } from '../../types/disruption'
import { EventBadge, BadgeVariant } from '../EventBadge/EventBadge'
import styles from './FlightCard.module.css'

interface FlightCardProps {
  flight: FlightView
  isMissedConnection?: boolean
}

export const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  isMissedConnection = false,
}) => {
  const isDelayed = flight.delay_minutes > 0

  let badgeVariant: BadgeVariant = 'scheduled'
  let badgeLabel: string = flight.status

  if (isMissedConnection) {
    badgeVariant = 'missed'
    badgeLabel = 'Connection Missed'
  } else if (isDelayed) {
    badgeVariant = 'delayed'
    badgeLabel = `Delayed +${flight.delay_minutes}m`
  } else if (flight.status === 'ON_TIME') {
    badgeVariant = 'onTime'
    badgeLabel = 'On Time'
  }

  const cardStyleClass = isMissedConnection
    ? styles.cardMissed
    : isDelayed
    ? styles.cardDelayed
    : ''

  return (
    <article className={`${styles.card} ${cardStyleClass}`} aria-label={`Flight ${flight.flight_number}`}>
      <div className={styles.header}>
        <div className={styles.flightIdent}>
          <span className={styles.flightNumber}>{flight.flight_number}</span>
          <span className={styles.segmentDate}>{flight.date}</span>
        </div>
        <EventBadge
          label={badgeLabel}
          variant={badgeVariant}
          icon={isMissedConnection ? '⚠️' : isDelayed ? '⏱️' : '✈️'}
        />
      </div>

      <div className={styles.routeContainer}>
        <div className={`${styles.station} ${styles.stationOrigin}`}>
          <span className={styles.airportCode}>{flight.origin}</span>
          <span className={isDelayed ? styles.scheduledTimeCrossed : styles.scheduledTime}>
            Dep: {flight.scheduled_departure}
          </span>
          {isDelayed && (
            <span className={`${styles.actualTime} ${styles.actualTimeDelayed}`}>
              Est: {flight.estimated_departure}
            </span>
          )}
        </div>

        <div className={styles.routeVisual}>
          <div className={styles.routeLine}>
            <span className={styles.planeIcon}>✈</span>
          </div>
          {isDelayed && (
            <span className={styles.delayPill}>+{flight.delay_minutes} min delay</span>
          )}
        </div>

        <div className={`${styles.station} ${styles.stationDest}`}>
          <span className={styles.airportCode}>{flight.destination}</span>
          <span className={isDelayed ? styles.scheduledTimeCrossed : styles.scheduledTime}>
            Arr: {flight.scheduled_arrival}
          </span>
          {isDelayed && (
            <span className={`${styles.actualTime} ${styles.actualTimeDelayed}`}>
              Est: {flight.estimated_arrival}
            </span>
          )}
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Departure Gate</span>
          <span className={styles.detailValue}>{flight.gate || 'TBA'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Boarding Starts</span>
          <span className={styles.detailValue}>{flight.boarding_time || 'N/A'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Recommended Lounge</span>
          <span className={styles.detailValue}>{flight.lounge_time || 'N/A'}</span>
        </div>
      </div>

      {flight.times_estimated && (
        <p className={styles.estimationNotice}>
          * Operational times calculated based on real-time flight telemetry.
        </p>
      )}
    </article>
  )
}
