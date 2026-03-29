'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw || pw.length < 8) return { score: 0, label: '' }
  let score = 1
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const capped = Math.min(score, 4) as 1 | 2 | 3 | 4
  const labels: Record<number, string> = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' }
  return { score: capped, label: labels[capped] }
}

const strengthColor: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-blue-400',
  4: 'bg-emerald-500',
}
const strengthTextColor: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-amber-500',
  3: 'text-blue-500',
  4: 'text-emerald-600',
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const strength = getPasswordStrength(password)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName || null,
        company_name: companyName || null,
      }).eq('id', data.user.id)
    }

    setConfirm(true)
    setLoading(false)
  }

  if (confirm) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h1 className="text-xl font-bold text-stone-800">Check your email</h1>
          <p className="text-stone-500 text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to log in.
          </p>
          <Link href="/login" className="text-emerald-600 hover:underline text-sm font-medium">← Back to log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-emerald-700 font-bold text-xl mb-8">
          🍴 Recipe Multiplier
        </Link>
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-6">Create account</h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">First name</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Marco"
                  className="w-full border border-stone-300 rounded-lg px-3 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">Last name</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className="w-full border border-stone-300 rounded-lg px-3 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Company <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="Bella Catering Co."
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-stone-300 rounded-lg px-3 py-3 pr-16 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strength.score >= i ? strengthColor[strength.score] : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`text-xs ${strengthTextColor[strength.score]}`}>{strength.label}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full border border-stone-300 rounded-lg px-3 py-3 pr-16 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-stone-600 mt-4">
          Already have an account? <Link href="/login" className="text-emerald-700 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}
