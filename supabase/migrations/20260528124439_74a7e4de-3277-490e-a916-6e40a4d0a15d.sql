
-- Fix search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lock down SECURITY DEFINER functions: only triggers (postgres) should call them
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Replace overly-broad public SELECT on wardrobe with a per-user listing rule.
-- Public URLs still work because public.buckets.public = true.
drop policy if exists "Users can read wardrobe (public read)" on storage.objects;

create policy "Users can list their own wardrobe files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
