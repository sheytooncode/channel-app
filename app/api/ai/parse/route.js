import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getWeekStart, DAY_NAMES } from '../../../../lib/supabase/utils'

export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { input, goals = [], dayIndex, weekStart } = await request.json()
  if (!input?.trim()) return NextResponse.json({ error: 'No input' }, { status: 400 })

  const today = new Date()
  const todayIdx = dayIndex ?? (today.getDay() === 0 || today.getDay() === 6 ? 4 : today.getDay() - 1)
  const ws = weekStart || getWeekStart()
  const isMulti = input.includes('\n') || input.length > 120

  if (!process.env.ANTHROPIC_API_KEY) {
    const task = parseFallback(input, todayIdx, ws)
    return NextResponse.json({ tasks: [task], mode: 'single' })
  }

  const goalList = goals.length > 0
    ? goals.map(g => `  - "${g.label}" (id: ${g.id})`).join('\n')
    : '  (no goals set — use null for goal_id)'

  const dayName = DAY_NAMES[todayIdx] || 'Monday'

  const prompt = isMulti
    ? `Extract all tasks from this text. Today is ${dayName} (day_index ${todayIdx}, 0=Mon 4=Fri).

User goals:
${goalList}

Text to extract from:
"""
${input.trim()}
"""

Rules:
- Extract every actionable item as a task
- Assign realistic durations (15, 30, 45, 60, 90, or 120 minutes)
- Spread tasks across the week — no more than 3-4 tasks per day
- Mark urgent/important tasks as priority "high"
- Match tasks to the most relevant goal_id, or null
- Return ONLY a valid JSON array, no commentary

Each item: {"title": string, "goal_id": string|null, "mins": number, "priority": "normal"|"high", "day_index": number, "subtasks": []}`
    : `Parse this single task into a structured object.

Task: "${input.trim()}"
Today: ${dayName} (day_index ${todayIdx}, 0=Mon 4=Fri)

User goals:
${goalList}

Rules:
- Clean up the title (make it actionable, remove time references)
- Infer duration from context — look for "30min", "1h", "quick", etc. Default to 30
- If text says "tomorrow", "Tuesday", etc., infer the right day_index
- If text contains "urgent", "ASAP", "!", mark as high priority
- Match to the most relevant goal_id, or null
- Return ONLY a valid JSON object, no commentary

Format: {"title": string, "goal_id": string|null, "mins": number, "priority": "normal"|"high", "day_index": number, "subtasks": []}`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: isMulti ? 2048 : 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    const normalize = (t) => ({
      title:     String(t.title || input.slice(0, 100)).slice(0, 200),
      goal_id:   t.goal_id || null,
      mins:      [15, 30, 45, 60, 90, 120].includes(Number(t.mins)) ? Number(t.mins) : 30,
      priority:  t.priority === 'high' ? 'high' : 'normal',
      day_index: Math.min(4, Math.max(0, Number(t.day_index) ?? todayIdx)),
      subtasks:  Array.isArray(t.subtasks) ? t.subtasks.slice(0, 6) : [],
      week_start: ws,
      done: false,
    })

    const tasks = Array.isArray(parsed) ? parsed.map(normalize) : [normalize(parsed)]
    return NextResponse.json({ tasks, mode: tasks.length === 1 ? 'single' : 'multi' })
  } catch (err) {
    console.error('AI parse error:', err)
    const task = parseFallback(input, todayIdx, ws)
    return NextResponse.json({ tasks: [task], mode: 'single' })
  }
}

function parseFallback(input, dayIdx, weekStart) {
  const minMatch = input.match(/(\d+)\s*(?:min|m\b)/i)
  const hrMatch  = input.match(/(\d+)\s*h(?:our|r)?/i)
  const mins = hrMatch ? Math.min(120, parseInt(hrMatch[1]) * 60)
             : minMatch ? Math.min(120, parseInt(minMatch[1])) : 30
  const title = input.replace(/\d+\s*(?:min|m\b|hour|hr|h\b)/gi, '').replace(/\s+/g, ' ').trim().slice(0, 200) || input.slice(0, 200)
  const priority = /urgent|asap|important|!/i.test(input) ? 'high' : 'normal'
  return { title, mins, priority, day_index: dayIdx, goal_id: null, subtasks: [], week_start: weekStart, done: false }
}
