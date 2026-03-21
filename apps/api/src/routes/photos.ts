import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { createUserClient, supabaseAdmin } from '../lib/supabase.js'

type Variables = { userId: string; jwt: string }

const photos = new Hono<{ Variables: Variables }>()

photos.use('*', authMiddleware)

// List all photos for the current user (joined with dose_log + protocol_peptide + peptide)
photos.get('/', async (c) => {
  const jwt = c.get('jwt')
  const supabase = createUserClient(jwt)

  const { data, error } = await supabase
    .from('photos')
    .select(`
      *,
      dose_log:dose_logs(
        id,
        administered_at,
        dose_mcg,
        notes,
        protocol_peptide:protocol_peptides(
          peptide:peptides(id, name)
        )
      )
    `)
    .order('taken_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data)
})

// Get a signed upload URL from Supabase Storage
// The frontend uploads the file directly using this URL, then calls POST /photos to save the record
photos.post('/upload-url', async (c) => {
  const userId = c.get('userId')

  const body = await c.req.json<{ filename: string; content_type: string }>()
  const ext = body.filename.split('.').pop() ?? 'jpg'
  const storagePath = `${userId}/${Date.now()}.${ext}`

  const { data, error } = await supabaseAdmin.storage
    .from('progress-photos')
    .createSignedUploadUrl(storagePath)

  if (error) return c.json({ error: error.message }, 400)

  return c.json({ upload_url: data.signedUrl, storage_path: storagePath })
})

// Save a photo record after the file has been uploaded to Storage
photos.post('/', async (c) => {
  const jwt = c.get('jwt')
  const userId = c.get('userId')
  const supabase = createUserClient(jwt)

  const body = await c.req.json<{
    dose_log_id: string
    storage_path: string
    caption?: string | null
    taken_at?: string | null
  }>()

  const { data, error } = await supabase
    .from('photos')
    .insert({
      user_id: userId,
      dose_log_id: body.dose_log_id,
      storage_path: body.storage_path,
      caption: body.caption ?? null,
      taken_at: body.taken_at ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 400)
  return c.json(data, 201)
})

export default photos
