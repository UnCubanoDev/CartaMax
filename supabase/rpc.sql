-- CartaMax RPC Functions
-- Procedures for payment approval, license management, and validation

-- 1. Aprobar Pago y Activar Licencia
create or replace function public.aprobar_pago(pago_id uuid, admin_id uuid)
returns void as $$
declare
  v_negocio_id uuid;
  v_plan_id uuid;
  v_monto decimal;
  v_fecha_vencimiento date;
begin
  -- Get payment details
  select negocio_id, plan_id, monto 
  into v_negocio_id, v_plan_id, v_monto
  from public.pagos 
  where id = pago_id and estado = 'pendiente';
  
  if not found then
    raise exception 'Pago no encontrado o ya procesado';
  end if;

  -- Update payment status
  update public.pagos 
  set estado = 'aprobado', 
      revisado_por = admin_id, 
      fecha_revision = now()
  where id = pago_id;

  -- Calculate expiration date (30 days from now)
  v_fecha_vencimiento := current_date + 30;

  -- Update business status and plan
  update public.negocios 
  set estado = 'activo', 
      plan_id = v_plan_id, 
      fecha_vencimiento = v_fecha_vencimiento,
      updated_at = now()
  where id = v_negocio_id;
end;
$$ language plpgsql security definer;

-- 2. Rechazar Pago
create or replace function public.rechazar_pago(pago_id uuid, admin_id uuid, motivo text default null)
returns void as $$
begin
  update public.pagos 
  set estado = 'rechazado', 
      revisado_por = admin_id, 
      fecha_revision = now(),
      notas = case when motivo is not null then notas || ' | Rechazo: ' || motivo else notas end
  where id = pago_id and estado = 'pendiente';
  
  if not found then
    raise exception 'Pago no encontrado o ya procesado';
  end if;
end;
$$ language plpgsql security definer;

-- 3. Activar Licencia Manualmente (Super Admin)
create or replace function public.activar_licencia(negocio_id uuid, meses int default 1)
returns void as $$
begin
  update public.negocios 
  set estado = 'activo', 
      fecha_vencimiento = coalesce(fecha_vencimiento, current_date) + (meses * 30),
      updated_at = now()
  where id = negocio_id;
end;
$$ language plpgsql security definer;

-- 4. Renovar Licencia
create or replace function public.renovar_licencia(negocio_id uuid, meses int default 1)
returns void as $$
declare
  v_current_expiry date;
begin
  select fecha_vencimiento into v_current_expiry from public.negocios where id = negocio_id;
  
  update public.negocios 
  set fecha_vencimiento = coalesce(v_current_expiry, current_date) + (meses * 30),
      estado = case when estado = 'vencido' then 'activo' else estado end,
      updated_at = now()
  where id = negocio_id;
end;
$$ language plpgsql security definer;

-- 5. Validar Negocio Activo (for public menu access)
create or replace function public.validar_negocio_activo(slug_param text)
returns table (
  es_valido boolean,
  negocio_id uuid,
  nombre text,
  estado_actual text,
  dias_restantes int
) as $$
declare
  v_negocio record;
begin
  select n.id, n.nombre, n.estado, n.fecha_vencimiento
  into v_negocio
  from public.negocios n
  where n.slug = slug_param;
  
  if not found then
    return query select false, null::uuid, null::text, 'no_existe'::text, 0;
    return;
  end if;
  
  return query 
  select 
    (v_negocio.estado = 'activo' and (v_negocio.fecha_vencimiento is null or v_negocio.fecha_vencimiento >= current_date)),
    v_negocio.id,
    v_negocio.nombre,
    v_negocio.estado,
    case 
      when v_negocio.fecha_vencimiento is null then 999
      else (v_negocio.fecha_vencimiento - current_date)
    end::int;
end;
$$ language plpgsql security definer;

-- 6. Get Business Stats (for Super Admin dashboard)
create or replace function public.get_dashboard_stats()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_negocios', (select count(*) from public.negocios),
    'licencias_activas', (select count(*) from public.negocios where estado = 'activo'),
    'pagos_pendientes', (select count(*) from public.pagos where estado = 'pendiente'),
    'ingresos_mensuales', (
      select coalesce(sum(monto), 0) 
      from public.pagos 
      where estado = 'aprobado' 
      and fecha_pago >= date_trunc('month', current_date)
    )
  ) into result;
  return result;
end;
$$ language plpgsql security definer;

-- 7. List auth users (for super admin user assignment)
create or replace function public.admin_list_users()
returns table (id uuid, email text, created_at timestamptz)
language sql security definer
as $$
  select id, email, created_at from auth.users order by created_at desc;
$$;

-- 8. Create auth user (for super admin)
create or replace function public.admin_create_user(p_email text, p_password text)
returns json
language plpgsql security definer
as $$
declare
  v_user_id uuid;
begin
  if exists (select 1 from auth.users where email = p_email) then
    raise exception 'El usuario con email % ya existe', p_email;
  end if;

  v_user_id := gen_random_uuid();
  
  insert into auth.users (
    id, instance_id, email, encrypted_password, 
    email_confirmed_at, confirmation_sent_at,
    raw_user_meta_data, raw_app_meta_data, 
    created_at, updated_at, 
    role, aud
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000',
    p_email, crypt(p_password, gen_salt('bf')),
    now(), now(),
    '{}'::jsonb,
    '{"provider":"email","providers":["email"]}',
    now(), now(),
    'authenticated', 'authenticated'
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) values (
    v_user_id, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email', p_email,
    now(), now(), now()
  );

  return json_build_object('id', v_user_id::text, 'email', p_email);
end;
$$;
