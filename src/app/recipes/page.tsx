import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { RecipeList, type OwnRecipe, type SharedRecipe } from '@/components/RecipeList'

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Own recipes with share counts
  const { data: own } = await supabase
    .from('recipes')
    .select('*, recipe_shares(id)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Shared with me
  const { data: sharedRows } = await supabase
    .from('recipe_shares')
    .select('permission, recipes(*, profiles!recipes_user_id_fkey(first_name, last_name, avatar_url, id))')
    .eq('shared_with', user.id)

  const shared = (sharedRows ?? []).map(row => {
    const r = row.recipes as unknown as Record<string, unknown>
    const ownerProfile = r.profiles as Record<string, string | null> | null
    const ownerDisplayName = [ownerProfile?.first_name, ownerProfile?.last_name].filter(Boolean).join(' ') || null
    return {
      ...r,
      my_permission: row.permission,
      owner_display_name: ownerDisplayName,
      owner_avatar_url: ownerProfile?.avatar_url,
    }
  })

  return (
    <>
      <Navbar profile={profile} email={user.email} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-stone-800">Recipes</h1>
          <Link href="/recipes/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + New recipe
          </Link>
        </div>

        <RecipeList
          own={(own ?? []) as unknown as OwnRecipe[]}
          shared={shared as unknown as SharedRecipe[]}
        />
      </main>
    </>
  )
}
