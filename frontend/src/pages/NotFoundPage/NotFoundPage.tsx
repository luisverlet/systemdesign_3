import React from 'react'
import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export const NotFoundPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.errorCode}>404</div>
      <h2 className={styles.title}>Page Not Found</h2>
      <p className={styles.description}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className={styles.homeButton}>
        Return to Booking Search
      </Link>
    </div>
  )
}
