import { useState } from 'react'
import { useAuth, API } from '../App'

export default function Login() {
  const { login } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login' ? { email: form.email, password: form.password } : form
      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      login(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-icon"><div className="play-tri"></div></div>
          ReelForge
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: 18, fontWeight: 500 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </h2>
        {mode === 'signup' && (
          <input className="input" placeholder="Full name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        )}
        <input className="input" placeholder="Email address" type="email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Password" type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        {error && <div className="error-msg">{error}</div>}
        <button className="btn-primary" onClick={submit} disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}
