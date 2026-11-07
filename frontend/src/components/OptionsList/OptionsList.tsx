import React, { useState } from 'react'
import { Option, Decision, RebookingResponse } from '../../types/disruption'
import { useDataSource } from '../../context/DataSourceContext'
import { requestRebooking } from '../../services/disruptionApi'
import { OptionCard } from '../OptionCard/OptionCard'
import styles from './OptionsList.module.css'

interface OptionsListProps {
  options: Option[]
  decision: Decision
  bookingId?: string
}

export const OptionsList: React.FC<OptionsListProps> = ({
  options,
  decision,
  bookingId = 'ABC123',
}) => {
  const { mode } = useDataSource()
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [confirmedResult, setConfirmedResult] = useState<RebookingResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rebookingError, setRebookingError] = useState<string | null>(null)

  const isHumanReview = decision.type === 'HUMAN_REVIEW'
  const disabledReason = isHumanReview
    ? `Self-service rebooking is locked while Case ${decision.human_case_id || 'SUPPORT'} is being processed by a specialized agent.`
    : undefined

  const handleConfirmRebooking = async () => {
    if (!selectedOption) return

    setIsSubmitting(true)
    setRebookingError(null)

    try {
      const response = await requestRebooking(
        {
          booking_id: bookingId,
          option_id: selectedOption.option_id,
        },
        mode
      )
      setConfirmedResult(response)
      setSelectedOption(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm rebooking'
      setRebookingError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!options || options.length === 0) {
    return (
      <section className={styles.container} aria-label="Resolution Options">
        <h3 className={styles.title}>Resolution Options</h3>
        <div className={styles.emptyState}>
          <p>No alternative flights or automated compensation options available at this moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.container} aria-label="Resolution Options">
      <div className={styles.header}>
        <h3 className={styles.title}>Available Resolution Alternatives</h3>
        <span className={styles.subtitle}>
          {options.length} eligible {options.length === 1 ? 'option' : 'options'} found
        </span>
      </div>

      <div className={styles.grid}>
        {options.map((option) => (
          <OptionCard
            key={option.option_id}
            option={option}
            disabled={isHumanReview}
            disabledReason={disabledReason}
            onSelect={(opt) => {
              setRebookingError(null)
              setSelectedOption(opt)
            }}
          />
        ))}
      </div>

      {selectedOption && (
        <div className={styles.selectionModal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Confirm Rebooking Selection</h4>
            <p>
              Are you sure you want to select <strong>{selectedOption.flight_number || selectedOption.type}</strong> on {selectedOption.date} at {selectedOption.departure}?
            </p>
            {rebookingError && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{rebookingError}</p>
            )}
            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.cancelBtn}
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedOption(null)
                  setRebookingError(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                disabled={isSubmitting}
                onClick={handleConfirmRebooking}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Selection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmedResult && (
        <div className={styles.selectionModal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Alternative Flight Reserved!</h4>
            <p>{confirmedResult.message}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Request ID: {confirmedResult.request_id} &bull; Status: {confirmedResult.status}
            </p>
            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => setConfirmedResult(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
