const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export async function getHealth() {
  const res = await fetch(`${API_URL}/health`)
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}
