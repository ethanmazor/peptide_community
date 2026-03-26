import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import health from './routes/health.js'
import doses from './routes/doses.js'
import protocols from './routes/protocols.js'
import peptides from './routes/peptides.js'
import vials from './routes/vials.js'
import photos from './routes/photos.js'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

app.route('/health', health)
app.route('/doses', doses)
app.route('/protocols', protocols)
app.route('/peptides', peptides)
app.route('/vials', vials)
app.route('/photos', photos)

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running at http://localhost:${port}`)
})

export default app
