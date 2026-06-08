# Murder at Midnight

AI-powered multiplayer murder mystery game. New scenario every game. Play together or remotely via room codes.

## Setup & Deploy (10 minutes)

### 1. Get a free Gemini API key
- Go to [aistudio.google.com](https://aistudio.google.com) → **Get API Key** → **Create API key**
- Free, no credit card

### 2. Set up Supabase (free database for rooms + leaderboard)
1. Go to [supabase.com](https://supabase.com) → sign up free
2. Click **New Project** → name it anything → set a password → create
3. Once ready, go to **SQL Editor** → paste the contents of `supabase-schema.sql` → click **Run**
4. Go to **Settings** → **API** → copy:
   - **Project URL** (e.g. `https://xyz.supabase.co`)
   - **anon public** key (under Project API keys)

### 3. Push to GitHub
```bash
cd murder-mystery-game
git init && git add . && git commit -m "Murder at Midnight"
git remote add origin https://github.com/YOUR_USERNAME/murder-mystery-game.git
git branch -M main && git push -u origin main
```

### 4. Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → import repo
2. Add 3 environment variables:
   - `GEMINI_API_KEY` = your Gemini key
   - `SUPABASE_URL` = your Supabase Project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon public key
3. Deploy!

## How to Play

### Same device
Add names → pick difficulty & mode → **Solo Device — Start**

### Remote (different phones)
1. Player 1: Add their name → **Create Room** → gets a 4-letter code (e.g. DUSK)
2. Send the code over WhatsApp
3. Player 2: Opens URL → adds their name → **Join Room** → enters the code
4. Both see the same mystery! Discuss over a call, reveal clues, accuse

## Difficulty Levels
- 🔍 **Elementary** — 4 suspects, clearer clues, reveal 3 to accuse
- 👁 **The Game is Afoot** — 5 suspects, ambiguous clues, reveal 4 to accuse
- 💀 **Diabolical** — 6 suspects, red herrings, reveal 5 to accuse

## Game Modes
- **Cooperative** — solve together
- **Competitive** — take turns accusing, first correct wins
- **One Traitor** — one player secretly knows the killer and misdirects

## Cost
**Completely free.** Gemini free tier + Supabase free tier (2 projects, 500MB database).
