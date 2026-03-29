'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scaleIngredients, scaleInstructions, computeCosts, type ParsedLine } from '@/lib/recipeLogic'
import { RecipeResults } from './RecipeResults'

interface RecipeFormProps {
  /** If provided, the form is pre-populated (editing a saved recipe) */
  initialData?: {
    id?: string
    name: string
    sourceName: string
    author: string
    sourceUrl: string
    instructions: string
    chefNotes: string
    originalIngredients: string
    originalServings: number
    desiredServings: number
  }
  isOwner?: boolean
}

export function RecipeForm({ initialData, isOwner = true }: RecipeFormProps) {
  const router = useRouter()

  const [tab, setTab] = useState<'type' | 'url'>('type')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const [name, setName] = useState(initialData?.name ?? '')
  const [sourceName, setSourceName] = useState(initialData?.sourceName ?? '')
  const [author, setAuthor] = useState(initialData?.author ?? '')
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl ?? '')
  const [instructions, setInstructions] = useState(initialData?.instructions ?? '')
  const [chefNotes, setChefNotes] = useState(initialData?.chefNotes ?? '')
  const [originalIngredients, setOriginalIngredients] = useState(initialData?.originalIngredients ?? '')
  const [originalServings, setOriginalServings] = useState(initialData?.originalServings?.toString() ?? '')
  const [desiredServings, setDesiredServings] = useState(initialData?.desiredServings?.toString() ?? '')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [results, setResults] = useState<ParsedLine[] | null>(null)
  const [scaledInstructions, setScaledInstructions] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [costMap, setCostMap] = useState<Record<number, string>>({})

  async function handleImportUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!importUrl.trim()) return
    setImporting(true)
    setImportError(null)

    const res = await fetch('/api/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: importUrl.trim() }),
    })
    const json = await res.json()

    if (!res.ok) {
      setImportError(json.error)
    } else {
      setName(json.name ?? '')
      setAuthor(json.author ?? '')
      setSourceUrl(json.sourceUrl ?? importUrl.trim())
      setOriginalIngredients(json.ingredients ?? '')
      setInstructions(json.instructions ?? '')
      if (json.originalServings) setOriginalServings(String(json.originalServings))
      setTab('type')
    }
    setImporting(false)
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Recipe name is required.'
    if (!originalIngredients.trim()) e.originalIngredients = 'Ingredient list is required.'
    const orig = parseFloat(originalServings)
    const desired = parseFloat(desiredServings)
    if (isNaN(orig) || orig <= 0) e.originalServings = 'Enter a valid positive number.'
    if (isNaN(desired) || desired <= 0) e.desiredServings = 'Enter a valid positive number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleScale(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const orig = parseFloat(originalServings)
    const desired = parseFloat(desiredServings)
    const lines = scaleIngredients(originalIngredients, orig, desired)
    setResults(lines)
    if (instructions.trim()) {
      setScaledInstructions(scaleInstructions(instructions, orig, desired))
    }
    setCostMap({})
  }

  async function handleSave() {
    if (!results) return
    setSaving(true)

    const scaledWithCosts = results.map((line, i) => ({
      qty: line.scaledQty,
      ingredient: line.ingredient,
      unit_cost: costMap[i] ? parseFloat(costMap[i]) : null,
      original_line: line.originalLine,
    }))

    const totalCost = Object.values(costMap)
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

    const payload = {
      name,
      source_name: sourceName || null,
      author: author || null,
      source_url: sourceUrl || null,
      instructions: instructions || null,
      chef_notes: chefNotes || null,
      original_ingredients: originalIngredients,
      original_servings: parseFloat(originalServings),
      desired_servings: parseFloat(desiredServings),
      scaled_ingredients: scaledWithCosts,
      total_cost: totalCost || null,
    }

    const method = initialData?.id ? 'PATCH' : 'POST'
    const url = initialData?.id ? `/api/recipes/${initialData.id}` : '/api/recipes'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const saved = await res.json()
      router.push(`/recipes/${saved.id}`)
    }
    setSaving(false)
  }

  function handleReset() {
    setResults(null)
    setScaledInstructions(null)
  }

  if (results) {
    return (
      <RecipeResults
        recipeName={name}
        originalServings={parseFloat(originalServings)}
        desiredServings={parseFloat(desiredServings)}
        scaledLines={results}
        scaledInstructions={scaledInstructions}
        costMap={costMap}
        onCostChange={(i, val) => setCostMap(prev => ({ ...prev, [i]: val }))}
        onSave={handleSave}
        onBack={handleReset}
        saving={saving}
        isOwner={isOwner}
        sourceName={sourceName}
        author={author}
        sourceUrl={sourceUrl}
      />
    )
  }

  return (
    <form onSubmit={handleScale} className="space-y-5">
      {/* URL import tab */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
        <button type="button" onClick={() => setTab('type')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'type' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>
          Type / paste
        </button>
        <button type="button" onClick={() => setTab('url')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'url' ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>
          Import from URL
        </button>
      </div>

      {tab === 'url' && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-stone-600">Paste a link from AllRecipes, NYT Cooking, Serious Eats, and most major recipe sites.</p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleImportUrl}
              disabled={importing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
          {importError && <p className="text-sm text-red-600">{importError}</p>}
        </div>
      )}

      {/* Recipe metadata */}
      <Field label="Recipe name *" error={errors.name}>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Roast Chicken"
          className={inputClass(!!errors.name)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Source name (optional)">
          <input type="text" value={sourceName} onChange={e => setSourceName(e.target.value)}
            placeholder="e.g. America's Test Kitchen"
            className={inputClass(false)} />
        </Field>
        <Field label="Author (optional)">
          <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
            placeholder="e.g. Martha Stewart"
            className={inputClass(false)} />
        </Field>
      </div>

      <Field label="Source URL (optional)">
        <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass(false)} />
      </Field>

      {/* Servings row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Original servings *" error={errors.originalServings}>
          <input type="text" inputMode="decimal" value={originalServings}
            onChange={e => setOriginalServings(e.target.value)}
            placeholder="e.g. 4"
            className={inputClass(!!errors.originalServings)} />
        </Field>
        <Field label="Desired servings *" error={errors.desiredServings}>
          <input type="text" inputMode="decimal" value={desiredServings}
            onChange={e => setDesiredServings(e.target.value)}
            placeholder="e.g. 12"
            className={inputClass(!!errors.desiredServings)} />
        </Field>
      </div>

      {/* Ingredients */}
      <Field label="Ingredients *" error={errors.originalIngredients}
        hint="One ingredient per line. Supports whole numbers, fractions (1/2), mixed numbers (1 1/2), decimals, and colloquial amounts (a pinch, a handful).">
        <textarea value={originalIngredients} onChange={e => setOriginalIngredients(e.target.value)}
          rows={8} placeholder={"2 cups flour\n1 1/2 tsp baking powder\na pinch of salt\n3 large eggs"}
          className={`${inputClass(!!errors.originalIngredients)} resize-y`} />
      </Field>

      {/* Instructions */}
      <Field label="Instructions (optional)"
        hint="Any numeric quantities in the instructions will also be scaled.">
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          rows={5} placeholder={"Step 1: Preheat oven to 375°F.\nStep 2: Mix 2 cups flour with..."}
          className={`${inputClass(false)} resize-y`} />
      </Field>

      {/* Chef notes — owner only */}
      {isOwner && (
        <Field label="Chef notes (private — only you can see these)"
          hint="Personal notes: ingredient substitutions, adjustments for specific events, etc.">
          <textarea value={chefNotes} onChange={e => setChefNotes(e.target.value)}
            rows={3} placeholder="Double the garlic. Use half the salt for the catering event on the 14th."
            className={`${inputClass(false)} resize-y`} />
        </Field>
      )}

      <button type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-base transition-colors">
        Scale Recipe →
      </button>
    </form>
  )
}

function inputClass(hasError: boolean) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-stone-300'
  }`
}

function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
