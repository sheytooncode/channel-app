import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMorningDigest(email, { tasks = [], goals = [], date = new Date() }) {
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const totalMins = tasks.reduce((s, t) => s + (t.mins || 0), 0)
  const hours = Math.floor(totalMins / 60)
  const mins  = totalMins % 60
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  const goalMap = Object.fromEntries(goals.map(g => [g.id, g]))
  const taskLines = tasks.map(t => {
    const goal = t.goal_id ? goalMap[t.goal_id] : null
    return `• ${t.title}${goal ? ` [${goal.short}]` : ''} — ${t.mins}m${t.priority === 'high' ? ' ⚡' : ''}`
  }).join('\n')

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0A0E1A;color:#EDF0F7;padding:32px;border-radius:12px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
    <span style="font-size:20px;font-weight:800;letter-spacing:.12em;color:#EDF0F7">CHANNEL</span>
  </div>
  <p style="color:#6B7898;font-size:13px;margin-bottom:8px">${dateStr}</p>
  <h2 style="font-size:22px;font-weight:800;margin:0 0 24px;color:#EDF0F7">Today's focus</h2>
  ${tasks.length === 0
    ? '<p style="color:#6B7898;font-size:14px">No tasks scheduled for today. Open Channel to add some.</p>'
    : `<div style="background:#131826;border:1px solid #1E2840;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="color:#6B7898;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px">${tasks.length} tasks · ${timeStr}</p>
        ${tasks.map(t => {
          const goal = t.goal_id ? goalMap[t.goal_id] : null
          return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1E2840">
            ${goal ? `<span style="width:3px;height:16px;background:${goal.color};border-radius:2px;flex-shrink:0"></span>` : ''}
            <span style="font-size:14px;color:#EDF0F7;flex:1">${t.title}</span>
            <span style="font-size:12px;color:#6B7898">${t.mins}m</span>
            ${t.priority === 'high' ? '<span style="font-size:11px;color:#00C2FF">⚡</span>' : ''}
          </div>`
        }).join('')}
      </div>`
  }
  <p style="font-size:11px;color:#2E3D5C;text-align:center;margin-top:24px;font-style:italic">Carve your channel.</p>
</div>`

  return resend.emails.send({
    from: 'Channel <noreply@channel.app>',
    to: email,
    subject: `Today's focus — ${dateStr}`,
    html,
    text: `Today's focus — ${dateStr}\n\n${taskLines || 'No tasks scheduled. Open Channel to add some.'}\n\nTotal: ${timeStr}`,
  })
}

export async function sendEveningDigest(email, { completed = [], remaining = [], goals = [], date = new Date() }) {
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const total = completed.length + remaining.length
  const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0A0E1A;color:#EDF0F7;padding:32px;border-radius:12px">
  <div style="margin-bottom:32px">
    <span style="font-size:20px;font-weight:800;letter-spacing:.12em;color:#EDF0F7">CHANNEL</span>
  </div>
  <p style="color:#6B7898;font-size:13px;margin-bottom:8px">${dateStr}</p>
  <h2 style="font-size:22px;font-weight:800;margin:0 0 8px;color:#EDF0F7">End of day</h2>
  <p style="font-size:14px;color:#6B7898;margin:0 0 24px">${completed.length} of ${total} tasks complete (${pct}%)</p>
  <div style="background:#1E2840;border-radius:4px;height:4px;margin-bottom:24px">
    <div style="background:#00C2FF;height:4px;border-radius:4px;width:${pct}%"></div>
  </div>
  ${remaining.length > 0 ? `
  <p style="font-size:12px;color:#6B7898;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">${remaining.length} remaining</p>
  ${remaining.map(t => `<div style="padding:8px 0;border-bottom:1px solid #1E2840;font-size:14px;color:#6B7898">${t.title}</div>`).join('')}
  ` : '<p style="color:#4CAF50;font-size:14px;font-weight:600">All done. The channel deepens.</p>'}
  <p style="font-size:11px;color:#2E3D5C;text-align:center;margin-top:24px;font-style:italic">Carve your channel.</p>
</div>`

  return resend.emails.send({
    from: 'Channel <noreply@channel.app>',
    to: email,
    subject: `Day recap — ${pct}% complete`,
    html,
    text: `${dateStr}\n\n${completed.length}/${total} tasks complete (${pct}%)\n\nRemaining:\n${remaining.map(t => `• ${t.title}`).join('\n') || 'None!'}`,
  })
}
