import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/recipes'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next === '/recipes') {
        // Email confirmation flow — apply saved metadata to profile, then send to login with message
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.first_name) {
          await supabase.from('profiles').update({
            first_name: user.user_metadata.first_name,
            last_name: user.user_metadata.last_name || null,
          }).eq('id', user.id)
        }
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?confirmed=true`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
