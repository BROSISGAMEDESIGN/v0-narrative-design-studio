-- Brosis Engine: shared narrative state (canvas, cast, chapters, notes)
-- Run this in Supabase SQL Editor or via CLI: supabase db push

create table if not exists public.engine_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists engine_projects_slug_idx on public.engine_projects (slug);

create or replace function public.set_engine_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_engine_projects_updated_at on public.engine_projects;
create trigger set_engine_projects_updated_at
  before update on public.engine_projects
  for each row
  execute function public.set_engine_projects_updated_at();

alter table public.engine_projects enable row level security;

-- Shared studio: anyone with the anon key can read/write this row.
-- Tighten later with auth if you expose the app beyond trusted collaborators.

create policy "engine_projects_select_anon"
  on public.engine_projects
  for select
  to anon, authenticated
  using (true);

create policy "engine_projects_insert_anon"
  on public.engine_projects
  for insert
  to anon, authenticated
  with check (true);

create policy "engine_projects_update_anon"
  on public.engine_projects
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Realtime: other browsers see updates immediately
alter publication supabase_realtime add table public.engine_projects;

-- Default row used by the app (slug = main unless NEXT_PUBLIC_ENGINE_PROJECT_SLUG overrides)
insert into public.engine_projects (slug, state)
values (
  'main',
  jsonb_build_object(
    'projectName', 'Untitled Project',
    'scenes', '[]'::jsonb,
    'chapters', jsonb_build_array(
      jsonb_build_object(
        'id', 'chapter-1',
        'name', 'Chapter 1',
        'color', '#A855F7',
        'order', 0,
        'createdAt', (extract(epoch from now()) * 1000)::bigint
      )
    ),
    'characters', '[]'::jsonb,
    'teamNotes', '[]'::jsonb,
    'lastSaved', null
  )
)
on conflict (slug) do nothing;
