import { createClient }  from '../../../lib/supabase/server'
import { NextResponse }   from 'next/server'
import { getWeekStart, getDayIndex } from '../../../lib/supabase/utils'
import Anthropic          from '@anthropic-ai/sdk'

/**
 * POST /api/carry-forward
 *
 * Finds incomplete tasks from previous days this week and moves them to today.
 * If a task has already been carried twice, the AI breaks it into smaller steps.
 * Returns { carried: number, broken: number } — counts for the toast UI.
 */
export async function POST() {
  const supabase  = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = getWeekStart()
  const todayIdx  = getDayIndex()

  const { data: stale, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id',   user.id)
    .eq('week_start', weekStart)
    .eq('done',       false)
    .lt('day_index',  todayIdx)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!stale || stale.length === 0) return NextResponse.json({ carried: 0, broken: 0 })

  let carried = 0
  let broken  = 0

  for (const task of stale) {
    if (task.carry_count >= 2 && process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const msg = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 512,
          messages: [{ role: 'user', content: `This task has been postponed twice. Break it into 2-3 smaller, easier subtasks so it actually gets done today.\nTask: "${task.title}"\nReturn ONLY a JSON array of short task title strings. No markdown.` }],
        })
        const raw = msg.content[0].text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
        const titles = JSON.parse(raw)
        if (Array.isArray(titles) && titles.length > 0) {
          const newTasks = titles.slice(0, 3).map(t => ({ user_id: user.id, goal_id: task.goal_id, title: String(t).slice(0, 200), mins: Math.max(15, Math.round(task.mins / titles.length)), done: false, priority: task.priority, week_start: weekStart, day_index: todayIdx, carry_oount: 0, subtasks: [] }))
          await supabase.from('tasks').insert(newTasks)
          await supabase.from('tasks').delete().eq('id', task.id)
          broken++
          continue
        }
      } catch { }
    }
    await supabase.from('tasks').update({ day_index: todayIdx, carry_count: task.carry_count + 1 }).eq('id', task.id)
    carried++
  }
  return NextResponse.json({ carried, broken })
}
