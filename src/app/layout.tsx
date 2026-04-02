import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Recipe Multiplier (Beta)',
  description: 'Scale any recipe up or down. Save, share, and cost your recipes.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className={`${geist.className} bg-stone-50 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
