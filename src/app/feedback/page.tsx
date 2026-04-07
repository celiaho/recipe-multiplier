import { Navbar } from '@/components/Navbar'
import { FeaturebaseWidget } from '@/components/FeaturebaseWidget'

export const metadata = { title: 'Feedback—Recipe Multiplier' }

export default function FeedbackPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <h1 className="text-2xl font-bold text-stone-800 mb-6">Share feedback</h1>
        <div className="flex-1">
          <FeaturebaseWidget />
        </div>
      </main>
    </>
  )
}
