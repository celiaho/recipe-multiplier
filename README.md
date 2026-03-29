# Recipe Multiplier

Scale any recipe up or down, track ingredient costs, and share recipes with your team.

**Live app:** https://recipe-multiplier.vercel.app

---

## Features

- Scale recipes by any multiplier — supports fractions, mixed numbers, decimals, and colloquial quantities (a pinch, a handful, a dash)
- Import recipes directly from URLs (AllRecipes, Serious Eats, BBC Good Food, Epicurious, King Arthur Baking, and most recipe blogs)
- Track per-ingredient costs with total cost and cost-per-serving summary
- Share recipes with teammates — view or edit access, Google Drive-style
- Private chef notes visible only to the recipe owner
- Email scaled recipes with full ingredient list, instructions, and timing info

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router, Turbopack) |
| Database + Auth | Supabase (Postgres + Row Level Security) |
| File storage | Supabase Storage (avatar uploads) |
| Deployment | Vercel |
| Styling | Tailwind CSS |

## Local Development

```bash
npm install
npm run dev       # starts at http://localhost:3000
npm run build     # production build check
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run `supabase-schema.sql` in your Supabase SQL Editor to create all tables, RLS policies, triggers, and storage buckets.

## Deployment

Deployed on Vercel. Every push to `main` triggers an automatic production deployment.

**Supabase settings required:**
- Authentication → URL Configuration → Site URL: `https://recipe-multiplier.vercel.app`
- Authentication → URL Configuration → Redirect URLs: `https://recipe-multiplier.vercel.app/**`

## Architecture and Process

See [`PROCESS.md`](./PROCESS.md) for:
- Why this stack was chosen over alternatives
- All architectural decisions and trade-offs
- Deferred features and known bugs
- The full AI-assisted development process log

## Origin

Refactored from a Java servlet school project (CSC-285, BHCC Fall 2024) into a deployable multi-user web application. The original Java implementation lives at [`celiaho/CSC-285_Advanced_Java_Assignments`](https://github.com/celiaho/CSC-285_Advanced_Java_Assignments).
