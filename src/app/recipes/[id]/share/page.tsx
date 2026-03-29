import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { ShareManager } from '@/components/ShareManager'

type Params = { params: Promise<{ id: string }> }

export default async function SharePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, name, user_id')
    .eq('id', id)
    .single()

  if (!recipe || recipe.user_id !== user.id) notFound()

  return (
    <>
      <Navbar profile={profile} email={user.email} />
      <main className="max-w-xl mx-auto px-4 py-10">
        <Link href={`/recipes/${id}`} className="text-stone-400 hover:text-stone-600 text-sm block mb-6">
          ← Back to recipe
        </Link>
        <ShareManager recipeId={id} recipeName={recipe.name} />
      </main>
    </>
  )
}
