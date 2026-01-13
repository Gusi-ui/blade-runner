# 🚀 Guía de Despliegue a GitHub Pages

## 📋 Configuración Completada

✅ Workflow de GitHub Actions creado (`.github/workflows/deploy.yml`)
✅ Astro configurado para producción (`astro.config.mjs`)
✅ Archivo CNAME creado para dominio personalizado
✅ Archivo `.nojekyll` creado para desactivar Jekyll en GitHub Pages

---

## 🔧 Pasos para Activar GitHub Pages

### 1. Habilitar GitHub Pages en tu Repositorio

1. Ve a tu repositorio: `https://github.com/Gusi-ui/blade-runner`
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral izquierdo, haz clic en **Pages**
4. En **Source**, selecciona **GitHub Actions** (NO "Deploy from a branch")
5. Guarda los cambios

**⚠️ IMPORTANTE**: Si ves que GitHub Pages está usando Jekyll automáticamente, asegúrate de que:

- El **Source** esté configurado en **GitHub Actions** (no en "Deploy from a branch")
- El archivo `.nojekyll` esté presente en la carpeta `public/` (ya está incluido)

### 2. Hacer Push de los Cambios

Los cambios ya están listos, solo necesitas hacer commit y push:

```bash
git add .
git commit -m "chore: configurar GitHub Pages deployment"
git push
```

El workflow se ejecutará automáticamente y tu sitio estará disponible en unos minutos.

---

## 🌐 Configuración del Dominio Personalizado

### Opción A: Dominio Personalizado (gusi.dev)

#### En tu Proveedor de Dominio (Namecheap, GoDaddy, Cloudflare, etc.):

**Si quieres usar `gusi.dev` (sin www):**

```
Tipo: A
Nombre: @
Valor: 185.199.108.153
```

```
Tipo: A
Nombre: @
Valor: 185.199.109.153
```

```
Tipo: A
Nombre: @
Valor: 185.199.110.153
```

```
Tipo: A
Nombre: @
Valor: 185.199.111.153
```

**Si quieres usar `www.gusi.dev`:**

```
Tipo: CNAME
Nombre: www
Valor: gusi-ui.github.io
```

#### En GitHub:

1. Ve a **Settings** → **Pages**
2. En **Custom domain**, escribe: `gusi.dev` (o `www.gusi.dev`)
3. Haz clic en **Save**
4. Espera a que GitHub verifique el dominio (puede tardar hasta 24 horas)
5. ✅ Marca la casilla **Enforce HTTPS** cuando esté disponible

### Opción B: Sin Dominio Personalizado

Si no quieres usar un dominio personalizado, edita `astro.config.mjs`:

```javascript
export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  site: 'https://gusi-ui.github.io',
  base: '/blade-runner',
  build: {
    inlineStylesheets: 'auto',
  },
});
```

Y **ELIMINA** el archivo `public/CNAME`.

Tu sitio estará disponible en: `https://gusi-ui.github.io/blade-runner`

---

## 🔍 Verificar el Despliegue

1. Ve a la pestaña **Actions** en tu repositorio
2. Verás el workflow "Deploy to GitHub Pages" ejecutándose
3. Cuando aparezca un ✅ verde, tu sitio estará desplegado
4. Accede a tu sitio:
   - Con dominio: `https://gusi.dev`
   - Sin dominio: `https://gusi-ui.github.io/blade-runner`

---

## 🔄 Despliegue Automático

Cada vez que hagas `git push` a la rama `main`, el sitio se actualizará automáticamente.

---

## ❓ Problemas Comunes

### El sitio muestra "404"

- Verifica que GitHub Pages esté configurado en **Source: GitHub Actions** (NO "Deploy from a branch")
- Revisa que el workflow se haya ejecutado correctamente en la pestaña Actions
- Verifica que el archivo `.nojekyll` esté presente en `public/`

### GitHub Pages está usando Jekyll en lugar de Astro

- Verifica que el **Source** en Settings → Pages esté en **GitHub Actions**
- Asegúrate de que el archivo `.nojekyll` esté en la carpeta `public/`
- Si el problema persiste, elimina cualquier archivo `_config.yml` o carpetas `_posts/` que puedan activar Jekyll

### El dominio personalizado no funciona

- Espera hasta 24 horas para la propagación DNS
- Verifica que los registros DNS estén correctos en tu proveedor
- Asegúrate de que el archivo `public/CNAME` tenga el dominio correcto

### Los estilos no cargan

- Verifica que `site` en `astro.config.mjs` sea correcto
- Si no usas dominio personalizado, asegúrate de tener `base: '/blade-runner'`

---

## 📝 Cambiar el Dominio Personalizado

1. Edita `public/CNAME` con tu nuevo dominio
2. Edita `site` en `astro.config.mjs`
3. Configura los registros DNS en tu proveedor
4. Haz commit y push de los cambios

---

---

## 🔑 Configuración de Variables de Entorno en Producción

### Para GitHub Pages con GitHub Actions

Las variables de entorno NO se incluyen en el repositorio por seguridad. Debes configurarlas en GitHub:

1. Ve a tu repositorio: `https://github.com/Gusi-ui/blade-runner`
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral izquierdo, haz clic en **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**
5. Agrega las siguientes variables:

#### NASA API Key (REQUERIDA para la Calculadora Cósmica):

```
Nombre: PUBLIC_NASA_API_KEY
Valor: tu_clave_real_de_nasa
```

Obtén una clave gratis en: https://api.nasa.gov/

#### NewsAPI Key (opcional para noticias):

```
Nombre: PUBLIC_NEWS_API_KEY
Valor: tu_clave_real_de_newsapi
```

Obtén una clave gratis en: https://newsapi.org/

### Actualizar el Workflow de GitHub Actions

Edita `.github/workflows/deploy.yml` y agrega las variables de entorno en la sección de build:

```yaml
- name: Build
  run: npm run build
  env:
    PUBLIC_NASA_API_KEY: ${{ secrets.PUBLIC_NASA_API_KEY }}
    PUBLIC_NEWS_API_KEY: ${{ secrets.PUBLIC_NEWS_API_KEY }}
```

### Verificar que las APIs Funcionan

Después de configurar las variables:

1. Haz un commit y push para activar el workflow
2. Ve a la pestaña **Actions** y verifica que el build se complete exitosamente
3. Abre tu sitio en producción
4. Abre la consola del navegador (F12)
5. Ve a la Calculadora Cósmica e ingresa una fecha posterior a 1995
6. Revisa los logs en la consola:
   - ✅ Deberías ver: `✓ API Key presente: Sí`
   - ✅ Deberías ver: `✓ Respuesta de NASA APOD: 200 OK`
   - ✅ La imagen de NASA debería cargar correctamente

### Problemas Comunes

#### La imagen de NASA no carga en producción

**Causa 1: Variables de entorno no configuradas**

- Verifica que hayas agregado `PUBLIC_NASA_API_KEY` en los secrets de GitHub
- Verifica que el workflow tenga la sección `env:` con las variables

**Causa 2: API Key inválida o expirada**

- Obtén una nueva API key en https://api.nasa.gov/
- Actualiza el secret en GitHub

**Causa 3: Límite de rate excedido**

- La API Key DEMO_KEY tiene límite de 30 requests por hora
- Usa tu propia API key (límite: 1000 requests por hora)

**Causa 4: Problemas de CORS**

- Las imágenes de NASA APOD permiten CORS correctamente
- Si ves errores de CORS, verifica que la URL de la imagen sea correcta
- Revisa los logs en la consola del navegador

---

## 🎉 ¡Listo!

Tu terminal Blade Runner estará disponible en línea con despliegue automático.
