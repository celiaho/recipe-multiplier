'use client'

import { useState, useEffect } from 'react'
import { Avatar } from './Avatar'
import type { Permission, ShareWithProfile } from '@/types/database'

interface ShareManagerProps {
  recipeId: string
  recipeName: string
}

export function ShareManager({ recipeId, recipeName }: ShareManagerProps) {
  const [shares, setShares] = useState<ShareWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<Permission>('view')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null)

  async function loadShares() {
    const res = await fetch(`/api/recipes/${recipeId}/shares`)
    if (res.ok) setShares(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadShares() }, [recipeId])

  async function addShare(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/recipes/${recipeId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), permission }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error)
    } else {
      setEmail('')
      setSuccess(`Shared with ${email.trim()}`)
      await loadShares()
    }
    setAdding(false)
  }

  async function updatePermission(shareId: string, newPerm: Permission) {
    const res = await fetch(`/api/recipes/${recipeId}/shares`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_id: shareId, permission: newPerm }),
    })
    if (res.ok) await loadShares()
  }

  async function removeShare(shareId: string) {
    const res = await fetch(`/api/recipes/${recipeId}/shares`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_id: shareId }),
    })
    if (res.ok) setShares(s => s.filter(x => x.id !== shareId))
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
      <h2 className="font-semibold text-stone-800">
        Share &ldquo;{recipeName}&rdquo;
      </h2>

      {/* Add person form */}
      <form onSubmit={addShare} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={permission}
          onChange={e => setPermission(e.target.value as Permission)}
          className="font-sans border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="view">Can view</option>
          <option value="edit">Can edit</option>
        </select>
        <button
          type="submit"
          disabled={adding}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {adding ? 'Sending…' : 'Share'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      {/* People with access */}
      <div>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
          People with access
        </h3>

        {loading ? (
          <p className="text-sm text-stone-400">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="text-sm text-stone-400">Not shared with anyone yet.</p>
        ) : (
          <ul className="space-y-2">
            {shares.map(share => (
              <li key={share.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    avatarUrl={share.profile?.avatar_url}
                    displayName={[share.profile?.first_name, share.profile?.last_name].filter(Boolean).join(' ') || undefined}
                    email={share.shared_email}
                    size="sm"
                  />
                  <span className="text-sm text-stone-700 truncate">{share.shared_email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={share.permission}
                    onChange={e => updatePermission(share.id, e.target.value as Permission)}
                    className="font-sans text-xs border border-stone-200 rounded-md px-2 py-1 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                  </select>
                  {confirmingRemove === share.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-stone-500">Remove?</span>
                      <button
                        onClick={() => { removeShare(share.id); setConfirmingRemove(null) }}
                        className="text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Yes
                      </button>
                      <span className="text-stone-400">/</span>
                      <button
                        onClick={() => setConfirmingRemove(null)}
                        className="text-stone-500 hover:text-stone-700 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingRemove(share.id)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                      title="Remove access"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
