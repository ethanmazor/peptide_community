import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { createUserClient } from '../lib/supabase.js'
import type { DoseLog } from '@peptide/types'

type Variables = { userId: string; jwt: string }

const doses = new Hono<{ Variables: Variables }>()

doses.use('*', authMiddleware)

doses.post('/', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)

  const body = await c.req.json<Omit<DoseLog, 'id' | 'created_at'>>()

  const { data, error } = await supabase
    .from('dose_logs')
    .insert(body)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json(data, 201)
})

export default doses
