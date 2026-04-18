import { NextResponse }      from 'next/server'
import { createClient }       from '@supabase/supabase-js'
import { sendEveningNudge }   from '../../../../lib/email'
import { getWeekStart, getDayIndex, DAY_NAMES } from '../../../../lib/supabase/utils'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = adminClient()
  const weekStart = getWeekStart()
  const todayIdx = getDayIndex()
  const dayName = DAY_NAMES[todayIdx] || 'Today'
  const { data: tasks, error } = await supabase.from('tasks').select('*, goals(*)').eq('week_start', weekStart).eq('day_index', todayIdx)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tasks?.length) return NextResponse.json({ sent: 0 })
  const byUser = tasks.reduce((acc, t) => { if (!acc[t.user_id]) acc[t.user_id] = []; acc[t.user_id].push(t); return acc }, {})
  let sent = 0
  for (const [userId, userTasks] of Object.entries(byUser)) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) continue
      const goals = [...new Map(userTasks.filter(t=>t.goals).map(t=>[t.goals.id, t.goals])).values()]
      await sendEveningNudge({ to: user.email, tasks: userTasks, goals, dayName })
      sent++
    } catch (e) { console.error(`Evening nudge failed for ${userId}:`, e) }
  }
  return NextResponse.json({ sent, day: dayName })
}
