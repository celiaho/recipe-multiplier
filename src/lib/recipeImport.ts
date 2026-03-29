/**
 * recipeImport.ts
 *
 * Fetches a recipe URL and extracts structured data using Schema.org Recipe JSON-LD,
 * which is embedded by most major recipe sites (NYT Cooking, AllRecipes, Serious Eats, etc.)
 */

export interface ImportedRecipe {
  name: string
  author: string | null
  ingredients: string        // newline-separated ingredient list
  instructions: string       // plain text, newline-separated steps
  originalServings: number | null
  sourceUrl: string
}

export type ImportResult =
  | { success: true; recipe: ImportedRecipe }
  | { success: false; error: string }

/**
 * Normalizes Schema.org author, which can be a string, Person object, or array.
 */
function normalizeAuthor(raw: unknown): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw.trim() || null
  if (Array.isArray(raw)) return normalizeAuthor(raw[0])
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return String(obj.name ?? '').trim() || null
  }
  return null
}

/**
 * Normalizes Schema.org recipeInstructions, which can be:
 * - A plain string
 * - An array of strings
 * - An array of HowToStep objects { "@type": "HowToStep", "text": "..." }
 * - An array of HowToSection objects containing steps
 */
function normalizeInstructions(raw: unknown): string {
  if (!raw) return ''

  if (typeof raw === 'string') return raw.trim()

  if (Array.isArray(raw)) {
    const steps = raw.flatMap((item): string[] => {
      if (typeof item === 'string') return [item.trim()]
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>
        if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
          return (obj.itemListElement as unknown[]).map(step => {
            if (typeof step === 'string') return step.trim()
            if (typeof step === 'object' && step !== null) {
              return String((step as Record<string, unknown>).text ?? '').trim()
            }
            return ''
          }).filter(Boolean)
        }
        if (obj.text) return [String(obj.text).trim()]
      }
      return []
    }).filter(Boolean)
    return steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
  }

  return ''
}

/**
 * Normalizes recipeYield, which can be a string ("8 servings"), number, or array.
 */
function normalizeYield(raw: unknown): number | null {
  if (!raw) return null
  const arr = Array.isArray(raw) ? raw : [raw]
  for (const item of arr) {
    const str = String(item)
    const match = str.match(/(\d+(?:\.\d+)?)/)
    if (match) return parseFloat(match[1])
  }
  return null
}

/**
 * Extracts Schema.org Recipe data from parsed HTML text.
 * Looks for <script type="application/ld+json"> blocks containing @type: Recipe.
 */
function extractSchemaRecipe(html: string): ImportedRecipe | null {
  // Find all JSON-LD script blocks
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1])
      const candidates: unknown[] = []

      // Handle @graph arrays (common on WordPress/Yoast sites)
      if (json['@graph'] && Array.isArray(json['@graph'])) {
        candidates.push(...json['@graph'])
      } else if (Array.isArray(json)) {
        candidates.push(...json)
      } else {
        candidates.push(json)
      }

      for (const candidate of candidates) {
        const obj = candidate as Record<string, unknown>
        const type = obj['@type']
        const isRecipe =
          type === 'Recipe' ||
          (Array.isArray(type) && type.includes('Recipe'))

        if (!isRecipe) continue

        const name = String(obj.name ?? '').trim()
        if (!name) continue

        const ingredientsRaw = obj.recipeIngredient
        const ingredients = Array.isArray(ingredientsRaw)
          ? ingredientsRaw.map(i => String(i).trim()).join('\n')
          : ''

        const instructions = normalizeInstructions(obj.recipeInstructions)
        const originalServings = normalizeYield(obj.recipeYield)
        const author = normalizeAuthor(obj.author)

        return { name, author, ingredients, instructions, originalServings, sourceUrl: '' }
      }
    } catch {
      // JSON parse error — try next block
      continue
    }
  }

  return null
}

/**
 * Server-side function: fetches a URL and parses Schema.org Recipe data.
 * Must only be called from an API route (server context).
 */
export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl
  }

  let html: string
  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        // Mimic a real browser to avoid bot-blocking
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeMultiplier/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Could not fetch that URL (HTTP ${response.status}). Try copying the ingredients manually.`,
      }
    }

    html = await response.text()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `Could not reach that URL: ${message}. Try copying the ingredients manually.`,
    }
  }

  const recipe = extractSchemaRecipe(html)

  if (!recipe) {
    return {
      success: false,
      error: "This site doesn't include structured recipe data. Try copying the ingredients manually.",
    }
  }

  return {
    success: true,
    recipe: { ...recipe, sourceUrl: normalizedUrl },
  }
}
