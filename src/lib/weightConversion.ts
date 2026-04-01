/**
 * weightConversion.ts
 *
 * Converts scaled ingredient quantities to weight (g/kg).
 * Used in RecipeResults to show a weight column alongside volume measurements.
 *
 * Phase 1: hardcoded density table covering ~130+ common culinary ingredients.
 * Phase 2 (future): USDA FoodData Central seed into ingredient_densities table
 *   + Claude Haiku fallback for unlisted items.
 */

// ─── Unicode fraction helpers ──────────────────────────────────────────────────

const UNICODE_FRAC_MAP: Record<string, string> = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6',
}

const UNICODE_FRAC_PATTERN = /[½⅓⅔¼¾⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]/g

function normalizeFractions(s: string): string {
  return s
    .replace(/(\d)([½⅓⅔¼¾⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚])/g, '$1 $2')
    .replace(UNICODE_FRAC_PATTERN, m => UNICODE_FRAC_MAP[m] ?? m)
}

/** Parse a quantity string like "1⅔", "1 2/3", "1/2", or "40" into a number. */
function parseQtyStr(s: string): number {
  const norm = normalizeFractions(s.trim())
  const mixed = norm.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])
  const frac = norm.match(/^(\d+)\/(\d+)$/)
  if (frac) return parseInt(frac[1]) / parseInt(frac[2])
  const n = parseFloat(norm)
  return isNaN(n) ? 0 : n
}

// ─── Unit mappings ─────────────────────────────────────────────────────────────

const UNIT_ALIASES: Record<string, string> = {
  tsp: 'tsp', tsps: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tbsps: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbs: 'tbsp',
  cup: 'cup', cups: 'cup',
  'fl oz': 'fl_oz', 'fluid oz': 'fl_oz', 'fluid ounce': 'fl_oz', 'fluid ounces': 'fl_oz',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  pint: 'pint', pints: 'pint', pt: 'pint',
  quart: 'quart', quarts: 'quart', qt: 'quart',
  gallon: 'gallon', gallons: 'gallon', gal: 'gallon',
}

/** Volume units → milliliters. */
const ML_MAP: Record<string, number> = {
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  fl_oz: 29.5735,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
  ml: 1,
  l: 1000,
}

/** Weight units → grams (direct, no density needed). */
const G_MAP: Record<string, number> = {
  oz: 28.3495,
  lb: 453.592,
  g: 1,
  kg: 1000,
}

// ─── Density table (g/mL) ─────────────────────────────────────────────────────
// Longest-key-wins: sorted by key length descending at module load time.
// All matching is case-insensitive on the ingredient text (unit word stripped).

const DENSITIES_RAW: Array<[string, number]> = [
  // Oils
  ['avocado oil', 0.910],
  ['olive oil', 0.911],
  ['sesame oil', 0.920],
  ['toasted sesame oil', 0.920],
  ['coconut oil', 0.910],
  ['peanut oil', 0.910],
  ['sunflower oil', 0.910],
  ['vegetable oil', 0.910],
  ['canola oil', 0.910],
  ['corn oil', 0.910],
  ['grapeseed oil', 0.910],
  ['oil', 0.910],

  // Dairy and fats
  ['heavy whipping cream', 0.994],
  ['heavy cream', 0.994],
  ['whipping cream', 0.994],
  ['double cream', 0.994],
  ['light cream', 1.012],
  ['half-and-half', 1.025],
  ['half and half', 1.025],
  ['whole milk', 1.030],
  ['skim milk', 1.033],
  ['2% milk', 1.031],
  ['oat milk', 1.030],
  ['almond milk', 1.025],
  ['coconut milk beverage', 1.020],
  ['milk', 1.030],
  ['buttermilk', 1.026],
  ['greek yogurt', 1.100],
  ['plain yogurt', 1.050],
  ['sour cream', 1.055],
  ['crème fraîche', 1.010],
  ['creme fraiche', 1.010],
  ['yogurt', 1.050],
  ['cream cheese', 1.010],
  ['melted butter', 0.911],
  ['clarified butter', 0.911],
  ['ghee', 0.911],
  ['butter', 0.959],

  // Sweeteners
  ["confectioners' sugar", 0.507],
  ['confectioners sugar', 0.507],
  ['powdered sugar', 0.507],
  ['icing sugar', 0.507],
  ['packed brown sugar', 0.929],
  ['dark brown sugar', 0.929],
  ['light brown sugar', 0.929],
  ['brown sugar', 0.929],
  ['granulated sugar', 0.845],
  ['caster sugar', 0.845],
  ['superfine sugar', 0.845],
  ['white sugar', 0.845],
  ['golden syrup', 1.436],
  ['maple syrup', 1.315],
  ['dark corn syrup', 1.350],
  ['light corn syrup', 1.350],
  ['corn syrup', 1.350],
  ['agave nectar', 1.365],
  ['agave syrup', 1.365],
  ['agave', 1.365],
  ['molasses', 1.390],
  ['blackstrap molasses', 1.390],
  ['honey', 1.425],
  ['sugar', 0.845],

  // Flours and starches
  ['all-purpose flour', 0.528],
  ['all purpose flour', 0.528],
  ['bread flour', 0.528],
  ['cake flour', 0.473],
  ['pastry flour', 0.497],
  ['self-rising flour', 0.528],
  ['self rising flour', 0.528],
  ['whole-wheat flour', 0.561],
  ['whole wheat flour', 0.561],
  ['spelt flour', 0.528],
  ['rye flour', 0.528],
  ['almond meal', 0.443],
  ['almond flour', 0.443],
  ['coconut flour', 0.380],
  ['rice flour', 0.561],
  ['tapioca starch', 0.507],
  ['tapioca flour', 0.507],
  ['arrowroot powder', 0.507],
  ['arrowroot starch', 0.507],
  ['arrowroot', 0.507],
  ['cornstarch', 0.507],
  ['corn starch', 0.507],
  ['potato starch', 0.507],
  ['flour', 0.528],

  // Leaveners, thickeners, and salts
  ['baking powder', 0.812],
  ['baking soda', 1.217],
  ['bicarbonate of soda', 1.217],
  ['cream of tartar', 0.609],
  ['instant yeast', 0.629],
  ['active dry yeast', 0.568],
  ['rapid rise yeast', 0.629],
  ['yeast', 0.568],
  ['kosher salt', 0.568],
  ['flaky sea salt', 0.400],
  ['coarse sea salt', 0.568],
  ['fine sea salt', 1.217],
  ['sea salt', 1.217],
  ['table salt', 1.217],
  ['salt', 1.217],
  ['gelatin powder', 0.700],
  ['unflavored gelatin', 0.700],
  ['agar agar', 0.507],

  // Broths, stocks, and water
  ['chicken broth', 1.000],
  ['chicken stock', 1.000],
  ['beef broth', 1.000],
  ['beef stock', 1.000],
  ['vegetable broth', 1.000],
  ['vegetable stock', 1.000],
  ['fish stock', 1.000],
  ['bone broth', 1.000],
  ['dashi', 1.000],
  ['broth', 1.000],
  ['stock', 1.000],
  ['water', 1.000],

  // Juices and acids
  ['fresh lemon juice', 1.010],
  ['lemon juice', 1.010],
  ['fresh lime juice', 1.010],
  ['lime juice', 1.010],
  ['fresh orange juice', 1.040],
  ['orange juice', 1.040],
  ['apple cider', 1.040],
  ['apple juice', 1.040],
  ['pineapple juice', 1.040],
  ['grape juice', 1.058],

  // Vinegars
  ['white wine vinegar', 1.005],
  ['red wine vinegar', 1.005],
  ['apple cider vinegar', 1.005],
  ['rice wine vinegar', 1.005],
  ['champagne vinegar', 1.005],
  ['sherry vinegar', 1.005],
  ['balsamic vinegar', 1.085],
  ['distilled white vinegar', 1.005],
  ['malt vinegar', 1.005],
  ['vinegar', 1.005],

  // Wine, beer, and spirits
  ['dry white wine', 0.993],
  ['white wine', 0.993],
  ['dry red wine', 0.993],
  ['red wine', 0.993],
  ['sparkling wine', 0.993],
  ['prosecco', 0.993],
  ['champagne', 0.993],
  ['wine', 0.993],
  ['beer', 1.004],
  ['lager', 1.004],
  ['stout', 1.010],
  ['bourbon', 0.938],
  ['whiskey', 0.938],
  ['whisky', 0.938],
  ['rum', 0.935],
  ['vodka', 0.953],
  ['gin', 0.950],
  ['brandy', 0.940],
  ['tequila', 0.940],
  ['kahlua', 1.100],
  ['amaretto', 1.070],
  ['triple sec', 1.080],
  ['grand marnier', 1.040],

  // Extracts
  ['vanilla extract', 0.879],
  ['almond extract', 0.879],
  ['peppermint extract', 0.879],
  ['lemon extract', 0.879],
  ['orange extract', 0.879],
  ['extract', 0.879],

  // Condiments and sauces
  ['soy sauce', 1.105],
  ['low sodium soy sauce', 1.105],
  ['dark soy sauce', 1.150],
  ['tamari', 1.105],
  ['coconut aminos', 1.100],
  ['liquid aminos', 1.100],
  ['fish sauce', 1.090],
  ['oyster sauce', 1.150],
  ['hoisin sauce', 1.130],
  ['teriyaki sauce', 1.100],
  ['worcestershire sauce', 1.100],
  ['worcestershire', 1.100],
  ['hot sauce', 1.000],
  ['frank\'s redhot', 1.000],
  ['sriracha', 1.000],
  ['sambal oelek', 1.050],
  ['gochujang', 1.150],
  ['miso paste', 1.150],
  ['white miso', 1.150],
  ['red miso', 1.150],
  ['tomato paste', 1.100],
  ['tomato sauce', 1.050],
  ['marinara sauce', 1.050],
  ['pasta sauce', 1.050],
  ['crushed tomatoes', 1.050],
  ['diced tomatoes', 1.020],
  ['tomato puree', 1.050],
  ['salsa', 1.000],
  ['dijon mustard', 1.070],
  ['whole grain mustard', 1.070],
  ['yellow mustard', 1.070],
  ['dry mustard', 0.406],
  ['mustard', 1.070],
  ['ketchup', 1.100],
  ['mayonnaise', 0.910],
  ['ranch dressing', 0.960],
  ['caesar dressing', 0.960],
  ['balsamic glaze', 1.200],
  ['tahini', 0.960],
  ['almond butter', 1.060],
  ['sunflower seed butter', 1.060],
  ['cashew butter', 1.060],
  ['nut butter', 1.060],
  ['peanut butter', 1.060],
  ['coconut cream', 1.050],
  ['cream of coconut', 1.050],
  ['coconut milk', 1.000],
  ['evaporated milk', 1.066],
  ['sweetened condensed milk', 1.320],

  // Spices and dried herbs (g/mL in a measuring spoon, packed)
  ['italian seasoning', 0.193],
  ['herbes de provence', 0.193],
  ['poultry seasoning', 0.406],
  ['old bay seasoning', 0.406],
  ['everything bagel seasoning', 0.506],
  ['red pepper flakes', 0.264],
  ['crushed red pepper', 0.264],
  ['smoked paprika', 0.447],
  ['sweet paprika', 0.447],
  ['hot paprika', 0.447],
  ['garlic powder', 0.447],
  ['onion powder', 0.447],
  ['chili powder', 0.507],
  ['chipotle powder', 0.447],
  ['ancho chili powder', 0.447],
  ['curry powder', 0.447],
  ['garam masala', 0.447],
  ['chinese five spice', 0.406],
  ['five spice powder', 0.406],
  ['za\'atar', 0.193],
  ['sumac', 0.355],
  ['cayenne pepper', 0.447],
  ['black pepper', 0.447],
  ['white pepper', 0.447],
  ['ground pepper', 0.447],
  ['cracked pepper', 0.355],
  ['paprika', 0.447],
  ['cayenne', 0.447],
  ['turmeric', 0.527],
  ['ground turmeric', 0.527],
  ['ground cinnamon', 0.527],
  ['cinnamon', 0.527],
  ['ground cumin', 0.406],
  ['cumin', 0.406],
  ['ground coriander', 0.355],
  ['coriander', 0.355],
  ['ground cardamom', 0.406],
  ['cardamom', 0.406],
  ['ground nutmeg', 0.406],
  ['nutmeg', 0.406],
  ['ground allspice', 0.406],
  ['allspice', 0.406],
  ['ground cloves', 0.406],
  ['ground ginger', 0.406],
  ['ginger', 0.406],
  ['fennel seeds', 0.355],
  ['fennel seed', 0.355],
  ['caraway seeds', 0.355],
  ['caraway seed', 0.355],
  ['celery seeds', 0.406],
  ['celery seed', 0.406],
  ['sesame seeds', 0.507],
  ['sesame seed', 0.507],
  ['poppy seeds', 0.507],
  ['poppy seed', 0.507],
  ['mustard seeds', 0.406],
  ['mustard seed', 0.406],
  ['dried oregano', 0.193],
  ['dried thyme', 0.193],
  ['dried basil', 0.193],
  ['dried parsley', 0.152],
  ['dried dill', 0.152],
  ['dried sage', 0.193],
  ['dried mint', 0.152],
  ['dried rosemary', 0.223],
  ['dried cilantro', 0.152],
  ['dried chives', 0.152],
  ['dried tarragon', 0.193],
  ['dried marjoram', 0.193],
  ['fresh thyme', 0.203],
  ['fresh parsley', 0.152],
  ['fresh dill', 0.152],
  ['fresh basil', 0.152],
  ['fresh cilantro', 0.152],
  ['fresh mint', 0.152],
  ['fresh rosemary', 0.203],
  ['fresh sage', 0.193],
  ['fresh chives', 0.152],
  ['fresh tarragon', 0.193],
  ['oregano', 0.193],
  ['thyme', 0.193],
  ['basil', 0.152],
  ['parsley', 0.152],
  ['rosemary', 0.203],
  ['sage', 0.193],
  ['dill weed', 0.152],
  ['dill', 0.152],
  ['mint', 0.152],
  ['cilantro', 0.152],
  ['chives', 0.152],
  ['tarragon', 0.193],
  ['marjoram', 0.193],
  ['pepper', 0.447],

  // Cocoa and chocolate
  ['dutch-process cocoa powder', 0.358],
  ['dutch process cocoa powder', 0.358],
  ['unsweetened cocoa powder', 0.358],
  ['natural cocoa powder', 0.358],
  ['cocoa powder', 0.358],
  ['cacao powder', 0.358],
  ['cocoa', 0.358],
  ['hot cocoa mix', 0.507],
  ['chocolate chips', 0.600],
  ['mini chocolate chips', 0.600],

  // Grains and cereals
  ['old-fashioned rolled oats', 0.380],
  ['old fashioned rolled oats', 0.380],
  ['rolled oats', 0.380],
  ['old-fashioned oats', 0.380],
  ['old fashioned oats', 0.380],
  ['quick-cooking oats', 0.380],
  ['quick oats', 0.380],
  ['instant oats', 0.380],
  ['oats', 0.380],
  ['panko breadcrumbs', 0.211],
  ['panko bread crumbs', 0.211],
  ['panko', 0.211],
  ['fine breadcrumbs', 0.422],
  ['dry breadcrumbs', 0.422],
  ['bread crumbs', 0.422],
  ['breadcrumbs', 0.422],
  ['cornmeal', 0.674],
  ['polenta', 0.674],
  ['grits', 0.674],
  ['couscous', 0.590],
  ['farro', 0.780],
  ['uncooked rice', 0.781],
  ['raw rice', 0.781],
  ['white rice', 0.781],
  ['brown rice', 0.781],
  ['arborio rice', 0.781],
  ['sushi rice', 0.781],
  ['basmati rice', 0.781],
  ['jasmine rice', 0.781],
  ['rice', 0.781],

  // Cheese and dairy-adjacent
  ['grated parmesan', 0.507],
  ['shredded parmesan', 0.507],
  ['parmesan', 0.507],
  ['grated romano', 0.507],
  ['romano', 0.507],
  ['nutritional yeast', 0.355],
  ['protein powder', 0.507],
  ['whey protein', 0.507],
]

// Sort by key length descending so longer/more-specific keys match first.
const DENSITIES: Array<[string, number]> = DENSITIES_RAW.sort((a, b) => b[0].length - a[0].length)

// ─── Count weights (g per unit) ────────────────────────────────────────────────
// Order matters: most-specific entries must appear before less-specific ones.

interface CountEntry {
  keyword: string
  grams: number
  approx: boolean
}

const COUNT_WEIGHTS: CountEntry[] = [
  // Garlic — specific before general
  { keyword: 'head of garlic', grams: 50, approx: true },
  { keyword: 'head garlic', grams: 50, approx: true },
  { keyword: 'garlic clove', grams: 5, approx: true },
  { keyword: 'garlic', grams: 5, approx: true },

  // Eggs — specific before general
  { keyword: 'jumbo egg', grams: 56, approx: false },
  { keyword: 'extra large egg', grams: 56, approx: false },
  { keyword: 'extra-large egg', grams: 56, approx: false },
  { keyword: 'large egg', grams: 50, approx: false },
  { keyword: 'medium egg', grams: 44, approx: false },
  { keyword: 'small egg', grams: 38, approx: false },
  { keyword: 'egg white', grams: 33, approx: false },
  { keyword: 'egg yolk', grams: 17, approx: false },
  { keyword: 'egg', grams: 50, approx: false },

  // Bay leaves
  { keyword: 'bay leaves', grams: 0.6, approx: true },
  { keyword: 'bay leaf', grams: 0.6, approx: true },

  // Citrus
  { keyword: 'large lemon', grams: 180, approx: true },
  { keyword: 'small lemon', grams: 80, approx: true },
  { keyword: 'medium lemon', grams: 130, approx: true },
  { keyword: 'lemon', grams: 130, approx: true },
  { keyword: 'lime', grams: 65, approx: true },
  { keyword: 'large orange', grams: 230, approx: true },
  { keyword: 'medium orange', grams: 180, approx: true },
  { keyword: 'orange', grams: 180, approx: true },
  { keyword: 'grapefruit', grams: 400, approx: true },

  // Alliums
  { keyword: 'large onion', grams: 200, approx: true },
  { keyword: 'medium onion', grams: 150, approx: true },
  { keyword: 'small onion', grams: 100, approx: true },
  { keyword: 'red onion', grams: 150, approx: true },
  { keyword: 'onion', grams: 150, approx: true },
  { keyword: 'large shallot', grams: 40, approx: true },
  { keyword: 'medium shallot', grams: 30, approx: true },
  { keyword: 'shallot', grams: 30, approx: true },
  { keyword: 'green onion', grams: 15, approx: true },
  { keyword: 'scallion', grams: 15, approx: true },

  // Carrots
  { keyword: 'large carrot', grams: 110, approx: true },
  { keyword: 'medium carrot', grams: 80, approx: true },
  { keyword: 'small carrot', grams: 50, approx: true },
  { keyword: 'carrot', grams: 80, approx: true },

  // Celery
  { keyword: 'celery stalk', grams: 40, approx: true },
  { keyword: 'celery rib', grams: 40, approx: true },

  // Potatoes
  { keyword: 'large potato', grams: 300, approx: true },
  { keyword: 'medium potato', grams: 200, approx: true },
  { keyword: 'small potato', grams: 110, approx: true },
  { keyword: 'russet potato', grams: 200, approx: true },
  { keyword: 'yukon potato', grams: 200, approx: true },
  { keyword: 'red potato', grams: 170, approx: true },
  { keyword: 'baby potato', grams: 30, approx: true },
  { keyword: 'potato', grams: 200, approx: true },

  // Tomatoes
  { keyword: 'roma tomato', grams: 60, approx: true },
  { keyword: 'plum tomato', grams: 60, approx: true },
  { keyword: 'large tomato', grams: 180, approx: true },
  { keyword: 'medium tomato', grams: 120, approx: true },
  { keyword: 'small tomato', grams: 80, approx: true },
  { keyword: 'cherry tomato', grams: 17, approx: true },
  { keyword: 'grape tomato', grams: 10, approx: true },
  { keyword: 'tomato', grams: 120, approx: true },

  // Other produce
  { keyword: 'large avocado', grams: 250, approx: true },
  { keyword: 'small avocado', grams: 150, approx: true },
  { keyword: 'avocado', grams: 200, approx: true },
  { keyword: 'banana', grams: 120, approx: true },
  { keyword: 'large apple', grams: 220, approx: true },
  { keyword: 'medium apple', grams: 180, approx: true },
  { keyword: 'apple', grams: 180, approx: true },
  { keyword: 'jalapeño pepper', grams: 15, approx: true },
  { keyword: 'jalapeno pepper', grams: 15, approx: true },
  { keyword: 'jalapeño', grams: 15, approx: true },
  { keyword: 'jalapeno', grams: 15, approx: true },
  { keyword: 'serrano pepper', grams: 8, approx: true },
  { keyword: 'chipotle pepper', grams: 10, approx: true },
  { keyword: 'chipotle chile', grams: 10, approx: true },
  { keyword: 'dried chile', grams: 10, approx: true },
  { keyword: 'ancho chile', grams: 15, approx: true },
  { keyword: 'poblano pepper', grams: 100, approx: true },
  { keyword: 'bell pepper', grams: 150, approx: true },
  { keyword: 'head of cabbage', grams: 900, approx: true },
  { keyword: 'head of lettuce', grams: 300, approx: true },
  { keyword: 'head of cauliflower', grams: 600, approx: true },
  { keyword: 'head of broccoli', grams: 400, approx: true },
  { keyword: 'corn cob', grams: 200, approx: true },
  { keyword: 'ear of corn', grams: 200, approx: true },
  { keyword: 'ear corn', grams: 200, approx: true },

  // Proteins
  { keyword: 'anchovy fillet', grams: 4, approx: true },
  { keyword: 'anchovy', grams: 4, approx: true },
  { keyword: 'strip of bacon', grams: 15, approx: true },
  { keyword: 'strip bacon', grams: 15, approx: true },
  { keyword: 'slice of bacon', grams: 15, approx: true },
  { keyword: 'slice bacon', grams: 15, approx: true },
  { keyword: 'rasher bacon', grams: 15, approx: true },
  { keyword: 'bacon strip', grams: 15, approx: true },
]

// ─── Lookup helpers ────────────────────────────────────────────────────────────

/** Find g/mL density for ingredient text using longest-key-wins. */
function findDensity(text: string): number | null {
  const lower = text.toLowerCase()
  for (const [key, density] of DENSITIES) {
    if (lower.includes(key)) return density
  }
  return null
}

/** Find g/unit count weight for ingredient text. */
function findCountWeight(text: string): { grams: number; approx: boolean } | null {
  const lower = text.toLowerCase()
  for (const entry of COUNT_WEIGHTS) {
    if (lower.includes(entry.keyword)) {
      return { grams: entry.grams, approx: entry.approx }
    }
  }
  return null
}

function canonicalizeUnit(word: string): string | null {
  // Strip trailing punctuation (e.g. "lbs." → "lbs", "tsp," → "tsp")
  const clean = word.replace(/[.,;:]+$/, '')
  return UNIT_ALIASES[clean] ?? UNIT_ALIASES[clean.toLowerCase()] ?? null
}

// ─── Formatting and display helpers ───────────────────────────────────────────

/** Format a gram value as a human-readable weight string. */
export function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(1)} kg`
  return `${Math.round(g)} g`
}

/**
 * Strip the leading unit word from an ingredient field when it's a recognized
 * volume or weight unit. Used for weight-mode display.
 * e.g. "cups olive oil" → "olive oil", "lbs chicken thighs" → "chicken thighs"
 * e.g. "cloves garlic, minced" → "cloves garlic, minced" (count units kept)
 * e.g. "fresh thyme" → "fresh thyme" (no leading unit)
 */
export function getIngredientName(ingredientText: string): string {
  const words = ingredientText.trim().split(/\s+/)
  if (words.length > 1) {
    const canonical = canonicalizeUnit(words[0])
    if (canonical && (canonical in ML_MAP || canonical in G_MAP)) {
      return words.slice(1).join(' ')
    }
  }
  return ingredientText
}

// ─── Compound part parser ──────────────────────────────────────────────────────

interface CompoundPart {
  qty: number
  unit: string // canonical key in ML_MAP
}

/**
 * Parse a compound part like "1 tbsp" or "1⅘ tsp" into qty + canonical unit.
 * Only handles volume units (compound quantities are always volume).
 */
function parseCompoundPart(part: string): CompoundPart | null {
  const normalized = normalizeFractions(part.trim())
  // Matches: "1 tbsp", "1 2/3 cups", "1/2 tsp", "2 cups"
  const match = normalized.match(/^(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+(?:\.\d+)?)\s+([a-zA-Z]+)$/)
  if (!match) return null
  const qty = parseQtyStr(match[1])
  const unit = canonicalizeUnit(match[2])
  if (!unit || !(unit in ML_MAP)) return null
  return { qty, unit }
}

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Convert a scaled ingredient quantity to a weight string (g or kg).
 * Returns null if no conversion is possible — the weight cell will be blank.
 *
 * @param scaledQty     - The scaledQty field from ParsedLine.
 *                        Simple: "1⅔" | Compound: "6 tbsp + 2 tsp" | Count: "53⅓"
 * @param ingredientText - The ingredient field from ParsedLine.
 *                        Includes the unit word for simple cases: "cups olive oil",
 *                        "lbs chicken thighs", "cloves garlic, minced", "fresh thyme"
 */
export function toWeightQty(
  scaledQty: string,
  ingredientText: string,
): { display: string; approx: boolean } | null {
  // ── Case 1: compound quantity ("6 tbsp + 2 tsp") ──────────────────────────
  if (scaledQty.includes(' + ')) {
    const parts = scaledQty.split(' + ').map(parseCompoundPart)
    if (parts.some(p => p === null)) return null

    let totalMl = 0
    for (const p of parts as CompoundPart[]) {
      totalMl += p.qty * ML_MAP[p.unit]
    }
    if (totalMl <= 0) return null

    const density = findDensity(ingredientText)
    if (density === null) return null

    return { display: formatGrams(totalMl * density), approx: false }
  }

  // Extract the first word of ingredientText to identify the unit
  const words = ingredientText.trim().split(/\s+/)
  const unitWord = words[0] ?? ''
  const canonical = canonicalizeUnit(unitWord)

  // ── Case 2: weight unit (oz, lb, g, kg) — direct conversion ───────────────
  if (canonical && canonical in G_MAP) {
    const qty = parseQtyStr(scaledQty)
    if (qty <= 0) return null
    return { display: formatGrams(qty * G_MAP[canonical]), approx: false }
  }

  // ── Case 3: volume unit (tsp, tbsp, cup, fl oz, etc.) ─────────────────────
  if (canonical && canonical in ML_MAP) {
    const qty = parseQtyStr(scaledQty)
    if (qty <= 0) return null
    const ml = qty * ML_MAP[canonical]
    const ingredientOnly = words.slice(1).join(' ')
    const density = findDensity(ingredientOnly)
    if (density === null) return null
    return { display: formatGrams(ml * density), approx: false }
  }

  // ── Case 4: count unit (cloves, heads, eggs, sprigs, etc.) ────────────────
  const qty = parseQtyStr(scaledQty)
  if (qty <= 0) return null

  const countWeight = findCountWeight(ingredientText)
  if (countWeight === null) return null

  return { display: formatGrams(qty * countWeight.grams), approx: countWeight.approx }
}
