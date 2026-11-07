import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDataSource } from '../../context/DataSourceContext'
import {
  fetchDisruption,
  ApiError,
  DistillationError,
} from '../../services/disruptionApi'
import { ResolveResponse } from '../../types/disruption'
import { DecisionBanner } from '../../components/DecisionBanner/DecisionBanner'
import { PassengerSummary } from '../../components/PassengerSummary/PassengerSummary'
import { TripTimeline } from '../../components/TripTimeline/TripTimeline'
import { OptionsList } from '../../components/OptionsList/OptionsList'
import styles from './BookingDetailsPage.module.css'

export const BookingDetailsPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { mode } = useDataSource()

  const [data, setData] = useState<ResolveResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [distillationError, setDistillationError] = useState<string | null>(null)

  const loadBooking = useCallback(async () => {
    if (!bookingId) return

    setLoading(true)
    setApiError(null)
    setDistillationError(null)

    try {
      const result = await fetchDisruption(bookingId, mode)
      setData(result)
    } catch (err) {
      if (err instanceof DistillationError) {
        setDistillationError(err.message)
      } else if (err instanceof ApiError) {
        setApiError(err.message)
      } else {
        setApiError('An unexpected network error occurred while retrieving your booking.')
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId, mode])

  useEffect(() => {
    loadBooking()
  }, [loadBooking])

  return (
    <div className={styles.container}>
      <nav className={styles.topNav} aria-label="Page navigation">
        <Link to="/" className={styles.backLink}>
          &larr; Back to Booking Search
        </Link>
        <div className={styles.pnrTag}>
          <span>Booking Reference:</span>
          <span className={styles.pnrCode}>{bookingId?.toUpperCase()}</span>
        </div>
      </nav>

      {/* Loading Skeleton */}
      {loading && (
        <div className={styles.skeletonContainer} role="status" aria-label="Loading flight data">
          <div className={`${styles.skeletonBlock} ${styles.skeletonBanner}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonCard}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonCard}`} />
        </div>
      )}

      {/* Distillation Failure Error Card */}
      {!loading && distillationError && (
        <div className={styles.distillationErrorCard} role="alert">
          <div className={styles.errorIcon} aria-hidden="true">⚠️</div>
          <h3 className={styles.errorTitle}>Itinerary Cannot Be Distilled</h3>
          <p className={styles.errorText}>
            The flight operations service returned incomplete data that cannot be formatted into a reliable itinerary view.
          </p>
          <p className={styles.errorText}>
            <em>Detail: {distillationError}</em>
          </p>
          <div className={styles.errorActions}>
            <button type="button" onClick={loadBooking} className={styles.retryBtn}>
              Retry Fetch
            </button>
            <Link to="/" className={styles.searchBtn}>
              Search Another Booking
            </Link>
          </div>
        </div>
      )}

      {/* Standard API Error Card */}
      {!loading && apiError && (
        <div className={styles.errorCard} role="alert">
          <div className={styles.errorIcon} aria-hidden="true">🔍</div>
          <h3 className={styles.errorTitle}>Unable to Retrieve Reservation</h3>
          <p className={styles.errorText}>{apiError}</p>
          <div className={styles.errorActions}>
            <button type="button" onClick={loadBooking} className={styles.retryBtn}>
              Retry
            </button>
            <Link to="/" className={styles.searchBtn}>
              New Search
            </Link>
          </div>
        </div>
      )}

      {/* Successfully Distilled Booking */}
      {!loading && !apiError && !distillationError && data && (
        <main>
          <DecisionBanner
            decision={data.decision}
            distilledMessage={data.message}
          />

          <PassengerSummary passengers={data.passengers} />

          <TripTimeline
            flights={data.flights}
            impact={data.impact}
          />

          <OptionsList
            options={data.options}
            decision={data.decision}
            bookingId={data.booking_id}
          />
        </main>
      )}
    </div>
  )
}
