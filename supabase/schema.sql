-- CartaMax SaaS Multi-tenant Database Schema
-- Generated: 2026-05-07
-- This schema supports multi-tenant QR digital menu SaaS for restaurants.

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Configuración de Pagos (Bank transfer settings for manual payments)
create table if not exists public.configuracion_pago (
    id uuid primary key default uuid_generate_v4(),
    banco_nombre text not null,
    numero_cuenta text not null,
    clabe text,
    beneficiario text not null,
    instrucciones text,
    activo boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. Planes de Suscripción
create table if not exists public.planes (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null unique,
    descripcion text,
    precio_mensual decimal(10,2) not null check (precio_mensual >= 0),
    max_productos int check (max_productos > 0),
    max_categorias int check (max_categorias > 0),
    max_mesas int check (max_mesas > 0),
    activo boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. Negocios (Tenants)
create table if not exists public.negocios (
    id uuid primary key default uuid_generate_v4(),
    nombre text not null,
    slug text not null unique, -- for public URL e.g., usuario.github.io/restaurante-demo
    logo_url text,
    direccion text,
    telefono text,
    email text,
    owner_email text not null unique, -- email del dueño (para auth)
    plan_id uuid references public.planes(id) on delete set null,
    estado text not null check (estado in ('activo', 'inactivo', 'pendiente', 'vencido')) default 'pendiente',
    fecha_vencimiento date,
    configuracion jsonb default '{}', -- settings like colors, etc.
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 4. Pagos (Manual payment proofs)
create table if not exists public.pagos (
    id uuid primary key default uuid_generate_v4(),
    negocio_id uuid not null references public.negocios(id) on delete cascade,
    plan_id uuid references public.planes(id) on delete set null,
    monto decimal(10,2) not null check (monto >= 0),
    comprobante_url text, -- storage path
    estado text not null check (estado in ('pendiente', 'aprobado', 'rechazado')) default 'pendiente',
    fecha_pago date not null default current_date,
    notas text,
    revisado_por uuid, -- super admin who reviewed
    fecha_revision timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 5. Mesas
create table if not exists public.mesas (
    id uuid primary key default uuid_generate_v4(),
    negocio_id uuid not null references public.negocios(id) on delete cascade,
    numero int not null,
    nombre text,
    codigo_qr text, -- generated QR content
    activa boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (negocio_id, numero)
);

-- 6. Categorías
create table if not exists public.categorias (
    id uuid primary key default uuid_generate_v4(),
    negocio_id uuid not null references public.negocios(id) on delete cascade,
    nombre text not null,
    descripcion text,
    orden int default 0,
    activa boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 7. Productos
create table if not exists public.productos (
    id uuid primary key default uuid_generate_v4(),
    negocio_id uuid not null references public.negocios(id) on delete cascade,
    categoria_id uuid references public.categorias(id) on delete set null,
    nombre text not null,
    descripcion text,
    precio decimal(10,2) not null check (precio >= 0),
    imagen_url text,
    disponible boolean default true,
    destacado boolean default false,
    ingredientes text[], -- array of strings
    alergenos text[], -- array of strings
    orden int default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 8. Ordenes (platform orders)
create table if not exists public.ordenes (
    id uuid primary key default uuid_generate_v4(),
    negocio_id uuid not null references public.negocios(id) on delete cascade,
    mesa_numero int,
    nombre_cliente text,
    estado text not null default 'pendiente' check (estado in ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
    total decimal(10,2) not null check (total >= 0),
    notas text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 9. Ordenes Productos (line items)
create table if not exists public.ordenes_productos (
    id uuid primary key default uuid_generate_v4(),
    orden_id uuid not null references public.ordenes(id) on delete cascade,
    producto_id uuid references public.productos(id) on delete set null,
    nombre_producto text not null,
    precio_unitario decimal(10,2) not null,
    cantidad int not null check (cantidad > 0),
    subtotal decimal(10,2) not null
);

-- Indexes for performance
create index if not exists idx_negocios_slug on public.negocios(slug);
create index if not exists idx_negocios_estado on public.negocios(estado);
create index if not exists idx_negocios_owner_email on public.negocios(owner_email);
create index if not exists idx_pagos_negocio_id on public.pagos(negocio_id);
create index if not exists idx_pagos_estado on public.pagos(estado);
create index if not exists idx_mesas_negocio_id on public.mesas(negocio_id);
create index if not exists idx_categorias_negocio_id on public.categorias(negocio_id);
create index if not exists idx_productos_negocio_id on public.productos(negocio_id);
create index if not exists idx_productos_categoria_id on public.productos(categoria_id);
create index if not exists idx_ordenes_negocio_id on public.ordenes(negocio_id);
create index if not exists idx_ordenes_estado on public.ordenes(estado);
create index if not exists idx_ordenes_productos_orden_id on public.ordenes_productos(orden_id);

-- Trigger function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers (drop first to make idempotent)
drop trigger if exists trg_configuracion_pago_updated_at on public.configuracion_pago;
create trigger trg_configuracion_pago_updated_at before update on public.configuracion_pago for each row execute function public.handle_updated_at();
drop trigger if exists trg_planes_updated_at on public.planes;
create trigger trg_planes_updated_at before update on public.planes for each row execute function public.handle_updated_at();
drop trigger if exists trg_negocios_updated_at on public.negocios;
create trigger trg_negocios_updated_at before update on public.negocios for each row execute function public.handle_updated_at();
drop trigger if exists trg_pagos_updated_at on public.pagos;
create trigger trg_pagos_updated_at before update on public.pagos for each row execute function public.handle_updated_at();
drop trigger if exists trg_mesas_updated_at on public.mesas;
create trigger trg_mesas_updated_at before update on public.mesas for each row execute function public.handle_updated_at();
drop trigger if exists trg_categorias_updated_at on public.categorias;
create trigger trg_categorias_updated_at before update on public.categorias for each row execute function public.handle_updated_at();
drop trigger if exists trg_productos_updated_at on public.productos;
create trigger trg_productos_updated_at before update on public.productos for each row execute function public.handle_updated_at();
drop trigger if exists trg_ordenes_updated_at on public.ordenes;
create trigger trg_ordenes_updated_at before update on public.ordenes for each row execute function public.handle_updated_at();

-- Function to automatically set owner as super admin? Not needed. We'll handle roles via auth.users.

-- Note: RLS policies will be in policies.sql
-- Note: RPC functions will be in rpc.sql
-- Note: Storage buckets will be in storage.sql
