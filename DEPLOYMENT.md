# 🚀 Guía de Despliegue a GitHub Pages

## 📋 Configuración Completada

✅ Workflow de GitHub Actions creado (`.github/workflows/deploy.yml`)
✅ Astro configurado para producción (`astro.config.mjs`)
✅ Archivo CNAME creado para dominio personalizado

---

## 🔧 Pasos para Activar GitHub Pages

### 1. Habilitar GitHub Pages en tu Repositorio

1. Ve a tu repositorio: `https://github.com/Gusi-ui/blade-runner`
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral izquierdo, haz clic en **Pages**
4. En **Source**, selecciona **GitHub Actions**
5. Guarda los cambios

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

- Verifica que GitHub Pages esté configurado en **Source: GitHub Actions**
- Revisa que el workflow se haya ejecutado correctamente en la pestaña Actions

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

## 🎉 ¡Listo!

Tu terminal Blade Runner estará disponible en línea con despliegue automático.
