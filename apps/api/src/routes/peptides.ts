import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { createUserClient } from '../lib/supabase.js'
import type { Peptide } from '@peptide/types'

type Variables = { userId: string; jwt: string }

const peptides = new Hono<{ Variables: Variables }>()

peptides.use('*', authMiddleware)

// List all default peptides + user's custom peptides
peptides.get('/', async (c) => {
  const jwt = c.get('jwt')
  const userId = c.get('userId')
  const supabase = createUserClient(jwt)

  const { data, error } = await supabase
    .from('peptides')
    .select('*')
    .or(`is_default.eq.true,created_by_user_id.eq.${userId}`)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

// Create custom peptide
peptides.post('/', async (c) => {
  const jwt = c.get('jwt')
  const userId = c.get('userId')
  const supabase = createUserClient(jwt)

  const body = await c.req.json<Partial<Peptide>>()

  const { data, error } = await supabase
    .from('peptides')
    .insert({
      created_by_user_id: userId,
      name: body.name!,
      alias: body.alias ?? null,
      description: body.description ?? null,
      typical_dose_mcg: body.typical_dose_mcg ?? null,
      typical_frequency: body.typical_frequency ?? null,
      half_life_hours: body.half_life_hours ?? null,
      is_default: false,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

// Update a peptide (user's own custom peptides only — RLS enforces this)
peptides.patch('/:id', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)
  const id = c.req.param('id')

  const body = await c.req.json<Partial<Peptide>>()
  const { id: _id, created_at: _ca, is_default: _def, created_by_user_id: _cbu, ...updates } = body as Peptide

  const { data, error } = await supabase
    .from('peptides')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

export default peptides
