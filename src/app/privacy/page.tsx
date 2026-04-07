import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Privacy Policy—Recipe Multiplier' }

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-8 block">← Back</Link>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Privacy Policy</h1>
        <p className="text-xs text-stone-400 mb-8">Last updated: April 7, 2026</p>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-stone-800 mb-2">What we collect</h2>
            <p>When you create an account, we collect your email address, first name, last name, and optional profile photo. When you use the app, we store the recipe content you enter, including ingredients, instructions, servings, and chef notes.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">How we use it</h2>
            <p>Your data is used solely to provide the Recipe Multiplier service. We do not sell your data to third parties, use it for advertising, or share it with anyone except as required to operate the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">Data storage</h2>
            <p>Your data is stored and processed by <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Supabase</a>, our database provider. Authentication and file storage are also handled by Supabase.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">Your rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time. To make a request, use the <Link href="/contact" className="text-emerald-700 hover:underline">contact form</Link>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">Contact</h2>
            <p>Questions about this policy? <Link href="/contact" className="text-emerald-700 hover:underline">Contact us</Link>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
