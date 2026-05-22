import React, { useState } from 'react'
import { supabase } from '../supabase/supabase'
import { FcGoogle } from 'react-icons/fc'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) setError(error.message)
  }
  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-letter">B</div>
          <div className="auth-logo-name">B-BOOK</div>
          <div className="auth-tagline">Your breaking journal & arsenal</div>
        </div>
        <div className="auth-card">
          <div className="auth-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</div>
          {error && <div className="auth-error">{error}</div>}
          {message && <div style={{ color: '#10B981', fontSize: 13, marginBottom: 12, background: '#001A0F', padding: '8px 12px', borderRadius: 6, border: '1px solid #003020' }}>{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBlock: 12,
                gap: 12
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#222' }} />
              <span style={{ color: '#777', fontSize: 12 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#222' }} />
            </div>
            <button
              type="button"
              className="btn"
              onClick={signInWithGoogle}
              style={{
                width: '100%',
                justifyContent: 'center',
                marginBottom: 18,
                background: '#fff',
                color: '#111',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 600
              }}
            >
              <FcGoogle size={22} />
              Continue with Google
            </button>

          </form>
          <div className="auth-toggle">
            {mode === 'login' ? (
              <>No account? <span onClick={() => { setMode('signup'); setError(''); }}>Sign up</span></>
            ) : (
              <>Have an account? <span onClick={() => { setMode('login'); setError(''); }}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}