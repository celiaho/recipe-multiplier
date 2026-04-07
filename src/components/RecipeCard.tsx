import Link from 'next/link'
import { Avatar } from './Avatar'
import type { Permission } from '@/types/database'

function formatCardSharedWith(users: { first_name: string | null; last_name: string | null }[], count: number): string {
  const names = users.map(u => [u.first_name, u.last_name].filter(Boolean).join(' ')).filter(Boolean)
  if (names.length === 0) return `Shared with ${count}`
  if (names.length === 1) return `Shared with ${names[0]}`
  if (names.length === 2) return `Shared with 2: ${names[0]} and ${names[1]}`
  return `Shared with ${count}: ${names[0]}, ${names[1]}, ${names[2] ?? ''}${count > 3 ? ' and others' : ''}`
}

interface RecipeCardProps {
  id: string
  name: string
  sourceName?: string | null
  author?: string | null
  originalServings: number
  desiredServings: number
  createdAt: string
  ownerDisplayName?: string | null
  ownerAvatarUrl?: string | null
  ownerEmail?: string
  myPermission?: Permission | 'owner'
  isShared?: boolean
  shareCount?: number
  shareUsers?: { first_name: string | null; last_name: string | null }[]
}

export function RecipeCard({
  id, name, sourceName, author, originalServings, desiredServings, createdAt,
  ownerDisplayName, ownerAvatarUrl, ownerEmail,
  myPermission = 'owner', isShared = false, shareCount = 0, shareUsers = [],
}: RecipeCardProps) {
  const multiplier = (desiredServings / originalServings).toFixed(2).replace(/\.?0+$/, '')
  const date = 'Saved ' + new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Link href={`/recipes/${id}`} className="block group">
      <div className="bg-white border border-stone-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors leading-tight">
            {name}
          </h3>
          {(author || sourceName) && (
            <p className="text-xs text-stone-400 mt-0.5 truncate">
              {[author, sourceName].filter(Boolean).join(' · ')}
            </p>
          )}
          {myPermission !== 'owner' && (
            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full shrink-0">
              {myPermission === 'edit' ? 'Can edit' : 'View only'}
            </span>
          )}
        </div>

        <p className="text-sm text-stone-500 mt-1">
          {originalServings} → {desiredServings} servings
          {originalServings !== desiredServings && (
            <span className="text-stone-400"> (×{multiplier})</span>
          )}
        </p>

        <div className="flex items-center justify-between mt-3">
          {isShared && ownerEmail ? (
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Avatar avatarUrl={ownerAvatarUrl} displayName={ownerDisplayName} email={ownerEmail} size="sm" />
              <span>{ownerDisplayName ?? ownerEmail.split('@')[0]}</span>
            </div>
          ) : (
            shareCount > 0 ? (
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <Link
                  href={`/recipes/${id}/share`}
                  onClick={e => e.stopPropagation()}
                  className="hover:text-stone-600 transition-colors shrink-0"
                  aria-label="Manage sharing"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <span>{formatCardSharedWith(shareUsers, shareCount)}</span>
              </div>
            ) : (
              <div />
            )
          )}
          <span className="text-xs text-stone-400">{date}</span>
        </div>
      </div>
    </Link>
  )
}
