import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { RecipeResults } from '@/components/RecipeResults'
import { RecipeForm } from '@/components/RecipeForm'
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

  if (permission === 'edit') {
    // Edit-access users get the full form pre-populated
    return (
      <>
        <Navbar profile={profile} email={user.email} />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/recipes" className="text-stone-400 hover:text-stone-600 text-sm">← My recipes</Link>
          </div>
          <RecipeForm
            initialData={{
              id: recipe.id,
              name: recipe.name,
              sourceName: recipe.source_name ?? '',
              author: recipe.author ?? '',
              sourceUrl: recipe.source_url ?? '',
              instructions: recipe.instructions ?? '',
              chefNotes: '',  // Chef notes never shown to non-owners
              originalIngredients: recipe.original_ingredients,
              originalServings: recipe.original_servings,
              desiredServings: recipe.desired_servings,
            }}
            isOwner={false}
          />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar profile={profile} email={user.email} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link href="/recipes" className="text-stone-400 hover:text-stone-600 text-sm">← My recipes</Link>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Link href={`/recipes/${id}/share`}
                className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
                👥 Share
              </Link>
              <DeleteRecipeButton recipeId={id} />
            </div>
          )}
        </div>

        <RecipeResults
          recipeName={recipe.name}
          originalServings={recipe.original_servings}
          desiredServings={recipe.desired_servings}
          scaledLines={scaledLines}
          scaledInstructions={scaledInstructions}
          costMap={costMap}
          isOwner={isOwner}
          sourceName={recipe.source_name}
          author={recipe.author}
          sourceUrl={recipe.source_url}
          chefNotes={recipe.chef_notes}
          showChefNotes={isOwner}
        />
      </main>
    </>
  )
}
