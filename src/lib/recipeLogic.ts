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
 * Ported from PostMultipliedRecipe.java :: convertDecimalToFraction()
 * with floating-point guard added for JS.
 */
function decimalToFraction(decimal: number): string {
  if (decimal === 0) return '0'
  const isNeg = decimal < 0
  decimal = Math.abs(decimal)

  const whole = Math.floor(decimal)
  let frac = decimal - whole

  if (frac < 0.001) {
    return isNeg ? `-${whole}` : `${whole}`
  }

  let numerator = frac
  let denominator = 1
  const MAX_ITER = 20

  for (let i = 0; i < MAX_ITER && Math.abs(numerator - Math.round(numerator)) > 0.0001; i++) {
    numerator *= 2
    denominator *= 2
    // floating-point guard (key difference from Java port)
    numerator = Math.round(numerator * 1e10) / 1e10
  }

  numerator = Math.round(numerator)
  const g = gcd(numerator, denominator)
  numerator = numerator / g
  denominator = denominator / g

  const fracStr = `${numerator}/${denominator}`
  const prefix = isNeg ? '-' : ''

  if (whole === 0) return `${prefix}${fracStr}`
  return `${prefix}${whole} ${fracStr}`
}

/**
 * Formats a scaled quantity for display.
 * Whole numbers returned as integers, fractions as mixed numbers.
 */
function formatQty(value: number): string {
  if (value === Math.floor(value) && value >= 0) {
    return String(Math.floor(value))
  }
  return decimalToFraction(value)
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

  // Try colloquial first
  const colloquial = tryScaleColloquial(trimmed, multiplier)
  if (colloquial) {
    return {
      scaledQty: colloquial.scaledQty,
      ingredient: colloquial.ingredient,
      originalLine: line,
      wasScaled: true,
    }
  }

  // Standard numeric parse
  const match = trimmed.match(QTY_REGEX)
  if (!match) {
    return {
      scaledQty: '',
      ingredient: trimmed,
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

  // Pluralize the first word of the ingredient if it's a known unit
  const words = ingredient.split(' ')
  const firstWord = words[0]
  const pluralizedUnit = pluralizeUnit(firstWord, scaled)
  const displayIngredient = pluralizedUnit !== firstWord
    ? [pluralizedUnit, ...words.slice(1)].join(' ')
    : ingredient

  return {
    scaledQty: formatQty(scaled),
    ingredient: displayIngredient,
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

  // Skip conversion if servings are equal (README #1)
  if (originalServings === desiredServings) {
    return lines.map(line => ({
      scaledQty: '',
      ingredient: line.trim(),
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

  // Replace numeric quantities in instructions (whole, mixed, fraction, decimal)
  return instructions.replace(
    /\b(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+\.\d+)\b/gm,
    (match) => {
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
    sourceName?: string | null
    author?: string | null
    sourceUrl?: string | null
    instructions?: string | null
    totalCost?: number
  }
): string {
  const { sourceName, author, sourceUrl, instructions, totalCost } = options ?? {}
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
  body += `Scaled: ${originalServings} → ${desiredServings} servings (×${multiplier})\n\n`
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
