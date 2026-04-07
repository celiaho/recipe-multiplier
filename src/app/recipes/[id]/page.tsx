import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { RecipeResults } from '@/components/RecipeResults'
import { DeleteRecipeButton } from '@/components/DeleteRecipeButton'
import { scaleIngredients, scaleInstructions } from '@/lib/recipeLogic'

type Params = { params: Promise<{ id: string }> }

export default async function RecipePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Fetch recipe (RLS allows owner + shared users)
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  const isOwner = recipe.user_id === user.id

  // Determine permission
  let permission: 'owner' | 'edit' | 'view' = 'view'
  if (isOwner) {
    permission = 'owner'
  } else {
    const { data: share } = await supabase
      .from('recipe_shares')
      .select('permission')
      .eq('recipe_id', id)
      .eq('shared_with', user.id)
      .single()
    if (share) permission = share.permission as 'edit' | 'view'
  }

  // Re-compute scaled lines for display (stored JSON used as fallback)
  const scaledLines = recipe.original_ingredients
    ? scaleIngredients(recipe.original_ingredients, recipe.original_servings, recipe.desired_servings)
    : []

  const scaledInstructions = recipe.instructions
    ? scaleInstructions(recipe.instructions, recipe.original_servings, recipe.desired_servings)
    : null

  // Cost map from stored scaled_ingredients
  const costMap: Record<number, string> = {}
  if (Array.isArray(recipe.scaled_ingredients)) {
    recipe.scaled_ingredients.forEach((item: { unit_cost: number | null }, i: number) => {
      if (item.unit_cost != null) costMap[i] = String(item.unit_cost)
    })
  }

  // Fetch share names for owner
  let sharedWith: string[] | undefined
  if (isOwner) {
    const { data: shareRows } = await supabase
      .from('recipe_shares')
      .select('profiles!recipe_shares_shared_with_fkey(first_name, last_name)')
      .eq('recipe_id', id)

    if (shareRows && shareRows.length > 0) {
      sharedWith = (shareRows as unknown as { profiles: { first_name: string | null; last_name: string | null } | null }[]).map(row => {
        const p = row.profiles
        return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unknown'
      })
    }
  }

  if (permission === 'edit') {
    // Shared editors get redirected to the dedicated edit page
    redirect(`/recipes/${id}/edit`)
  }

  return (
    <>
      <Navbar profile={profile} email={user.email} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href="/recipes" className="text-stone-400 hover:text-stone-600 text-sm">← My recipes</Link>
        </div>

        <RecipeResults
          recipeName={recipe.name}
          originalServings={recipe.original_servings}
          desiredServings={recipe.desired_servings}
          scaledLines={scaledLines}
          scaledInstructions={scaledInstructions}
          costMap={costMap}
          isOwner={isOwner}
          recipeInfo={recipe.recipe_info}
          sourceName={recipe.source_name}
          author={recipe.author}
          sourceUrl={recipe.source_url}
          chefNotes={recipe.chef_notes}
          showChefNotes={isOwner}
          displayMode={(recipe.display_pref ?? profile?.measurement_pref ?? 'volume') as 'both' | 'weight' | 'volume'}
          recipeId={recipe.id}
          sharedWith={sharedWith}
          {...(isOwner && {
            editHref: `/recipes/${id}/edit`,
            shareHref: `/recipes/${id}/share`,
            deleteButton: <DeleteRecipeButton recipeId={id} />,
          })}
        />
      </main>
      <Footer />
    </>
  )
}
