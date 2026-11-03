-- =====================================================================
-- Pixelario — esquema inicial
-- 9 tablas, Row Level Security, función pública get_public_book,
-- bucket privado de fotos y utilidades.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  timezone text not null default 'America/Lima',
  theme text not null default 'system' check (theme in ('system', 'day', 'night')),
  default_reminder_channels text[] not null default array['app', 'email'],
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- people (un libro por persona)
-- ---------------------------------------------------------------------

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  nickname text check (char_length(nickname) <= 60),
  relationship text not null default 'amigo' check (char_length(relationship) <= 40),
  cover_color text not null default '#8B3A3A' check (cover_color ~ '^#[0-9A-Fa-f]{6}$'),
  avatar_url text,
  tagline text check (char_length(tagline) <= 140),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_owner_id_idx on public.people (owner_id);

create trigger people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- Cualquier cambio en un capítulo cuenta como "última edición" del libro.
create or replace function public.touch_person()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.people set updated_at = now() where id = old.person_id;
  else
    update public.people set updated_at = now() where id = new.person_id;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade, -- null = predefinida
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'other',
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create index categories_owner_id_idx on public.categories (owner_id);

insert into public.categories (owner_id, name, icon, sort_order) values
  (null, 'Comida', 'food', 1),
  (null, 'Bebida', 'drink', 2),
  (null, 'Música', 'music', 3),
  (null, 'Películas y series', 'movies', 4),
  (null, 'Libros', 'books', 5),
  (null, 'Lugares', 'places', 6),
  (null, 'Actividades', 'activities', 7),
  (null, 'Colores', 'colors', 8),
  (null, 'Animales', 'animals', 9),
  (null, 'Otros', 'other', 99);

-- ---------------------------------------------------------------------
-- preferences (le gusta / no le gusta)
-- ---------------------------------------------------------------------

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  kind text not null check (kind in ('like', 'dislike')),
  title text not null check (char_length(title) between 1 and 120),
  note text check (char_length(note) <= 1000),
  intensity smallint not null default 2 check (intensity between 1 and 3),
  changed_at timestamptz, -- fecha en que pasó de "le gusta" a "no le gusta" (o al revés)
  created_at timestamptz not null default now()
);

create index preferences_person_id_idx on public.preferences (person_id);

create trigger preferences_touch_person
  after insert or update or delete on public.preferences
  for each row execute function public.touch_person();

-- ---------------------------------------------------------------------
-- anecdotes
-- ---------------------------------------------------------------------

create table public.anecdotes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 5000),
  happened_on date,
  place text check (char_length(place) <= 120),
  mood text,
  photos text[] not null default '{}' check (coalesce(array_length(photos, 1), 0) <= 4),
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create index anecdotes_person_id_idx on public.anecdotes (person_id);

create trigger anecdotes_touch_person
  after insert or update or delete on public.anecdotes
  for each row execute function public.touch_person();

-- ---------------------------------------------------------------------
-- important_dates
-- ---------------------------------------------------------------------

create table public.important_dates (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  type text not null default 'birthday' check (type in ('birthday', 'anniversary', 'saint', 'custom')),
  label text not null check (char_length(label) between 1 and 80),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  year int check (year between 1900 and 2200), -- nullable: cumpleaños sin año
  recurring boolean not null default true,
  remind_days_before int[] not null default '{7,0}',
  created_at timestamptz not null default now()
);

create index important_dates_person_id_idx on public.important_dates (person_id);

create trigger important_dates_touch_person
  after insert or update or delete on public.important_dates
  for each row execute function public.touch_person();

-- ---------------------------------------------------------------------
-- gift_ideas
-- ---------------------------------------------------------------------

create table public.gift_ideas (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  preference_id uuid references public.preferences (id) on delete set null,
  date_id uuid references public.important_dates (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  price_estimate numeric(12, 2) check (price_estimate >= 0),
  url text check (char_length(url) <= 2000),
  note text check (char_length(note) <= 1000),
  status text not null default 'idea' check (status in ('idea', 'bought', 'given')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gift_ideas_person_id_idx on public.gift_ideas (person_id);

create trigger gift_ideas_updated_at
  before update on public.gift_ideas
  for each row execute function public.set_updated_at();

create trigger gift_ideas_touch_person
  after insert or update or delete on public.gift_ideas
  for each row execute function public.touch_person();

-- ---------------------------------------------------------------------
-- reminders
-- ---------------------------------------------------------------------

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id uuid references public.people (id) on delete cascade,
  date_id uuid references public.important_dates (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  note text check (char_length(note) <= 1000),
  due_at timestamptz not null,
  repeat text not null default 'none' check (repeat in ('none', 'weekly', 'monthly', 'yearly')),
  channels text[] not null default array['app', 'email'],
  done_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index reminders_owner_id_idx on public.reminders (owner_id);
create index reminders_due_at_pending_idx on public.reminders (due_at) where done_at is null;

-- ---------------------------------------------------------------------
-- share_links
-- ---------------------------------------------------------------------

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.people (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  sections jsonb not null default
    '{"likes": true, "dislikes": true, "anecdotes": true, "dates": false, "gifts": false, "reminders": false}'::jsonb,
  expires_at timestamptz,
  is_active boolean not null default true,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

-- (share_links.token ya tiene índice único)

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.people enable row level security;
alter table public.categories enable row level security;
alter table public.preferences enable row level security;
alter table public.anecdotes enable row level security;
alter table public.important_dates enable row level security;
alter table public.gift_ideas enable row level security;
alter table public.reminders enable row level security;
alter table public.share_links enable row level security;

-- profiles: cada usuario solo su fila
create policy "own_profile_select" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "own_profile_update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- people
create policy "owner_all" on public.people
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- categories: predefinidas visibles para todos los usuarios; propias editables
create policy "categories_select" on public.categories
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "categories_insert" on public.categories
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "categories_update" on public.categories
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "categories_delete" on public.categories
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Tablas hijas: acceso si la persona pertenece al usuario
create policy "owner_all" on public.preferences
  for all to authenticated
  using (exists (select 1 from public.people p where p.id = preferences.person_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.people p where p.id = preferences.person_id and p.owner_id = (select auth.uid())));

create policy "owner_all" on public.anecdotes
  for all to authenticated
  using (exists (select 1 from public.people p where p.id = anecdotes.person_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.people p where p.id = anecdotes.person_id and p.owner_id = (select auth.uid())));

create policy "owner_all" on public.important_dates
  for all to authenticated
  using (exists (select 1 from public.people p where p.id = important_dates.person_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.people p where p.id = important_dates.person_id and p.owner_id = (select auth.uid())));

create policy "owner_all" on public.gift_ideas
  for all to authenticated
  using (exists (select 1 from public.people p where p.id = gift_ideas.person_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.people p where p.id = gift_ideas.person_id and p.owner_id = (select auth.uid())));

create policy "owner_all" on public.share_links
  for all to authenticated
  using (exists (select 1 from public.people p where p.id = share_links.person_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.people p where p.id = share_links.person_id and p.owner_id = (select auth.uid())));

-- reminders: del usuario; si apunta a una persona, también debe ser suya
create policy "owner_all" on public.reminders
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and (
      person_id is null
      or exists (select 1 from public.people p where p.id = reminders.person_id and p.owner_id = (select auth.uid()))
    )
  );

-- =====================================================================
-- Funciones RPC
-- =====================================================================

-- Regenera el token de un link (invalida el anterior). Respeta RLS.
create or replace function public.regenerate_share_token(p_person_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  update public.share_links
     set token = v_token, view_count = 0
   where person_id = p_person_id;
  if not found then
    raise exception 'share link not found';
  end if;
  return v_token;
end;
$$;

grant execute on function public.regenerate_share_token(uuid) to authenticated;

-- Acceso público controlado: los visitantes nunca leen las tablas.
-- p_count_view = false se usa para la imagen Open Graph (no suma visitas).
create or replace function public.get_public_book(token text, p_count_view boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.share_links;
  v_person public.people;
  v_sections jsonb;
  v_result jsonb;
begin
  select * into v_link
    from public.share_links l
   where l.token = get_public_book.token
     and l.is_active
     and (l.expires_at is null or l.expires_at > now());

  if not found then
    return null;
  end if;

  if p_count_view then
    update public.share_links set view_count = view_count + 1 where id = v_link.id;
  end if;

  select * into v_person from public.people where id = v_link.person_id;
  v_sections := v_link.sections;

  v_result := jsonb_build_object(
    'person', jsonb_build_object(
      'name', v_person.name,
      'nickname', v_person.nickname,
      'relationship', v_person.relationship,
      'cover_color', v_person.cover_color,
      'avatar_url', v_person.avatar_url,
      'tagline', v_person.tagline
    ),
    'author', (select display_name from public.profiles where id = v_person.owner_id),
    'sections', v_sections
  );

  if coalesce((v_sections ->> 'likes')::boolean, false) then
    v_result := v_result || jsonb_build_object('likes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', pr.id, 'title', pr.title, 'note', pr.note, 'intensity', pr.intensity,
        'category_name', c.name, 'category_icon', c.icon
      ) order by c.sort_order nulls last, c.name, pr.intensity desc, pr.created_at), '[]'::jsonb)
      from public.preferences pr
      left join public.categories c on c.id = pr.category_id
      where pr.person_id = v_person.id and pr.kind = 'like'
    ));
  end if;

  if coalesce((v_sections ->> 'dislikes')::boolean, false) then
    v_result := v_result || jsonb_build_object('dislikes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', pr.id, 'title', pr.title, 'note', pr.note, 'intensity', pr.intensity,
        'category_name', c.name, 'category_icon', c.icon
      ) order by c.sort_order nulls last, c.name, pr.intensity desc, pr.created_at), '[]'::jsonb)
      from public.preferences pr
      left join public.categories c on c.id = pr.category_id
      where pr.person_id = v_person.id and pr.kind = 'dislike'
    ));
  end if;

  if coalesce((v_sections ->> 'anecdotes')::boolean, false) then
    v_result := v_result || jsonb_build_object('anecdotes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', a.id, 'title', a.title, 'body', a.body, 'happened_on', a.happened_on,
        'place', a.place, 'mood', a.mood, 'photos', a.photos
      ) order by a.happened_on desc nulls last, a.created_at desc), '[]'::jsonb)
      from public.anecdotes a
      where a.person_id = v_person.id and not a.is_private
    ));
  end if;

  if coalesce((v_sections ->> 'dates')::boolean, false) then
    v_result := v_result || jsonb_build_object('dates', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'type', d.type, 'label', d.label, 'month', d.month, 'day', d.day,
        'year', d.year, 'recurring', d.recurring
      ) order by d.month, d.day), '[]'::jsonb)
      from public.important_dates d
      where d.person_id = v_person.id
    ));
  end if;

  if coalesce((v_sections ->> 'gifts')::boolean, false) then
    v_result := v_result || jsonb_build_object('gifts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', g.id, 'title', g.title, 'price_estimate', g.price_estimate, 'url', g.url,
        'note', g.note, 'status', g.status
      ) order by g.created_at desc), '[]'::jsonb)
      from public.gift_ideas g
      where g.person_id = v_person.id
    ));
  end if;

  if coalesce((v_sections ->> 'reminders')::boolean, false) then
    v_result := v_result || jsonb_build_object('reminders', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'title', r.title, 'note', r.note, 'due_at', r.due_at, 'repeat', r.repeat
      ) order by r.due_at), '[]'::jsonb)
      from public.reminders r
      where r.person_id = v_person.id and r.done_at is null
    ));
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_public_book(text, boolean) from public;
grant execute on function public.get_public_book(text, boolean) to anon, authenticated;

-- Eliminar la cuenta propia con todo su contenido (cascade).
-- Las fotos de Storage se borran antes desde el servidor.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- =====================================================================
-- Storage: bucket privado de fotos  <owner_id>/<person_id>/<archivo>
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "photos_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
