-- Deutsch Trainer — Supabase schema (Phase 1 + tables reserved for Phase 2)
-- Run this whole file once in the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ───────────────────────── sets / exercises / vocab ─────────────────────────
create table if not exists exercise_sets (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source_note text,
  created_at  timestamptz not null default now()
);

create table if not exists exercises (
  id       uuid primary key default gen_random_uuid(),
  set_id   uuid not null references exercise_sets(id) on delete cascade,
  position int  not null,
  type     text not null check (type in (
             'translate_mn_de','translate_de_mn','fill_blank','error_hunt',
             'transform','name_case','speed','label_parts')),
  payload  jsonb  not null,
  tags     text[] not null default '{}'
);
create index if not exists exercises_set_idx on exercises(set_id, position);

create table if not exists vocab (
  id        uuid primary key default gen_random_uuid(),
  set_id    uuid not null references exercise_sets(id) on delete cascade,
  german    text not null,
  article   text check (article in ('der','die','das')),
  plural    text,
  mongolian text not null,
  kind      text not null check (kind in ('noun','verb','other')),
  irregular boolean not null default false
);
create index if not exists vocab_set_idx on vocab(set_id);

-- ───────────────────────── attempts ─────────────────────────
create table if not exists attempts (
  id               uuid primary key default gen_random_uuid(),
  exercise_id      uuid not null references exercises(id) on delete cascade,
  answer           jsonb not null,
  correct          boolean not null,
  points           numeric(3,1) not null default 0,
  tables_used      boolean not null default false,
  tables_opened    text[] not null default '{}',
  error_categories text[] not null default '{}',
  seconds_taken    int,
  graded_by        text not null check (graded_by in ('exact','self','manual','ai')),
  flagged          boolean not null default false,
  is_retry         boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists attempts_created_idx  on attempts(created_at desc);
create index if not exists attempts_exercise_idx on attempts(exercise_id);
create index if not exists attempts_flagged_idx  on attempts(flagged) where flagged;

-- ───────────────────────── Phase 2 (created now, used later) ─────────────────────────
create table if not exists gender_cards (
  vocab_id    uuid primary key references vocab(id) on delete cascade,
  box         int not null default 1 check (box between 1 and 5),
  due_at      timestamptz not null default now(),
  last_result text
);

create table if not exists speed_runs (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('nadg','prepositions')),
  seconds    numeric(6,1) not null,
  errors     int not null default 0,
  created_at timestamptz not null default now()
);

-- ───────────────────────── v_mistakes (for an external assistant) ─────────────────────────
create or replace view v_mistakes as
select
  a.id               as attempt_id,
  a.created_at,
  s.title            as set_title,
  e.id               as exercise_id,
  e.type,
  e.tags,
  a.error_categories,
  a.answer,
  e.payload,
  coalesce(e.payload->>'answer', e.payload->>'german') as expected,
  a.tables_used,
  a.is_retry,
  a.flagged
from attempts a
join exercises e     on e.id = a.exercise_id
join exercise_sets s on s.id = e.set_id
where a.correct = false;

-- ───────────────────────── atomic import ─────────────────────────
-- Called by /api/import with the already-validated JSON.
create or replace function import_set(p jsonb) returns uuid
language plpgsql set search_path = public as $$
declare
  new_id uuid;
  ex     jsonb;
  v      jsonb;
  pos    int := 0;
begin
  insert into exercise_sets(title, source_note)
  values (p->>'title', p->>'source_note')
  returning id into new_id;

  for v in select * from jsonb_array_elements(coalesce(p->'vocab', '[]'::jsonb)) loop
    insert into vocab(set_id, german, article, plural, mongolian, kind, irregular)
    values (new_id, v->>'german', v->>'article', v->>'plural', v->>'mongolian',
            v->>'kind', coalesce((v->>'irregular')::boolean, false));
  end loop;

  for ex in select * from jsonb_array_elements(p->'exercises') loop
    insert into exercises(set_id, position, type, payload, tags)
    values (new_id, pos, ex->>'type',
            ex - 'type' - 'tags',
            coalesce(array(select jsonb_array_elements_text(ex->'tags')), '{}'));
    pos := pos + 1;
  end loop;

  return new_id;
end $$;

-- ───────────────────────── security ─────────────────────────
-- The app talks to the database only from the server with the service-role key,
-- so RLS is on with no policies: the public anon key can read nothing.
alter table exercise_sets enable row level security;
alter table exercises     enable row level security;
alter table vocab         enable row level security;
alter table attempts      enable row level security;
alter table gender_cards  enable row level security;
alter table speed_runs    enable row level security;
revoke execute on function import_set(jsonb) from public, anon, authenticated;
alter view v_mistakes set (security_invoker = true);
