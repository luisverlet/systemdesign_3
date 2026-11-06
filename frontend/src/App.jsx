import { useEffect, useState } from 'react'
import { getHealth } from './services/api.js'

export default function App() {
  const [status, setStatus] = useState('...')

  useEffect(() => {
    getHealth().then((d) => setStatus(d.status)).catch(() => setStatus('error'))
  }, [])

  return <h1>API status: {status}</h1>
}
