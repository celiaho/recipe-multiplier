import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
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
        <Script
          id="featurebase-sdk"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!(function(e,t){const a="featurebase-sdk";function n(){if(!t.getElementById(a)){var e=t.createElement("script");(e.id=a),(e.src="https://do.featurebase.app/js/sdk.js"),t.getElementsByTagName("script")[0].parentNode.insertBefore(e,t.getElementsByTagName("script")[0])}}"function"!=typeof e.Featurebase&&(e.Featurebase=function(){(e.Featurebase.q=e.Featurebase.q||[]).push(arguments)}),"complete"===t.readyState||"interactive"===t.readyState?n():t.addEventListener("DOMContentLoaded",n)})(window,document);
    window.Featurebase("initialize_feedback_widget", { organization: "recipemultiplier" });`,
          }}
        />
      </body>
    </html>
  )
}
