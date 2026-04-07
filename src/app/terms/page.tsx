import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Terms of Service—Recipe Multiplier' }

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-8 block">← Back</Link>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Terms of Service</h1>
        <p className="text-xs text-stone-400 mb-8">Last updated: April 7, 2026</p>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-stone-800 mb-2">The service</h2>
            <p>Recipe Multiplier is a beta tool for scaling, saving, and sharing recipes. It is provided free of charge and may be changed or discontinued at any time.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">No warranty</h2>
            <p>This service is provided as-is, without warranty of any kind. Scaled quantities are calculated automatically and should be reviewed before use, especially for baking or professional kitchen use.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">Your content</h2>
            <p>You own all recipe content you enter. We do not claim any rights to it. By using the service, you grant us permission to store and display your content to you and the people you choose to share it with.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">Acceptable use</h2>
            <p>Do not use this service for automated scraping, abuse, or any unlawful purpose. Accounts that violate these terms may be suspended.</p>
          </section>

          <section>
            <h2 className="font-semibold text-stone-800 mb-2">Contact</h2>
            <p>Questions or issues? <Link href="/contact" className="text-emerald-700 hover:underline">Contact us</Link>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
