'use client'

import { useState } from 'react'
import { computeCosts, formatCost, buildEmailBody, type ParsedLine } from '@/lib/recipeLogic'
import { toWeightQty, getIngredientName } from '@/lib/weightConversion'
import { DismissibleCallout } from './DismissibleCallout'

type DisplayMode = 'both' | 'weight' | 'volume'

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
  /** Initial display mode — driven by per-recipe or per-profile preference. */
  displayMode?: DisplayMode
  /** Provide to enable "Save for this recipe" button. */
  recipeId?: string
  editHref?: string
  shareHref?: string
  deleteButton?: React.ReactNode
  sharedWith?: string[]
}

function formatSharedWith(names: string[]): string {
  if (names.length === 1) return `Shared with ${names[0]}`
  if (names.length === 2) return `Shared with 2: ${names[0]} and ${names[1]}`
  const shown = names.slice(0, 3)
  return `Shared with ${names.length}: ${shown.slice(0, -1).join(', ')}, ${shown[shown.length - 1]} and others`
}

const TOOLTIP_CONTENT = (
  <>
    Weight equivalents are estimated using{' '}
    <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
      USDA FoodData Central
    </a>{' '}
    density tables for common culinary ingredients
    (e.g. 1 cup all-purpose flour ≈ 125 g, 1 tbsp olive oil ≈ 14 g).
    Count-based items like garlic cloves use typical average weights.
    Unlisted ingredients show a blank weight cell.
    Actual values may vary by brand, grind, or how an ingredient is packed.
    Verify with a kitchen scale if precision matters.
  </>
)

export function RecipeResults({
  recipeName, originalServings, desiredServings,
  scaledLines, scaledInstructions,
  costMap, onCostChange = () => {},
  onSave, onBack, saving,
  isOwner = true, recipeInfo, sourceName, author, sourceUrl, chefNotes, showChefNotes = true,
  displayMode = 'volume',
  recipeId,
  editHref, shareHref, deleteButton, sharedWith,
}: RecipeResultsProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [showCosts, setShowCosts] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentMode, setCurrentMode] = useState<DisplayMode>(displayMode)
  const [savingPref, setSavingPref] = useState(false)
  const [prefSaved, setPrefSaved] = useState(false)

  const multiplier = (desiredServings / originalServings)
  const multiplierStr = multiplier.toFixed(2).replace(/\.?0+$/, '')

  const { totalCost, costPerServing } = computeCosts(
    scaledLines.map((_, i) => ({ unit_cost: costMap[i] ? parseFloat(costMap[i]) : null })),
    desiredServings
  )

  const hasCosts = totalCost > 0
  const showWeightCol = currentMode === 'both' || currentMode === 'weight'
  const showVolumeCol = currentMode === 'both' || currentMode === 'volume'

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
    const subject = `${recipeName}—scaled to ${desiredServings} servings`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  async function handleSavePref() {
    if (!recipeId) return
    setSavingPref(true)
    await fetch(`/api/recipes/${recipeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_pref: currentMode }),
    })
    setSavingPref(false)
    setPrefSaved(true)
    setTimeout(() => setPrefSaved(false), 3000)
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
            {copied ? '✓ Copied!' : 'Copy ingredients'}
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
          {editHref && (
            <a href={editHref}
              className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
              ✏️ Edit
            </a>
          )}
          {shareHref && (
            <a href={shareHref}
              className="text-sm border border-stone-300 hover:border-stone-400 text-stone-600 px-3 py-1.5 rounded-lg transition-colors">
              👥 Share
            </a>
          )}
          {deleteButton}
        </div>
        {onSave && (
          <div className="mt-2 print:hidden">
            <DismissibleCallout storageKey="hint-save-recipe" color="amber">
              Hit <strong>Save recipe</strong> to add it to My Recipes so you can find it anytime.
            </DismissibleCallout>
          </div>
        )}
        {sharedWith && sharedWith.length > 0 && shareHref && (
          <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-2 print:hidden">
            <a href={shareHref} className="hover:text-stone-600 transition-colors" aria-label="Manage sharing">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
            <span>{formatSharedWith(sharedWith)}</span>
          </div>
        )}
      </div>

      {/* Recipe info (timing, cuisine, etc.) */}
      {recipeInfo && (
        <section>
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3 print:hidden">
            Recipe Info
          </h2>
          <div className="text-sm text-stone-600 whitespace-pre-wrap bg-stone-50 border border-stone-100 rounded-lg px-4 py-3 leading-relaxed">
            {recipeInfo.replace(/,(?=[^\s])/g, ', ')}
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section>
        <div className="mb-3 print:hidden">
          <DismissibleCallout storageKey="hint-weight-toggle" color="emerald">
            Your ingredients are shown in <strong>volume</strong> by default. Toggle to <strong>Weight</strong> or <strong>Both</strong> to see gram/kg estimates —useful for baking. Set your default in Account Settings.
          </DismissibleCallout>
        </div>
        <div className="flex items-center justify-between gap-3 mb-3 print:hidden flex-wrap gap-y-2">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide">
            Scaled Ingredients
          </h2>

          {/* Display mode segmented control + account link */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="flex bg-stone-100 rounded-lg p-0.5 text-xs font-medium">
                {(['weight', 'volume', 'both'] as DisplayMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setCurrentMode(mode); setPrefSaved(false) }}
                    className={`px-3 py-1 rounded-md transition-colors capitalize ${
                      currentMode === mode
                        ? 'bg-white shadow text-stone-800'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {mode === 'weight' ? '⚖ Weight' : mode === 'volume' ? '📏 Volume' : '⚖📏 Both'}
                  </button>
                ))}
              </div>
              {showWeightCol && (
                <div className="relative group">
                  <button
                    type="button"
                    className="text-stone-400 hover:text-stone-600 text-sm leading-none transition-colors"
                    aria-label="About weight estimates"
                  >
                    ⓘ
                  </button>
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-stone-800 text-white text-xs rounded-lg px-3 py-2.5 leading-relaxed hidden group-hover:block z-20 font-sans shadow-lg">
                    {TOOLTIP_CONTENT}
                  </div>
                </div>
              )}
            </div>
            {showWeightCol && (
              <p className="text-xs text-stone-400 mt-0.5">
                Set your default in{' '}
                <a href="/account" className="hover:text-stone-600 underline transition-colors">Account Settings</a>.
              </p>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {scaledLines.map((line, i) => {
            const weightResult = showWeightCol && line.wasScaled
              ? toWeightQty(line.scaledQty, line.ingredient)
              : null
            const weightDisplay = weightResult
              ? `${weightResult.approx ? '~' : ''}${weightResult.display}`
              : null
            const ingredientName = getIngredientName(line.ingredient)
            const volumeDisplay = line.wasScaled
              ? `${line.scaledQty} ${line.ingredient}`
              : line.ingredient

            // For "both" mode: split volume display into qty+unit (muted) and name (black).
            // Compound: unit is embedded in scaledQty ("6 tbsp + 2 tsp"), ingredient is just the name.
            // Volume/weight unit: first word of ingredient is the unit → strip it for name.
            // Count/unscaled: scaledQty is the count, ingredient is name+unit together.
            const isCompound = line.scaledQty.includes(' + ')
            const unitStripped = ingredientName !== line.ingredient // getIngredientName stripped a unit word
            const volumeQty = line.wasScaled
              ? (isCompound ? line.scaledQty : unitStripped ? `${line.scaledQty} ${line.ingredient.split(/\s+/)[0]}` : line.scaledQty)
              : ''
            const volumeName = line.wasScaled
              ? (isCompound || unitStripped ? ingredientName : line.ingredient)
              : line.ingredient

            return (
              <li key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!checked[i]}
                  onChange={() => setChecked(s => ({ ...s, [i]: !s[i] }))}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 shrink-0 print:hidden"
                />

                {/* Both mode: true 3-column grid — weight | volume qty+unit | ingredient name */}
                {currentMode === 'both' && (
                  <div className={`flex-1 grid grid-cols-[72px_128px_1fr] gap-x-3 text-sm items-baseline min-w-0 ${checked[i] ? 'line-through text-stone-400' : ''}`}>
                    <span className={`font-bold tabular-nums truncate ${checked[i] ? '' : 'text-stone-700'}`}>
                      {weightDisplay ?? ''}
                    </span>
                    <span className="text-stone-400 truncate">
                      {volumeQty}
                    </span>
                    <span className={checked[i] ? '' : 'text-stone-800'}>
                      {volumeName}
                      {line.note && (
                        <span className="text-xs text-stone-400 ml-2 italic">{line.note}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Weight mode: weight col + ingredient name */}
                {currentMode === 'weight' && (
                  <span className={`flex-1 text-sm ${checked[i] ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                    {weightDisplay
                      ? <><strong>{weightDisplay}</strong>{' '}{ingredientName}</>
                      : volumeDisplay
                    }
                    {line.note && (
                      <span className="text-xs text-stone-400 ml-2 italic">{line.note}</span>
                    )}
                  </span>
                )}

                {/* Volume mode: existing behavior */}
                {currentMode === 'volume' && (
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
                )}

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
            )
          })}
        </ul>

        {/* Save preference for this recipe */}
        {showWeightCol && recipeId && (
          <div className="mt-2 print:hidden">
            {currentMode !== displayMode && (
              <button
                type="button"
                onClick={handleSavePref}
                disabled={savingPref}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium transition-colors disabled:opacity-50"
              >
                {savingPref ? 'Saving…' : prefSaved ? '✓ Saved for this recipe' : 'Save for this recipe'}
              </button>
            )}
            {currentMode === displayMode && prefSaved && (
              <span className="text-xs text-stone-500">✓ Preference saved</span>
            )}
          </div>
        )}

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
      {isOwner && showChefNotes && (
        <section className="print:hidden">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
            Chef Notes
            <span className="text-xs font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Private</span>
          </h2>
          {chefNotes ? (
            <div className="border-l-4 border-amber-300 pl-3 py-1 text-sm text-stone-700 whitespace-pre-wrap">
              {chefNotes}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No chef notes yet.</p>
          )}
        </section>
      )}
    </div>
  )
}
