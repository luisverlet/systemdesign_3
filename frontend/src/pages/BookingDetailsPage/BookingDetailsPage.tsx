import React from 'react'
import { useParams } from 'react-router-dom'

export const BookingDetailsPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  return <div>Booking Details for: {bookingId}</div>
}
