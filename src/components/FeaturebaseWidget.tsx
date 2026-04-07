'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export function FeaturebaseWidget() {
  useEffect(() => {
    const win = window as any

    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function () {
        ;(win.Featurebase.q = win.Featurebase.q || []).push(arguments)
      }
    }

    win.Featurebase('init_embed_widget', {
      organization: 'recipemultiplier',
      embedOptions: {
        path: '/',
      },
      stylingOptions: {
        theme: 'light',
        hideMenu: false,
        hideLogo: false,
      },
    })
  }, [])

  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" strategy="afterInteractive" />
      <div data-featurebase-embed className="w-full h-full min-h-[600px]" />
    </>
  )
}
