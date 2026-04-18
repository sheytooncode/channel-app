import { createClient }  from '../../../../lib/supabase/server'
import { NextResponse }   from 'next/server'
import Anthropic          from '@anthropic-ai/sdk'
import { getWeekStart, DAY_NAMES } from '../../../../lib/supabase/utils'

export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI_DISABLED' }, { status: 503 })
  }

  const { rawInput, goals } = await request.json()
  if (!rawInput?.trim()) return NextResponse.json({ error: 'No input provided' }, { status: 400 })

  const today   = new Date()
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1 // 0=Mon
  const weekStart = getWeekStart()
  const dayName   = DAY_NAMES[todayIdx] || 'Monday'

  const goalList = goals.map(g => `  - "${g.label}" (id: ${g.id}, color: ${g.color})`).join('\n')

  const prompt = `You are Channel's AI planning engine. Channel is a weekly accountability app.

The user has these goals:
${goalList}

Today is ${dayName}. The week starts on ${weekStart} (Monday). Today is day_index ${todayIdx} (0=Monday, 4=Friday).

The user wants to accomplish this this week:
"""
${rawInput.trim()}
"""

Create a structured weekly task plan. Rules:
1. Map each item to the most relevant goal_id from the list above. Use null only for admin/personal tasks with no goal fit.
2. Assign realistic time estimates in minutes (15, 30, 45, 60, 90, or 120).
3. Distribute tasks sensibly across the week — no more than 3-4 tasks per day, no more than 3 hours total per day.
4. Today is day_index ${todayIdx}. Start scheduling from today onward. Don't schedule anything before today.
5. Mark the 1-2 most important tasks as priority "high". Everything else is "normal".
6. For tasks that are large or vague (e.g. "work on chapter 3"), break them into 2-4 concrete subtasks.
7. Return 8-15 tasks total.

Return ONLY a valid JSON array with no commentary, no markdown fences. Each item must follow this exact shape:
{
  "title": "Task name (specific and actionable)",
  "goal_id": "uuid-from-above or null",
  "mins": 45,
  "priority": "normal",
  "day_index": 0,
  "subtasks": [{"title": "subtask"}]
}

day_index: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text.trim()
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const tasks = JSON.parse(cleaned)

    // Validate shape before returning
    if (!Array.isArray(tasks)) throw new Error('Response was not an array')

    const safe = tasks.map(t => ({
      title:     String(t.title || 'Untitled').slice(0, 200),
      goal_id:   t.goal_id || null,
      mins:      Number(t.mins) || 30,
      priority:  t.priority === 'high' ? 'high' : 'normal',
      day_index: Math.min(4, Math.max(todayIdx, Number(t.day_index) || todayIdx)),
      subtasks:  Array.isArray(t.subtasks) ? t.subtasks.slice(0, 6) : [],
      week_start: weekStart,
      done:       false,
    }))

    return NextResponse.json({ tasks: safe, weekStart })
  } catch (err) {
    console.error('AI plan error:', err)
    return NextResponse.json({ error: 'Failed to generate plan. Check your API key and try again.' }, { status: 500 })
  }
}
