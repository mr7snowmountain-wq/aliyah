-- Colle dans SQL Editor sur supabase.com

create table public.profiles (
  id                   uuid references auth.users on delete cascade primary key,
  mama_name            text,
  child_name           text,
  child_age            text,
  onboarding_complete  boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "lecture propre"  on profiles for select using (auth.uid() = id);
create policy "insertion propre" on profiles for insert with check (auth.uid() = id);
create policy "mise à jour propre" on profiles for update using (auth.uid() = id);

-- Crée automatiquement un profil vide à chaque inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────
-- Table plannings (un planning par user par jour)
-- ──────────────────────────────────────────────
create table public.plannings (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  date       date not null default current_date,
  tasks      jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.plannings enable row level security;

create policy "lecture planning"     on plannings for select using (auth.uid() = user_id);
create policy "insertion planning"   on plannings for insert with check (auth.uid() = user_id);
create policy "mise à jour planning" on plannings for update using (auth.uid() = user_id);
create policy "suppression planning" on plannings for delete using (auth.uid() = user_id);
