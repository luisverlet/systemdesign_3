import React, { ReactNode } from 'react'
import { Header } from '../Header/Header'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.mainContent}>
        {children}
      </main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} FlyCompanion &bull; Airline Disruption &amp; Contingency Orchestration</p>
      </footer>
    </div>
  )
}
