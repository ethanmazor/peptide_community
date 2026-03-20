import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'

const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true'

export default function ProtectedLayout() {
  const { session, loading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (PREVIEW_MODE) return
    if (!loading && !session) {
      navigate('/login', { replace: true })
    }
  }, [session, loading, navigate])

  if (!PREVIEW_MODE && (loading || !session)) return null

  return <Outlet />
}
