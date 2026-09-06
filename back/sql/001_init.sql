-- =============================================================================
-- Dacon Supabase 초기 스키마
-- 사용법: Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- =============================================================================

-- 확장
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1) profiles — auth.users 와 1:1 (로그인 ID·재무 프로필)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  login_id text not null,
  email text not null,
  name text not null,
  monthly_income numeric(14, 2),
  target_amount numeric(14, 2),
  target_period integer,
  asset_list jsonb not null default '[]'::jsonb,
  loan_list jsonb not null default '[]'::jsonb,
  product_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_id_len check (char_length(login_id) between 4 and 20),
  constraint profiles_login_id_format check (login_id ~ '^[A-Za-z0-9_]+$'),
  constraint profiles_name_len check (char_length(name) between 1 and 30)
);

create unique index if not exists profiles_login_id_key on public.profiles (lower(login_id));
create unique index if not exists profiles_email_key on public.profiles (lower(email));

-- -----------------------------------------------------------------------------
-- 2) account_book_transactions — 가계부
-- -----------------------------------------------------------------------------
create table if not exists public.account_book_transactions (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null check (char_length(category) between 1 and 30),
  memo text not null default '' check (char_length(memo) <= 200),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_book_user_date_idx
  on public.account_book_transactions (user_id, date desc);

create index if not exists account_book_user_type_idx
  on public.account_book_transactions (user_id, type);

-- -----------------------------------------------------------------------------
-- 3) spending_evaluations — 소비 평가 결과 (주기별 최신 1건)
-- -----------------------------------------------------------------------------
create table if not exists public.spending_evaluations (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  range_from date,
  range_to date,
  summary jsonb not null default '{}'::jsonb,
  spending jsonb not null default '[]'::jsonb,
  finance jsonb,
  insight text not null default '',
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  comment text not null default '',
  recommendations jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  saved_at timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists spending_evaluations_user_idx
  on public.spending_evaluations (user_id, saved_at desc);

-- -----------------------------------------------------------------------------
-- 4) financial_products — 상품 카탈로그 (선택, 나중에 적재)
-- -----------------------------------------------------------------------------
create table if not exists public.financial_products (
  product_id bigint primary key,
  product_name text not null,
  bank_name text,
  sector text,
  category text check (category in ('대출', '예적금') or category is null),
  product_type text,
  interest_rate numeric(8, 4),
  interest_rate_max numeric(8, 4),
  max_limit numeric(14, 2),
  max_limit_text text,
  min_amount numeric(14, 2),
  term text,
  description text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- updated_at 자동 갱신
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists account_book_set_updated_at on public.account_book_transactions;
create trigger account_book_set_updated_at
  before update on public.account_book_transactions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auth 가입 시 profiles 스텁 (백엔드가 upsert로 채움)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, login_id, email, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'login_id', 'user_' || substr(replace(new.id::text, '-', ''), 1, 12)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', '사용자')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.account_book_transactions enable row level security;
alter table public.spending_evaluations enable row level security;
alter table public.financial_products enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- account_book
drop policy if exists "account_book_select_own" on public.account_book_transactions;
create policy "account_book_select_own"
  on public.account_book_transactions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "account_book_insert_own" on public.account_book_transactions;
create policy "account_book_insert_own"
  on public.account_book_transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "account_book_update_own" on public.account_book_transactions;
create policy "account_book_update_own"
  on public.account_book_transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "account_book_delete_own" on public.account_book_transactions;
create policy "account_book_delete_own"
  on public.account_book_transactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- spending_evaluations
drop policy if exists "spending_evaluations_select_own" on public.spending_evaluations;
create policy "spending_evaluations_select_own"
  on public.spending_evaluations for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "spending_evaluations_upsert_own" on public.spending_evaluations;
create policy "spending_evaluations_upsert_own"
  on public.spending_evaluations for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "spending_evaluations_update_own" on public.spending_evaluations;
create policy "spending_evaluations_update_own"
  on public.spending_evaluations for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- financial_products: 인증 사용자 읽기 전용
drop policy if exists "financial_products_read" on public.financial_products;
create policy "financial_products_read"
  on public.financial_products for select
  to authenticated
  using (true);

-- service_role 은 RLS 우회 (Express 백엔드용)
-- Dashboard → Settings → API → service_role 키를 Render/로컬 .env 에 넣으세요.

comment on table public.profiles is '앱 프로필 + 재무 정보 (Supabase Auth 연동)';
comment on table public.account_book_transactions is '가계부 수입/지출';
comment on table public.spending_evaluations is '소비내역 AI 평가 결과';
comment on table public.financial_products is '금융 상품 카탈로그';
