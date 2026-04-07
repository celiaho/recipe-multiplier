'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'beta-banner-dismissed'

export function BetaBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-3">
      <span className="flex-1">
        <strong>Beta:</strong> Known issue—in some cases, only the first quantity on an ingredient line is scaled. Please review your scaled results before use.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-amber-500 hover:text-amber-700 transition-colors mt-0.5 shrink-0 leading-none"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="1" y1="1" x2="13" y2="13"/>
          <line x1="13" y1="1" x2="1" y2="13"/>
        </svg>
      </button>
    </div>
  )
}
