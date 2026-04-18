'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

const C = {
  bg: '#0A0E1A', surface: '#131826', border: '#1E2840',
  accent: '#00C2FF', accentSoft: 'rgba(0,194,255,0.10)',
  text: '#EDF0F7', textSub: '#6B7898', textMuted: '#2E3D5C',
  error: '#FF6B6B', errorSoft: 'rgba(255,107,107,0.10)',
}

export default function LoginPage() {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else        { router.push('/dashboard'); router.refresh() }
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
        <svg width="26" height="26" viewBox="0 0 22 22" fill="none"><path d="M4 3 L11 19 L18 3" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 10 L14.5 10" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" opacity=".4"/></svg>
        <span style={{ fontSize:18, fontWeight:800, letterSpacing:'.12em', color:C.text }}>CHANNEL</span>
      </div>
      <div style={{ width:'100%', maxWidth:380, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:'32px 28px' }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:6, letterSpacing:'-.02em' }}>Welcome back</h1>
        <p style={{ fontSize:13, color:C.textSub, marginBottom:28 }}>The channel deepens.</p>
        {error && <div style={{ background:C.errorSoft, border:`1px solid ${C.error}40`, borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:13, color:C.error }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label style={{ fontSize:11, fontWeight:600, color:C.textSub, letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:7 }}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:9, padding:'11px 14px', color:C.text, fontSize:14, outline:'none', transition:'border-color .15s' }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:C.textSub, letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:7 }}>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:9, padding:'11px 14px', color:C.text, fontSize:14, outline:'none', transition:'border-color .15s' }} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <button type="submit" disabled={loading} style={{ marginTop:6, width:'100%', background:C.accent, border:'none', borderRadius:10, padding:'13px', color:'#0A0E1A', fontSize:14, fontWeight:800, letterSpacing:'.04em', opacity:loading?.7:1, transition:'opacity .15s' }}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p style={{ marginTop:22, textAlign:'center', fontSize:13, color:C.textSub }}>No account?{' '}<Link href="/signup" style={{ color:C.accent, textDecoration:'none', fontWeight:600 }}>Create one</Link></p>
      </div>
      <p style={{ marginTop:28, fontSize:11, color:C.textMuted, letterSpacing:'.06em', fontStyle:'italic' }}>Carve your channel.</p>
    </div>
  )
}
