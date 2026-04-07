import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { RecipeForm } from '@/components/RecipeForm'
import { BetaBanner } from '@/components/BetaBanner'

export default async function NewRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <>
      <Navbar profile={profile} email={user.email} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-stone-800 mb-6">New recipe</h1>
        <BetaBanner />
        <RecipeForm isOwner displayMode={profile?.measurement_pref ?? 'volume'} />
      </main>
      <Footer />
    </>
  )
}
