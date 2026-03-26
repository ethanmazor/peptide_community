import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'

const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true'

interface SessionContextValue {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!PREVIEW_MODE)

  useEffect(() => {
    if (PREVIEW_MODE) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // On native, listen for deep links that carry Supabase auth tokens.
    // Email confirmation links and OAuth redirects arrive as:
    //   peptidetracker://auth/callback?code=XXXX  (PKCE)
    let cleanup: (() => void) | undefined
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', ({ url }) => {
        if (url.startsWith('peptidetracker://')) {
          // Extract the query string from the deep link URL
          const queryString = url.split('?')[1] ?? ''
          if (queryString) {
            supabase.auth.exchangeCodeForSession(queryString).catch(console.error)
          }
        }
      }).then((handle) => {
        cleanup = () => handle.remove()
      })
    }

    return () => {
      listener.subscription.unsubscribe()
      cleanup?.()
    }
  }, [])

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
