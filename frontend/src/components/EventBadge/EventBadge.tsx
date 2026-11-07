import React from 'react'
import styles from './EventBadge.module.css'

export type BadgeVariant = 'onTime' | 'delayed' | 'missed' | 'scheduled' | 'neutral'

interface EventBadgeProps {
  label: string
  variant?: BadgeVariant
  icon?: string
}

export const EventBadge: React.FC<EventBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
}) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`} role="status">
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </span>
  )
}
