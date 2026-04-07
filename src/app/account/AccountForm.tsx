'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/AvatarUpload'
import type { Profile } from '@/types/database'

interface AccountFormProps {
  profile: Profile
  email: string
}

type DisplayMode = 'both' | 'weight' | 'volume'

export function AccountForm({ profile: initialProfile, email }: AccountFormProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState(initialProfile)
  const [firstName, setFirstName] = useState(initialProfile.first_name ?? '')
  const [lastName, setLastName] = useState(initialProfile.last_name ?? '')
  const [companyName, setCompanyName] = useState(initialProfile.company_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [measurementPref, setMeasurementPref] = useState<DisplayMode>(initialProfile.measurement_pref ?? 'both')
  const [savingPref, setSavingPref] = useState(false)
  const [savedPref, setSavedPref] = useState(false)

  // Change email
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Change password
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName || null,
        company_name: companyName || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    if (error) setError(error.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  async function handleSaveMeasurementPref(mode: DisplayMode) {
    setMeasurementPref(mode)
    setSavingPref(true)
    setSavedPref(false)
    await supabase
      .from('profiles')
      .update({ measurement_pref: mode, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    setSavingPref(false)
    setSavedPref(true)
    setTimeout(() => setSavedPref(false), 2000)
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setSavingEmail(true)
    setEmailError(null)
    setEmailSent(false)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) setEmailError(error.message)
    else { setEmailSent(true); setNewEmail('') }
    setSavingEmail(false)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match.'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    setSavingPassword(true)
    setPasswordError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPasswordError(error.message)
    else {
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    }
    setSavingPassword(false)
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <section className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Profile photo</h2>
        <AvatarUpload
          profile={{ ...profile, first_name: firstName, last_name: lastName }}
          email={email}
          onUpdate={url => setProfile(p => ({ ...p, avatar_url: url }))}
        />
      </section>

      {/* Name + email */}
      <section className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Profile info</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Marco"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Rossi"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Company <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Bella Catering Co."
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 text-stone-400 cursor-not-allowed"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Measurement style */}
      <section className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Measurement style</h2>
        <p className="text-xs text-stone-400 mb-4">
          Sets your default for all recipes. Individual recipes can override this preference.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-stone-100 rounded-lg p-0.5 text-sm font-medium">
            {(['weight', 'volume', 'both'] as DisplayMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => handleSaveMeasurementPref(mode)}
                disabled={savingPref}
                className={`px-4 py-1.5 rounded-md transition-colors capitalize disabled:opacity-50 ${
                  measurementPref === mode
                    ? 'bg-white shadow text-stone-800'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {mode === 'weight' ? '⚖ Weight' : mode === 'volume' ? '📏 Volume' : '⚖📏 Both'}
              </button>
            ))}
          </div>
          {savedPref && <span className="text-xs text-emerald-600">✓ Saved</span>}
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          <strong className="text-stone-500">Both</strong>—weight and volume side-by-side (recommended for professional use).{' '}
          <strong className="text-stone-500">Weight</strong>—grams/kg only.{' '}
          <strong className="text-stone-500">Volume</strong>—original volume quantities only.
        </p>
      </section>
      {/* Change email */}
      <section className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Change email</h2>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">New email address</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder={email}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          {emailSent && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              Confirmation sent. Check your new inbox to confirm the change.
            </p>
          )}
          <button type="submit" disabled={savingEmail || !newEmail || newEmail === email}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {savingEmail ? 'Sending…' : 'Send confirmation'}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Change password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">New password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="button" onClick={() => setShowNewPassword(s => !s)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {showNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12Q12 19 22 12"/><line x1="8" y1="15" x2="6.5" y2="18"/><line x1="12" y1="16" x2="12" y2="19"/><line x1="16" y1="15" x2="17.5" y2="18"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="button" onClick={() => setShowConfirmNewPassword(s => !s)}
                aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {showConfirmNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12Q12 19 22 12"/><line x1="8" y1="15" x2="6.5" y2="18"/><line x1="12" y1="16" x2="12" y2="19"/><line x1="16" y1="15" x2="17.5" y2="18"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {confirmNewPassword && newPassword !== confirmNewPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>
          {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
          <button type="submit" disabled={savingPassword || newPassword.length < 8 || newPassword !== confirmNewPassword}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {savingPassword ? 'Saving…' : passwordSaved ? '✓ Password updated' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
