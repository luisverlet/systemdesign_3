import React from 'react'
import { Decision } from '../../types/disruption'
import styles from './DecisionBanner.module.css'

interface DecisionBannerProps {
  decision: Decision
  distilledMessage?: string
}

export const DecisionBanner: React.FC<DecisionBannerProps> = ({
  decision,
  distilledMessage,
}) => {
  if (decision.type === 'HUMAN_REVIEW') {
    return (
      <div className={`${styles.banner} ${styles.humanReview}`} role="alert" aria-live="polite">
        <div className={styles.iconWrapper} aria-hidden="true">🧑‍✈️</div>
        <div className={styles.content}>
          <h3 className={styles.title}>Priority Human Assistance in Progress</h3>
          <p className={styles.description}>
            {distilledMessage || decision.reason}
          </p>
          <div className={styles.metaRow}>
            {decision.human_case_id && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Support Case:</span>
                <span className={styles.casePill}>{decision.human_case_id}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status:</span>
              <span className={styles.metaValue}>Assigned to Airport Care Specialist</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Target Response:</span>
              <span className={styles.metaValue}>Within 45 minutes</span>
            </div>
            {decision.policy_version && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Policy Reference:</span>
                <span className={styles.metaValue}>{decision.policy_version}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (decision.type === 'AUTO_OFFER') {
    return (
      <div className={`${styles.banner} ${styles.autoOffer}`} role="alert">
        <div className={styles.iconWrapper} aria-hidden="true">✨</div>
        <div className={styles.content}>
          <h3 className={styles.title}>Complimentary Resolution Options Available</h3>
          <p className={styles.description}>
            {distilledMessage || decision.reason || 'You are eligible to select an alternative flight or request compensation below.'}
          </p>
        </div>
      </div>
    )
  }

  if (decision.type === 'INFO_ONLY') {
    return (
      <div className={`${styles.banner} ${styles.infoOnly}`} role="status">
        <div className={styles.iconWrapper} aria-hidden="true">ℹ️</div>
        <div className={styles.content}>
          <h3 className={styles.title}>Operational Update</h3>
          <p className={styles.description}>
            {distilledMessage || decision.reason || 'Your itinerary has operational notices but does not require rebooking.'}
          </p>
        </div>
      </div>
    )
  }

  return null
}
