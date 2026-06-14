import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('mode') === 'register' ? 'register' : 'login'
  )
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [formError, setFormError] = useState('')
  const { login, register, isLoading, error, clearError, token } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (token) navigate('/dashboard') }, [token, navigate])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    clearError()

    if (mode === 'register') {
      if (form.password !== form.confirm) { setFormError('Passwords do not match'); return }
      if (form.password.length < 8) { setFormError('Password must be 8+ characters'); return }
      await register(form.username, form.email, form.password)
    } else {
      await login(form.email, form.password)
    }
  }

  const toggle = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    clearError(); setFormError('')
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>← Back to Home</Link>

      <div className={styles.card}>
        <div className={styles.logoMark}>🏔</div>
        <h1 className={`${styles.title} font-title`}>PEAKRUSH</h1>
        <p className={styles.subtitle}>
          {mode === 'login' ? 'Welcome back, rider' : 'Join the mountain'}
        </p>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => toggle()}>
            Sign In
          </button>
          <button className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => toggle()}>
            Register
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label>Username</label>
              <input placeholder="shredmaster99" value={form.username} onChange={set('username')} required minLength={3} maxLength={50} />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>
          {mode === 'register' && (
            <div className={styles.field}>
              <label>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            </div>
          )}

          {(error || formError) && (
            <div className={styles.error}>{formError || error}</div>
          )}

          <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            {isLoading ? <span className="animate-spin">⟳</span> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already a rider? '}
          <button className={styles.switchBtn} onClick={toggle}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
