'use client'
import { useState } from 'react'

const C = {
  bg: '#0A0E1A', surface: '#131826', surface2: '#0F1420', border: '#1E2840',
  accent: '#00C2FF', accentSoft: 'rgba(0,194,255,0.10)',
  text: '#EDF0F7', textSub: '#6B7898', textMuted: '#2E3D5C',
  error: '#FF6B6B', errorSoft: 'rgba(255,107,107,0.10)',
  high: '#FFB347', highSoft: 'rgba(255,179,71,0.12)',
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function WeeklyPlanner({ goals = [], onConfirm, onClose }) {
  const [step, setStep] = useState('input') // 'input' | 'loading' | 'preview'
  const [rawInput, setRawInput] = useState('')
  const [plan, setPlan] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const goalMap = Object.fromEntries(goals.map(g => [g.id, g]))

  async function handleGenerate() {
    if (!rawInput.trim()) return
    setError('')
    setStep('loading')
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput, goals }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPlan(data.tasks || [])
      setStep('preview')
    } catch (err) {
      setError(err.message)
      setStep('input')
    }
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      await onConfirm(plan)
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  function removeTask(idx) {
    setPlan(p => p.filter((_, i) => i !== idx))
  }

  function togglePriority(idx) {
    setPlan(p => p.map((t, i) => i === idx ? { ...t, priority: t.priority === 'high' ? 'normal' : 'high' } : t))
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,14,26,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ width:'100%', maxWidth:560, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:C.text, margin:0, letterSpacing:'-.02em' }}>AI Weekly Planner</h2>
            <p style={{ fontSize:12, color:C.textSub, margin:'3px 0 0' }}>Brain dump → structured week</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.textSub, fontSize:20, lineHeight:1, padding:4, cursor:'pointer' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          {step === 'input' && (
            <>
              <p style={{ fontSize:13, color:C.textSub, marginBottom:16, lineHeight:1.6 }}>
                Write everything you want to get done this week — free-form, messy, whatever. The AI will structure it into a realistic plan.
              </p>
              {error && (
                <div style={{ background:C.errorSoft, border:`1px solid ${C.error}40`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.error }}>{error}</div>
              )}
              <textarea
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder="e.g. Finish the landing page copy, review investor deck, 3 client calls (Mon/Wed/Fri), prepare Q2 report, start reading Thinking Fast and Slow..."
                autoFocus
                rows={8}
                style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px', color:C.text, fontSize:14, lineHeight:1.6, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              {goals.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <p style={{ fontSize:11, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Will map to your goals</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {goals.map(g => (
                      <div key={g.id} style={{ display:'flex', alignItems:'center', gap:6, background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'4px 10px' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:g.color }} />
                        <span style={{ fontSize:12, color:C.textSub }}>{g.short}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'loading' && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:'50%', margin:'0 auto 20px', animation:'spin 0.8s linear infinite' }} />
              <p style={{ color:C.textSub, fontSize:14 }}>Building your week…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {step === 'preview' && (
            <>
              {error && (
                <div style={{ background:C.errorSoft, border:`1px solid ${C.error}40`, borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:C.error }}>{error}</div>
              )}
              <p style={{ fontSize:13, color:C.textSub, marginBottom:16 }}>
                {plan.length} tasks generated — review and confirm to add them to your week.
              </p>
              {/* Group by day */}
              {[0,1,2,3,4].map(dayIdx => {
                const dayTasks = plan.filter(t => t.day_index === dayIdx)
                if (!dayTasks.length) return null
                const totalMins = dayTasks.reduce((s, t) => s + t.mins, 0)
                return (
                  <div key={dayIdx} style={{ marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:'uppercase', letterSpacing:'.1em' }}>{DAY_NAMES[dayIdx]}</span>
                      <span style={{ fontSize:11, color:C.textMuted }}>{totalMins >= 60 ? `${Math.floor(totalMins/60)}h${totalMins%60 ? ` ${totalMins%60}m`:''}` : `${totalMins}m`}</span>
                    </div>
                    {dayTasks.map((task, globalIdx) => {
                      const idx = plan.indexOf(task)
                      const goal = task.goal_id ? goalMap[task.goal_id] : null
                      return (
                        <div key={idx} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:10 }}>
                          {goal && <div style={{ width:3, height:'100%', minHeight:20, background:goal.color, borderRadius:2, flexShrink:0, marginTop:2 }} />}
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, color:C.text, margin:0, fontWeight:500 }}>{task.title}</p>
                            {task.subtasks?.length > 0 && (
                              <div style={{ marginTop:4 }}>
                                {task.subtasks.map((st, si) => (
                                  <p key={si} style={{ fontSize:11, color:C.textMuted, margin:'2px 0', paddingLeft:8 }}>· {st.title}</p>
                                ))}
                              </div>
                            )}
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                              <span style={{ fontSize:11, color:C.textMuted }}>{task.mins}m</span>
                              {goal && <span style={{ fontSize:11, color:goal.color, opacity:.8 }}>{goal.short}</span>}
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                            <button
                              onClick={() => togglePriority(idx)}
                              title="Toggle priority"
                              style={{ background:'none', border:'none', padding:4, cursor:'pointer', opacity: task.priority === 'high' ? 1 : 0.3, fontSize:14 }}
                            >⚡</button>
                            <button
                              onClick={() => removeTask(idx)}
                              title="Remove task"
                              style={{ background:'none', border:'none', color:C.textSub, fontSize:16, padding:4, cursor:'pointer', lineHeight:1 }}
                            >×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.border}`, display:'flex', gap:10, flexShrink:0 }}>
          {step === 'input' && (
            <>
              <button onClick={onClose} style={{ flex:1, background:'none', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px', color:C.textSub, fontSize:14, cursor:'pointer' }}>Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={!rawInput.trim()}
                style={{ flex:2, background:C.accent, border:'none', borderRadius:10, padding:'12px', color:'#0A0E1A', fontSize:14, fontWeight:800, cursor: rawInput.trim() ? 'pointer' : 'not-allowed', opacity: rawInput.trim() ? 1 : 0.5 }}
              >Generate Plan</button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('input')} style={{ flex:1, background:'none', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px', color:C.textSub, fontSize:14, cursor:'pointer' }}>← Redo</button>
              <button
                onClick={handleConfirm}
                disabled={saving || plan.length === 0}
                style={{ flex:2, background:C.accent, border:'none', borderRadius:10, padding:'12px', color:'#0A0E1A', fontSize:14, fontWeight:800, cursor:'pointer', opacity: saving ? 0.7 : 1 }}
              >{saving ? 'Adding tasks…' : `Add ${plan.length} tasks to week`}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
