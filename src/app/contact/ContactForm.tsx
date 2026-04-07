'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const SUBJECTS = [
  'Bug report',
  'Compliments',
  'Feature request',
  'General question',
  'Privacy or data request',
  'Other',
]

interface Props {
  prefillName?: string
  prefillEmail?: string
}

export function ContactForm({ prefillName = '', prefillEmail = '' }: Props) {
  const [name, setName]         = useState(prefillName)
  const [email, setEmail]       = useState(prefillEmail)
  const [subject, setSubject]   = useState(SUBJECTS[0])
  const [message, setMessage]   = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [status, setStatus]     = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('subject', subject)
      formData.append('message', message)
      if (screenshot) formData.append('screenshot', screenshot)

      const res = await fetch('/api/contact', { method: 'POST', body: formData })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Contact us</h1>
      <p className="text-sm text-stone-500 mb-8">
        Bug reports, requests for new features, questions, compliments—drop a line and
        we&apos;ll get back to you. Recipe Multiplier is a passion project managed by one mere
        mortal so thanks in advance for your patience. :)
      </p>

      {status === 'sent' ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-6 text-center">
          <p className="text-emerald-800 font-medium mb-1">Message sent!</p>
          <p className="text-sm text-emerald-700 mb-4">We&apos;ll get back to you as soon as we can.</p>
          <Link href="/" className="text-sm text-emerald-700 underline hover:no-underline">
            ← Back to home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full font-sans bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tell us how we can help…"
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Screenshot <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <div
              className="flex items-center gap-3 bg-white border border-stone-300 rounded-lg px-3 py-2 cursor-pointer hover:border-stone-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-sm text-stone-500 truncate">
                {screenshot ? screenshot.name : 'Attach an image…'}
              </span>
              {screenshot && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setScreenshot(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="ml-auto text-stone-400 hover:text-stone-600 shrink-0"
                  aria-label="Remove attachment"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
                  </svg>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setScreenshot(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-stone-400 mt-1">PNG, JPG, GIF up to 5 MB</p>
          </div>

          {status === 'error' && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>

        </form>
      )}
    </main>
  )
}
