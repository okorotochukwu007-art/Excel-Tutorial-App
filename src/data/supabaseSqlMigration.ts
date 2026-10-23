export const SUPABASE_STAGE2_SQL_MIGRATION = `-- ============================================================================
-- EXCEL TO DATA ANALYST ACADEMY — STAGE 2 SUPABASE POSTGRESQL SCHEMA & RLS
-- Copy and run this script in your Supabase Dashboard -> SQL Editor
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.enforce_profile_role_security()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Permission denied: Students cannot modify their own role.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_role_security on public.profiles;
create trigger trg_enforce_profile_role_security
before update on public.profiles
for each row execute function public.enforce_profile_role_security();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'Student'), '@', 1)),
    'student'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table if not exists public.courses (
  id text primary key,
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null,
  one_time_price integer not null check (one_time_price > 0),
  currency text not null default 'NGN' check (currency in ('NGN', 'USD', 'GHS', 'KES', 'ZAR')),
  status text not null default 'published' check (status in ('published', 'draft')),
  lifetime_access_entitlement boolean not null default true,
  preview_lesson_count integer not null default 6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  level_number integer not null check (level_number between 1 and 6),
  order_index integer not null,
  title text not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  module_id text not null references public.modules(id) on delete cascade,
  level_number integer not null check (level_number between 1 and 6),
  order_index integer not null,
  title text not null,
  description text not null,
  duration_minutes integer not null default 15,
  is_free_preview boolean not null default false,
  youtube_video_id text,
  key_formulas jsonb not null default '[]'::jsonb,
  concept_summary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_resources (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  file_name text not null,
  file_description text not null default '',
  download_url text,
  assignment_instructions text not null default '',
  expected_outcome text not null default '',
  sample_csv_content text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete restrict,
  paystack_reference text not null unique,
  amount integer not null check (amount > 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'abandoned')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id, paystack_reference)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  last_viewed_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create table if not exists public.quizzes (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  module_id text not null references public.modules(id) on delete cascade,
  title text not null,
  passing_score_percent integer not null default 67,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id text primary key,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  formula_context text,
  options jsonb not null default '[]'::jsonb,
  correct_option_index integer not null,
  explanation text not null default ''
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id text not null,
  lesson_title text not null,
  score_percent integer not null check (score_percent between 0 and 100),
  passed boolean not null default false,
  total_questions integer not null default 3,
  correct_count integer not null default 0,
  attempted_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  instructions text not null,
  expected_outcome text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id text not null,
  completed_checklist_items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  status text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed', 'reviewed')),
  updated_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create table if not exists public.lesson_video_recommendations (
  id text primary key,
  lesson_id text not null references public.lessons(id) on delete cascade,
  video_id text not null,
  title text not null,
  channel_title text not null default '',
  description text not null default '',
  thumbnail_url text not null default '',
  duration_formatted text not null default '',
  duration_seconds integer not null default 0,
  what_you_will_learn text not null default '',
  suitability_label text not null default 'Strong Beginner Match (Metadata Evidence)',
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate', 'approved', 'rejected')),
  is_primary boolean not null default false,
  source text not null default 'youtube_discovery',
  search_query_used text not null default '',
  discovered_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (lesson_id, video_id)
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.purchases enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.assignments enable row level security;
alter table public.project_submissions enable row level security;
alter table public.lesson_video_recommendations enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own_or_admin" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

create policy "courses_select_published_or_admin" on public.courses for select using (status = 'published' or public.is_admin());
create policy "courses_admin_write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

create policy "modules_select_public" on public.modules for select using (true);
create policy "modules_admin_write" on public.modules for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons_select_public_metadata" on public.lessons for select using (true);
create policy "lessons_admin_write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

create policy "lesson_resources_select" on public.lesson_resources for select using (auth.uid() is not null or exists (select 1 from public.lessons l where l.id = lesson_resources.lesson_id and l.is_free_preview = true));
create policy "lesson_resources_admin_write" on public.lesson_resources for all using (public.is_admin()) with check (public.is_admin());

create policy "purchases_select_own_or_admin" on public.purchases for select using (auth.uid() = user_id or public.is_admin());
create policy "purchases_admin_manage" on public.purchases for all using (public.is_admin()) with check (public.is_admin());

create policy "lesson_progress_select_own_or_admin" on public.lesson_progress for select using (auth.uid() = user_id or public.is_admin());
create policy "lesson_progress_insert_own" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "lesson_progress_update_own" on public.lesson_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lesson_progress_delete_own" on public.lesson_progress for delete using (auth.uid() = user_id);

create policy "quizzes_select_all" on public.quizzes for select using (true);
create policy "quizzes_admin_write" on public.quizzes for all using (public.is_admin()) with check (public.is_admin());

create policy "quiz_questions_select_all" on public.quiz_questions for select using (true);
create policy "quiz_questions_admin_write" on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());

create policy "quiz_attempts_select_own_or_admin" on public.quiz_attempts for select using (auth.uid() = user_id or public.is_admin());
create policy "quiz_attempts_insert_own" on public.quiz_attempts for insert with check (auth.uid() = user_id);

create policy "assignments_select_all" on public.assignments for select using (true);
create policy "assignments_admin_write" on public.assignments for all using (public.is_admin()) with check (public.is_admin());

create policy "project_submissions_select_own_or_admin" on public.project_submissions for select using (auth.uid() = user_id or public.is_admin());
create policy "project_submissions_insert_own" on public.project_submissions for insert with check (auth.uid() = user_id);
create policy "project_submissions_update_own_or_admin" on public.project_submissions for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "lesson_video_recs_select_approved_or_admin" on public.lesson_video_recommendations for select using (status = 'approved' or public.is_admin());
create policy "lesson_video_recs_admin_write" on public.lesson_video_recommendations for all using (public.is_admin()) with check (public.is_admin());
`;
