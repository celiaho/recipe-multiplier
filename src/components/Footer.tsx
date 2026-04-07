import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-400">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span>© 2025 Recipe Multiplier</span>
        <Link href="/privacy" className="hover:text-stone-600 transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-stone-600 transition-colors">Terms</Link>
        <a href="https://recipemultiplier.featurebase.app" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 transition-colors">Send Feedback</a>
      </div>
    </footer>
  )
}
