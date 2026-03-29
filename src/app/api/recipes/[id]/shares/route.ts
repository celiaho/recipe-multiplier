import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/recipes/[id]/shares — list shares for a recipe (owner only)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('recipe_shares')
    .select('*, profiles!recipe_shares_shared_with_fkey(first_name, last_name, avatar_url)')
    .eq('recipe_id', id)
    .eq('shared_by', user.id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/recipes/[id]/shares — share a recipe with someone by email
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, permission } = await request.json()
  if (!email || !permission) {
    return NextResponse.json({ error: 'email and permission required' }, { status: 400 })
  }

  // Look up the user by email
  const { data: targetProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (
      await supabase.rpc('get_user_id_by_email', { email_input: email })
    ).data)
    .single()

  // Fallback: use admin lookup via auth.users if available
  // For now return a clear error if user not found
  if (lookupError || !targetProfile) {
    return NextResponse.json(
      { error: `No account found for ${email}. They must sign up first.` },
      { status: 404 }
    )
  }

  const { data, error } = await supabase
    .from('recipe_shares')
    .upsert({
      recipe_id: id,
      shared_by: user.id,
      shared_with: targetProfile.id,
      shared_email: email,
      permission,
    }, { onConflict: 'recipe_id,shared_with' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/recipes/[id]/shares — update permission for a share
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { share_id, permission } = await request.json()

  const { data, error } = await supabase
    .from('recipe_shares')
    .update({ permission })
    .eq('id', share_id)
    .eq('recipe_id', id)
    .eq('shared_by', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/recipes/[id]/shares — revoke a share
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { share_id } = await request.json()

  const { error } = await supabase
    .from('recipe_shares')
    .delete()
    .eq('id', share_id)
    .eq('recipe_id', id)
    .eq('shared_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
