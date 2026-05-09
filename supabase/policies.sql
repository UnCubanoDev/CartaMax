-- CartaMax RLS (Row Level Security) Policies
-- Multi-tenant isolation using negocio_id and auth.uid()

-- Enable RLS on all tenant-specific tables
alter table public.negocios enable row level security;
alter table public.mesas enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.pagos enable row level security;

-- Helper function to get user role (checks user_metadata first, then JWT role)
create or replace function public.get_user_role()
returns text as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    'anon'
  );
$$ language sql stable;

-- Helper function to get negocio_id from auth email (for business users)
create or replace function public.get_my_negocio_id()
returns uuid as $$
  select id from public.negocios where owner_email = auth.email();
$$ language sql stable security definer;

-- POLICIES FOR NEGOCIOS
drop policy if exists "Super admin full access on negocios" on public.negocios;
create policy "Super admin full access on negocios"
  on public.negocios for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Business owners can view own negocio" on public.negocios;
create policy "Business owners can view own negocio"
  on public.negocios for select
  using (id = public.get_my_negocio_id());

drop policy if exists "Business owners can update own negocio" on public.negocios;
create policy "Business owners can update own negocio"
  on public.negocios for update
  using (id = public.get_my_negocio_id())
  with check (id = public.get_my_negocio_id());

-- POLICIES FOR MESAS
drop policy if exists "Super admin full access on mesas" on public.mesas;
create policy "Super admin full access on mesas"
  on public.mesas for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Business can manage own mesas" on public.mesas;
create policy "Business can manage own mesas"
  on public.mesas for all
  using (negocio_id = public.get_my_negocio_id())
  with check (negocio_id = public.get_my_negocio_id());

drop policy if exists "Public can view active mesas" on public.mesas;
create policy "Public can view active mesas"
  on public.mesas for select
  using (
    activa = true 
    and exists (
      select 1 from public.negocios n 
      where n.id = negocio_id 
      and n.estado = 'activo'
    )
  );

-- POLICIES FOR CATEGORIAS
drop policy if exists "Super admin full access on categorias" on public.categorias;
create policy "Super admin full access on categorias"
  on public.categorias for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Business can manage own categorias" on public.categorias;
create policy "Business can manage own categorias"
  on public.categorias for all
  using (negocio_id = public.get_my_negocio_id())
  with check (negocio_id = public.get_my_negocio_id());

drop policy if exists "Public can view active categorias" on public.categorias;
create policy "Public can view active categorias"
  on public.categorias for select
  using (
    activa = true 
    and exists (
      select 1 from public.negocios n 
      where n.id = negocio_id 
      and n.estado = 'activo'
    )
  );

-- POLICIES FOR PRODUCTOS
drop policy if exists "Super admin full access on productos" on public.productos;
create policy "Super admin full access on productos"
  on public.productos for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Business can manage own productos" on public.productos;
create policy "Business can manage own productos"
  on public.productos for all
  using (negocio_id = public.get_my_negocio_id())
  with check (negocio_id = public.get_my_negocio_id());

drop policy if exists "Public can view available productos" on public.productos;
create policy "Public can view available productos"
  on public.productos for select
  using (
    disponible = true 
    and exists (
      select 1 from public.negocios n 
      where n.id = negocio_id 
      and n.estado = 'activo'
    )
  );

-- POLICIES FOR PAGOS
drop policy if exists "Super admin full access on pagos" on public.pagos;
create policy "Super admin full access on pagos"
  on public.pagos for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Business can view own pagos" on public.pagos;
create policy "Business can view own pagos"
  on public.pagos for select
  using (negocio_id = public.get_my_negocio_id());

drop policy if exists "Business can insert own pagos" on public.pagos;
create policy "Business can insert own pagos"
  on public.pagos for insert
  with check (negocio_id = public.get_my_negocio_id());

-- POLICIES FOR PLANES (public read, super admin write)
alter table public.planes enable row level security;
drop policy if exists "Anyone can view active planes" on public.planes;
create policy "Anyone can view active planes"
  on public.planes for select
  using (activo = true);

drop policy if exists "Super admin full access on planes" on public.planes;
create policy "Super admin full access on planes"
  on public.planes for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

-- POLICIES FOR CONFIGURACION_PAGO (super admin only)
alter table public.configuracion_pago enable row level security;
drop policy if exists "Super admin manages configuracion_pago" on public.configuracion_pago;
create policy "Super admin manages configuracion_pago"
  on public.configuracion_pago for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

-- POLICIES FOR ORDENES
alter table public.ordenes enable row level security;
alter table public.ordenes_productos enable row level security;

drop policy if exists "Super admin full access on ordenes" on public.ordenes;
create policy "Super admin full access on ordenes"
  on public.ordenes for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Anyone can create ordenes" on public.ordenes;
create policy "Anyone can create ordenes"
  on public.ordenes for insert
  with check (true);

drop policy if exists "Public can view ordenes" on public.ordenes;
create policy "Public can view ordenes"
  on public.ordenes for select
  using (true);

drop policy if exists "Business can view own ordenes" on public.ordenes;
create policy "Business can view own ordenes"
  on public.ordenes for select
  using (negocio_id = public.get_my_negocio_id());

drop policy if exists "Business can update own ordenes" on public.ordenes;
create policy "Business can update own ordenes"
  on public.ordenes for update
  using (negocio_id = public.get_my_negocio_id())
  with check (negocio_id = public.get_my_negocio_id());

drop policy if exists "Super admin full access on ordenes_productos" on public.ordenes_productos;
create policy "Super admin full access on ordenes_productos"
  on public.ordenes_productos for all
  using (public.get_user_role() = 'super_admin')
  with check (public.get_user_role() = 'super_admin');

drop policy if exists "Anyone can create ordenes_productos" on public.ordenes_productos;
create policy "Anyone can create ordenes_productos"
  on public.ordenes_productos for insert
  with check (true);

drop policy if exists "Business can view own ordenes_productos" on public.ordenes_productos;
create policy "Business can view own ordenes_productos"
  on public.ordenes_productos for select
  using (
    exists (
      select 1 from public.ordenes o
      where o.id = orden_id
      and o.negocio_id = public.get_my_negocio_id()
    )
  );
