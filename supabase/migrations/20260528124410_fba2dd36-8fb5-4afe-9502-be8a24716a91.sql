
-- ===== Enums =====
create type public.clothing_category as enum (
  'top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessory'
);

create type public.mannequin_preset as enum (
  'neutral_light', 'neutral_medium', 'neutral_dark',
  'curvy_light', 'curvy_medium', 'curvy_dark',
  'slim_light', 'slim_medium', 'slim_dark'
);

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  mannequin_preset public.mannequin_preset not null default 'neutral_medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- generic updated_at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ===== Clothing items =====
create table public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.clothing_category not null,
  color text,
  name text,
  image_url text not null,
  cutout_url text,
  ai_tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index clothing_items_user_idx on public.clothing_items(user_id, created_at desc);
create index clothing_items_user_cat_idx on public.clothing_items(user_id, category);

grant select, insert, update, delete on public.clothing_items to authenticated;
grant all on public.clothing_items to service_role;

alter table public.clothing_items enable row level security;

create policy "Users can view their own items"
  on public.clothing_items for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own items"
  on public.clothing_items for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on public.clothing_items for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.clothing_items for delete to authenticated
  using (auth.uid() = user_id);

-- ===== Outfits =====
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled look',
  mannequin_preset public.mannequin_preset not null default 'neutral_medium',
  item_ids uuid[] not null default '{}',
  generated_image_url text,
  created_at timestamptz not null default now()
);

create index outfits_user_idx on public.outfits(user_id, created_at desc);

grant select, insert, update, delete on public.outfits to authenticated;
grant all on public.outfits to service_role;

alter table public.outfits enable row level security;

create policy "Users can view their own outfits"
  on public.outfits for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own outfits"
  on public.outfits for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own outfits"
  on public.outfits for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own outfits"
  on public.outfits for delete to authenticated
  using (auth.uid() = user_id);

-- ===== Collections =====
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cover_outfit_id uuid references public.outfits(id) on delete set null,
  created_at timestamptz not null default now()
);

create index collections_user_idx on public.collections(user_id, created_at desc);

grant select, insert, update, delete on public.collections to authenticated;
grant all on public.collections to service_role;

alter table public.collections enable row level security;

create policy "Users can view their own collections"
  on public.collections for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own collections"
  on public.collections for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on public.collections for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on public.collections for delete to authenticated
  using (auth.uid() = user_id);

-- ===== Collection ↔ Outfits join =====
create table public.collection_outfits (
  collection_id uuid not null references public.collections(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, outfit_id)
);

create index collection_outfits_outfit_idx on public.collection_outfits(outfit_id);

grant select, insert, update, delete on public.collection_outfits to authenticated;
grant all on public.collection_outfits to service_role;

alter table public.collection_outfits enable row level security;

create policy "Users can view their own collection_outfits"
  on public.collection_outfits for select to authenticated
  using (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.user_id = auth.uid())
  );

create policy "Users can insert their own collection_outfits"
  on public.collection_outfits for insert to authenticated
  with check (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.user_id = auth.uid())
    and exists (select 1 from public.outfits o
            where o.id = outfit_id and o.user_id = auth.uid())
  );

create policy "Users can delete their own collection_outfits"
  on public.collection_outfits for delete to authenticated
  using (
    exists (select 1 from public.collections c
            where c.id = collection_id and c.user_id = auth.uid())
  );

-- ===== Storage bucket =====
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Files are stored under {user_id}/...
create policy "Users can read wardrobe (public read)"
  on storage.objects for select to public
  using (bucket_id = 'wardrobe');

create policy "Users can upload to their own wardrobe folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update files in their own wardrobe folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete files in their own wardrobe folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
