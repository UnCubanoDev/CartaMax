-- CartaMax Storage Buckets and Policies
-- Buckets: logos-negocios, productos, comprobantes

-- Note: Buckets must be created via Supabase Dashboard or API
-- This file documents the SQL-based policies for storage

-- 1. Bucket: logos-negocios (Public read, business write)
insert into storage.buckets (id, name, public) 
values ('logos-negocios', 'logos-negocios', true)
on conflict (id) do nothing;

-- 2. Bucket: productos (Public read, business write)
insert into storage.buckets (id, name, public) 
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- 3. Bucket: comprobantes (Private, business write, super admin read)
insert into storage.buckets (id, name, public) 
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Helper function to get negocio_id from JWT or request
create or replace function public.get_auth_negocio_id()
returns uuid as $$
  select id from public.negocios where owner_email = auth.email();
$$ language sql stable;

-- STORAGE POLICIES FOR LOGOS-NEGOCIOS (Public read, authenticated business write)
create policy "Public read logos"
  on storage.objects for select
  using (bucket_id = 'logos-negocios');

create policy "Business upload own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'logos-negocios'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Business update own logo"
  on storage.objects for update
  using (
    bucket_id = 'logos-negocios'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Business delete own logo"
  on storage.objects for delete
  using (
    bucket_id = 'logos-negocios'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

-- STORAGE POLICIES FOR PRODUCTOS (Public read, authenticated business write)
create policy "Public read productos"
  on storage.objects for select
  using (bucket_id = 'productos');

create policy "Business upload own product images"
  on storage.objects for insert
  with check (
    bucket_id = 'productos'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Business update own product images"
  on storage.objects for update
  using (
    bucket_id = 'productos'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Business delete own product images"
  on storage.objects for delete
  using (
    bucket_id = 'productos'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

-- STORAGE POLICIES FOR COMPROBANTES (Private: business upload, super admin read)
create policy "Business upload own comprobantes"
  on storage.objects for insert
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Business read own comprobantes"
  on storage.objects for select
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Super admin read all comprobantes"
  on storage.objects for select
  using (
    bucket_id = 'comprobantes'
    and public.get_user_role() = 'super_admin'
  );

create policy "Super admin delete comprobantes"
  on storage.objects for delete
  using (
    bucket_id = 'comprobantes'
    and public.get_user_role() = 'super_admin'
  );
