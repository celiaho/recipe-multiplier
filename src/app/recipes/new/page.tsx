import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { RecipeForm } from '@/components/RecipeForm'

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
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Beta:</strong> Known issue — in some cases, only the first quantity on an ingredient line is scaled. Please review your scaled results before use.
        </div>
        <RecipeForm isOwner />
      </main>
    </>
  )
}
