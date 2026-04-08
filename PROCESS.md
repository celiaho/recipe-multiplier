# Development Process: Recipe Multiplier

## Overview

This document traces how the Recipe Multiplier web app was designed and built, including the role of AI-assisted development. It is intended as a portfolio artifact demonstrating how AI tools can accelerate engineering work without replacing engineering judgment.

---

## Origin

The project started as a school assignment: a Java servlet app (CSC-285 Advanced Java, Fall 2024 at BHCC) that scaled recipe ingredient quantities up or down. The original code lives in:
`C:\BHCC\2024_Fall\CSC-285_Advanced_Java\Projects\CSC-285_Advanced_Java_Assignments\20241116_W10_HW6_Servlets_Recipe_Multiplier\`

A local chef asked for a real tool along these lines. That request prompted expanding the school project into a deployable, multi-user web application.

---

## How AI Was Used

The development of this app was conducted collaboratively with Claude (Anthropic), used as a development accelerator. The process was conversational and iterative:

### What I provided (engineering judgment and product decisions):
- The original Java implementation to port
- User requirements: who the app is for (a chef/catering business owner and their staff), what it needs to do
- Specific feature requests at each step, with reasoning
- Decisions about architecture trade-offs when options were presented
- Review and approval of the plan before any code was written
- Identification of requirements that changed scope (e.g., adding user accounts after initially scoping a static JS app)

### What Claude contributed (implementation acceleration):
- Explored the existing codebase and read all source files
- Proposed two deployment approaches (Java + Docker vs. static JS) with trade-off analysis, and explained why each was appropriate or not
- Designed the full data model, API structure, and component tree
- Ported the Java fraction/scaling logic to TypeScript faithfully
- Extended the logic with new features: colloquial quantity lookup table, mixed-number output, instruction scaling, unit pluralization
- Wrote all boilerplate (Next.js scaffold setup, Supabase client config, middleware, SQL schema)
- Diagnosed and resolved a real disk space issue on the development machine mid-session
- Fixed TypeScript errors caught during the build check

### What was reviewed and decided jointly:
- Stack selection (Next.js + Supabase + Vercel vs. alternatives)
- Which features belong in MVP vs. later phases, and why
- The Google Drive-style sharing model design
- Privacy rules (chef notes visible only to owner)
- Email sharing via `mailto:` rather than a paid email service

---

## Architecture Decisions

### Why Next.js instead of Java or Python for deployment
The original app was Java servlets, which require a persistent server. Free hosting tiers (Render, Railway) put servers to sleep after 15 minutes of inactivity, causing 30–60 second "cold starts" on first visit. Next.js serverless functions on Vercel have ~100ms cold starts and a genuinely free tier with no sleep behavior. Since the frontend and backend can share one codebase in Next.js, it also eliminates the need to manage two separate deployments.

### Why Supabase for auth and database
Building auth from scratch is error-prone and time-consuming. Supabase provides Postgres + auth + Row Level Security in one free-tier service. The RLS policies mean the database itself enforces sharing rules — a shared user simply cannot query recipes they shouldn't see, regardless of what the API does.

### Why the sharing model works the way it does
The design mirrors Google Drive's per-document sharing because that's a model catering professionals already understand. Key decisions:
- Only owners can manage shares (editors cannot re-share)
- Chef notes are enforced private at both the API and UI layer
- View-only access is genuinely read-only: the edit form is not rendered for view-only users

### Why colloquial quantities are in MVP
A lookup table (pinch = 1/16 tsp, dash = 1/8 tsp, etc.) is a data problem, not a parsing problem. The cost of implementing it is low and the value for a professional chef is high. Moving it to a later phase would have been an arbitrary delay.

### Why unit conversion is Phase 2
Converting "48 teaspoons" → "1 cup" requires both a conversion table and rules for *when* to convert. You don't want "2 teaspoons" to become "0.04 cups". Getting those threshold rules right requires real user feedback, which means shipping first.

---

## File Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Landing page
│   ├── login/              # Auth pages
│   ├── signup/
│   ├── account/            # Profile + avatar upload
│   ├── recipes/            # Recipe library, new recipe, view/edit, share
│   └── api/                # Serverless API routes (recipes, shares, import-url, avatar)
├── components/             # Shared React components
│   ├── Navbar.tsx
│   ├── Avatar.tsx          # Initials fallback + photo display
│   ├── AvatarUpload.tsx    # File upload to Supabase Storage
│   ├── RecipeCard.tsx      # Library card with owner avatar + share indicator
│   ├── RecipeForm.tsx      # Full scaling form with URL import tab
│   ├── RecipeResults.tsx   # Scaled output with costs, email, print, copy
│   └── ShareManager.tsx    # Google Drive-style sharing panel
├── lib/
│   ├── supabase/           # Client, server, middleware helpers
│   ├── recipeLogic.ts      # Core scaling logic (ported from Java)
│   └── recipeImport.ts     # URL fetch + Schema.org JSON-LD parser
└── types/
    └── database.ts         # TypeScript types for all DB entities
```

---

## Key Logic: Java → TypeScript Port

The four core methods from `PostMultipliedRecipe.java` were ported to `lib/recipeLogic.ts`:

| Java method | TypeScript equivalent | Notes |
|---|---|---|
| `convertFractionStringToDouble()` | `fractionStringToDouble()` | Direct port |
| `gcd()` | `gcd()` | Euclidean algorithm, direct port |
| `convertDecimalToFraction()` | `decimalToFraction()` | Added `Math.round(x * 1e10) / 1e10` floating-point guard required in JS |
| `parseAndMultiplyIngredientLine()` | `parseLine()` | Same regex; extended with colloquial lookup and unit pluralization |

New additions not in the original Java:
- `tryScaleColloquial()` — lookup table for pinch/dash/splash/handful etc.
- `scaleInstructions()` — applies the multiplier to numeric quantities in instruction text
- `formatQty()` — formats output as mixed numbers (2 1/2 not 5/2)
- `buildEmailBody()` — generates the pre-filled mailto: body

---

## Deployment Checklist

1. ✅ Create a [Supabase](https://supabase.com) project
2. ✅ Run `supabase-schema.sql` in the Supabase SQL Editor
3. ✅ Copy Supabase URL and anon key into `.env.local`
4. Push this repo to GitHub (`celiaho/recipe-multiplier`)
5. Import the repo to [Vercel](https://vercel.com) — add the same env vars
6. In Vercel: Settings → Domains → add `recipe.celiaho.com`
7. In your DNS provider: add `CNAME recipe → cname.vercel-dns.com`

---

## Deployment Session (2026-03-28)

This session picked up after the app was fully built. The working directory had changed between sessions, causing the prior Claude conversation to malfunction. A new conversation was started in the correct directory (`C:\Projects`) and context was reconstructed from the existing files (`PROCESS.md`, `supabase-schema.sql`, `.env.local`).

### What the user did:
- Created a Supabase project and retrieved the project URL and anon key
- Ran `supabase-schema.sql` in the Supabase SQL Editor (result: "Success. No rows returned")
- Provided credentials for `.env.local`

### What Claude did:
- Reconstructed project context by reading existing files rather than relying on conversation history
- Identified the `.env.local` placeholder file already scaffolded in a prior session and updated it with real credentials
- Advised creating a new GitHub repo (`celiaho/recipe-multiplier`) separate from the class assignment repo, on the grounds that this is a distinct v2.0 personal project and mixing them would undersell both

### Decision: Separate GitHub repo
The original Java servlet app lives in `celiaho/CSC-285_Advanced_Java_Assignments`. This Next.js rewrite is a full-stack TypeScript application with Supabase auth, Postgres, Row Level Security, cloud storage, and Vercel deployment — a different project in every meaningful sense. A dedicated repo communicates that clearly to anyone reviewing the portfolio.

---

## Deployment Completion Session (2026-03-30)

### Deployment checklist — final status

1. ✅ Create a [Supabase](https://supabase.com) project
2. ✅ Run `supabase-schema.sql` in the Supabase SQL Editor
3. ✅ Copy Supabase URL and anon key into `.env.local`
4. ✅ Pushed repo to GitHub (`celiaho/recipe-multiplier`)
5. ✅ Imported repo to [Vercel](https://vercel.com) — added Supabase env vars
6. ✅ In Vercel: Settings → Domains → added `recipemultiplier.celiaho.com`
7. ✅ In Squarespace DNS: added `CNAME recipemultiplier → cname.vercel-dns.com`

Note: the original deployment plan used `recipe.celiaho.com` as the subdomain. Changed to `recipemultiplier.celiaho.com` for clarity.

### Resend setup

Supabase's built-in email provider is rate-limited to approximately 3 auth emails per hour. At any real usage level this blocks signup confirmations and password resets. Resend was configured as the custom SMTP provider in Supabase Auth settings (Authentication → SMTP Settings). Resend's free tier supports 3,000 emails/month with no hourly cap — sufficient for a beta deployment.

### DNS issue with Squarespace

Adding a CNAME record in Squarespace's DNS panel (`recipemultiplier` → `cname.vercel-dns.com`) requires saving through Squarespace's interface. DNS propagation takes minutes to hours; Vercel shows the domain as unverified until propagation completes. Both `recipemultiplier.celiaho.com` and the Vercel deployment URL are now resolving correctly.

### Git remote URL mismatch

The recipe-multiplier repo's remote was set to SSH (`git@github.com:celiaho/recipe-multiplier.git`) but no SSH key was configured on this machine. The fix was switching to HTTPS:

```
git remote set-url origin https://github.com/celiaho/recipe-multiplier.git
```

Also, the local `main` branch had no upstream tracking set (the initial push was done without `-u`), so the first push required:

```
git push --set-upstream origin main
```

After that, `git push` works as expected.

### Middleware → proxy rename (Next.js 16)

Next.js 16 deprecated the `middleware` file convention in favor of `proxy`. Two changes were required:

1. Rename `src/middleware.ts` → `src/proxy.ts`
2. Rename the exported function inside the file from `middleware` to `proxy`

Both changes are necessary — renaming only the file causes a Vercel build failure ("Proxy is missing expected function export name").

### Favicon: favicon.ico vs icon.tsx

Next.js serves `favicon.ico` from `src/app/` with higher priority than a programmatic `icon.tsx`. To use `icon.tsx` (which renders the 🍴 emoji as a PNG), the old `favicon.ico` had to be deleted. Browsers also cache favicons aggressively — a hard refresh (Ctrl+Shift+R) or incognito window is needed to see the updated icon after deployment.

### Beta label and known issues notice

Added in this session:
- Amber "Beta" badge in the navbar next to the logo (`Navbar.tsx`)
- Page title updated to "Recipe Multiplier (Beta)" (`layout.tsx`)
- Amber callout above the recipe form warning users of the known scaling issue (`recipes/new/page.tsx`)
- README.md written from scratch (was empty)
- "Further development" notice added to the original Java servlet README and pushed to `celiaho/CSC-285_Advanced_Java_Assignments`

---

## Beta Polish & Infrastructure Session (2026-04-01 to 2026-04-07)

### Contact page (`/contact`)

New server-rendered page with a client-side form (`ContactForm.tsx`). Features:
- Subject dropdown (Bug report, Feature request, Compliments, General question, Privacy or data request, Other)
- Optional screenshot upload (images only, 5 MB limit)
- Pre-fills name and email for logged-in users via server-side Supabase query
- Submits as `multipart/FormData` to `/api/contact` → sends via Resend with `replyTo` set to the user's address
- Public-facing email address deliberately not shown anywhere (anti-scraping); contact form is the only contact method shown in Privacy Policy and Terms of Service

### Dismissible beta banner (`BetaBanner.tsx`)

Replaced static amber callout on `/recipes/new` with a client component that reads/writes `localStorage`. Once dismissed, the banner does not reappear. Storagekey: `beta-banner-dismissed`.

### Dismissible onboarding callouts (`DismissibleCallout.tsx`)

New reusable client component supporting `emerald` and `amber` color variants. Reads localStorage on mount to determine visibility. Shows a tip box with ✕ dismiss button. Used for:
- Emerald callout above ingredient list: explains weight/volume toggle, links to Account Settings
- Amber callout near Save button: prompts first-time users to save their scaled recipe

To reset dismissed state for testing: DevTools → Application → Local Storage → delete `hint-weight-toggle` and `hint-save-recipe`.

### Custom 404 (`src/app/not-found.tsx`)

Next.js App Router convention — automatically rendered for all unmatched routes. Uses a kawaii cracked-egg PNG (generated via Bing Image Creator, background removed in Photopea) with chef-themed copy: "This recipe doesn't exist." Two CTAs: Go home + My Recipes.

### Featurebase feedback platform

Featurebase (recipemultiplier.featurebase.app) used as the user feedback portal. The embed widget requires a paid plan, so the Navbar "Send Feedback" dropdown item links externally. The Featurebase JS SDK is loaded via `next/script` in `layout.tsx` with `strategy="afterInteractive"` and `organization: 'recipemultiplier'`.

### Footer + Privacy Policy + Terms of Service

`Footer.tsx` server component added to all six main pages (landing, recipes list, new recipe, recipe detail, edit, account). Links: Privacy Policy → `/privacy`, Terms → `/terms`, Send Feedback → Featurebase portal.

`/privacy` and `/terms` are minimal but legally functional pages. Contact sections link to `/contact` — the email address is not exposed on any public page.

### Bug fixes (scaling logic)

**`scaleSecondaryQtys` decimal regex** — the alternation `\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+\.\d+` matched integers before decimals, so "5.5" was matched as two separate "5"s → each scaled → "10.10". Fixed by moving `\d+\.\d+` to the front of the alternation. Same fix applied to `scaleInstructions`.

**`decimalToFraction` near-integer** — `0.666… × 3 = 1.9999…` caused the fractional part to be `0.9999`, which rendered as "1 1/1" (wrong). Fixed with `if (frac > 0.999) return whole + 1`.

---

## UI Polish & Sharing Session (2026-04-07)

### UI Polish Batch

Thirteen targeted UI improvements made across the app:

| # | Change | File(s) |
|---|--------|---------|
| 1 | Desired Servings field: `bg-stone-50` outlined box in its grid column | `RecipeForm.tsx` |
| 2 | Search bar: magnifying glass SVG icon, white background | `RecipeList.tsx` |
| 3 | Search expanded to all recipe fields (ingredients, recipe info, chef notes) | `RecipeList.tsx` |
| 4 | "Recipe Info" section heading added in saved recipe view | `RecipeResults.tsx` |
| 5 | "Copy list" → "Copy ingredients" | `RecipeResults.tsx` |
| 6 | Edit/Share/Delete consolidated into RecipeResults action row (removed from page level) | `RecipeResults.tsx`, `[id]/page.tsx` |
| 7 | Measurement tooltip: USDA FoodData Central hyperlink in text; `font-sans` fix; "Manage default" link replaced with inline "Set your default in Account Settings" note | `RecipeResults.tsx` |
| 8 | Amber save callout shortened: removed "Want to keep this scaled recipe? " prefix | `RecipeResults.tsx` |
| 9 | Chef notes now visible before saving (previously missing `chefNotes` prop) | `RecipeForm.tsx` |
| 10 | Chef notes: left-border amber style instead of amber background (avoids visual confusion with DismissibleCallout) | `RecipeResults.tsx` |
| 11 | Chef notes empty state: shows "No chef notes yet." when owner has no notes, rather than hiding the section | `RecipeResults.tsx` |
| 12 | Em dashes without surrounding spaces throughout all user-visible text (`word—word` not `word — word`) | All UI files |
| 13 | Recipe card dates prefixed with "Saved" | `RecipeCard.tsx` |

### Sharing improvements

**"Shared with [Name]" display:** Recipe cards now show the actual names of people a recipe is shared with rather than "Shared with N". Display formats:
- 1 share: "Shared with FirstName LastName"
- 2 shares: "Shared with 2: Name1 and Name2"
- 3+ shares: "Shared with N: Name1, Name2, Name3 and others"

The 👥 icon is a clickable link to the share management page. Share info is also shown below the action row on the recipe detail page (owner only).

Required a query change: own recipes now select `recipe_shares(id, shared_with, profiles!recipe_shares_shared_with_fkey(first_name, last_name))` instead of `recipe_shares(id)`.

**Remove-access confirmation:** Clicking ✕ in the share manager now shows an inline "Remove? Yes / No" prompt before executing the removal, preventing accidental revocations.

### Count unit word parsing fix (`weightConversion.ts`)

Ingredient lines like "8¼ pieces dried bay leaves" showed a split display in Both mode because "pieces" wasn't in the unit-stripping list. `getIngredientName()` now strips: `piece/pieces`, `head/heads`, `bunch/bunches`, `sprig/sprigs`, `stalk/stalks`, `slice/slices`, `sheet/sheets`, `link/links`, `knob/knobs`, `floret/florets`. Result: volume column shows `8¼ pieces`, ingredient name column shows `dried bay leaves`.

---

## What I Would Do Next

- **Phase 2:** USDA FoodData Central seed script (`scripts/seed-ingredient-densities.ts`) to populate `ingredient_densities` table; AI fallback (Claude Haiku) for unlisted ingredients; `/ingredient-densities` read-only lookup page
- **Phase 3:** Shopping list (combine ingredients from multiple recipes), duplicate recipe, save costs button on detail page
- **Phase 4:** Invite by email for non-registered users
- **Tests:** Port `ParseFractionStringTest.java` to a proper Jest test suite for `recipeLogic.ts` — this is a natural next step given the fraction logic is the most complex part

---

## Deferred: Feature Requests

**Unit punctuation normalization in scaled output (low priority)**
- If a user enters "lbs." (with a trailing period) in an ingredient line, the output preserves the period even though it's a formatting artifact, not part of the unit name.
- Question: should the app silently normalize common unit abbreviations in the displayed output (e.g. "lbs." → "lbs", "tbsp." → "tbsp")?
- Current behavior: punctuation is stripped for density/weight lookups (so weight conversion works), but the raw ingredient text is displayed as-is.
- Proposed: apply the same punctuation-stripping normalization to the displayed ingredient text — users would see clean output regardless of how the original recipe was typed.
- Defer: low surface area bug; normalize during a broader ingredient-text cleanup pass.

**Edit scaled recipe vs. edit original recipe (medium priority)**
- The ✏️ Edit button on the recipe detail page currently takes the user back to the original (pre-scale) recipe form. There is no way to make ad-hoc edits to the scaled output — e.g. removing an ingredient, adding a note to a specific line, or adjusting a quantity that the scaler got wrong.
- Two separate editing modes would be useful:
  1. **Edit original** — what exists today; re-scale from scratch.
  2. **Edit scaled** — patch individual lines of the scaled output directly, without re-running the scaling logic.
- These are meaningfully different UX flows. Defer until user feedback clarifies which is more commonly needed and how the two modes should relate (e.g. should a manual scaled-edit be preserved when the original is re-scaled, or discarded?).

**Recipe detail page — scaling summary display (low priority, needs user research)**
- The landing page tour shows a green pill badge ("✓ Scaled 13.3× · 6 → 80 servings") on the scaled results card, but the live recipe detail page shows the multiplier as plain muted text ("4 → 11 servings (×2.75)").
- Before designing a treatment, ask real users what information is most useful at a glance: the multiplier, the original→desired count, both, or something else entirely (e.g. a banner only when the scale is extreme).
- Defer until user feedback is collected.



**Re-yield saved recipes (medium priority)**
- Currently, a saved recipe is fixed at the desired serving count it was saved with. To change servings, the user must go back to the form, re-enter everything, and save again.
- Desired behavior: on the recipe detail page, the user can change the desired serving count and the app re-scales on the fly without going back to the form — similar to how a spreadsheet recalculates.
- Design notes: the re-scaling logic (`scaleIngredients`, `scaleInstructions`) already runs server-side on page load from the stored `original_ingredients`. The missing piece is a client-side control to change `desiredServings` and re-trigger the scaling in the browser.
- Implementation approach: convert the RecipeResults display on the detail page to accept an editable `desiredServings` input (client component). On change, call `scaleIngredients` in-browser (the function is already pure/client-safe) and re-render. Optionally add a "Save new serving count" button that patches `desired_servings` via PATCH /api/recipes/[id].
- Stored costs would become stale on re-yield; either clear them or pro-rate by multiplier. This needs a UX decision before building.

**Save recipe without scaling first (medium priority)**
- Currently the flow forces: fill form → scale → view results → save. Users who just want to store a recipe at its original serving size have no shortcut.
- Fix: add a "Save without scaling" button on the recipe form that submits with `desired_servings = original_servings`. No UI changes to the results view needed — saving with equal servings already works, the form just doesn't expose it directly.

**Ingredient unit pricing / cost database (Phase 2+)**
- Current costing asks for a dollar amount per scaled ingredient line. This is fragile: the cost is only accurate for that exact scaling, and has to be re-entered every time.
- Better model: store a unit price per ingredient (e.g., chicken breast $2.00/lb, kosher salt $5.00/32 oz), then derive cost from the scaled quantity automatically.
- Long-term: sync unit prices from distributor or supermarket price APIs/databases (e.g., US Foods, Sysco, Instacart API). This would make cost tracking genuinely useful for catering businesses doing event pricing.
- Requires: schema change to add a `ingredient_prices` table (or price metadata per ingredient), UI to enter/manage prices, and a cost calculation engine that understands units.

---

## Weight/Volume Display + Mobile Arrow Fix Session (2026-04-01)

### Weight/volume display mode (Issue 2)

Added a three-way measurement display toggle to `RecipeResults`:

- **Both** (default for new users) — weight column (bold, g/kg) + volume column (muted) side-by-side
- **Weight** — weight only; falls back to volume display for ingredients with no density match
- **Volume** — original behavior, unchanged

The mode control is a segmented button group above the ingredients list. When weight is visible, an (i) button shows a tooltip explaining that values are density estimates.

**`src/lib/weightConversion.ts`** — new file (~400 lines) containing:
- `DENSITIES` — ~130+ ingredient entries (oils, dairy, flours, sweeteners, leaveners, spices, herbs, broths, vinegars, spirits, condiments, grains, etc.) sorted by key length descending for longest-key-wins matching
- `COUNT_WEIGHTS` — ~60 count-based entries (garlic cloves, eggs, onions, citrus, potatoes, tomatoes, etc.) with grams per unit and an `approx` flag
- `ML_MAP` — volume unit → mL conversions
- `G_MAP` — weight unit → gram conversions
- `UNIT_ALIASES` — normalizes unit words to canonical forms
- `findDensity(text)` — longest-key-wins g/mL lookup
- `findCountWeight(text)` — keyword-match g/unit lookup
- `toWeightQty(scaledQty, ingredientText)` — main export; handles compound ("6 tbsp + 2 tsp"), volume unit, weight unit, and count cases; returns null when no match (weight cell blank)
- `getIngredientName(ingredientText)` — strips leading volume/weight unit word for weight-only mode display
- `formatGrams(g)` — formats as integer grams (<1000g) or kg with 1 decimal (≥1000g)

**Phase 1 scope:** hardcoded density table (no API calls, zero latency). Phase 2 will seed from USDA FoodData Central CSVs into the `ingredient_densities` Supabase table with Claude Haiku fallback for unlisted items.

**Density matching strategy:** ingredients not in the table get a blank weight cell — no error, no approximate guess. The user can verify with a kitchen scale if needed.

**Preference persistence:**
- `profiles.measurement_pref` (new column, default `'both'`) — user's global default
- `recipes.display_pref` (new column, nullable) — per-recipe override; `NULL` = use profile default
- Per-recipe save: "Save for this recipe" button in RecipeResults calls `PATCH /api/recipes/[id]` with `{ display_pref }` (now whitelisted in the route handler)
- Global default: new "Measurement style" section in Account Settings (`AccountForm.tsx`) with matching 3-button segmented control

**Files changed:**
- `src/lib/weightConversion.ts` — new file
- `src/types/database.ts` — `Profile.measurement_pref`, `Recipe.display_pref`
- `src/components/RecipeResults.tsx` — display mode toggle, weight/volume columns, save-pref button
- `src/app/account/AccountForm.tsx` — Measurement style section
- `src/app/api/recipes/[id]/route.ts` — `display_pref` whitelisted in PATCH
- `src/app/recipes/[id]/page.tsx` — passes `displayMode` and `recipeId` to RecipeResults
- `src/app/recipes/new/page.tsx` — passes `displayMode` from profile to RecipeForm
- `src/app/recipes/[id]/edit/page.tsx` — passes `displayMode` from recipe/profile to RecipeForm
- `src/components/RecipeForm.tsx` — accepts and forwards `displayMode` prop

**Supabase schema changes (already applied in SQL Editor):**
```sql
ALTER TABLE profiles ADD COLUMN measurement_pref text NOT NULL DEFAULT 'both'
  CHECK (measurement_pref IN ('both', 'weight', 'volume'));
ALTER TABLE recipes ADD COLUMN display_pref text DEFAULT NULL
  CHECK (display_pref IN ('both', 'weight', 'volume'));
CREATE TABLE ingredient_densities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_key text UNIQUE NOT NULL,
  grams_per_ml float, grams_per_unit float, approx boolean DEFAULT false,
  source text DEFAULT 'usda' CHECK (source IN ('usda', 'ai', 'manual')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON ingredient_densities (ingredient_key);
```

### Mobile landing page arrow fix

`TourSection.tsx` ResultsPanel: added `<div className="flex md:hidden justify-center text-gray-300 text-2xl py-1">↓</div>` between the two cards, complementing the existing horizontal `→` arrow that is hidden on mobile. Now mobile users see a downward arrow between the "Original recipe" card and the "Scaled results" card.

---

## Scaling Logic & UI Improvements Session (2026-03-31)

### Landing page redesign mockup (`public/mockups/concept-c.html`)

Designed and implemented "Concept C — Fresh & Modern" as a static mockup (not yet live):
- New hero with cleaner layout and updated feature card copy
- Replaced the separate "input methods" bar and app preview section with a single **tabbed "See it in action" section** — 3 tabs (Import from URL → Enter your ingredients → Scaled results) using button-driven transitions; all form inputs non-interactive (pointer-events: none)
- Nav updated to show logged-out state (Log in / Sign up)
- All scaled quantities verified accurate at 6→80 servings (13.333× multiplier)

### Landing page copy (`src/app/page.tsx`)

Updated all three feature card descriptions to match approved mockup:
- Smart scaling: added "colloquial amounts like 'a pinch'"
- Team sharing: removed "just like Google Drive"
- Cost tracking: removed "for any event" (inaccurate — app is per-recipe, not event-level)

### Major scaling logic rewrite (`src/lib/recipeLogic.ts`)

**`decimalToFraction` — replaced bit-doubling with best rational approximation**
The Java-ported algorithm only resolved dyadic fractions (1/2, 1/4, 1/8 etc.); fractions like 1/3 or 2/3 produced absurd outputs (349525/1048576). Replaced with a denominator-sweep (1–64) that finds the closest rational:
```typescript
for (let den = 1; den <= 64; den++) {
  const num = Math.round(frac * den)
  const err = Math.abs(num / den - frac)
  if (err < bestErr) { bestErr = err; bestNum = num; bestDen = den }
  if (err < 0.0001) break
}
```
Result: 2/3 tbsp now correctly shows as "⅔ tbsp" instead of garbage.

**Unicode fractions (`toUnicodeFractions`, updated `formatQty`)**
Added a lookup map covering denominators 2, 3, 4, 5, 6, 8. ASCII fractions in `formatQty` output are converted to Unicode at the end (e.g., "2 1/2" → "2½", "1/3" → "⅓"). Applied in both the scaled and unchanged-servings paths.

**Bidirectional unit conversion (`UNIT_PAIRS`, `normalizeUnit`)**
Implemented up/down conversion for English and metric units:
- Upgrades: tsp→tbsp→cup, oz→lb, ml→L, g→kg (only when result has a clean fraction, denominator ≤ 8)
- Downgrades: cup→tbsp at <0.25 cup, tbsp→tsp at <1 tbsp, lb→oz at <0.25 lb, L→ml at <0.25 L, kg→g at <0.1 kg
- fl oz excluded (conflicts with weight oz; uncommon in US recipes — deferred)

**Compound unit formatting (`formatCompound`)**
Any fractional tbsp now always compounds to `X tbsp + Y tsp` (not just whole-tsp fractions). The tsp remainder can itself be fractional (e.g., `1⅗ tbsp` → `1 tbsp + 1⅘ tsp`). Likewise, tsp ≥ 3 with a remainder splits into `X tbsp + Y tsp`.

### Bug fixes

**Unicode fractions missing for unchanged servings**
The unchanged-servings early-return path in `scaleIngredients` bypassed `toUnicodeFractions`. Fixed: now applies Unicode conversion there too.

**Instructions scaling list markers**
`scaleInstructions` was applying the number-scaling regex globally, so step numbers (`1.`, `2.`, `3)`) were being scaled along with recipe quantities. Fixed by splitting into lines, stripping leading list markers before scaling, and restoring them afterward.

### UX copy improvements

- URL import error for blocked sites (e.g. Food Network): now reads "Try copying the ingredients and using the Enter your ingredients tab instead" instead of a dead-end message
- URL import tab hint text: updated to "Works with most major recipe websites. Some sites (e.g. Food Network) block automated access."

---

## Post-Beta UI Polish & Infrastructure Session (2026-04-08)

### UI polish batch

**Desired servings box**
Wrapped the desired servings `<Field>` in `RecipeForm.tsx` in a `bg-stone-50 border border-stone-200 rounded-xl p-3` container to visually distinguish it from the original servings field. Grid stays `grid-cols-2 items-start` so tops align.

**Search bar magnifying glass**
Added a magnifying-glass SVG icon inside a `relative` wrapper on the search input in `RecipeList.tsx`. Input uses `pl-9` to leave room for the icon.

**"Recipe Info" label**
Added an `<h2>` heading "Recipe Info" above the recipe details section in `RecipeResults.tsx` for clearer visual hierarchy.

**"Copy ingredients" rename**
Button previously labeled "Copy list" renamed to "Copy ingredients" in `RecipeResults.tsx`.

**Edit / Share / Delete consolidation**
Removed the separate owner-only action block from `[id]/page.tsx`. Edit, Share, and Delete are now passed as props (`editHref`, `shareHref`, `deleteButton`) into `RecipeResults` and rendered alongside the other action buttons in one row.

**Tooltip — USDA reference**
Tooltip in `RecipeResults.tsx` updated: USDA FoodData Central linked inline in the tooltip body text. "Account Settings" note moved outside the tooltip as a plain `<p>` below it. Tooltip uses `font-sans` and does not have `pointer-events-none` (so the link is clickable).

**Amber callout shortened**
"Want to keep this scaled recipe? Hit **Save recipe**…" shortened to "Hit **Save recipe**…" in `RecipeResults.tsx`.

**Chef notes always visible to owner**
Chef notes section now renders whenever `isOwner && showChefNotes` — even when empty. Empty state shows "No chef notes yet." instead of hiding the section entirely.

**Chef notes left-border style**
Chef notes block styled with `border-l-4 border-amber-300 pl-3 py-1`.

**Shared with — names on cards and detail view**
`RecipeCard.tsx`: added `shareUsers?` prop; card shows first + last names of people the recipe is shared with via a 👥 icon linking to the share page (click stops propagation so the card link isn't also followed).
`[id]/page.tsx`: Supabase query joins `recipe_shares → profiles` to get sharer names. `RecipeResults.tsx`: renders sharedWith line below the actions row.

**Inline confirm before removing share access**
`ShareManager.tsx`: added `confirmingRemove` state. The ✕ button now shows "Remove? Yes / No" inline before executing deletion.

**Count unit word parsing**
`weightConversion.ts`: added `STRIP_COUNT_UNITS` Set (piece/pieces, head/heads, bunch/bunches, sprig/sprigs, stalk/stalks, slice/slices, sheet/sheets, link/links, knob/knobs, floret/florets). `getIngredientName()` now strips these alongside standard unit words so ingredient names display correctly in weight columns.

**Em dashes**
Fixed `word — word` → `word—word` (no spaces) throughout all user-visible strings: `TourSection.tsx`, `ContactForm.tsx`, `BetaBanner.tsx`, `page.tsx`, `AccountForm.tsx`, `contact/page.tsx`, `feedback/page.tsx`, `RecipeResults.tsx`, `RecipeForm.tsx`, `RecipeCard.tsx`.

**"Saved" date prefix**
Recipe cards now show "Saved MM/DD/YYYY" instead of a bare date.

### Site infrastructure

**Footer**
Created `src/components/Footer.tsx` (server component) and added it to all 6 page layouts.

**Privacy Policy and Terms of Service**
Created `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`. Both link to `/contact` for contact (not the raw email address, to prevent scraping).

**Featurebase feedback widget**
Added Featurebase SDK `<Script>` to `src/app/layout.tsx` with `strategy="afterInteractive"` and `organization: 'recipemultiplier'`.

**Contact form email (Resend)**
Created `src/app/api/contact/route.ts` using the `resend` npm package to send contact form submissions to `recipemultiplier@celiaho.com`. DevTools reminder email sent via Resend to confirm the integration.

### Environment variable setup (lesson learned)

When `resend` was installed locally (`npm install resend`), `package.json` and `package-lock.json` were not included in the git staging command, causing Vercel builds to fail with `Module not found: Can't resolve 'resend'`. Fixed by staging and committing both files separately.

**Rule established:** whenever a new environment variable or npm package is introduced, three things must happen:
1. Package committed to `package.json` / `package-lock.json`
2. Env var added to Vercel dashboard (Settings → Environment Variables, all environments)
3. Env var documented in `.env.example`

Created `.env.example` in the repo root listing all required variables with placeholder values. Added `!.env.example` exception to `.gitignore` (which uses `.env*` as a blanket rule) so the example file is committed but real secrets are not.

---

## Deferred: Known Bugs

**Empty line whitespace in ingredient list (fixed 2026-03-28)**
- Ingredient textareas with blank lines between items were saved with blank lines in the database.
- Fixed: `handleSave()` in `RecipeForm.tsx` now normalizes ingredients before saving (trims each line, removes blanks).

**Serving range truncation (fixed 2026-03-28)**
- URL-imported recipes with serving ranges like "6-8" only captured "6".
- Fixed: `normalizeYield()` in `recipeImport.ts` now detects range patterns and returns the average (7).

**Secondary quantities in ingredient lines (fixed 2026-03-28)**
- Only the leading quantity in an ingredient line was scaled. Parenthetical equivalents like "(2.7 lbs)" and additional quantities like "plus 1 tablespoon" were passed through verbatim.
- Fixed: `parseLine()` in `recipeLogic.ts` now applies secondary quantity scaling to the ingredient remainder via `scaleSecondaryQtys()`.

**Colloquial quantity cross-term conversion (`recipeLogic.ts` → `tryScaleColloquial`)**
- "a pinch of love" × 2 outputs "**dashes** of love" (bold) instead of "2 pinches of love"
- Root cause: scaled tsp value (1/16 × 2 = 1/8) matches the `dash` entry in `COLLOQUIAL_TO_TSP`, so the term changes. The `wasScaled: true` flag then bolds it.
- Fix: when scaling a colloquial would change the term (e.g. pinch → dash), keep the original term and express numerically instead (e.g. "2 pinches"). Only convert within the same term family.

---

## Accessibility Pass (WCAG 2.1 AA)

Partially addressed after mobile usability issues were reported (2026-03-28). Remaining issues documented below.

### Fixed (2026-03-28)
- Profile menu now click-based (was CSS hover-only — inaccessible on mobile touch)
- Avatar button has `aria-label="Account menu"` and `min-h-[44px] min-w-[44px]` touch target
- Navbar links and buttons have `min-h-[44px]` touch targets
- Auth page inputs use `py-3` (≥44px height) and explicit `text-stone-900` for contrast
- Hint text changed from `text-stone-400` to `text-stone-500` (better contrast)
- Submit buttons changed from `bg-emerald-600` to `bg-emerald-700` (better contrast on white text)
- Link colors changed from `text-emerald-600` to `text-emerald-700` on auth pages

### Issues to fix:

**Color contrast (WCAG 1.4.3)**
- `text-stone-400` used for hint/secondary text fails AA (≈2.3:1). Change to `text-stone-500` or `text-stone-600`.
- `bg-emerald-600` with white text fails AA for small text (≈3.5:1, needs 4.5:1). Change button backgrounds to `bg-emerald-700`.
- `text-emerald-600` link text on white fails AA. Change to `text-emerald-700`.

**Touch targets (WCAG 2.5.5 / Apple HIG: 44×44px minimum)**
- Navbar avatar dropdown button — needs `min-h-[44px] min-w-[44px]`
- ShareManager "✕" remove button — icon-only, no explicit sizing
- RecipeResults action buttons (`py-1.5`) — under 44px height
- RecipeForm tab buttons (`py-1.5`) — under 44px height
- Ingredient checkboxes (`h-4 w-4`) — need larger touch target wrapper
- Cost input fields (`py-0.5`) — very small

**Focus indicators (WCAG 2.4.7)**
- Buttons app-wide have `focus:outline-none` with no replacement ring. Add `focus-visible:ring-2 focus-visible:ring-emerald-500`.

**ARIA labels (WCAG 4.1.2)**
- ShareManager "✕" button needs `aria-label="Remove access for [email]"`
- Navbar avatar button needs `aria-label="Account menu"`
- Ingredient checkboxes need `aria-label` per ingredient line
- Emoji in buttons (`📧`, `🖨`, `💾`) should be wrapped in `aria-hidden="true"` with visible text following

**Form label associations (WCAG 1.3.1)**
- `RecipeForm`'s `Field` component renders `<label>` and `<input>` as siblings — not programmatically associated. Add `htmlFor`/`id` pairs or nest input inside label.

**Skip navigation (WCAG 2.4.1)**
- Add a visually-hidden skip link at the top of layout: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
