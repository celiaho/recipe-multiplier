'use client'

import { useState, useRef } from 'react'
import { Avatar } from './Avatar'
import type { Profile } from '@/types/database'

interface AvatarUploadProps {
  profile: Profile
  email: string
  onUpdate: (newAvatarUrl: string) => void
}

export function AvatarUpload({ profile, email, onUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch('/api/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onUpdate(json.avatar_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar avatarUrl={profile.avatar_url} displayName={[profile.first_name, profile.last_name].filter(Boolean).join(' ') || undefined} email={email} size="lg" />
      <div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-emerald-700 hover:text-emerald-600 font-medium disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Change photo'}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <p className="text-xs text-stone-400 mt-0.5">JPG, PNG, GIF · max 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
