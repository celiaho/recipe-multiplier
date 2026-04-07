'use client'

import { useState, useEffect } from 'react'

interface Props {
  storageKey: string
  color: 'emerald' | 'amber'
  children: React.ReactNode
}

export function DismissibleCallout({ storageKey, color, children }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setVisible(true)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  const styles = {
    emerald: {
      wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      btn:  'text-emerald-400 hover:text-emerald-700',
    },
    amber: {
      wrap: 'bg-amber-50 border-amber-200 text-amber-800',
      btn:  'text-amber-400 hover:text-amber-700',
    },
  }[color]

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${styles.wrap}`}>
      <span className="text-base leading-snug mt-0.5 shrink-0">💡</span>
      <span className="flex-1 leading-relaxed">{children}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className={`shrink-0 mt-0.5 transition-colors ${styles.btn}`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="1" y1="1" x2="13" y2="13"/>
          <line x1="13" y1="1" x2="1" y2="13"/>
        </svg>
      </button>
    </div>
  )
}
