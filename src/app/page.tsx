import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { TourSection } from '@/components/TourSection'

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

      {/* HERO */}
      <section
        className="relative overflow-hidden text-center px-8 pt-20 pb-16"
        style={{ background: 'linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 40%, #F0FDFA 100%)' }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.3) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(110,231,183,0.2) 0%, transparent 70%)' }}
        />

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-green-600 text-xs font-bold px-4 py-1.5 rounded-full mb-7 shadow-sm">
          🍽️ Built for chefs and catering professionals
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-gray-900 max-w-2xl mx-auto mb-5 tracking-tight">
          Scale any recipe.<br />
          <span className="text-green-600">In seconds.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto mb-10 font-medium">
          Stop doing ingredient math by hand. Scale up or down, track costs, and share recipes with your whole team.
        </p>

        {/* CTAs */}
        <div className="flex gap-3 justify-center flex-wrap">
          {user ? (
            <>
              <Link
                href="/recipes/new"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-full font-bold text-base transition-colors"
                style={{ boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
              >
                Scale a recipe →
              </Link>
              <Link
                href="/recipes"
                className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-3.5 rounded-full font-bold text-base border border-gray-200 shadow-sm transition-colors"
              >
                My recipes
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-full font-bold text-base transition-colors"
                style={{ boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
              >
                Get started free →
              </Link>
              <Link
                href="/login"
                className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-3.5 rounded-full font-bold text-base border border-gray-200 shadow-sm transition-colors"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-8 py-20 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: '⚖️', title: 'Smart scaling', desc: 'Handles fractions, mixed numbers, and colloquial amounts like "a pinch" — scaled correctly every time.' },
            { icon: '👥', title: 'Team sharing', desc: 'Share recipes with your staff. Set view-only or edit access per person.' },
            { icon: '💰', title: 'Cost tracking', desc: 'Add per-ingredient costs and instantly see total recipe cost and cost per serving.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 border border-gray-100 rounded-3xl p-8">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-xl mb-5">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TABBED TOUR */}
      <TourSection />

      {/* BOTTOM CTA */}
      {!user && (
        <section className="bg-white py-20 px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Ready to stop doing the math?
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md mx-auto">
              Free to use. No credit card required. Scale your first recipe in under a minute.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full font-bold text-base transition-colors"
              style={{ boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
            >
              Create a free account →
            </Link>
          </div>
        </section>
      )}
    </>
  )
}
