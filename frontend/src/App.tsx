import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/Layout/AppLayout'
import { SearchPage } from './pages/SearchPage/SearchPage'
import { BookingDetailsPage } from './pages/BookingDetailsPage/BookingDetailsPage'
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage'

export const App: React.FC = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/booking/:bookingId" element={<BookingDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  )
}
