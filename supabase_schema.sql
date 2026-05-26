-- ═══════════════════════════════════════════════════════
-- HIDDENOS — SUPABASE SCHEMA v1
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ── PROFILES ────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── ACCOUNTS ────────────────────────────────────────
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  start_bal numeric default 0,
  color text default '#00d4ff',
  type text default 'funded',
  broker text,
  max_dd numeric,
  trailing_dd boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.accounts enable row level security;
create policy "Users manage own accounts" on public.accounts for all using (auth.uid() = user_id);

-- ── TRADES ──────────────────────────────────────────
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references public.accounts(id) on delete set null,

  -- General
  date date not null,
  ts timestamptz default now(),
  closed_at timestamptz,
  instrument text not null,
  dir text check (dir in ('long', 'short')) not null,
  status text check (status in ('open', 'closed')) default 'open',
  outcome text check (outcome in ('win', 'loss', 'be')),

  -- Prices
  entry numeric,
  sl numeric,
  tp numeric,
  exit_price numeric,
  contracts numeric,
  risk_pct numeric default 0.25,

  -- Results
  pnl numeric default 0,
  rr_actual numeric,
  mfe numeric,
  mae numeric,

  -- Context
  market_cond text,
  news_cond text,
  vol_cond text,
  setup text,

  -- Multi-TF Analysis
  htf text,
  htf_poi text,
  htf_levels text,
  ltf text,
  ltf_poi text,
  exec_3m text,

  -- SMC Fields
  liquidity_sweep text,
  premium_discount text,
  smt_divergence text,
  bos_choch text,
  volume_confirm text,

  -- Entry Execution
  entry_type text,
  confirm_model text,

  -- Management
  partial text,
  trailing_stop text,
  breakeven text,

  -- Grading
  execution_grade text,
  process_grade text,
  confidence integer,

  -- Emotions
  emotions_pre text[] default '{}',
  emotions_during text[] default '{}',
  emotions_post text[] default '{}',

  -- Notes & Links
  story text,
  notes text,
  tv_link text,
  replay_link text,
  photos text[] default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trades enable row level security;
create policy "Users manage own trades" on public.trades for all using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_trades_user_date on public.trades(user_id, date desc);
create index if not exists idx_trades_user_status on public.trades(user_id, status);
create index if not exists idx_trades_account on public.trades(account_id);

-- ── DAILY LOGS ──────────────────────────────────────
create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  bias text,
  gameplan text,
  mood text,
  notes text,
  checklist jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.daily_logs enable row level security;
create policy "Users manage own daily_logs" on public.daily_logs for all using (auth.uid() = user_id);

-- ── JOURNAL ENTRIES ─────────────────────────────────
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  dt timestamptz default now(),
  text text,
  lesson text,
  emo integer,
  compliance text,
  result text,
  created_at timestamptz default now()
);

alter table public.journal_entries enable row level security;
create policy "Users manage own journal" on public.journal_entries for all using (auth.uid() = user_id);

-- ── MACRO ENTRIES ───────────────────────────────────
create table if not exists public.macro_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  dxy text,
  bias text,
  event text,
  spec text,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.macro_entries enable row level security;
create policy "Users manage own macro" on public.macro_entries for all using (auth.uid() = user_id);

-- ── PSYCHOLOGY ENTRIES ──────────────────────────────
create table if not exists public.psychology_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,

  -- Pre-session
  pre_sleep integer,
  pre_stress integer,
  pre_energy integer,
  pre_motivation integer,
  pre_confidence integer,
  pre_emotions text[] default '{}',
  pre_mood text,

  -- During
  during_emotions text[] default '{}',
  during_notes text,

  -- Post
  post_emotions text[] default '{}',
  post_mood text,
  post_reflection text,
  post_lesson text,
  execution_grade text,
  process_grade text,
  emotional_stability integer,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.psychology_entries enable row level security;
create policy "Users manage own psychology" on public.psychology_entries for all using (auth.uid() = user_id);

-- ── QUICK NOTES ─────────────────────────────────────
create table if not exists public.quick_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  dt date default current_date,
  text text not null,
  created_at timestamptz default now()
);

alter table public.quick_notes enable row level security;
create policy "Users manage own notes" on public.quick_notes for all using (auth.uid() = user_id);

-- ── UPDATED_AT TRIGGER ──────────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['profiles','accounts','trades','daily_logs','macro_entries','psychology_entries'])
  loop
    execute format('
      drop trigger if exists set_updated_at on public.%I;
      create trigger set_updated_at before update on public.%I
      for each row execute procedure public.update_updated_at();
    ', tbl, tbl);
  end loop;
end $$;
