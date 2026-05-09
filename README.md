# CartaMax - Menús Digitales QR SaaS

Plataforma SaaS multi-tenant para menús digitales QR de restaurantes.

## Características

- **Multi-tenant**: Cada restaurante tiene su espacio aislado
- **Panel Super Admin**: Gestión global de negocios, planes y pagos
- **Panel de Negocio**: Gestión de menú, productos, categorías y mesas
- **Menú Público PWA**: Accesible vía QR, instalable, funciona offline
- **Sistema de Pagos Manual**: Comprobantes de transferencia bancaria
- **Licencias**: Control de vencimientos y renovaciones

## Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query
- React Router DOM
- TailwindCSS + shadcn/ui
- Zustand
- Framer Motion

### Backend (BaaS)
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Row Level Security (RLS) para multi-tenancy

### PWA
- vite-plugin-pwa
- Service Worker para offline support

## Estructura del Proyecto

```
src/
├── app/              # Configuración de la app
├── components/       # Componentes reutilizables
│   ├── ui/         # Componentes base (shadcn/ui)
│   ├── shared/     # Componentes compartidos
│   └── ...
├── features/         # Módulos por funcionalidad
│   ├── auth/
│   ├── super-admin/
│   ├── business/
│   ├── public-menu/
│   └── ...
├── hooks/           # Custom hooks
├── layouts/         # Layouts de la aplicación
├── lib/             # Librerías y configuraciones
├── services/        # Servicios de acceso a datos
├── store/           # Estado global (Zustand)
├── types/           # Tipos de TypeScript
└── ...
```

## Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y completa:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Supabase

Sigue la guía completa en `docs/SUPABASE_SETUP.md`:

1. Crear proyecto en Supabase
2. Ejecutar SQL en orden: `schema.sql` → `policies.sql` → `rpc.sql` → `storage.sql` → `seeds.sql`
3. Configurar buckets de storage
4. Crear usuario Super Admin con metadata: `{"role": "super_admin"}`

### 3. Instalación

```bash
npm install
npm run dev
```

## Despliegue

Ver `docs/DEPLOY_GITHUB_PAGES.md` para instrucciones detalladas.

Resumen:
- Configurar `base` en `vite.config.ts`
- Usar HashRouter para SPA
- Ejecutar `npm run deploy`

## Documentación

- `docs/SUPABASE_SETUP.md` - Configuración de Supabase paso a paso
- `docs/DEPLOY_GITHUB_PAGES.md` - Despliegue en GitHub Pages
- `docs/ARCHITECTURE.md` - Arquitectura del sistema
- `docs/RLS_POLICIES.md` - Row Level Security Policies

## Licencia

MIT

## Soporte

Para problemas o preguntas, revisa la documentación en `docs/` o crea un issue en el repositorio.
