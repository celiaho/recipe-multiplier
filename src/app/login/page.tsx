'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (window.location.search.includes('confirmed=true')) setConfirmed(true)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/recipes')
      router.refresh()
    }
  }

  async function handleReset() {
    if (!email) { setError('Enter your email address first.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    })
    if (error) setError(error.message)
    else setResetSent(true)
  }

  const inputClass = 'w-full border border-stone-300 rounded-lg px-3 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-emerald-700 font-bold text-xl mb-8">
          🍴 Recipe Multiplier
        </Link>
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-6">Log in</h1>

          {confirmed && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              Your email is confirmed. You can now log in.
            </p>
          )}
          {resetSent ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              Password reset link sent to {email}. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12Q12 19 22 12"/><line x1="8" y1="15" x2="6.5" y2="18"/><line x1="12" y1="16" x2="12" y2="19"/><line x1="16" y1="15" x2="17.5" y2="18"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in…' : 'Log in'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full text-sm text-stone-500 hover:text-stone-700 text-center py-1"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-stone-600 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-emerald-700 hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
