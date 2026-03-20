import { Hono } from 'hono'

const health = new Hono()

health.get('/', (c) => {
  return c.json({ ok: true })
})

export default health
