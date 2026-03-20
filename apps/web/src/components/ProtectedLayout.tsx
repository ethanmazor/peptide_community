import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'

export default function ProtectedLayout() {
  const { session, loading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true })
    }
  }, [session, loading, navigate])

  if (loading || !session) return null

  return <Outlet />
}
