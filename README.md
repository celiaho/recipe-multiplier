# Recipe Multiplier (Beta)

A recipe scaling tool for chefs and catering professionals. Scale ingredients up or down, track costs per serving, and share recipes with your team.

**Live:** [recipemultiplier.celiaho.com](https://recipemultiplier.celiaho.com) · deployed on Vercel

> **Beta:** This app is in active development. Review scaled results before use.

---

## What it does

- **Scale ingredients** — handles fractions, mixed numbers, decimals, colloquial amounts like "a pinch", and automatic unit conversion (e.g. 26 tbsp → 1⅔ cups)
- **Weight/volume display** — toggle between volume-only, weight-only (g/kg), or both side-by-side; preference saved per-recipe or globally in Account Settings; weight estimates sourced from USDA FoodData Central
- **Import from URL** — paste a link from AllRecipes, NYT Cooking, Serious Eats, or most major recipe websites
- **Track costs** — add per-ingredient costs and see total cost + cost per serving
- **Share with your team** — Google Drive-style per-recipe permissions (view or edit access per person); recipe cards show who a recipe is shared with by name
- **Chef notes** — private notes visible only to the recipe owner
- **Contact form** — built-in feedback form at `/contact` with optional screenshot upload; submissions delivered via Resend
- **Privacy Policy + Terms of Service** — at `/privacy` and `/terms`
- **Footer** — site-wide footer with nav links on all pages

---

## Origin

Started as a Java servlet web app (CSC-285 Advanced Java, Fall 2024 at BHCC) — a locally-running recipe scaler that already handled fractions, mixed numbers, and ingredient parsing. A local chef asked for a hosted, multi-user version, which prompted a full rewrite in Next.js for public deployment.

Original implementation: [CSC-285 Servlets — Recipe Multiplier](https://github.com/celiaho/CSC-285_Advanced_Java_Assignments/tree/main/20241116_W10_HW6_Servlets_Recipe_Multiplier)

See [PROCESS.md](PROCESS.md) for the full development story and architecture decisions.

---

## Built with Claude Code

Development was conducted collaboratively with [Claude Code](https://claude.ai/code) (Anthropic), used as a development accelerator. The AI ported the Java logic, designed the data model, and wrote boilerplate. Engineering judgment, feature decisions, and architecture trade-offs were made by the developer.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| Auth + Database | Supabase (Postgres + Row Level Security) |
| File storage | Supabase Storage (avatar photos) |
| Transactional email | Resend (signup confirmation, password reset) |
| Deployment | Vercel |
| Styling | Tailwind CSS v4 |

---

## Local development

**Prerequisites:** Node.js 18+, a Supabase project, a Resend account

1. Clone the repo:
   ```bash
   git clone https://github.com/celiaho/recipe-multiplier.git
   cd recipe-multiplier
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables — copy the example file and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
   Required variables (see `.env.example` for descriptions and where to find each key):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`

   For Vercel deployments, add all three under **Settings → Environment Variables** in your Vercel project dashboard.

4. Run the database schema in your Supabase SQL Editor (`supabase-schema.sql` in repo root).

5. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Architecture and decisions

See [PROCESS.md](PROCESS.md) for:
- Why Next.js instead of the Java servlet approach for deployment
- Why Supabase for auth and database (RLS-enforced sharing)
- The Google Drive-style sharing model
- Weight/volume display design and density table strategy
- Full deployment and configuration notes
- Known bugs and deferred features
