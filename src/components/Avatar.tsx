'use client'

interface AvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-16 h-16 text-xl' }

export function Avatar({ avatarUrl, displayName, email, size = 'md' }: AvatarProps) {
  const initials = (displayName ?? email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('')

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={displayName ?? email ?? 'User'}
      className={`${sizes[size]} rounded-full object-cover ring-1 ring-stone-200 shrink-0`}
    />
  ) : (
    <div
      className={`${sizes[size]} rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center shrink-0`}
      title={displayName ?? email}
    >
      {initials}
    </div>
  )
}
