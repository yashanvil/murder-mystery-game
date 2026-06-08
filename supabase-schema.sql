-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Rooms table (stores game sessions with a 4-letter code)
create table rooms (
  id bigint generated always as identity primary key,
  code text not null,
  scenario jsonb not null,
  difficulty text default 'afoot',
  mode text default 'cooperative',
  created_at timestamptz default now()
);

-- Index for fast room lookups
create index idx_rooms_code on rooms(code);

-- Leaderboard table (one row per player)
create table leaderboard (
  player_name text primary key,
  played int default 0,
  won int default 0,
  streak int default 0,
  best_streak int default 0
);

-- Enable Row Level Security but allow all operations via anon key
-- (This is a family game, no auth needed)
alter table rooms enable row level security;
alter table leaderboard enable row level security;

create policy "Allow all on rooms" on rooms for all using (true) with check (true);
create policy "Allow all on leaderboard" on leaderboard for all using (true) with check (true);

-- Optional: auto-delete rooms older than 24 hours
-- (Run this as a Supabase cron job or manually once in a while)
-- delete from rooms where created_at < now() - interval '24 hours';
