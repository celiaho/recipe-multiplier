import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { RecipeForm } from '@/components/RecipeForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  // Determine whether this user can edit
  const isOwner = recipe.user_id === user.id
  let canEdit = isOwner

  if (!isOwner) {
    const { data: share } = await supabase
      .from('recipe_shares')
      .select('permission')
      .eq('recipe_id', id)
      .eq('shared_with', user.id)
      .single()
    canEdit = share?.permission === 'edit'
  }

  if (!canEdit) notFound()

  return (
    <>
      <Navbar profile={profile} email={user.email} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/recipes/${id}`} className="text-stone-400 hover:text-stone-600 text-sm">
            ← Back to recipe
          </Link>
        </div>
        <h1 className="text-xl font-bold text-stone-800 mb-6">Edit recipe</h1>
        <RecipeForm
          initialData={{
            id: recipe.id,
            name: recipe.name,
            sourceName: recipe.source_name ?? '',
            author: recipe.author ?? '',
            sourceUrl: recipe.source_url ?? '',
            recipeInfo: recipe.recipe_info ?? '',
            instructions: recipe.instructions ?? '',
            chefNotes: isOwner ? (recipe.chef_notes ?? '') : '',
            originalIngredients: recipe.original_ingredients,
            originalServings: recipe.original_servings,
            desiredServings: recipe.desired_servings,
          }}
          isOwner={isOwner}
        />
      </main>
    </>
  )
}
