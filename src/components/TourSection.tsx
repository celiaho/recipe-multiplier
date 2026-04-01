'use client'

import { useState } from 'react'

function IngredientRow({ qty, ingredient }: { qty: string; ingredient: string }) {
  return (
    <li className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-600 border-b border-gray-50 last:border-0">
      <span className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0" />
      <span className="font-bold text-gray-900 min-w-[70px]">{qty}</span>
      <span>{ingredient}</span>
    </li>
  )
}

function ImportPanel({ onImport }: { onImport: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-md max-w-lg mx-auto">
      <h3 className="text-base font-extrabold text-gray-900 mb-1">Import from a recipe website</h3>
      <p className="text-xs text-gray-400 mb-6">Paste any recipe URL — we&apos;ll pull the ingredients and servings automatically.</p>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          readOnly
          value="https://www.allrecipes.com/recipe/24074/roast-chicken/"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 pointer-events-none select-none min-w-0"
        />
        <button
          onClick={onImport}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors"
        >
          Import recipe →
        </button>
      </div>
      <div className="flex gap-2 bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 leading-relaxed mb-4">
        <span className="flex-shrink-0">ℹ️</span>
        <span>Works with most major recipe websites. Some sites (e.g. Food Network) block automated access.</span>
      </div>
      <p className="text-xs text-gray-400 font-medium text-center">AllRecipes · NYT Cooking · Serious Eats · Food52 · and more</p>
    </div>
  )
}

function EnterPanel({ onScale }: { onScale: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-md max-w-sm mx-auto">
      <h3 className="text-base font-extrabold text-gray-900 mb-1">Enter your ingredient list</h3>
      <p className="text-xs text-gray-400 mb-5">One ingredient per line — any format works</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Original servings</label>
          <input type="text" readOnly value="6" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 pointer-events-none select-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Desired servings</label>
          <input type="text" readOnly value="80" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 pointer-events-none select-none" />
        </div>
      </div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ingredients</label>
      <textarea
        readOnly
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 h-28 resize-none mb-4 pointer-events-none select-none"
        defaultValue={`3 lbs chicken thighs\n2 tbsp olive oil\n4 cloves garlic, minced\n1 1/2 tsp fresh thyme\n1/2 tsp black pepper`}
      />
      <button
        onClick={onScale}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-bold text-sm shadow-md transition-colors"
      >
        Scale recipe →
      </button>
    </div>
  )
}

function ResultsPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
      {/* Input summary */}
      <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-md">
        <h3 className="text-base font-extrabold text-gray-900 mb-1">Roast Chicken with Herbs</h3>
        <p className="text-xs text-gray-400 mb-5">Original recipe · 6 servings</p>
        <ul className="border border-gray-100 rounded-xl overflow-hidden">
          <IngredientRow qty="3 lbs" ingredient="chicken thighs" />
          <IngredientRow qty="2 tbsp" ingredient="olive oil" />
          <IngredientRow qty="4 cloves" ingredient="garlic, minced" />
          <IngredientRow qty="1½ tsp" ingredient="fresh thyme" />
          <IngredientRow qty="½ tsp" ingredient="black pepper" />
        </ul>
      </div>

      {/* Arrow */}
      <div className="hidden md:flex items-start pt-12 text-gray-300 text-2xl px-1">→</div>

      {/* Scaled results */}
      <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-md">
        <div className="mb-5">
          <h3 className="text-base font-extrabold text-gray-900 mb-1.5">Roast Chicken with Herbs</h3>
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
            ✓ Scaled 13.3× · 6 → 80 servings
          </span>
        </div>
        <ul className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          <IngredientRow qty="40 lbs" ingredient="chicken thighs" />
          <IngredientRow qty="1⅔ cups" ingredient="olive oil" />
          <IngredientRow qty="53⅓" ingredient="cloves garlic, minced" />
          <IngredientRow qty="6 tbsp + 2 tsp" ingredient="fresh thyme" />
          <IngredientRow qty="2 tbsp + ⅔ tsp" ingredient="black pepper" />
        </ul>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '📋 Copy', save: false },
            { label: '📧 Email', save: false },
            { label: '🖨 Print', save: false },
            { label: '💾 Save', save: true },
          ].map(btn => (
            <button
              key={btn.label}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold pointer-events-none ${
                btn.save
                  ? 'bg-green-600 border border-green-600 text-white'
                  : 'bg-gray-50 border border-gray-200 text-gray-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TourSection() {
  const [activeTab, setActiveTab] = useState<'import' | 'enter' | 'results'>('import')

  const tabs: { id: 'import' | 'enter' | 'results'; label: string }[] = [
    { id: 'import', label: '🔗 Import from URL' },
    { id: 'enter', label: '✏️ Enter your ingredients' },
    { id: 'results', label: '✓ Scaled results' },
  ]

  return (
    <section className="bg-gray-50 py-20 px-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">See it in action</p>
        <h2 className="text-4xl font-extrabold text-gray-900 text-center leading-tight tracking-tight mb-3">
          From ingredients to <span className="text-green-600">scaled list</span> — in one click.
        </h2>
        <p className="text-center text-sm text-gray-500 leading-relaxed max-w-lg mx-auto mb-10">
          Import from a recipe URL or enter your own. Get perfectly scaled quantities in seconds.
        </p>

        <div className="flex gap-1 justify-center bg-white border border-gray-200 rounded-full p-1.5 w-fit mx-auto shadow-sm mb-10 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'import' && <ImportPanel onImport={() => setActiveTab('enter')} />}
        {activeTab === 'enter' && <EnterPanel onScale={() => setActiveTab('results')} />}
        {activeTab === 'results' && <ResultsPanel />}
      </div>
    </section>
  )
}
