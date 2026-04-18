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
  success: '#00E5A0', successSoft: 'rgba(0,229,160,0.10)',
}

const inputStyle = (focused, border) => ({
  width:'100%', background:'#0A0E1A', border:`1px solid ${focused ? C.accent : border || C.border}`,
  borderRadius:9, padding:'11px 14px', color:C.text, fontSize:14, outline:'none', transition:'border-color .15s',
})

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ email:'', password:'', confirm:'' })
  const [focus, setFocus]     = useState({})
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else        { setDone(true) }
  }

  if (done) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:380, background:C.surface,
        border:`1px solid ${C.border}`, borderRadius:16, padding:'32px 28px', textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:16 }}>✉️</div>
        <h2 style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:10 }}>Check your email</h2>
        <p style={{ fontSize:13, color:C.textSub, lineHeight:1.6 }}>
          We sent a confirmation link to <strong style={{ color:C.text }}>{form.email}</strong>.
          Click it to activate your account and start carving.
        </p>
        <Link href="/login" style={{ display:'block', marginTop:24, color:C.accent,
          fontSize:13, fontWeight:600, textDecoration:'none' }}>
          Back to sign in →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:24 }}>

      {/* Wordmark */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
        <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
          <path d="M4 3 L11 19 L18 3" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.5 10 L14.5 10" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" opacity=".4"/>
        </svg>
        <span style={{ fontSize:18, fontWeight:800, letterSpacing:'.12em', color:C.text }}>CHANNEL</span>
      </div>

      <div style={{ width:'100%', maxWidth:380, background:C.surface,
        border:`1px solid ${C.border}`, borderRadius:16, padding:'32px 28px' }}>

        <h1 style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:6, letterSpacing:'-.02em' }}>
          Start carving
        </h1>
        <p style={{ fontSize:13, color:C.textSub, marginBottom:28 }}>
          New channels begin with a single decision.
        </p>

        {error && (
          <div style={{ background:C.errorSoft, border:`1px solid ${C.error}40`,
            borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:13, color:C.error }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { key:'email',    label:'Email',            type:'email',    ph:'you@example.com' },
            { key:'password', label:'Password',         type:'password', ph:'At least 8 characters' },
            { key:'confirm',  label:'Confirm Password', type:'password', ph:'Repeat your password' },
          ].map(({ key, label, type, ph }) => (
            <div key={key}>
              <label style={{ fontSize:11, fontWeight:600, color:C.textSub,
                letterSpacing:'.06em', textTransform:'uppercase', display:'block', marginBottom:7 }}>
                {label}
              </label>
              <input type={type} value={form[key]} onChange={set(key)} required placeholder={ph}
                style={inputStyle(focus[key])}
                onFocus={() => setFocus(p => ({...p,[key]:true}))}
                onBlur={()  => setFocus(p => ({...p,[key]:false}))}
              />
            </div>
          ))}

          <button type="submit" disabled={loading}
            style={{ marginTop:6, width:'100%', background:C.accent, border:'none',
              borderRadius:10, padding:'13px', color:'#0A0E1A', fontSize:14,
              fontWeight:800, letterSpacing:'.04em', opacity:loading?.7:1 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop:22, textAlign:'center', fontSize:13, color:C.textSub }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color:C.accent, textDecoration:'none', fontWeight:600 }}>
            Sign in
          </Link>
        </p>
      </div>

      <p style={{ marginTop:28, fontSize:11, color:C.textMuted, letterSpacing:'.06em', fontStyle:'italic' }}>
        Carve your channel.
      </p>
    </div>
  )
}
