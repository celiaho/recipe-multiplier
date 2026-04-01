import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/recipes/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('recipes')
    .select('*, profiles!recipes_user_id_fkey(first_name, last_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Strip chef_notes for non-owners — it is private to the owner only
  const isOwner = data.user_id === user.id
  if (!isOwner) {
    const { chef_notes: _omit, ...safeData } = data
    return NextResponse.json(safeData)
  }

  return NextResponse.json(data)
}

// PATCH /api/recipes/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Whitelist updatable fields to prevent mass assignment
  const {
    name, source_name, author, source_url, recipe_info, instructions,
    original_ingredients, original_servings, desired_servings,
    scaled_ingredients, total_cost, display_pref,
  } = body

  // chef_notes is owner-only — check ownership before allowing it
  const { data: existing } = await supabase
    .from('recipes')
    .select('user_id')
    .eq('id', id)
    .single()

  const isOwner = existing?.user_id === user.id
  const update: Record<string, unknown> = {
    ...(name !== undefined && { name }),
    ...(source_name !== undefined && { source_name }),
    ...(author !== undefined && { author }),
    ...(source_url !== undefined && { source_url }),
    ...(recipe_info !== undefined && { recipe_info }),
    ...(instructions !== undefined && { instructions }),
    ...(original_ingredients !== undefined && { original_ingredients }),
    ...(original_servings !== undefined && { original_servings }),
    ...(desired_servings !== undefined && { desired_servings }),
    ...(scaled_ingredients !== undefined && { scaled_ingredients }),
    ...(total_cost !== undefined && { total_cost }),
    ...(display_pref !== undefined && { display_pref }),
    ...(isOwner && body.chef_notes !== undefined && { chef_notes: body.chef_notes }),
  }

  // RLS enforces that only owners and editors can update
  const { data, error } = await supabase
    .from('recipes')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/recipes/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // only owner can delete

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
