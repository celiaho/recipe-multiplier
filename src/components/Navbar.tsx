'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-emerald-700 text-lg tracking-tight hover:text-emerald-600 flex items-center gap-2">
          🍴 Recipe Multiplier
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Beta</span>
        </Link>

        {email ? (
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/recipes"
              className="text-stone-700 hover:text-stone-900 font-medium px-3 py-2 rounded-md min-h-[44px] flex items-center"
            >
              My Recipes
            </Link>
            <Link
              href="/recipes/new"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-md font-medium transition-colors min-h-[44px] flex items-center"
            >
              + New Recipe
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(s => !s)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Avatar
                  avatarUrl={profile?.avatar_url}
                  displayName={[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined}
                  email={email}
                  size="sm"
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-stone-200 rounded-lg shadow-lg text-sm z-50">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-stone-50 text-stone-700 rounded-t-lg"
                  >
                    Account
                  </Link>
                  <a
                    href="https://recipemultiplier.featurebase.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-stone-50 text-stone-700"
                  >
                    Send Feedback
                  </a>
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="w-full text-left px-4 py-3 hover:bg-stone-50 text-stone-700 rounded-b-lg"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-stone-700 hover:text-stone-900 font-medium px-3 py-2 min-h-[44px] flex items-center"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-md font-medium transition-colors min-h-[44px] flex items-center"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
