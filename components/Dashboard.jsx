'use client'
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import WeeklyPlanner from './WeeklyPlanner'

const C = {
  bg: '#0A0E1A', surface: '#131826', surface2: '#0F1420', border: '#1E2840',
  accent: '#00C2FF', accentSoft: 'rgba(0,194,255,0.10)',
  text: '#EDF0F7', textSub: '#6B7898', textMuted: '#2E3D5C',
  error: '#FF6B6B', errorSoft: 'rgba(255,107,107,0.10)',
  success: '#4CAF50', successSoft: 'rgba(76,175,80,0.10)',
  high: '#FFB347', highSoft: 'rgba(255,179,71,0.10)',
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const GOAL_COLORS = ['#00C2FF', '#7C6FFF', '#FF6B9D', '#FFB347', '#4CAF50', '#FF6B6B', '#00D4B8', '#FF8C42', '#A855F7', '#F59E0B']

function getTodayIndex() {
  const day = new Date().getDay()
  if (day === 0 || day === 6) return 4 // weekend → show Friday
  return day - 1 // Mon=0
}

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 3 L11 19 L18 3" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 10 L14.5 10" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" opacity=".4"/>
      </svg>
      <span style={{ fontSize:15, fontWeight:800, letterSpacing:'.12em', color:C.text }}>CHANNEL</span>
    </div>
  )
}

function ChannelDepth({ tasks }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.done).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const totalMins = tasks.reduce((s, t) => s + (t.mins || 0), 0)
  const doneMins  = tasks.filter(t => t.done).reduce((s, t) => s + (t.mins || 0), 0)
  const timePct   = totalMins > 0 ? Math.round((doneMins / totalMins) * 100) : 0

  const color = pct >= 80 ? C.success : pct >= 40 ? C.accent : C.high

  return (
    <div style={{ padding:'16px', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.textSub, textTransform:'uppercase', letterSpacing:'.08em' }}>Channel Depth</span>
        <span style={{ fontSize:20, fontWeight:800, color }}>
          {pct}<span style={{ fontSize:13, fontWeight:600, color:C.textSub }}>%</span>
        </span>
      </div>
      <div style={{ background:C.border, borderRadius:4, height:6, overflow:'hidden', marginBottom:8 }}>
        <div style={{ background:color, height:'100%', width:`${pct}%`, borderRadius:4, transition:'width .4s ease' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:11, color:C.textMuted }}>{done}/{total} tasks</span>
        <span style={{ fontSize:11, color:C.textMuted }}>{timePct}% of time</span>
      </div>
    </div>
  )
}

function TaskCard({ task, goal, onToggle, onDelete, expanded, onToggleExpand }) {
  const goalColor = goal?.color || C.border

  return (
    <div style={{
      background: task.done ? C.surface2 : C.surface,
      border: `1px solid ${task.done ? C.border : C.border}`,
      borderLeft: `3px solid ${goalColor}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
      opacity: task.done ? 0.6 : 1,
      transition: 'opacity .15s',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, !task.done)}
          style={{
            width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? goalColor : C.border}`,
            background: task.done ? goalColor : 'transparent', flexShrink: 0, marginTop: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all .15s',
          }}
        >
          {task.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4 L4 7 L9 1" stroke="#0A0E1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <p style={{ fontSize:14, color:task.done ? C.textMuted : C.text, margin:0, fontWeight:500, textDecoration: task.done ? 'line-through' : 'none', flex:1, minWidth:0 }}>
              {task.title}
            </p>
            {task.priority === 'high' && !task.done && (
              <span style={{ fontSize:10, fontWeight:700, color:C.high, background:C.highSoft, border:`1px solid ${C.high}40`, borderRadius:4, padding:'2px 6px', letterSpacing:'.06em', flexShrink:0 }}>HIGH</span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
            <span style={{ fontSize:11, color:C.textMuted }}>{task.mins}m</span>
            {goal && <span style={{ fontSize:11, color:goal.color, opacity:.8 }}>{goal.short}</span>}
            {task.carry_count > 0 && <span style={{ fontSize:11, color:C.textSub }}>↩ carried {task.carry_count}×</span>}
            {task.subtasks?.length > 0 && (
              <button onClick={onToggleExpand} style={{ background:'none', border:'none', fontSize:11, color:C.textSub, cursor:'pointer', padding:0 }}>
                {expanded ? '▲' : '▼'} {task.subtasks.length} subtasks
              </button>
            )}
          </div>
          {expanded && task.subtasks?.length > 0 && (
            <div style={{ marginTop:8, paddingLeft:8, borderLeft:`2px solid ${C.border}` }}>
              {task.subtasks.map((st, i) => (
                <p key={i} style={{ fontSize:12, color:C.textSub, margin:'3px 0' }}>· {st.title}</p>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button onClick={() => onDelete(task.id)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:16, cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0 }}>×</button>
      </div>
    </div>
  )
}

function AddTaskForm({ goals, dayIndex, weekStart, onAdd }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle]   = useState('')
  const [mins, setMins]     = useState(30)
  const [goalId, setGoalId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onAdd({ title: title.trim(), mins: Number(mins), goal_id: goalId || null, priority, day_index: dayIndex, week_start: weekStart, done: false, subtasks: [] })
      setTitle(''); setMins(30); setGoalId(''); setPriority('normal')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ width:'100%', background:'none', border:`1px dashed ${C.border}`, borderRadius:10, padding:'11px', color:C.textSub, fontSize:13, cursor:'pointer', textAlign:'center', transition:'border-color .15s, color .15s' }} onMouseEnter={e=>{e.target.style.borderColor=C.accent;e.target.style.color=C.accent}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.textSub}}>
        + Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ background:C.surface, border:`1px solid ${C.accent}40`, borderRadius:10, padding:'14px' }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task name..."
        style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, outline:'none', marginBottom:10, boxSizing:'border-box', fontFamily:'inherit' }}
      />
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <select value={goalId} onChange={e => setGoalId(e.target.value)} style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 10px', color: goalId ? C.text : C.textSub, fontSize:13, outline:'none', cursor:'pointer' }}>
          <option value="">No goal</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.short} — {g.label}</option>)}
        </select>
        <select value={mins} onChange={e => setMins(e.target.value)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 10px', color:C.text, fontSize:13, outline:'none', cursor:'pointer' }}>
          {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m}m</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 10px', color:C.text, fontSize:13, outline:'none', cursor:'pointer' }}>
          <option value="normal">Normal</option>
          <option value="high">⚡ High</option>
        </select>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button type="button" onClick={() => setOpen(false)} style={{ flex:1, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px', color:C.textSub, fontSize:13, cursor:'pointer' }}>Cancel</button>
        <button type="submit" disabled={!title.trim() || saving} style={{ flex:2, background:C.accent, border:'none', borderRadius:8, padding:'9px', color:'#0A0E1A', fontSize:13, fontWeight:800, cursor:'pointer', opacity: title.trim() && !saving ? 1 : 0.5 }}>{saving ? 'Adding…' : 'Add task'}</button>
      </div>
    </form>
  )
}

function GoalsPanel({ goals, tasks, onAddGoal, onClose }) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel]   = useState('')
  const [short, setShort]   = useState('')
  const [color, setColor]   = useState(GOAL_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!label.trim() || !short.trim()) return
    if (goals.length >= 3) { setError('Maximum 3 goals'); return }
    setSaving(true)
    try {
      await onAddGoal({ label: label.trim(), short: short.trim().toUpperCase().slice(0,4), color, position: goals.length })
      setLabel(''); setShort(''); setColor(GOAL_COLORS[goals.length + 1] || GOAL_COLORS[0])
      setAdding(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,14,26,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ width:'100%', maxWidth:440, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${C.border}` }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:C.text, margin:0 }}>Weekly Goals</h2>
            <p style={{ fontSize:12, color:C.textSub, margin:'3px 0 0' }}>Up to 3 anchors for your week</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.textSub, fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:24 }}>
          {error && <div style={{ background:C.errorSoft, border:`1px solid ${C.error}40`, borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, color:C.error }}>{error}</div>}
          {goals.map(g => {
            const goalTasks = tasks.filter(t => t.goal_id === g.id)
            const done = goalTasks.filter(t => t.done).length
            const pct = goalTasks.length > 0 ? Math.round((done / goalTasks.length) * 100) : 0
            return (
              <div key={g.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderLeft:`4px solid ${g.color}`, borderRadius:10, padding:'14px 16px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:g.color, textTransform:'uppercase', letterSpacing:'.1em' }}>{g.short}</span>
                    </div>
                    <p style={{ fontSize:14, color:C.text, margin:0, fontWeight:500 }}>{g.label}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:18, fontWeight:800, color:g.color, margin:0 }}>{pct}<span style={{ fontSize:11, color:C.textSub }}>%</span></p>
                    <p style={{ fontSize:11, color:C.textMuted, margin:0 }}>{done}/{goalTasks.length}</p>
                  </div>
                </div>
                {goalTasks.length > 0 && (
                  <div style={{ marginTop:10, background:C.border, borderRadius:4, height:4, overflow:'hidden' }}>
                    <div style={{ background:g.color, height:'100%', width:`${pct}%`, borderRadius:4, transition:'width .3s' }} />
                  </div>
                )}
              </div>
            )
          })}

          {goals.length < 3 && !adding && (
            <button onClick={() => setAdding(true)} style={{ width:'100%', background:'none', border:`1px dashed ${C.border}`, borderRadius:10, padding:12, color:C.textSub, fontSize:13, cursor:'pointer', textAlign:'center' }}>
              + Add goal
            </button>
          )}

          {adding && (
            <form onSubmit={handleAdd} style={{ background:C.bg, border:`1px solid ${C.accent}40`, borderRadius:10, padding:14 }}>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:C.textSub, textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Goal label</label>
                <input autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Launch new product" style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
              </div>
              <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:C.textSub, textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Short code</label>
                  <input value={short} onChange={e => setShort(e.target.value.toUpperCase().slice(0,4))} placeholder="PROD" style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', letterSpacing:'.08em' }} />
                </div>
                <div>
                  <label style={{ fontSize:11, color:C.textSub, textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Color</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:6 }}>
                    {GOAL_COLORS.map(c => (
                      <div key={c} onClick={() => setColor(c)} style={{ width:22, height:22, borderRadius:'50%', background:c, cursor:'pointer', border:`2px solid ${color===c ? C.text : 'transparent'}`, transition:'border .15s' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => setAdding(false)} style={{ flex:1, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:9, color:C.textSub, fontSize:13, cursor:'pointer' }}>Cancel</button>
                <button type="submit" disabled={!label.trim() || !short.trim() || saving} style={{ flex:2, background:C.accent, border:'none', borderRadius:8, padding:9, color:'#0A0E1A', fontSize:13, fontWeight:800, cursor:'pointer', opacity: label.trim() && short.trim() && !saving ? 1 : 0.5 }}>{saving ? 'Adding…' : 'Add goal'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ user, initialGoals, initialTasks, weekStart }) {
  const router  = useRouter()
  const supabase = createClient()

  const [goals, setGoals]   = useState(initialGoals)
  const [tasks, setTasks]   = useState(initialTasks)
  const [view, setView]     = useState('today')       // 'today' | 'week' | 'goals'
  const [activeDay, setActiveDay] = useState(getTodayIndex())
  const [expandedTasks, setExpandedTasks] = useState({})
  const [showGoals, setShowGoals] = useState(false)
  const [showPlanner, setShowPlanner] = useState(false)
  const [carryingForward, setCarryingForward] = useState(false)
  const [toast, setToast]   = useState(null)

  const goalMap = useMemo(() => Object.fromEntries(goals.map(g => [g.id, g])), [goals])

  function showToast(msg, type = 'info') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── API helpers ──────────────────────────────────
  async function addTask(taskData) {
    const res = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(taskData) })
    if (!res.ok) throw new Error('Failed to add task')
    const task = await res.json()
    setTasks(prev => [...prev, task])
    return task
  }

  async function toggleTask(id, done) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t))
    const res = await fetch('/api/tasks', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, done }) })
    if (!res.ok) setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t))
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    const res = await fetch('/api/tasks', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    if (!res.ok) showToast('Failed to delete task', 'error')
  }

  async function addGoal(goalData) {
    const res = await fetch('/api/goals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(goalData) })
    if (!res.ok) throw new Error('Failed to add goal')
    const goal = await res.json()
    setGoals(prev => [...prev, goal])
    return goal
  }

  async function addPlannerTasks(planTasks) {
    const results = await Promise.all(planTasks.map(t => addTask({ ...t, week_start: weekStart })))
    showToast(`${results.length} tasks added to your week!`, 'success')
  }

  async function handleCarryForward() {
    setCarryingForward(true)
    try {
      const res = await fetch('/api/carry-forward', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
      showToast('Incomplete tasks carried forward', 'success')
    } catch {
      showToast('Failed to carry forward', 'error')
    } finally {
      setCarryingForward(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleExpand(id) {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ─── Computed ───────────────────────────────────
  const todayTasks = tasks.filter(t => t.day_index === getTodayIndex())
  const displayTasks = view === 'today' ? todayTasks : view === 'week' ? tasks.filter(t => t.day_index === activeDay) : []

  const todayIdx = getTodayIndex()
  const aiEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AI_ENABLED === 'true'

  // ─── Layout ─────────────────────────────────────
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, color:C.text, fontFamily:"'Inter', -apple-system, sans-serif" }}>

      {/* ─── Sidebar ─── */}
      <aside style={{ width:240, minWidth:240, background:C.surface, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', padding:'20px 0' }}>
        <div style={{ padding:'0 20px', marginBottom:28 }}>
          <Logo />
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0 12px' }}>
          {[
            { id:'today', label:'Today', icon:'◎' },
            { id:'week',  label:'This Week', icon:'▦' },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px',
                borderRadius:10, border:'none', cursor:'pointer', marginBottom:2, textAlign:'left',
                background: view === id ? C.accentSoft : 'none',
                color: view === id ? C.accent : C.textSub,
                fontSize:14, fontWeight: view === id ? 600 : 400,
                transition:'background .15s, color .15s',
              }}
            >
              <span style={{ fontSize:16 }}>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Goals list */}
        <div style={{ padding:'0 12px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.08em' }}>Goals</span>
            <button onClick={() => setShowGoals(true)} style={{ background:'none', border:'none', color:C.textSub, fontSize:16, cursor:'pointer', padding:0, lineHeight:1 }}>+</button>
          </div>
          {goals.length === 0 && (
            <p style={{ fontSize:12, color:C.textMuted, padding:'0 10px' }}>Add up to 3 goals</p>
          )}
          {goals.map(g => {
            const goalTasks = tasks.filter(t => t.goal_id === g.id)
            const done = goalTasks.filter(t => t.done).length
            const pct = goalTasks.length > 0 ? Math.round((done / goalTasks.length) * 100) : 0
            return (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, marginBottom:2 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:g.color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:C.text, margin:0, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.short}</p>
                  <div style={{ background:C.border, borderRadius:2, height:2, marginTop:4, overflow:'hidden' }}>
                    <div style={{ background:g.color, height:'100%', width:`${pct}%`, borderRadius:2 }} />
                  </div>
                </div>
                <span style={{ fontSize:11, color:C.textMuted, flexShrink:0 }}>{pct}%</span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'0 12px', borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
          {aiEnabled && (
            <button onClick={() => setShowPlanner(true)} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color:C.textSub, fontSize:13, cursor:'pointer', marginBottom:8, textAlign:'left', transition:'border-color .15s, color .15s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSub}}>
              <span>✦</span> AI Plan Week
            </button>
          )}
          <button onClick={handleCarryForward} disabled={carryingForward} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color:C.textSub, fontSize:13, cursor:'pointer', marginBottom:8, textAlign:'left', opacity: carryingForward ? 0.5 : 1 }}>
            <span>↩</span> {carryingForward ? 'Carrying…' : 'Carry Forward'}
          </button>
          <button onClick={handleSignOut} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 12px', borderRadius:8, border:'none', background:'none', color:C.textMuted, fontSize:12, cursor:'pointer', textAlign:'left' }}>
            <span>→</span> Sign out
          </button>
          <p style={{ fontSize:11, color:C.textMuted, padding:'8px 10px 0', opacity:.6 }}>{user.email}</p>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main style={{ flex:1, overflowY:'auto', padding:32, minWidth:0 }}>

        {/* Today view */}
        {view === 'today' && (
          <div style={{ maxWidth:640, margin:'0 auto' }}>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontSize:26, fontWeight:800, color:C.text, margin:'0 0 4px', letterSpacing:'-.03em' }}>
                {DAY_NAMES[todayIdx]}
              </h1>
              <p style={{ fontSize:14, color:C.textSub, margin:0 }}>
                {new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>

            <ChannelDepth tasks={todayTasks} />

            {/* Goals summary */}
            {goals.length > 0 && (
              <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                {goals.map(g => {
                  const gt = tasks.filter(t => t.goal_id === g.id && t.day_index === todayIdx)
                  const done = gt.filter(t => t.done).length
                  return (
                    <div key={g.id} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderLeft:`3px solid ${g.color}`, borderRadius:10, padding:'10px 12px' }}>
                      <p style={{ fontSize:11, fontWeight:700, color:g.color, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'.08em' }}>{g.short}</p>
                      <p style={{ fontSize:13, color:C.textSub, margin:0 }}>{done}/{gt.length}</p>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:13, fontWeight:700, color:C.textSub, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 14px' }}>
                {todayTasks.length > 0 ? `${todayTasks.length} tasks` : 'No tasks yet'}
              </h2>
              {todayTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  goal={task.goal_id ? goalMap[task.goal_id] : null}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  expanded={!!expandedTasks[task.id]}
                  onToggleExpand={() => toggleExpand(task.id)}
                />
              ))}
            </div>
            <AddTaskForm goals={goals} dayIndex={todayIdx} weekStart={weekStart} onAdd={addTask} />
          </div>
        )}

        {/* Week view */}
        {view === 'week' && (
          <div style={{ maxWidth:860, margin:'0 auto' }}>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:26, fontWeight:800, color:C.text, margin:'0 0 4px', letterSpacing:'-.03em' }}>This Week</h1>
              <p style={{ fontSize:14, color:C.textSub, margin:0 }}>w/c {weekStart}</p>
            </div>

            {/* Week overview */}
            <div style={{ display:'flex', gap:8, marginBottom:24 }}>
              {DAY_SHORT.map((d, i) => {
                const dayTasks = tasks.filter(t => t.day_index === i)
                const done = dayTasks.filter(t => t.done).length
                const pct = dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0
                const isToday = i === todayIdx
                const isActive = i === activeDay
                return (
                  <div
                    key={i}
                    onClick={() => setActiveDay(i)}
                    style={{ flex:1, background: isActive ? C.accentSoft : C.surface, border:`1px solid ${isActive ? C.accent : C.border}`, borderRadius:10, padding:'12px 8px', textAlign:'center', cursor:'pointer', transition:'all .15s' }}
                  >
                    <p style={{ fontSize:11, fontWeight:700, color: isToday ? C.accent : C.textSub, textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 6px' }}>{d}{isToday ? ' •' : ''}</p>
                    <p style={{ fontSize:18, fontWeight:800, color: isActive ? C.accent : C.text, margin:'0 0 6px' }}>{dayTasks.length}</p>
                    <div style={{ background:C.border, borderRadius:3, height:3, overflow:'hidden' }}>
                      <div style={{ background: isActive ? C.accent : C.textSub, height:'100%', width:`${pct}%`, borderRadius:3 }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Active day tasks */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h2 style={{ fontSize:16, fontWeight:800, color:C.text, margin:0 }}>{DAY_NAMES[activeDay]}</h2>
              <span style={{ fontSize:13, color:C.textSub }}>
                {tasks.filter(t => t.day_index === activeDay && t.done).length}/{tasks.filter(t => t.day_index === activeDay).length} done
              </span>
            </div>

            {tasks.filter(t => t.day_index === activeDay).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                goal={task.goal_id ? goalMap[task.goal_id] : null}
                onToggle={toggleTask}
                onDelete={deleteTask}
                expanded={!!expandedTasks[task.id]}
                onToggleExpand={() => toggleExpand(task.id)}
              />
            ))}
            <AddTaskForm goals={goals} dayIndex={activeDay} weekStart={weekStart} onAdd={addTask} />
          </div>
        )}
      </main>

      {/* ─── Toast ─── */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background: toast.type === 'error' ? C.error : toast.type === 'success' ? C.success : C.accent, color: toast.type === 'error' ? '#fff' : '#0A0E1A', padding:'12px 18px', borderRadius:10, fontSize:13, fontWeight:600, zIndex:2000, boxShadow:'0 4px 20px rgba(0,0,0,.4)', animation:'slideIn .2s ease' }}>
          {toast.msg}
          <style>{`@keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
      )}

      {/* ─── Modals ─── */}
      {showGoals && <GoalsPanel goals={goals} tasks={tasks} onAddGoal={addGoal} onClose={() => setShowGoals(false)} />}
      {showPlanner && <WeeklyPlanner goals={goals} onConfirm={addPlannerTasks} onClose={() => setShowPlanner(false)} />}
    </div>
  )
}
