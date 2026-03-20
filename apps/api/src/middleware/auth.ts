import { createMiddleware } from 'hono/factory'
import { supabaseAdmin } from '../lib/supabase.js'

type AuthVariables = {
  userId: string
  jwt: string
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const jwt = authHeader.slice(7)
    const { data, error } = await supabaseAdmin.auth.getUser(jwt)

    if (error || !data.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('userId', data.user.id)
    c.set('jwt', jwt)
    await next()
  }
)
