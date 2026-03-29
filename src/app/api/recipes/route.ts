import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/recipes — list own recipes + shared-with-me recipes
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Own recipes
  const { data: own, error: ownError } = await supabase
    .from('recipes')
    .select('*, profiles!recipes_user_id_fkey(first_name, last_name, avatar_url)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (ownError) return NextResponse.json({ error: ownError.message }, { status: 500 })

  // Recipes shared with me
  const { data: shared, error: sharedError } = await supabase
    .from('recipe_shares')
    .select(`
      permission,
      shared_email,
      recipes (
        *,
        profiles!recipes_user_id_fkey(first_name, last_name, avatar_url)
      )
    `)
    .eq('shared_with', user.id)

  if (sharedError) return NextResponse.json({ error: sharedError.message }, { status: 500 })

  const sharedRecipes = (shared ?? []).map(s => ({
    ...(s.recipes as unknown as Record<string, unknown>),
    my_permission: s.permission,
    shared_by_email: s.shared_email,
  }))

  return NextResponse.json({ own: own ?? [], shared: sharedRecipes })
}

// POST /api/recipes — create a new recipe
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    name, source_name, author, source_url, instructions, chef_notes,
    original_ingredients, original_servings, desired_servings,
    scaled_ingredients, total_cost,
  } = body

  if (!name || !original_ingredients || !original_servings || !desired_servings) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name, source_name, author, source_url, instructions, chef_notes,
      original_ingredients, original_servings, desired_servings,
      scaled_ingredients, total_cost,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
