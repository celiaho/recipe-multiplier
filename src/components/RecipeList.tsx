'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RecipeCard } from './RecipeCard'

export interface OwnRecipe {
  id: string
  name: string
  source_name?: string | null
  author?: string | null
  original_servings: number
  desired_servings: number
  created_at: string
  recipe_shares?: { id: string; shared_with: string; profiles: { first_name: string | null; last_name: string | null } | null }[]
  recipe_info?: string | null
  original_ingredients?: string | null
  chef_notes?: string | null
}

export interface SharedRecipe {
  id: string
  name: string
  source_name?: string | null
  author?: string | null
  original_servings: number
  desired_servings: number
  created_at: string
  my_permission: 'view' | 'edit'
  owner_display_name: string | null
  owner_avatar_url: string | null
  recipe_info?: string | null
  original_ingredients?: string | null
}

interface RecipeListProps {
  own: OwnRecipe[]
  shared: SharedRecipe[]
}

export function RecipeList({ own, shared }: RecipeListProps) {
  const [search, setSearch] = useState('')

  function matches(r: { name: string; source_name?: string | null; author?: string | null; recipe_info?: string | null; original_ingredients?: string | null; chef_notes?: string | null }) {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      (r.source_name?.toLowerCase().includes(q) ?? false) ||
      (r.author?.toLowerCase().includes(q) ?? false) ||
      (r.recipe_info?.toLowerCase().includes(q) ?? false) ||
      (r.original_ingredients?.toLowerCase().includes(q) ?? false) ||
      (r.chef_notes?.toLowerCase().includes(q) ?? false)
    )
  }

  const filteredOwn = own.filter(matches)
  const filteredShared = shared.filter(matches)

  return (
    <div className="space-y-8">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search by name, ingredients, source…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">My recipes</h2>
        {filteredOwn.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-stone-300 rounded-xl">
            {search ? (
              <p className="text-stone-400">No recipes match your search.</p>
            ) : (
              <>
                <p className="text-stone-400 mb-3">No recipes yet.</p>
                <Link href="/recipes/new" className="text-emerald-600 hover:underline text-sm font-medium">
                  Scale your first recipe →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOwn.map(r => (
              <RecipeCard
                key={r.id}
                id={r.id}
                name={r.name}
                sourceName={r.source_name}
                author={r.author}
                originalServings={Number(r.original_servings)}
                desiredServings={Number(r.desired_servings)}
                createdAt={r.created_at}
                shareCount={Array.isArray(r.recipe_shares) ? r.recipe_shares.length : 0}
                shareUsers={(r.recipe_shares ?? []).map(s => s.profiles ?? { first_name: null, last_name: null })}
              />
            ))}
          </div>
        )}
      </section>

      {shared.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Shared with me</h2>
          {filteredShared.length === 0 ? (
            <p className="text-stone-400 text-sm">No shared recipes match your search.</p>
          ) : (
            <div className="grid gap-3">
              {filteredShared.map(r => (
                <RecipeCard
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  sourceName={r.source_name}
                  author={r.author}
                  originalServings={Number(r.original_servings)}
                  desiredServings={Number(r.desired_servings)}
                  createdAt={r.created_at}
                  myPermission={r.my_permission}
                  ownerDisplayName={r.owner_display_name}
                  ownerAvatarUrl={r.owner_avatar_url}
                  isShared
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
