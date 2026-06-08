# Murder at Midnight

AI-powered multiplayer murder mystery party game built for Yash's family.

## Architecture

```
public/index.html    → Game frontend (vanilla HTML/CSS/JS, no framework)
api/generate.js      → Vercel serverless function → calls Gemini 2.5 Flash to generate scenarios
api/room.js          → Vercel serverless function → Supabase for room codes + shared leaderboard
supabase-schema.sql  → Database schema (2 tables: rooms, leaderboard)
vercel.json          → Vercel config (static output from public/)
```

## Services & Environment Variables

| Service  | Purpose                    | Env Vars                                    |
|----------|----------------------------|---------------------------------------------|
| Vercel   | Hosting + serverless API   | (managed via `vercel` CLI)                  |
| Gemini   | AI scenario generation     | `GEMINI_API_KEY`                            |
| Supabase | Room codes + leaderboard   | `SUPABASE_URL`, `SUPABASE_ANON_KEY`         |

All services are on free tiers. No credit card needed.

## Supabase Tables

- **rooms** — `code` (text), `scenario` (jsonb), `difficulty` (text), `mode` (text), `created_at` (timestamptz)
- **leaderboard** — `player_name` (text PK), `played` (int), `won` (int), `streak` (int), `best_streak` (int)

RLS is enabled with permissive policies (family game, no auth).

## Key Design Decisions

- Gemini 2.5 Flash for scenario generation (free tier: 1,500 req/day)
- `responseMimeType: "application/json"` in Gemini call forces structured JSON output
- Room codes are 4 uppercase letters (no I/O to avoid confusion), expire conceptually after 24h
- Difficulty levels control: suspect count (4/5/6), clue count (5/6/7), clue clarity, and minimum clues before accusing (3/4/5)
- Traitor mode randomly picks one player and shows them the killer on a private screen
- Frontend uses localStorage only for detective notes (scratch pad), all persistent data is in Supabase

## Deployment

```bash
# Link and deploy
vercel link
vercel env add GEMINI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel --prod

# Or just push to GitHub — Vercel auto-deploys from main branch
git add . && git commit -m "update" && git push
```

## Current Vercel URL

murder-at-midnight.vercel.app (Yash's deployment)
