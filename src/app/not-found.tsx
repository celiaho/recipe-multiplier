import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
      <Image
        src="/cracked-egg.png"
        alt="Cracked egg illustration"
        width={160}
        height={160}
        className="mb-6 select-none"
        priority
      />

      <p className="text-6xl font-bold text-stone-200 mb-2 tracking-tight">404</p>
      <h1 className="text-2xl font-bold text-stone-800 mb-3">This recipe doesn&apos;t exist</h1>
      <p className="text-stone-500 text-base mb-10 max-w-sm">
        Looks like this one got scaled down to nothing. Head back home or check your saved recipes.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
        >
          ← Go home
        </Link>
        <Link
          href="/recipes"
          className="border border-stone-300 hover:border-stone-400 text-stone-700 px-6 py-3 rounded-lg font-semibold text-sm transition-colors bg-white"
        >
          My Recipes
        </Link>
      </div>

      <p className="text-xs text-stone-400 mt-12">
        <Link href="/" className="hover:underline">🍴 Recipe Multiplier</Link>
      </p>
    </div>
  )
}
