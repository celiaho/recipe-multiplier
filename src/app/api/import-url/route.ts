import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { importRecipeFromUrl } from '@/lib/recipeImport'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const result = await importRecipeFromUrl(url)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }
  return NextResponse.json(result.recipe)
}
