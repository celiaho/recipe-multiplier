'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from './Avatar'
import type { Profile } from '@/types/database'

interface NavbarProps {
  profile?: Profile | null
  email?: string
}

export function Navbar({ profile, email }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-emerald-700 text-lg tracking-tight hover:text-emerald-600">
          🍴 Recipe Multiplier
        </Link>

        {email ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/recipes" className="text-stone-600 hover:text-stone-900 font-medium">
              My Recipes
            </Link>
            <Link
              href="/recipes/new"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              + New Recipe
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <Avatar avatarUrl={profile?.avatar_url} displayName={[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined} email={email} size="sm" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-stone-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-sm z-50">
                <Link href="/account" className="block px-4 py-2.5 hover:bg-stone-50 text-stone-700 rounded-t-lg">
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 hover:bg-stone-50 text-stone-700 rounded-b-lg"
                >
                  Sign out
                </button>
              </div>
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-stone-600 hover:text-stone-900 font-medium">Log in</Link>
            <Link href="/signup" className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors">
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
