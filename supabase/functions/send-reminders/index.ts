import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.peptide.community'

interface DueReminder {
  user_id: string
  email: string
  display_name: string | null
  peptide_name: string
  dose_mcg: number
  units_drawn: number | null
  concentration_mcg_per_unit: number | null
}

Deno.serve(async (_req) => {
  try {
    const now = new Date()
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()

    // Find users whose notification_time (adjusted by reminder_lead_min) falls
    // within this minute's window (i.e. now ± 30 seconds)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name, notification_time, reminder_lead_min')
      .not('email', 'is', null)

    if (profileError) throw profileError

    const remindersToSend: DueReminder[] = []
    const todayStr = now.toISOString().split('T')[0]

    const todayDow = now.getUTCDay()

    for (const profile of profiles ?? []) {
      const leadMin: number = profile.reminder_lead_min ?? 15

      // Find active protocol peptides with no dose logged today
      const { data: peptides } = await supabase
        .from('protocol_peptides')
        .select(`
          id,
          dose_mcg,
          scheduled_days,
          scheduled_time,
          peptide:peptides(name),
          protocol:protocols!inner(user_id, status),
          vials(concentration_mcg_per_unit, is_active, units_remaining)
        `)
        .eq('protocol.user_id', profile.id)
        .eq('protocol.status', 'active')

      for (const pp of peptides ?? []) {
        // Check day-of-week schedule
        const days = pp.scheduled_days as number[] | null
        if (days?.length && !days.includes(todayDow)) continue

        // Determine effective reminder fire time (per-peptide override or profile default)
        const effectiveTime = (pp.scheduled_time as string | null) ?? (profile.notification_time as string | null)
        if (!effectiveTime) continue

        const [h, m] = effectiveTime.split(':').map(Number)
        const fireAtMinutes = h * 60 + m - leadMin

        if (nowMinutes !== fireAtMinutes) continue

        // Check if already dosed today
        const { count } = await supabase
          .from('dose_logs')
          .select('id', { count: 'exact', head: true })
          .eq('protocol_peptide_id', pp.id)
          .gte('administered_at', `${todayStr}T00:00:00`)
          .lt('administered_at', `${todayStr}T23:59:59.999`)

        if ((count ?? 0) > 0) continue

        const activeVial = (pp.vials as Array<{ concentration_mcg_per_unit: number | null; is_active: boolean; units_remaining: number | null }>)
          ?.find((v) => v.is_active)
        const concPerUnit = activeVial?.concentration_mcg_per_unit ?? null
        const unitsDrawn = concPerUnit ? pp.dose_mcg / concPerUnit : null

        remindersToSend.push({
          user_id: profile.id,
          email: profile.email as string,
          display_name: profile.display_name,
          peptide_name: (pp.peptide as { name: string }).name,
          dose_mcg: pp.dose_mcg,
          units_drawn: unitsDrawn,
          concentration_mcg_per_unit: concPerUnit,
        })
      }
    }

    // Send emails via Resend
    const results = await Promise.allSettled(
      remindersToSend.map((r) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Peptide Tracker <reminders@peptide.community>',
            to: r.email,
            subject: `Time to dose ${r.peptide_name}`,
            html: buildEmailHtml(r),
          }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Resend ${res.status}`)
          return res.json()
        })
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ sent, failed, total: remindersToSend.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-reminders error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

function buildEmailHtml(r: DueReminder): string {
  const name = r.display_name ?? 'there'
  const unitsLine = r.units_drawn !== null
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Draw <strong>${r.units_drawn.toFixed(2)} units</strong>${r.concentration_mcg_per_unit ? ` (${r.concentration_mcg_per_unit.toFixed(1)} mcg/unit)` : ''}</p>`
    : ''

  return `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:40px 16px;margin:0;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h1 style="margin:0 0 4px;font-size:20px;color:#111827;">Dose reminder</h1>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hey ${name},</p>

    <div style="background:#f0fdf8;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#1D9E75;">${r.peptide_name}</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>${r.dose_mcg} mcg</strong></p>
      ${unitsLine}
    </div>

    <a href="${APP_URL}"
       style="display:block;text-align:center;background:#1D9E75;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Log dose →
    </a>

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      You're receiving this because you set a reminder in Peptide Tracker.
    </p>
  </div>
</body>
</html>
`
}
