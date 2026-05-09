# Row Level Security (RLS) Policies - CartaMax

## Introducción

Row Level Security (RLS) es el mecanismo de PostgreSQL que CartaMax utiliza para implementar el multi-tenancy. Cada negocio solo puede acceder a sus propios datos.

## Cómo Funciona

1. **Usuario autenticado** → JWT generado por Supabase Auth
2. **JWT contiene**: `user_id`, `email`, `role` (en metadata)
3. **RLS Policies** evalúan cada consulta contra el JWT
4. **Solo se retornan** las filas que cumplen la política

## Funciones Helper

Estas funciones están en `supabase/policies.sql` y ayudan a las políticas:

### `get_user_role()`
```sql
create or replace function public.get_user_role()
returns text as $$
  select coalesce((auth.jwt() ->> 'role'), 'anon');
$$ language sql stable;
```
Retorna el rol del usuario desde el JWT.

### `get_my_negocio_id()`
```sql
create or replace function public.get_my_negocio_id()
returns uuid as $$
  select id from public.negocios where owner_email = auth.email();
$$ language sql stable;
```
Retorna el ID del negocio basado en el email del usuario autenticado.

## Políticas por Tabla

### Negocios
```sql
-- Super admin tiene acceso total
create policy "Super admin full access on negocios"
  on public.negocios for all
  using (public.get_user_role() = 'super_admin');

-- Negocios solo ven y editan su propio registro
create policy "Business owners can view own negocio"
  on public.negocios for select
  using (id = public.get_my_negocio_id());

create policy "Business owners can update own negocio"
  on public.negocios for update
  using (id = public.get_my_negocio_id());
```

### Mesas, Categorías, Productos
Todas siguen el mismo patrón:
```sql
-- Super admin: acceso total
create policy "Super admin full access on [tabla]"
  on public.[tabla] for all
  using (public.get_user_role() = 'super_admin');

-- Negocio: solo sus propios datos
create policy "Business can manage own [tabla]"
  on public.[tabla] for all
  using (negocio_id = public.get_my_negocio_id());

-- Público: solo lectura de activos
create policy "Public can view active [tabla]"
  on public.[tabla] for select
  using (activa = true AND existe_negocio_activo);
```

### Pagos
```sql
-- Super admin: acceso total
create policy "Super admin full access on pagos"
  on public.pagos for all
  using (public.get_user_role() = 'super_admin');

-- Negocio: solo ve sus pagos
create policy "Business can view own pagos"
  on public.pagos for select
  using (negocio_id = public.get_my_negocio_id());

-- Negocio: puede insertar (enviar comprobante)
create policy "Business can insert own pagos"
  on public.pagos for insert
  with check (negocio_id = public.get_my_negocio_id());
```

## Storage Policies

### Buckets

#### `logos-negocios` (Público)
```sql
-- Cualquiera puede ver (GET)
create policy "Public read logos"
  on storage.objects for select
  using (bucket_id = 'logos-negocios');

-- Negocio solo sube a su carpeta
create policy "Business upload own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'logos-negocios'
    AND (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );
```

#### `comprobantes` (Privado)
```sql
-- Solo el negocio y super admin pueden ver
create policy "Business read own comprobantes"
  on storage.objects for select
  using (
    bucket_id = 'comprobantes'
    AND (storage.foldername(name))[1] = public.get_auth_negocio_id()::text
  );

create policy "Super admin read all comprobantes"
  on storage.objects for select
  using (
    bucket_id = 'comprobantes'
    AND public.get_user_role() = 'super_admin'
  );
```

## Configuración de Roles en JWT

Para que las políticas funcionen, el JWT debe contener el rol:

### Super Admin
```json
{
  "role": "super_admin",
  "email": "admin@cartamax.com"
}
```

### Negocio (Business)
```json
{
  "role": "authenticated",
  "email": "negocio@restaurante.com"
}
```

El rol `negocio` se determina por la relación `negocios.owner_email = auth.email()`.

## Pruebas de RLS

### Como Super Admin
```sql
-- Debe ver todos los negocios
SELECT * FROM negocios; -- Retorna todos
```

### Como Negocio
```sql
-- Solo ve su negocio
SELECT * FROM negocios; -- Retorna solo 1 fila

-- No puede ver mesas de otros
SELECT * FROM mesas; -- Solo las de su negocio
```

## Security Best Practices

1. **Siempre habilitar RLS** en tablas con datos sensibles
2. **Usar funciones helper** para lógica compleja de autorización
3. **Probar políticas** con diferentes usuarios
4. **No confiar solo en cliente** - La seguridad real está en la BD
5. **Auditoría** - Usar triggers para registrar cambios importantes

## Troubleshooting

### "Permission denied"
- Verifica que RLS está habilitado: `ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;`
- Revisa que la política existe y es correcta
- Verifica que el JWT tiene los claims correctos

### "No rows returned"
- La política está filtrando todos los resultados
- Revisa la lógica de la política
- Prueba la función helper por separado

### Storage Access Denied
- Verifica que el bucket existe
- Revisa las políticas de storage
- Asegura que la ruta del archivo sea correcta (`negocio_id/archivo.ext`)
