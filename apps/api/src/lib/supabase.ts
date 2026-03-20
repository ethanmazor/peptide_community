import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Anon client — used with user JWT for RLS-enforced queries
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

// Service client — admin ops only (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

// Create a user-scoped client by passing the user's JWT
export function createUserClient(jwt: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  })
}
