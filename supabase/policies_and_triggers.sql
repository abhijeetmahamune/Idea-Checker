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
alter table public.simulations enable row level security;
alter table public.devil_advocate_reports enable row level security;
alter table public.problem_upvotes enable row level security;
alter table public.solution_ratings enable row level security;
alter table public.problem_comments enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_messages enable row level security;

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

-- Simulations Table Policies
create policy "Allow select simulations associated with owned or guest solutions"
  on public.simulations for select
  using (
    exists (
      select 1 from public.solutions s
      where s.id = simulations.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "Allow insert simulations associated with owned or guest solutions"
  on public.simulations for insert
  with check (
    exists (
      select 1 from public.solutions s
      where s.id = simulations.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

-- Devil Advocate Reports Table Policies
create policy "Allow select devil_advocate_reports associated with owned or guest solutions"
  on public.devil_advocate_reports for select
  using (
    exists (
      select 1 from public.solutions s
      where s.id = devil_advocate_reports.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "Allow insert devil_advocate_reports associated with owned or guest solutions"
  on public.devil_advocate_reports for insert
  with check (
    exists (
      select 1 from public.solutions s
      where s.id = devil_advocate_reports.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

-- Problem Upvotes Table Policies
create policy "Allow authenticated users to read upvotes"
  on public.problem_upvotes for select
  to authenticated
  using (true);

create policy "Allow users to manage their own upvotes"
  on public.problem_upvotes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Solution Ratings Table Policies
create policy "Allow authenticated users to read ratings"
  on public.solution_ratings for select
  to authenticated
  using (true);

create policy "Allow users to manage their own ratings"
  on public.solution_ratings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Problem Comments Table Policies
create policy "Allow anyone to read comments"
  on public.problem_comments for select
  using (true);

create policy "Allow authenticated users to manage their own comments"
  on public.problem_comments for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Workspaces Table Policies
create policy "Allow owners and members to select workspaces"
  on public.workspaces for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspaces.id
      and m.user_id = auth.uid()
    )
  );

create policy "Allow owners to update workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Allow owners to delete workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

create policy "Allow authenticated users to insert workspaces"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Workspace Members Table Policies
create policy "Allow users to view their own memberships"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "Allow owners to manage workspace members"
  on public.workspace_members for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id
      and w.owner_id = auth.uid()
    )
  );

-- Workspace Messages Table Policies
create policy "workspace_members_read_messages"
  on public.workspace_messages for select
  using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_messages.workspace_id
      and m.user_id = auth.uid()
    )
  );

create policy "workspace_members_insert_messages"
  on public.workspace_messages for insert
  with check (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_messages.workspace_id
      and m.user_id = auth.uid()
    )
  );

-- Enable Row Level Security on the new tables
alter table public.deep_reports enable row level security;
alter table public.ai_requests enable row level security;
alter table public.attachments enable row level security;

-- Deep Reports Table Policies
create policy "Allow select deep_reports associated with owned or guest solutions"
  on public.deep_reports for select
  using (
    exists (
      select 1 from public.solutions s
      where s.id = deep_reports.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "Allow insert deep_reports associated with owned or guest solutions"
  on public.deep_reports for insert
  with check (
    exists (
      select 1 from public.solutions s
      where s.id = deep_reports.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

-- AI Requests Table Policies
create policy "Allow users to view their own AI requests"
  on public.ai_requests for select
  to authenticated
  using (user_id = auth.uid());

create policy "Allow authenticated users to insert AI requests"
  on public.ai_requests for insert
  to authenticated
  with check (user_id = auth.uid());

-- Attachments Table Policies
create policy "Allow select attachments associated with owned or guest solutions"
  on public.attachments for select
  using (
    exists (
      select 1 from public.solutions s
      where s.id = attachments.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );

create policy "Allow users to manage attachments for their solutions"
  on public.attachments for all
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.solutions s
      where s.id = attachments.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.solutions s
      where s.id = attachments.solution_id
      and (s.user_id = auth.uid() or s.user_id is null)
    )
  );
