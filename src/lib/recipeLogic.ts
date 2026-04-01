/**
 * recipeLogic.ts
 *
 * Core recipe scaling logic ported from PostMultipliedRecipe.java (CSC-285, Fall 2024).
 * Extended with: mixed number output, colloquial quantity lookup, unit pluralization,
 * instruction scaling, and skip-if-equal logic.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedLine {
  scaledQty: string
  ingredient: string
  originalLine: string
  wasScaled: boolean
  note?: string
}

// ─── Colloquial quantity lookup ───────────────────────────────────────────────
// Maps colloquial terms to their value in teaspoons for scaling purposes.
// Source: standard culinary approximations.

const COLLOQUIAL_TO_TSP: Record<string, number> = {
  'a pinch':    1 / 16,
  'pinch':      1 / 16,
  'a smidge':   1 / 32,
  'smidge':     1 / 32,
  'a smidgen':  1 / 32,
  'smidgen':    1 / 32,
  'a dash':     1 / 8,
  'dash':       1 / 8,
  'a splash':   1,
  'splash':     1,
  'a drop':     1 / 16,
  'drop':       1 / 16,
}

const COLLOQUIAL_TO_CUP: Record<string, number> = {
  'a handful':  1 / 4,
  'handful':    1 / 4,
  'a bunch':    null as unknown as number, // pass-through
  'bunch':      null as unknown as number,
}

// Pluralization map for colloquial terms
const COLLOQUIAL_PLURAL: Record<string, string> = {
  'pinch':   'pinches',
  'smidge':  'smidges',
  'smidgen': 'smidgens',
  'dash':    'dashes',
  'splash':  'splashes',
  'drop':    'drops',
  'handful': 'handfuls',
}

// ─── Unit pluralization / singularization ─────────────────────────────────────

const UNIT_SINGULAR_TO_PLURAL: Record<string, string> = {
  'cup':         'cups',
  'tablespoon':  'tablespoons',
  'tbsp':        'tbsp',     // stays same
  'teaspoon':    'teaspoons',
  'tsp':         'tsp',      // stays same
  'pound':       'pounds',
  'lb':          'lbs',
  'ounce':       'ounces',
  'oz':          'oz',       // stays same
  'clove':       'cloves',
  'can':         'cans',
  'package':     'packages',
  'pkg':         'pkgs',
  'slice':       'slices',
  'sprig':       'sprigs',
  'stalk':       'stalks',
  'head':        'heads',
  'bunch':       'bunches',
  'strip':       'strips',
  'piece':       'pieces',
  'sheet':       'sheets',
  'quart':       'quarts',
  'pint':        'pints',
  'gallon':      'gallons',
  'liter':       'liters',
  'gram':        'grams',
  'kilogram':    'kilograms',
  'kg':          'kg',       // stays same
  'g':           'g',        // stays same
  'ml':          'ml',       // stays same
}

const UNIT_PLURAL_TO_SINGULAR: Record<string, string> = Object.fromEntries(
  Object.entries(UNIT_SINGULAR_TO_PLURAL)
    .filter(([s, p]) => s !== p)
    .map(([s, p]) => [p, s])
)

function pluralizeUnit(unit: string, qty: number): string {
  const lower = unit.toLowerCase()
  if (qty === 1) {
    return UNIT_PLURAL_TO_SINGULAR[lower] ?? unit
  }
  return UNIT_SINGULAR_TO_PLURAL[lower] ?? unit
}

// ─── Math helpers (ported from Java) ─────────────────────────────────────────

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(Math.abs(b), Math.abs(a % b))
}

/**
 * Converts a fraction string like "3/4" or "2/3" to a double.
 * Ported from PostMultipliedRecipe.java :: convertFractionStringToDouble()
 */
function fractionStringToDouble(s: string): number {
  const parts = s.split('/')
  if (parts.length !== 2) throw new Error(`Invalid fraction: ${s}`)
  const num = parseFloat(parts[0])
  const den = parseFloat(parts[1])
  if (isNaN(num) || isNaN(den) || den === 0) throw new Error(`Invalid fraction: ${s}`)
  return num / den
}

/**
 * Converts a decimal to a fraction string.
 * Returns a mixed number string if > 1 (e.g. 2.5 → "2 1/2").
 * Uses best rational approximation with denominator ≤ 64, which correctly
 * handles thirds (1/3, 2/3), sixths, and other non-dyadic fractions that the
 * original bit-doubling algorithm (from Java) would produce garbage for.
 */
function decimalToFraction(decimal: number): string {
  if (decimal === 0) return '0'
  const isNeg = decimal < 0
  decimal = Math.abs(decimal)

  const whole = Math.floor(decimal)
  const frac = decimal - whole

  if (frac < 0.001) {
    return isNeg ? `-${whole}` : `${whole}`
  }

  // Find best rational approximation with denominator ≤ 64
  let bestNum = 1, bestDen = 1, bestErr = Infinity
  for (let den = 1; den <= 64; den++) {
    const num = Math.round(frac * den)
    const err = Math.abs(num / den - frac)
    if (err < bestErr) {
      bestErr = err
      bestNum = num
      bestDen = den
    }
    if (err < 0.0001) break
  }

  const g = gcd(bestNum, bestDen)
  bestNum = bestNum / g
  bestDen = bestDen / g

  const fracStr = `${bestNum}/${bestDen}`
  const prefix = isNeg ? '-' : ''

  if (whole === 0) return `${prefix}${fracStr}`
  return `${prefix}${whole} ${fracStr}`
}

// Maps ASCII fraction strings to Unicode fraction characters.
// Covers all fractions with denominators 2, 3, 4, 5, 6, 8 that have Unicode code points.
const UNICODE_FRACTIONS: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
  '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
  '1/6': '⅙', '5/6': '⅚',
  '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
}

/**
 * Replaces ASCII fraction strings with Unicode equivalents where available.
 * "2 1/2" → "2½", "1/3" → "⅓", "6 2/3" → "6⅔"
 * Fractions without a Unicode equivalent (e.g. 1/7) are left as-is.
 */
function toUnicodeFractions(s: string): string {
  // Replace "N frac" (mixed number) — remove the space before the fraction
  s = s.replace(/(\d+) (\d+\/\d+)/g, (_, whole, frac) => {
    const u = UNICODE_FRACTIONS[frac]
    return u ? `${whole}${u}` : `${whole} ${frac}`
  })
  // Replace standalone fractions
  s = s.replace(/\b(\d+\/\d+)\b/g, (frac) => UNICODE_FRACTIONS[frac] ?? frac)
  return s
}

/**
 * Formats a scaled quantity for display.
 * Whole numbers returned as integers, fractions as Unicode mixed numbers.
 */
function formatQty(value: number): string {
  if (value === Math.floor(value) && value >= 0) {
    return String(Math.floor(value))
  }
  return toUnicodeFractions(decimalToFraction(value))
}

// ─── Colloquial scaling ───────────────────────────────────────────────────────

/**
 * Tries to match and scale a colloquial quantity at the start of a line.
 * Returns null if no colloquial match found.
 */
function tryScaleColloquial(
  line: string,
  multiplier: number
): { scaledQty: string; ingredient: string } | null {
  const lower = line.toLowerCase().trim()

  // Check tsp-based colloquials
  for (const [term, tsp] of Object.entries(COLLOQUIAL_TO_TSP)) {
    if (lower.startsWith(term)) {
      const remainder = line.slice(term.length).trimStart()
      const scaledTsp = tsp * multiplier

      // Try to express back as a colloquial if the multiplied value matches
      const matchingTerm = Object.entries(COLLOQUIAL_TO_TSP).find(
        ([, v]) => Math.abs(v - scaledTsp) < 0.001
      )
      if (matchingTerm) {
        const base = matchingTerm[0].replace(/^a /, '')
        const scaledQty = multiplier > 1
          ? COLLOQUIAL_PLURAL[base] ?? base
          : base
        return { scaledQty, ingredient: remainder }
      }

      // Otherwise express as tsp fraction
      return { scaledQty: `${formatQty(scaledTsp)} tsp`, ingredient: remainder }
    }
  }

  // Check cup-based colloquials
  for (const [term, cups] of Object.entries(COLLOQUIAL_TO_CUP)) {
    if (lower.startsWith(term)) {
      const remainder = line.slice(term.length).trimStart()
      if (cups === null) return null // pass-through for "bunch" etc.
      const scaledCups = cups * multiplier
      return { scaledQty: `${formatQty(scaledCups)} ${pluralizeUnit('cup', scaledCups)}`, ingredient: remainder }
    }
  }

  return null
}

// ─── Secondary quantity scaling ──────────────────────────────────────────────

/**
 * Scales any additional numeric quantities found within an ingredient string.
 * Used after the leading quantity is already extracted and scaled.
 * Example: "cups (480ml) chicken broth" → "cups (960ml) chicken broth" at ×2
 * Note: no > 200 guard here — ingredient amounts like (500ml) must scale.
 */
function scaleSecondaryQtys(ingredient: string, multiplier: number): string {
  return ingredient.replace(
    /\b(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+\.\d+)\b/gm,
    (m) => {
      try {
        let value: number
        if (m.includes(' ')) {
          const [w, f] = m.split(' ')
          value = parseFloat(w) + fractionStringToDouble(f)
        } else if (m.includes('/')) {
          value = fractionStringToDouble(m)
        } else {
          value = parseFloat(m)
          if (value < 0.01) return m
        }
        return formatQty(value * multiplier)
      } catch {
        return m
      }
    }
  )
}

// ─── Unit normalization (upgrade, downgrade, compound formatting) ─────────────
// Handles tsp↔tbsp↔cup, oz↔lb, ml↔L, g↔kg — both directions.

interface UnitPair {
  small: { aliases: string[]; canonical: string }
  large: { aliases: string[]; canonical: string }
  smallPerLarge: number    // e.g. 3 for tsp/tbsp
  upgradeAt: number        // qty in small >= this → try upgrading to large
  downgradeAt: number      // qty in large < this → downgrade to small
  requireCleanUpgrade: boolean
}

const UNIT_PAIRS: UnitPair[] = [
  {
    small: { aliases: ['tsp', 'teaspoon', 'teaspoons'],                                          canonical: 'tsp'  },
    large: { aliases: ['tbsp', 'tablespoon', 'tablespoons'],                                     canonical: 'tbsp' },
    smallPerLarge: 3,    upgradeAt: 3,    downgradeAt: 1,    requireCleanUpgrade: true,
  },
  {
    small: { aliases: ['tbsp', 'tablespoon', 'tablespoons'],                                     canonical: 'tbsp' },
    large: { aliases: ['cup', 'cups'],                                                           canonical: 'cup'  },
    smallPerLarge: 16,   upgradeAt: 4,    downgradeAt: 0.25, requireCleanUpgrade: true,
  },
  {
    small: { aliases: ['oz', 'ounce', 'ounces'],                                                 canonical: 'oz'   },
    large: { aliases: ['lb', 'lbs', 'pound', 'pounds'],                                         canonical: 'lb'   },
    smallPerLarge: 16,   upgradeAt: 16,   downgradeAt: 0.25, requireCleanUpgrade: true,
  },
  {
    small: { aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'],          canonical: 'ml'   },
    large: { aliases: ['l', 'L', 'liter', 'liters', 'litre', 'litres'],                         canonical: 'L'    },
    smallPerLarge: 1000, upgradeAt: 1000, downgradeAt: 0.25, requireCleanUpgrade: true,
  },
  {
    small: { aliases: ['g', 'gram', 'grams'],                                                    canonical: 'g'    },
    large: { aliases: ['kg', 'kilogram', 'kilograms'],                                           canonical: 'kg'   },
    smallPerLarge: 1000, upgradeAt: 1000, downgradeAt: 0.1,  requireCleanUpgrade: true,
  },
]

/** Returns true if qty's fractional part has denominator ≤ 8 (a real cooking measure). */
function hasCleanFraction(qty: number): boolean {
  const frac = qty - Math.floor(qty)
  if (frac < 0.001 || frac > 0.999) return true
  for (let den = 2; den <= 8; den++) {
    if (Math.abs(frac * den - Math.round(frac * den)) < 0.005) return true
  }
  return false
}

/**
 * Normalizes a scaled quantity to the most appropriate unit, handling both
 * upgrade (26 tbsp → 1 2/3 cups) and downgrade (1/8 cup → 2 tbsp, 0.5 tbsp → 1 1/2 tsp).
 * Upgrades only occur when the result has a clean fraction (denominator ≤ 8).
 */
function normalizeUnit(qty: number, unit: string): { qty: number; unit: string } {
  let cur = { qty, unit: unit.toLowerCase() }
  let changed = true
  while (changed) {
    changed = false
    for (const pair of UNIT_PAIRS) {
      if (pair.small.aliases.includes(cur.unit) && cur.qty >= pair.upgradeAt) {
        const newQty = cur.qty / pair.smallPerLarge
        if (!pair.requireCleanUpgrade || hasCleanFraction(newQty)) {
          cur = { qty: newQty, unit: pair.large.canonical }
          changed = true
          break
        }
      } else if (pair.large.aliases.includes(cur.unit) && cur.qty < pair.downgradeAt) {
        cur = { qty: cur.qty * pair.smallPerLarge, unit: pair.small.canonical }
        changed = true
        break
      }
    }
  }
  return cur
}

/**
 * Returns a compound display string when a fractional unit can be expressed
 * more usably as two unit terms:
 *   - tbsp with 1/3 or 2/3 fraction → "6 tbsp + 2 tsp"  (1 tbsp = 3 tsp)
 *   - tsp ≥ 3 with fractional remainder → "2 tbsp + ⅔ tsp"
 * Returns null if no compound form applies.
 */
function formatCompound(qty: number, unit: string): string | null {
  if (unit === 'tbsp') {
    const whole = Math.floor(qty)
    const frac = qty - whole
    if (frac < 0.001) return null  // exact whole tbsp, no compound needed
    const remainTsp = frac * 3
    const remainStr = formatQty(remainTsp)
    return whole > 0 ? `${whole} tbsp + ${remainStr} tsp` : `${remainStr} tsp`
  }

  if (unit === 'tsp' && qty >= 3) {
    const tbsp = Math.floor(qty / 3)
    const remainTsp = qty - tbsp * 3
    if (remainTsp < 0.001) return null // exact tbsp — normalizeUnit handles this
    const remainStr = formatQty(remainTsp)
    return `${tbsp} tbsp + ${remainStr} tsp`
  }

  return null
}

// ─── Main parsing regex (same as Java original) ───────────────────────────────
// Matches: whole number, mixed number (e.g. "1 1/2"), fraction (e.g. "3/4"), decimal
const QTY_REGEX = /^(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+\.\d+)\s+(.*)/s

/**
 * Parses and scales a single ingredient line.
 * Ported from PostMultipliedRecipe.java :: parseAndMultiplyIngredientLine()
 */
function parseLine(line: string, multiplier: number): ParsedLine {
  const trimmed = line.trim()
  if (!trimmed) return { scaledQty: '', ingredient: '', originalLine: line, wasScaled: false }

  // Normalize Unicode fractions to ASCII so "¼ cup sugar" and "2½ tbsp" parse correctly.
  // Step 1: insert space between digit and Unicode fraction (e.g. "2½" → "2 ½")
  // Step 2: replace Unicode fraction with ASCII (e.g. "¼" → "1/4")
  // Order matters — doing both in one pass would yield "21/2" from "2½".
  const unicodeMap: Record<string, string> = {
    '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
    '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
  }
  const unicodePattern = /[½⅓⅔¼¾⅛⅜⅝⅞]/g
  const normalized = trimmed
    .replace(/(\d)([½⅓⅔¼¾⅛⅜⅝⅞])/g, '$1 $2')
    .replace(unicodePattern, m => unicodeMap[m])

  // Try colloquial first
  const colloquial = tryScaleColloquial(normalized, multiplier)
  if (colloquial) {
    return {
      scaledQty: colloquial.scaledQty,
      ingredient: scaleSecondaryQtys(colloquial.ingredient, multiplier),
      originalLine: line,
      wasScaled: true,
    }
  }

  // Standard numeric parse
  const match = normalized.match(QTY_REGEX)
  if (!match) {
    return {
      scaledQty: '',
      ingredient: normalized,
      originalLine: line,
      wasScaled: false,
      note: 'No quantity found — not scaled',
    }
  }

  const qtyStr = match[1].trim()
  const ingredient = match[2].trim()

  let qty: number
  if (qtyStr.includes(' ')) {
    // Mixed number: "1 1/2"
    const [whole, frac] = qtyStr.split(' ')
    qty = parseFloat(whole) + fractionStringToDouble(frac)
  } else if (qtyStr.includes('/')) {
    // Fraction: "3/4"
    qty = fractionStringToDouble(qtyStr)
  } else {
    qty = parseFloat(qtyStr)
  }

  const scaled = qty * multiplier
  const words = ingredient.split(' ')
  const { qty: normQty, unit: normUnit } = normalizeUnit(scaled, words[0])

  // Compound format: "6 tbsp + 2 tsp" instead of "6 2/3 tbsp"
  const compound = formatCompound(normQty, normUnit)
  if (compound) {
    return {
      scaledQty: compound,
      ingredient: scaleSecondaryQtys(words.slice(1).join(' '), multiplier),
      originalLine: line,
      wasScaled: true,
    }
  }

  // Standard format
  const pluralizedUnit = pluralizeUnit(normUnit, normQty)
  const displayIngredient = pluralizedUnit.toLowerCase() !== words[0].toLowerCase()
    ? [pluralizedUnit, ...words.slice(1)].join(' ')
    : ingredient

  return {
    scaledQty: formatQty(normQty),
    ingredient: scaleSecondaryQtys(displayIngredient, multiplier),
    originalLine: line,
    wasScaled: true,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scales all lines in an ingredient list.
 * If originalServings === desiredServings, returns lines unchanged (README #1).
 */
export function scaleIngredients(
  ingredientsText: string,
  originalServings: number,
  desiredServings: number
): ParsedLine[] {
  const lines = ingredientsText.split('\n')

  // Skip conversion if servings are equal, but still apply Unicode fraction display
  if (originalServings === desiredServings) {
    return lines.map(line => ({
      scaledQty: '',
      ingredient: toUnicodeFractions(line.trim()),
      originalLine: line,
      wasScaled: false,
      note: 'Servings unchanged',
    }))
  }

  const multiplier = desiredServings / originalServings
  return lines
    .filter(line => line.trim() !== '')
    .map(line => parseLine(line, multiplier))
}

/**
 * Scales numeric quantities found within instructions text.
 * Applies the same multiplier to any numbers matching the ingredient qty regex.
 */
export function scaleInstructions(
  instructions: string,
  originalServings: number,
  desiredServings: number
): string {
  if (originalServings === desiredServings) return instructions
  const multiplier = desiredServings / originalServings

  // Process line by line to avoid scaling list markers (1. 2. 3) etc.)
  return instructions.split('\n').map(line => {
    // Preserve leading list markers: "1. ", "2) ", "3. " etc.
    const markerMatch = line.match(/^(\s*\d+[.)]\s+)/)
    const marker = markerMatch ? markerMatch[1] : ''
    const content = line.slice(marker.length)

    const scaledContent = content.replace(
      /\b(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+\.\d+)\b/g,
      (match, _g1, offset, str) => {
        // Don't scale cooking times (minutes, hours, seconds, days)
        const after = str.slice(offset + match.length).match(/^\s*([a-z]+)/i)
        if (after && /^(minutes?|mins?|hours?|hrs?|seconds?|secs?|days?)$/i.test(after[1])) return match
        try {
          let value: number
          if (match.includes(' ')) {
            const [w, f] = match.split(' ')
            value = parseFloat(w) + fractionStringToDouble(f)
          } else if (match.includes('/')) {
            value = fractionStringToDouble(match)
          } else {
            value = parseFloat(match)
            // Don't scale years, temperatures >200, or other large non-qty numbers
            if (value > 200 || value < 0.01) return match
          }
          return formatQty(value * multiplier)
        } catch {
          return match
        }
      }
    )
    return marker + scaledContent
  }).join('\n')
}

/**
 * Computes total cost and cost per serving from scaled ingredients.
 */
export function computeCosts(
  scaledIngredients: { unit_cost: number | null }[],
  desiredServings: number
): { totalCost: number; costPerServing: number } {
  const totalCost = scaledIngredients.reduce(
    (sum, i) => sum + (i.unit_cost ?? 0),
    0
  )
  return {
    totalCost,
    costPerServing: desiredServings > 0 ? totalCost / desiredServings : 0,
  }
}

/**
 * Formats a cost value as a dollar string.
 */
export function formatCost(value: number): string {
  return `$${value.toFixed(2)}`
}

/**
 * Generates a mailto: link body for emailing a scaled recipe.
 */
export function buildEmailBody(
  recipeName: string,
  originalServings: number,
  desiredServings: number,
  scaledLines: ParsedLine[],
  options?: {
    recipeInfo?: string | null
    sourceName?: string | null
    author?: string | null
    sourceUrl?: string | null
    instructions?: string | null
    totalCost?: number
  }
): string {
  const { recipeInfo, sourceName, author, sourceUrl, instructions, totalCost } = options ?? {}
  const multiplier = (desiredServings / originalServings).toFixed(2).replace(/\.?0+$/, '')
  const lines = scaledLines.map(l =>
    l.wasScaled
      ? `${l.scaledQty} ${l.ingredient}`
      : l.ingredient
  ).join('\n')

  let body = `${recipeName}\n`
  if (author) body += `Author: ${author}\n`
  if (sourceName) body += `Source: ${sourceName}\n`
  if (sourceUrl) body += `URL: ${sourceUrl}\n`
  if (recipeInfo) body += `\n${recipeInfo}\n`
  body += `\nScaled: ${originalServings} → ${desiredServings} servings (×${multiplier})\n\n`
  body += `INGREDIENTS\n${lines}`
  if (totalCost && totalCost > 0) {
    body += `\n\nTotal cost: $${totalCost.toFixed(2)}`
    body += `\nCost per serving: $${(totalCost / desiredServings).toFixed(2)}`
  }
  if (instructions) {
    body += `\n\nINSTRUCTIONS\n${instructions}`
  }
  body += `\n\n---\nSent from Recipe Multiplier`
  return body
}
