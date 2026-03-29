'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/recipes')
      router.refresh()
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500">Delete this recipe?</span>
        <button onClick={handleDelete} disabled={deleting}
          className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirming(false)}
          className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-sm border border-stone-300 hover:border-red-300 text-stone-500 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors">
      Delete
    </button>
  )
}
