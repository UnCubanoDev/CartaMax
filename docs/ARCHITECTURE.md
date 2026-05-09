# Arquitectura de CartaMax

## Visión General

CartaMax es un SaaS multi-tenant para menús digitales QR de restaurantes. La arquitectura está diseñada para ser escalable, mantenible y segura.

## Stack Tecnológico

### Frontend
- **React 18**: Biblioteca de UI
- **Vite**: Build tool y dev server
- **TypeScript**: Tipado estático
- **React Router DOM**: Enrutamiento
- **TanStack Query**: Fetching y cache de datos
- **Zustand**: Manejo de estado (preparado)
- **TailwindCSS**: Estilos utilitarios
- **shadcn/ui**: Componentes base
- **Framer Motion**: Animaciones
- **React Hook Form + Zod**: Formularios y validación
- **Lucide React**: Iconos
- **React Dropzone**: Upload de archivos
- **DND Kit**: Drag and drop
- **Sonner**: Toasts/Notificaciones
- **QRCode.react**: Generación de códigos QR

### Backend (BaaS)
- **Supabase**: Backend as a Service
  - **PostgreSQL**: Base de datos relacional
  - **Auth**: Autenticación de usuarios
  - **Realtime**: Suscripciones en tiempo real
  - **Storage**: Almacenamiento de archivos
  - **RLS**: Row Level Security para multi-tenancy

### PWA
- **vite-plugin-pwa**: Configuración de PWA
- **Service Worker**: Cache y offline support
- **Web App Manifest**: Instalable

## Estructura de Carpetas

```
src/
├── app/                    # Configuración de la app (a futuro)
├── components/             # Componentes reutilizables
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── shared/           # Componentes compartidos
│   ├── forms/            # Componentes de formularios
│   ├── dashboard/        # Componentes de dashboard
│   └── menu/            # Componentes del menú público
├── features/             # Módulos por funcionalidad
│   ├── auth/            # Autenticación
│   ├── super-admin/      # Panel de super administrador
│   ├── business/         # Panel de negocio
│   ├── public-menu/      # Menú público
│   ├── payments/         # Pagos
│   ├── licenses/         # Licencias
│   ├── products/         # Productos
│   ├── categories/       # Categorías
│   └── tables/          # Mesas
├── hooks/                # Custom hooks
├── layouts/              # Layouts de la aplicación
├── lib/                  # Librerías y configuraciones
├── services/             # Servicios de acceso a datos
├── store/                # Estado global (Zustand)
├── types/                # Tipos de TypeScript
├── utils/                # Utilidades
├── routes/               # Configuración de rutas
├── styles/               # Estilos globales
└── pwa/                 # Archivos de PWA
```

## Patrones de Diseño

### Feature-Based Architecture
Cada funcionalidad está encapsulada en su propia carpeta dentro de `features/`, conteniendo:
- Componentes específicos
- Lógica de negocio
- Servicios relacionados

### Repository Pattern (via Services)
Los `services/` actúan como repositorios, abstraiendo el acceso a Supabase:
- `negociosService.ts`
- `productosService.ts`
- `categoriasService.ts`
- `mesasService.ts`
- `pagosService.ts`
- `planesService.ts`

### Custom Hooks
Lógica reutilizable extraída a hooks personalizados (a futuro):
- `useNegocio.ts`
- `useProductos.ts`
- `useCategorias.ts`

### Context para Estado Global
- `AuthContext`: Manejo de autenticación y sesión

## Multi-Tenancy

### Estrategia
Cada negocio (tenant) está aislado mediante:
1. **`negocio_id`** en todas las tablas relacionadas
2. **Row Level Security (RLS)** en Supabase
3. **Funciones helper** en PostgreSQL para verificar permisos

### Roles
- **`super_admin`**: Acceso global a todos los negocios
- **`negocio`**: Acceso solo a su propio negocio (identificado por `owner_email`)

### Aislamiento en RLS
```sql
-- Ejemplo de política para productos
create policy "Business can manage own productos"
  on public.productos for all
  using (negocio_id = public.get_my_negocio_id())
```

## Flujo de Datos

```
User Action → Component → Hook/Service → Supabase Client → PostgreSQL
                ↓
            TanStack Query (Cache)
                ↓
            UI Update
```

## Autenticación y Autorización

### Flujo de Auth
1. Usuario ingresa credenciales
2. Supabase Auth valida y retorna JWT
3. JWT contiene `role` en `user_metadata`
4. `AuthContext` lee el rol y configura permisos
5. `RouteGuard` protege rutas según rol

### Persistencia
- Sesión persistida en `localStorage` (configurado en Supabase client)
- Renovación automática de tokens

## PWA (Progressive Web App)

### Características
- **Offline**: Los assets se cachean vía Service Worker
- **Instalable**: Manifest configurado
- **Responsive**: Mobile-first design
- **Realtime**: Suscripciones de Supabase para actualizaciones

### Cache Strategy
- **Images**: Cache First (30 días)
- **API calls**: Network First (24 horas)

## Seguridad

### RLS (Row Level Security)
- Todas las tablas tienen RLS habilitado
- Políticas basadas en `auth.uid()` y `negocio_id`

### Validación
- **Zod**: Validación de formularios en cliente
- **PostgreSQL Constraints**: Validación en base de datos
- **Sanitización**: Manejada por Supabase

### Storage
- Buckets privados para comprobantes
- Buckets públicos para imágenes de productos
- Políticas de storage basadas en rol

## Escalabilidad

### Horizontal
- Supabase escala automáticamente
- CDN para assets estáticos (GitHub Pages / Vercel)

### Vertical
- Índices en columnas de búsqueda frecuente
- Paginación en tablas grandes (a futuro)
- Optimización de consultas con select específicos

## Mantenibilidad

### Código
- TypeScript para type safety
- Componentes pequeños y enfocados
- Separación clara de responsabilidades

### Documentación
- JSDoc en funciones críticas
- README y guías en `/docs`

## Performance

### Optimizaciones
- **TanStack Query**: Cache inteligente y deduplicación
- **Lazy Loading**: Componentes cargados bajo demanda (a futuro)
- **Code Splitting**: Vite lo hace automáticamente
- **Image Optimization**: Formatos modernos y tamaños apropiados

## Despliegue

### GitHub Pages SPA
- Build estático generado por Vite
- SPA redirect configurado vía HashRouter
- CI/CD con GitHub Actions (opcional)

## Roadmap / Mejoras Futuras

- [ ] Búsqueda global
- [ ] Notificaciones push
- [ ] Analytics para negocios
- [ ] API pública para integraciones
- [ ] Soporte multi-idioma
- [ ] Temas personalizados por negocio
- [ ] Respaldos automáticos
- [ ] Monitoreo y alertas
