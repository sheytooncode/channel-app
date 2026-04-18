import { createClient } from '../../../../lib/supabase/server'
import { NextResponse }  from 'next/server'
import Anthropic         from '@anthropic-ai/sdk'

export async function POST(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI_DISABLED' }, { status: 503 })
  }

  const { taskTitle, goalLabel } = await request.json()

  const prompt = `Break this task into 3-5 concrete, specific subtasks that together complete it.
Task: "${taskTitle}"${goalLabel ? `\nGoal context: ${goalLabel}` : ''}

Return ONLY a JSON array of strings — each string is one subtask. No commentary, no markdown.
Example: ["Research pricing models", "Draft pricing page copy", "Get feedback from 2 people"]`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text.trim()
      .replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const subtasks = JSON.parse(raw)

    if (!Array.isArray(subtasks)) throw new Error('Not an array')
    const safe = subtasks.slice(0, 6).map(s => ({ title: String(s).slice(0, 150) }))

    // Persist subtasks to the task row
    const { taskId } = await request.json().catch(() => ({}))
    // Note: taskId comes from body — re-parse not needed; caller patches directly
    return NextResponse.json({ subtasks: safe })
  } catch (err) {
    console.error('Breakdown error:', err)
    return NextResponse.json({ error: 'Failed to break down task.' }, { status: 500 })
  }
}
