import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <>
      <Navbar profile={profile} email={user?.email} />
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-stone-900 leading-tight">
          Scale any recipe.<br />
          <span className="text-emerald-600">Save, share, and cost it.</span>
        </h1>
        <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
          Built for chefs and catering professionals. Scale ingredients up or down,
          track costs per serving, and share recipes with your team — with view or edit access.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <>
              <Link href="/recipes/new"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-base transition-colors">
                Scale a recipe →
              </Link>
              <Link href="/recipes"
                className="border border-stone-300 hover:border-stone-400 text-stone-700 px-6 py-3 rounded-xl font-semibold text-base transition-colors">
                My recipes
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold text-base transition-colors">
                Get started free →
              </Link>
              <Link href="/login"
                className="border border-stone-300 hover:border-stone-400 text-stone-700 px-6 py-3 rounded-xl font-semibold text-base transition-colors">
                Log in
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '⚖️', title: 'Smart scaling', desc: 'Fractions, mixed numbers, decimals, and colloquial amounts like "a pinch" — all scaled correctly.' },
            { icon: '👥', title: 'Team sharing', desc: 'Share recipes with employees. Set view-only or edit access per person, just like Google Drive.' },
            { icon: '💰', title: 'Cost tracking', desc: 'Add per-ingredient costs and instantly see total cost and cost per serving for any event.' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-stone-200 rounded-xl p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-stone-800">{f.title}</h3>
              <p className="text-sm text-stone-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
