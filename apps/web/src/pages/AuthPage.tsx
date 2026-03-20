import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Tab = 'signin' | 'signup'

export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        navigate('/', { replace: true })
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSignupDone(true)
      }
    }

    setLoading(false)
  }

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }

  if (signupDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
        <h1 className="text-[20px] font-medium mb-3">Check your email</h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <button
          onClick={() => { setSignupDone(false); setTab('signin') }}
          className="mt-6 text-teal text-[14px] font-medium"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-16">
      <h1 className="text-[20px] font-medium mb-8">Peptide Tracker</h1>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border-primary)] mb-6">
        {(['signin', 'signup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null) }}
            className={`flex-1 pb-2.5 text-[14px] font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-teal text-teal -mb-px'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {t === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {error && (
          <p className="text-[13px] text-[var(--color-text-danger)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-11 mt-1 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-60"
        >
          {loading ? 'Loading…' : tab === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
        <span className="text-[12px] text-[var(--color-text-tertiary)]">or</span>
        <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
      </div>

      <button
        onClick={handleGoogle}
        className="h-11 flex items-center justify-center gap-2 border border-[var(--color-border-primary)] rounded-lg text-[14px] font-medium text-[var(--color-text-primary)]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </div>
  )
}
