-- =====================================================================
-- 1. AUTH USER SYNC TRIGGER
-- =====================================================================

-- Automatically syncs newly created users from Supabase Auth into the public.users table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, created_at)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.created_at
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable Row Level Security on all application tables
alter table public.users enable row level security;
alter table public.problems enable row level security;
alter table public.solutions enable row level security;
alter table public.evaluations enable row level security;

-- Users Table Policies
create policy "Allow users to read their own profiles"
  on public.users for select
  using (auth.uid() = id);

create policy "Allow users to update their own profiles"
  on public.users for update
  using (auth.uid() = id);

-- Problems Table Policies
create policy "Users can read/write their own problems, guests can read/write guest problems"
  on public.problems for all
  using (
    auth.uid() = user_id 
    or user_id is null -- Allows guest-created problems (without user_id)
  );

-- Solutions Table Policies
create policy "Users can read/write their own solutions, guests can read/write guest solutions"
  on public.solutions for all
  using (
    auth.uid() = user_id 
    or user_id is null -- Allows guest-created solutions
  );

-- Evaluations Table Policies
create policy "Allow select evaluations associated with owned or guest solutions"
  on public.evaluations for select
  using (
    exists (
      select 1 from public.solutions s
      where s.id = evaluations.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "Allow insert evaluations associated with owned or guest solutions"
  on public.evaluations for insert
  with check (
    exists (
      select 1 from public.solutions s
      where s.id = evaluations.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );
