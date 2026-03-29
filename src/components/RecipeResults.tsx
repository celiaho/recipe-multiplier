'use client'

import { useState } from 'react'
import { computeCosts, formatCost, buildEmailBody, type ParsedLine } from '@/lib/recipeLogic'

interface RecipeResultsProps {
  recipeName: string
  originalServings: number
  desiredServings: number
  scaledLines: ParsedLine[]
  scaledInstructions?: string | null
  costMap: Record<number, string>
  onCostChange?: (index: number, value: string) => void
  onSave?: () => void
  onBack?: () => void
  saving?: boolean
  isOwner?: boolean
  recipeInfo?: string | null
  sourceName?: string | null
  author?: string | null
  sourceUrl?: string | null
  chefNotes?: string | null
  showChefNotes?: boolean
}

export function RecipeResults({
  recipeName, originalServings, desiredServings,
  scaledLines, scaledInstructions,
  costMap, onCostChange = () => {},
  onSave, onBack, saving,
  isOwner = true, recipeInfo, sourceName, author, sourceUrl, chefNotes, showChefNotes = true,
}: RecipeResultsProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [showCosts, setShowCosts] = useState(false)
  const [copied, setCopied] = useState(false)

  const multiplier = (desiredServings / originalServings)
  const multiplierStr = multiplier.toFixed(2).replace(/\.?0+$/, '')

  const { totalCost, costPerServing } = computeCosts(
    scaledLines.map((_, i) => ({ unit_cost: costMap[i] ? parseFloat(costMap[i]) : null })),
    desiredServings
  )

  const hasCosts = totalCost > 0

  function handleCopy() {
    const text = scaledLines
      .map(l => l.wasScaled ? `${l.scaledQty} ${l.ingredient}` : l.ingredient)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleEmail() {
    const body = buildEmailBody(recipeName, originalServings, desiredServings, scaledLines, {
      recipeInfo,
      sourceName,
      author,
      sourceUrl,
      instructions: scaledInstructions ?? undefined,
      totalCost: hasCosts ? totalCost : undefined,
    })
    const subject = `${recipeName} — scaled to ${desiredServings} servings`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="print:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{recipeName}</h1>
            <p className="text-stone-500 mt-1">
              {originalServings} → <strong>{desiredServings}</strong> servings
              {originalServings !== desiredServings && (
                <span className="text-stone-400 ml-1">(×{multiplierStr})</span>
              )}
            </p>
            {(author || sourceName) && (
              <p className="text-sm text-stone-500 mt-1">
                {[author, sourceName].filter(Boolean).join(' · ')}
              </p>
            )}
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-emerald-600 hover:underline mt-0.5 block">
                View original recipe ↗
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {onBack && (
            <button onClick={onBack}
              className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
              ← Edit
            </button>
          )}
          <button onClick={handleCopy}
            className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
            {copied ? '✓ Copied!' : 'Copy list'}
          </button>
          <button onClick={handleEmail}
            className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
            📧 Email recipe
          </button>
          <button onClick={() => window.print()}
            className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
            🖨 Print
          </button>
          <button onClick={() => setShowCosts(s => !s)}
            className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
            {showCosts ? 'Hide costs' : '$ Add costs'}
          </button>
          {onSave && (
            <button onClick={onSave} disabled={saving}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : '💾 Save recipe'}
            </button>
          )}
        </div>
      </div>

      {/* Recipe info (timing, cuisine, etc.) */}
      {recipeInfo && (
        <section>
          <div className="text-sm text-stone-600 whitespace-pre-wrap bg-stone-50 border border-stone-100 rounded-lg px-4 py-3 leading-relaxed">
            {recipeInfo}
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section>
        <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">
          Scaled Ingredients
        </h2>
        <ul className="space-y-2">
          {scaledLines.map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => setChecked(s => ({ ...s, [i]: !s[i] }))}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 shrink-0 print:hidden"
              />
              <span className={`flex-1 text-sm ${checked[i] ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                {line.wasScaled ? (
                  <><strong>{line.scaledQty}</strong> {line.ingredient}</>
                ) : (
                  line.ingredient
                )}
                {line.note && (
                  <span className="text-xs text-stone-400 ml-2 italic">{line.note}</span>
                )}
              </span>
              {showCosts && (
                <div className="flex items-center gap-1 shrink-0 print:hidden">
                  <span className="text-xs text-stone-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={costMap[i] ?? ''}
                    onChange={e => onCostChange(i, e.target.value)}
                    className="w-20 border border-stone-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Cost summary */}
        {showCosts && hasCosts && (
          <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-600">Total ingredient cost</span>
              <span className="font-semibold">{formatCost(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Cost per serving</span>
              <span className="font-semibold">{formatCost(costPerServing)}</span>
            </div>
            {scaledLines.length > 0 && (
              <div className="text-xs text-stone-400 pt-1">
                {(() => {
                  const costs = scaledLines.map((l, i) => ({
                    name: l.wasScaled ? `${l.scaledQty} ${l.ingredient}` : l.ingredient,
                    cost: costMap[i] ? parseFloat(costMap[i]) : 0,
                  })).filter(x => x.cost > 0)
                  if (costs.length < 2) return null
                  const max = costs.reduce((a, b) => a.cost > b.cost ? a : b)
                  const min = costs.reduce((a, b) => a.cost < b.cost ? a : b)
                  return <>Most expensive: {max.name} ({formatCost(max.cost)}) · Least: {min.name} ({formatCost(min.cost)})</>
                })()}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Scaled instructions */}
      {scaledInstructions && (
        <section>
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">
            Instructions
          </h2>
          <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
            {scaledInstructions}
          </div>
        </section>
      )}

      {/* Chef notes — owner only, hidden from print for privacy */}
      {isOwner && showChefNotes && chefNotes && (
        <section className="print:hidden">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
            Chef Notes
            <span className="text-xs font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Private</span>
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-stone-700 whitespace-pre-wrap">
            {chefNotes}
          </div>
        </section>
      )}
    </div>
  )
}
