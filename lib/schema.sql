create table if not exists public.lp_admins (
  email text primary key,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.lp_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  reference text not null unique,
  customer_name varchar(100) not null,
  email varchar(254) not null,
  whatsapp varchar(20) not null,
  delivery_method text not null check (delivery_method in ('email','whatsapp')),
  child_name varchar(80) not null,
  age integer not null check (age between 2 and 12),
  sex text not null check (sex in ('male','female')),
  language text not null check (language in ('en','fr','ar','es','de','it','pt','nl','tr')),
  site_language text not null default 'en' check (site_language in ('en','fr','ar')),
  currency text not null default 'EUR' check (currency in ('EUR','USDT','USD')),
  favorite_color varchar(60) not null,
  favorite_animal varchar(60) not null,
  adventure text not null,
  superhero text not null,
  child_photo bytea not null,
  photo_mime text not null check (photo_mime in ('image/jpeg','image/png','image/webp')),
  customer_notes varchar(1500) not null default '',
  admin_notes varchar(4000) not null default '',
  status text not null default 'new' check (status in ('new','confirmed','in_progress','delivered','cancelled')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  due_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now(),
  check (octet_length(child_photo) <= 3145728)
);
-- Keep original historical orders in USD; only new orders default to EUR.
alter table public.lp_orders add column if not exists currency text not null default 'USD' check (currency in ('EUR','USDT','USD'));
alter table public.lp_orders alter column currency set default 'EUR';
alter table public.lp_orders add column if not exists site_language text not null default 'en' check (site_language in ('en','fr','ar'));
alter table public.lp_orders drop constraint if exists lp_orders_language_check;
alter table public.lp_orders add constraint lp_orders_language_check check (language in ('en','fr','ar','es','de','it','pt','nl','tr'));
create index if not exists lp_orders_created_idx on public.lp_orders (created_at desc);
create table if not exists public.lp_sessions (
  token_hash char(64) primary key,
  admin_email text not null references public.lp_admins(email) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists public.lp_rate_limits (
  bucket text primary key,
  starts_at timestamptz not null default now(),
  hits integer not null default 1
);
alter table public.lp_admins enable row level security;
alter table public.lp_orders enable row level security;
alter table public.lp_sessions enable row level security;
alter table public.lp_rate_limits enable row level security;
revoke all on public.lp_admins, public.lp_orders, public.lp_sessions, public.lp_rate_limits from anon, authenticated;
