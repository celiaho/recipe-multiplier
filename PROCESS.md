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

## What I Would Do Next

- **Phase 2:** Shopping list (combine ingredients from multiple recipes), duplicate recipe, save costs button on detail page
- **Phase 3:** Invite by email for non-registered users
- **Tests:** Port `ParseFractionStringTest.java` to a proper Jest test suite for `recipeLogic.ts` — this is a natural next step given the fraction logic is the most complex part

---

## Deferred: Feature Requests

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
