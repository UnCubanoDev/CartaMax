# Guía Completa de Configuración de Supabase para CartaMax

Esta guía te llevará paso a paso para configurar Supabase para el proyecto CartaMax.

## Requisitos Previos

- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- Node.js instalado en tu computadora
- Conocimientos básicos de bases de datos

## Paso 1: Crear un Proyecto en Supabase

1. Inicia sesión en [Supabase](https://supabase.com)
2. Haz clic en "New Project"
3. Completa los datos:
   - **Name**: `CartaMax` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a tu ubicación
4. Haz clic en "Create new project"
5. Espera a que se cree el proyecto (aprox. 2 minutos)

## Paso 2: Obtener URL y API Key

1. En el dashboard de tu proyecto, ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **URL**: `Project URL` (ejemplo: `https://abcdefg.supabase.co`)
   - **anon key**: `anon` `public` key

3. Crea un archivo `.env` en la raíz de tu proyecto CartaMax:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Paso 3: Ejecutar el Schema de Base de Datos

1. En el dashboard, ve a **SQL Editor**
2. Haz clic en "New Query"
3. Copia y pega el contenido del archivo `supabase/schema.sql` de este proyecto
4. Haz clic en "Run" para ejecutar el script
5. Esto creará todas las tablas necesarias:
   - `configuracion_pago`
   - `planes`
   - `negocios`
   - `pagos`
   - `mesas`
   - `categorias`
   - `productos`

## Paso 4: Configurar Row Level Security (RLS)

1. En el **SQL Editor**, crea una nueva consulta
2. Copia y pega el contenido de `supabase/policies.sql`
3. Ejecuta el script para habilitar las políticas de seguridad multi-tenant

**¿Qué hace esto?** Asegura que cada negocio solo pueda ver y modificar sus propios datos.

## Paso 5: Crear Funciones RPC

1. En el **SQL Editor**, crea una nueva consulta
2. Copia y pega el contenido de `supabase/rpc.sql`
3. Ejecuta el script

Estas funciones permiten:
- Aprobar y rechazar pagos
- Activar y renovar licencias
- Validar negocios activos
- Obtener estadísticas del dashboard

## Paso 6: Configurar Storage (Buckets)

1. En el **SQL Editor**, crea una nueva consulta
2. Copia y pega el contenido de `supabase/storage.sql`
3. Ejecuta el script

Esto creará los buckets para:
- **logos-negocios**: Logos de los restaurantes (público)
- **productos**: Imágenes de productos (público)
- **comprobantes**: Comprobantes de pago (privado)

**Alternativamente**, puedes crear los buckets manualmente:
1. Ve a **Storage** en el dashboard
2. Crea los 3 buckets mencionados
3. Configura el acceso como se especifica en `storage.sql`

## Paso 7: Configurar Autenticación

### Para Super Admin:

1. Ve a **Authentication** > **Users**
2. Haz clic en "Invite" o "Add User"
3. Crea un usuario con:
   - Email: `admin@cartamax.com` (o el que prefieras)
   - Password: Una contraseña segura
4. Una vez creado, haz clic en el usuario y ve a **User Metadata**
5. Agrega:
```json
{
  "role": "super_admin"
}
```

### Para Negocios (Business):

Los negocios se registran a través de la aplicación en `/register`. 
El sistema automáticamente crea:
1. El usuario en Auth
2. El registro en la tabla `negocios`

## Paso 8: Insertar Datos Iniciales (Semillas)

1. En el **SQL Editor**, crea una nueva consulta
2. Copia y pega el contenido de `supabase/seeds.sql`
3. Ejecuta el script

Esto creará:
- Planes de ejemplo (Básico, Pro, Premium)
- Configuración de pago de ejemplo

## Paso 9: Configurar Realtime (Opcional)

Para que las actualizaciones en tiempo real funcionen:

1. Ve a **Database** > **Replication**
2. En "Supabase Realtime", haz clic en "Enable"
3. Agrega las tablas que quieres escuchar en tiempo real:
   - `pagos`
   - `negocios`

## Paso 10: Verificar la Configuración

Para verificar que todo funciona:

1. Ejecuta en tu terminal:
```bash
npm install
npm run dev
```

2. Ve a `http://localhost:5173`
3. Intenta registrar un negocio en `/register`
4. Verifica que los datos aparecen en Supabase Dashboard

## Solución de Problemas

### Error: "Invalid API key"
- Verifica que el `.env` tenga las claves correctas
- Reinicia el servidor de desarrollo

### Error: "Permission denied"
- Verifica que las políticas RLS se ejecutaron correctamente
- Revisa que el usuario tenga el `role` correcto en metadata

### Error: "Bucket not found"
- Verifica que los buckets se crearon en Storage
- Ejecuta nuevamente `storage.sql`

## Notas Importantes

1. **Nunca subas tu archivo `.env` a GitHub** - ya está en `.gitignore`
2. **Las políticas RLS son críticas** para la seguridad multi-tenant
3. **El Super Admin** debe tener `role: "super_admin"` en su metadata
4. **Los negocios** se identifican por su `owner_email`

## Siguiente Paso

Continúa con la configuración de despliegue en `DEPLOY_GITHUB_PAGES.md`.
