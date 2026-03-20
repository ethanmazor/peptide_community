import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(() => {
      navigate('/', { replace: true })
    })
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-dvh">
      <div className="w-6 h-6 border-2 border-teal rounded-full border-t-transparent animate-spin" />
    </div>
  )
}
