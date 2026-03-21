import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { createUserClient } from '../lib/supabase.js'
import type { Vial } from '@peptide/types'

type Variables = { userId: string; jwt: string }

const vials = new Hono<{ Variables: Variables }>()

vials.use('*', authMiddleware)

// Create a new vial
vials.post('/', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)

  const body = await c.req.json<{
    protocol_peptide_id: string
    vial_size_mg: number
    bac_water_ml: number
    vendor_name?: string | null
    vendor_url?: string | null
    reconstituted_at?: string | null
    expires_at?: string | null
  }>()

  // Deactivate any existing active vial for this protocol_peptide
  await supabase
    .from('vials')
    .update({ is_active: false })
    .eq('protocol_peptide_id', body.protocol_peptide_id)
    .eq('is_active', true)

  // Calculate units_remaining: (vial_size_mg * 1000) / concentration_mcg_per_unit
  // concentration_mcg_per_unit = (vial_size_mg * 1000) / (bac_water_ml * 100)
  // units_remaining = bac_water_ml * 100
  const units_remaining = body.bac_water_ml * 100

  const { data, error } = await supabase
    .from('vials')
    .insert({
      protocol_peptide_id: body.protocol_peptide_id,
      vial_size_mg: body.vial_size_mg,
      bac_water_ml: body.bac_water_ml,
      units_remaining,
      vendor_name: body.vendor_name ?? null,
      vendor_url: body.vendor_url ?? null,
      reconstituted_at: body.reconstituted_at ?? new Date().toISOString().split('T')[0],
      expires_at: body.expires_at ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

// Update a vial (e.g., deactivate)
vials.patch('/:id', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)
  const id = c.req.param('id')

  const body = await c.req.json<Partial<Vial>>()
  const { id: _id, created_at: _ca, concentration_mcg_per_unit: _conc, ...updates } = body as Vial

  const { data, error } = await supabase
    .from('vials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

export default vials
