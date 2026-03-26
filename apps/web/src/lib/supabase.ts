import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // PKCE is required for OAuth flows in native apps (no implicit grant)
    flowType: 'pkce',
    // On native, deep links deliver the auth tokens — don't auto-detect from URL
    detectSessionInUrl: !Capacitor.isNativePlatform(),
  },
})
