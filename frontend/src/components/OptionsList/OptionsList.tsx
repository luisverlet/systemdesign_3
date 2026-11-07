import React, { useState } from 'react'
import { Option, Decision } from '../../types/disruption'
import { OptionCard } from '../OptionCard/OptionCard'
import styles from './OptionsList.module.css'

interface OptionsListProps {
  options: Option[]
  decision: Decision
}

export const OptionsList: React.FC<OptionsListProps> = ({ options, decision }) => {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [confirmedOption, setConfirmedOption] = useState<Option | null>(null)

  const isHumanReview = decision.type === 'HUMAN_REVIEW'
  const disabledReason = isHumanReview
    ? `Self-service rebooking is locked while Case ${decision.human_case_id || 'SUPPORT'} is being processed by a specialized agent.`
    : undefined

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
            onSelect={(opt) => setSelectedOption(opt)}
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
            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setSelectedOption(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => {
                  setConfirmedOption(selectedOption)
                  setSelectedOption(null)
                }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmedOption && (
        <div className={styles.selectionModal} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Alternative Flight Reserved!</h4>
            <p>
              Your rebooking request for <strong>{confirmedOption.flight_number}</strong> has been registered. A revised itinerary has been dispatched to your flight record.
            </p>
            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => setConfirmedOption(null)}
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
