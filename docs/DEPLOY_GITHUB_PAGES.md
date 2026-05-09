# Guía de Despliegue en GitHub Pages

Esta guía te explica cómo desplegar CartaMax en GitHub Pages como una SPA (Single Page Application).

## Requisitos Previos

- Una cuenta en GitHub
- El proyecto subido a un repositorio
- Supabase configurado y funcionando

## Paso 1: Configurar el Proyecto para SPA

GitHub Pages no soporta rutas SPA por defecto. Necesitamos configurar un rewrite.

### Opción A: Usar Hash Router (Recomendado)

Cambia el `BrowserRouter` por `HashRouter` en `src/main.tsx`:

```tsx
import { HashRouter } from 'react-router-dom'
// En lugar de BrowserRouter
```

Y actualiza `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/CartaMax/', // Nombre de tu repo
  // ... resto de config
})
```

### Opción B: Usar 404 Redirect (Más complejo)

Crea un archivo `.nojekyll` y configura redirects. Esta opción es más compleja y requiere mantenimiento.

## Paso 2: Actualizar package.json

Agrega el script de despliegue:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.1.0"
  }
}
```

Instala gh-pages:
```bash
npm install --save-dev gh-pages
```

## Paso 3: Configurar vite.config.ts

Asegúrate de que tu `vite.config.ts` tenga:

```typescript
export default defineConfig({
  base: '/CartaMax/', // Cambia por el nombre de tu repositorio
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // ... resto de config
})
```

## Paso 4: Subir a GitHub

1. Crea un repositorio en GitHub (ejemplo: `CartaMax`)
2. Inicializa git en tu proyecto (si no lo has hecho):

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/CartaMax.git
git push -u origin main
```

## Paso 5: Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings**
3. En el menú lateral, ve a **Pages**
4. En "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` (se creará automáticamente)
   - **Folder**: `/ (root)`
5. Haz clic en "Save"

## Paso 6: Desplegar

Ejecuta el comando de despliegue:

```bash
npm run deploy
```

Esto:
1. Construye el proyecto (`npm run build`)
2. Sube la carpeta `dist` a la rama `gh-pages`

## Paso 7: Verificar el Despliegue

1. Espera unos minutos después del despliegue
2. Ve a: `https://tu-usuario.github.io/CartaMax/`
3. Verifica que la aplicación carga correctamente

## Paso 8: Configurar Variables de Entorno en Producción

GitHub Pages no soporta variables de entorno dinámicas. Opciones:

### Opción A: Variables en el código (No recomendado para producción)

Actualiza el archivo `src/lib/supabase.ts` para usar valores por defecto:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key'
```

### Opción B: Usar GitHub Secrets + Actions (Recomendado)

1. Ve a tu repositorio en GitHub > **Settings** > **Secrets and variables** > **Actions**
2. Agrega los secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. Crea un archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Solución de Problemas

### La página muestra 404
- Verifica que la `base` en `vite.config.ts` sea correcta
- Asegúrate de que la rama `gh-pages` existe

### Los estilos no cargan
- Verifica las rutas de los assets en `vite.config.ts`
- Revisa la consola del navegador para errores 404

### Error de CORS con Supabase
- En Supabase Dashboard, ve a **Settings** > **API**
- Agrega tu dominio de GitHub Pages a "Additional allowed URLs"

## Notas Importantes

1. **GitHub Pages es gratuito** pero tiene límites de ancho de banda
2. **La URL será pública**: `https://usuario.github.io/CartaMax/`
3. **Cada push a main** puede activar un despliegue automático (si usas GitHub Actions)
4. **Considera usar un custom domain** para producción

## Siguiente Paso

Tu aplicación está desplegada. ¡Comparte el enlace con tus clientes!
