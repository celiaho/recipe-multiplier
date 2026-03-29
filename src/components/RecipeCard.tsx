import Link from 'next/link'
import { Avatar } from './Avatar'
import type { Permission } from '@/types/database'

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
}

export function RecipeCard({
  id, name, sourceName, author, originalServings, desiredServings, createdAt,
  ownerDisplayName, ownerAvatarUrl, ownerEmail,
  myPermission = 'owner', isShared = false, shareCount = 0,
}: RecipeCardProps) {
  const multiplier = (desiredServings / originalServings).toFixed(2).replace(/\.?0+$/, '')
  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
            <div className="flex items-center gap-1 text-xs text-stone-400">
              {shareCount > 0 && (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Shared with {shareCount}</span>
                </>
              )}
            </div>
          )}
          <span className="text-xs text-stone-400">{date}</span>
        </div>
      </div>
    </Link>
  )
}
