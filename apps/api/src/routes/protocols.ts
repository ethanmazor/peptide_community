import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { createUserClient } from '../lib/supabase.js'
import type { Protocol, ProtocolPeptide, Peptide } from '@peptide/types'

type Variables = { userId: string; jwt: string }

const protocols = new Hono<{ Variables: Variables }>()

protocols.use('*', authMiddleware)

// List all protocols for current user
protocols.get('/', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)

  const { data, error } = await supabase
    .from('protocols')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

// Get single protocol with its peptides
protocols.get('/:id', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)
  const id = c.req.param('id')

  const { data: protocol, error: protoError } = await supabase
    .from('protocols')
    .select('*')
    .eq('id', id)
    .single()

  if (protoError) return c.json({ error: protoError.message }, 400)

  const { data: peptides, error: ppError } = await supabase
    .from('protocol_peptides')
    .select('*, peptide:peptides(*)')
    .eq('protocol_id', id)

  if (ppError) return c.json({ error: ppError.message }, 400)

  return c.json({ ...protocol, protocol_peptides: peptides })
})

// Create protocol
protocols.post('/', async (c) => {
  const jwt = c.get('jwt')
  const userId = c.get('userId')
  const supabase = createUserClient(jwt)

  const body = await c.req.json<{
    name: string
    notes?: string | null
    start_date?: string | null
    end_date?: string | null
    peptides: Array<{
      peptide_id: string
      dose_mcg: number
      frequency: string
      notes?: string | null
      cycle_length_days?: number | null
      scheduled_days?: number[] | null
      scheduled_time?: string | null
      dose_phases?: Array<{ start_week: number; end_week: number | null; dose_mcg: number }> | null
    }>
  }>()

  // Deactivate any currently active protocol
  await supabase
    .from('protocols')
    .update({ status: 'completed' })
    .eq('user_id', userId)
    .eq('status', 'active')

  // Create the new protocol
  const { data: protocol, error: protoError } = await supabase
    .from('protocols')
    .insert({
      user_id: userId,
      name: body.name,
      notes: body.notes ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      status: 'active',
    })
    .select()
    .single()

  if (protoError) return c.json({ error: protoError.message }, 400)

  // Insert protocol_peptides
  if (body.peptides.length > 0) {
    const { error: ppError } = await supabase.from('protocol_peptides').insert(
      body.peptides.map((p) => ({
        protocol_id: protocol.id,
        peptide_id: p.peptide_id,
        dose_mcg: p.dose_mcg,
        frequency: p.frequency,
        notes: p.notes ?? null,
        cycle_length_days: p.cycle_length_days ?? null,
        scheduled_days: p.scheduled_days ?? null,
        scheduled_time: p.scheduled_time ?? null,
        dose_phases: p.dose_phases ?? null,
      }))
    )
    if (ppError) return c.json({ error: ppError.message }, 400)
  }

  // Return protocol with its peptides
  const { data: ppRows } = await supabase
    .from('protocol_peptides')
    .select('*, peptide:peptides(*)')
    .eq('protocol_id', protocol.id)

  return c.json({ ...protocol, protocol_peptides: ppRows ?? [] }, 201)
})

// Add a peptide to an existing protocol
protocols.post('/:id/peptides', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)
  const protocolId = c.req.param('id')

  const body = await c.req.json<{
    peptide_id: string
    dose_mcg: number
    frequency: string
    notes?: string | null
    cycle_length_days?: number | null
    scheduled_days?: number[] | null
    scheduled_time?: string | null
    dose_phases?: Array<{ start_week: number; end_week: number | null; dose_mcg: number }> | null
  }>()

  const { data, error } = await supabase
    .from('protocol_peptides')
    .insert({
      protocol_id: protocolId,
      peptide_id: body.peptide_id,
      dose_mcg: body.dose_mcg,
      frequency: body.frequency,
      notes: body.notes ?? null,
      cycle_length_days: body.cycle_length_days ?? null,
      scheduled_days: body.scheduled_days ?? null,
      scheduled_time: body.scheduled_time ?? null,
      dose_phases: body.dose_phases ?? null,
    })
    .select('*, peptide:peptides(*)')
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

// Remove a peptide from a protocol
protocols.delete('/:id/peptides/:ppId', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)
  const ppId = c.req.param('ppId')

  const { error } = await supabase
    .from('protocol_peptides')
    .delete()
    .eq('id', ppId)

  if (error) return c.json({ error: error.message }, 400)
  return c.json({ success: true })
})

// Update protocol (status, name, etc.)
protocols.patch('/:id', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)
  const id = c.req.param('id')

  const body = await c.req.json<Partial<Protocol>>()
  const { id: _id, user_id: _uid, created_at: _ca, ...updates } = body as Protocol

  const { data, error } = await supabase
    .from('protocols')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

export default protocols
