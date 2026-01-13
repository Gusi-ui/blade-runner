# 🔧 Configuración de DNS en Cloudflare para GitHub Pages

## ❌ Problema Actual

Tienes registros **AAAA** (IPv6) apuntando a direcciones de **Cloudflare Pages**, pero tu sitio está alojado en **GitHub Pages**. Esto causa el error 526 (Invalid SSL certificate).

## ✅ Solución: Configurar DNS Correctamente

### Paso 1: Eliminar los Registros AAAA Actuales

En Cloudflare, elimina todos los registros AAAA que tienes configurados:

- `AAAA gusi.dev 2606:50c0:8000::153`
- `AAAA gusi.dev 2606:50c0:8001::153`
- `AAAA gusi.dev 2606:50c0:8002::153`
- `AAAA gusi.dev 2606:50c0:8003::153`

### Paso 2: Agregar Registros A (IPv4) para GitHub Pages

Agrega estos **4 registros A** (IPv4) apuntando a las IPs de GitHub Pages:

```
Tipo: A
Nombre: @ (o gusi.dev)
Contenido: 185.199.108.153
Proxy: Proxied (nube naranja) ✅
TTL: Auto
```

```
Tipo: A
Nombre: @ (o gusi.dev)
Contenido: 185.199.109.153
Proxy: Proxied (nube naranja) ✅
TTL: Auto
```

```
Tipo: A
Nombre: @ (o gusi.dev)
Contenido: 185.199.110.153
Proxy: Proxied (nube naranja) ✅
TTL: Auto
```

```
Tipo: A
Nombre: @ (o gusi.dev)
Contenido: 185.199.111.153
Proxy: Proxied (nube naranja) ✅
TTL: Auto
```

### Paso 2.5: Agregar Registro CNAME para www (Opcional pero Recomendado)

Si GitHub Pages está intentando verificar `www.gusi.dev`, agrega este registro CNAME:

```
Tipo: CNAME
Nombre: www
Contenido: gusi-ui.github.io
Proxy: Proxied (nube naranja) ✅
TTL: Auto
```

**Nota**: Si NO quieres usar `www.gusi.dev`, puedes omitir este paso, pero asegúrate de eliminar `www.gusi.dev` de la configuración de dominios personalizados en GitHub Pages (Settings → Pages).

### Paso 3: Verificar Configuración SSL/TLS

1. Ve a **SSL/TLS** → **Overview** en el panel de Cloudflare
2. **Para la configuración inicial, usa modo "Full":**
   - **Full**: Cloudflare acepta certificados válidos de GitHub Pages (incluyendo Let's Encrypt)
   - Este modo es necesario inicialmente porque GitHub Pages puede tardar en provisionar certificados válidos
   - Una vez que el sitio funcione correctamente, puedes cambiar a "Full strict" para mayor seguridad

3. **Después de que funcione (opcional pero recomendado):**
   - Una vez que `https://gusi.dev` funcione correctamente
   - Espera 24-48 horas para asegurar que GitHub Pages tenga certificados válidos
   - Cambia el modo a **Full (strict)** para mayor seguridad
   - Cloudflare recomienda "Full strict" porque valida que el certificado del servidor de origen sea válido y no haya expirado
   - Si cambias a "Full strict" y el sitio deja de funcionar, vuelve a "Full" temporalmente

**Nota importante**: Cloudflare recomienda "Full strict" por seguridad, pero con GitHub Pages es mejor empezar con "Full" y luego cambiar a "Full strict" una vez que todo esté funcionando correctamente.

### Paso 4: Verificar en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** → **Pages**
3. Verifica que el dominio personalizado esté configurado como `gusi.dev`
4. **IMPORTANTE**: Si aparece `www.gusi.dev` en la lista de dominios personalizados y NO quieres usarlo:
   - Haz clic en los tres puntos (⋯) junto a `www.gusi.dev`
   - Selecciona **Remove** (Eliminar)
5. Si SÍ quieres usar `www.gusi.dev`, asegúrate de haber agregado el registro CNAME en el Paso 2.5
6. Espera a que GitHub verifique el dominio (puede tardar unos minutos)

## 🔍 Verificación

Después de hacer los cambios:

1. Espera 5-10 minutos para la propagación DNS

2. **Verifica en Cloudflare que los registros A estén correctos:**
   - Ve a Cloudflare → DNS → Records
   - Debes ver 4 registros A con estas IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Todos deben tener el proxy activado (nube naranja) ✅

3. **Nota sobre `dig`:**

   ```bash
   dig gusi.dev +short
   # Si el proxy está activado, verás IPs de Cloudflare (104.21.x.x, 172.67.x.x)
   # Esto es NORMAL y esperado cuando el proxy está activado
   # Lo importante es que en Cloudflare los registros A apunten a las IPs de GitHub Pages
   ```

4. **Verifica el certificado SSL:**
   ```bash
   curl -I https://gusi.dev
   ```

## ⚠️ Notas Importantes

- **NO uses registros AAAA** a menos que GitHub Pages soporte IPv6 (actualmente solo soporta IPv4)
- **Asegúrate de que el proxy esté activado** (nube naranja) para que Cloudflare funcione como CDN
- El error 526 desaparecerá una vez que los DNS apunten correctamente a GitHub Pages
- **SSL/TLS con GitHub Pages**:
  - Usa modo **Full** inicialmente para que funcione rápidamente
  - Después de 24-48 horas, puedes cambiar a **Full strict** para mayor seguridad (recomendación de Cloudflare)
  - Si cambias a "Full strict" y el sitio deja de funcionar, vuelve a "Full" temporalmente

## 🔴 Error: "Certificate Request Error" / "TLS certificate is being provisioned"

Si ves este mensaje, significa que GitHub está intentando obtener un certificado SSL pero no puede verificar tu dominio porque los registros DNS no están correctamente configurados o aún no se han propagado.

**Pasos para solucionarlo:**

1. **Verifica en Cloudflare que los registros A estén correctos:**
   - Ve a Cloudflare → DNS → Records
   - Debes tener **exactamente 4 registros A** (no AAAA) con estas IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Todos deben tener el proxy activado (nube naranja) ✅
   - **NO debe haber registros AAAA**

2. **Si los registros A no están correctos:**
   - Elimina TODOS los registros AAAA si aún existen
   - Elimina cualquier registro A que no sea una de las 4 IPs de GitHub Pages
   - Agrega los 4 registros A correctos si faltan
   - Espera 10-15 minutos para la propagación DNS

3. **Si los registros están correctos pero el error persiste:**
   - Ve a GitHub → Settings → Pages
   - Elimina temporalmente el dominio personalizado `gusi.dev`
   - Espera 1-2 minutos
   - Vuelve a agregar `gusi.dev` como dominio personalizado
   - Esto forzará a GitHub a reintentar la verificación

4. **VERIFICA EL MODO SSL/TLS EN CLOUDFLARE (MUY IMPORTANTE):**
   - En Cloudflare, ve a **SSL/TLS** → **Overview**
   - **Para la configuración inicial**: El modo debe estar en **Full** (NO "Full strict" ni "Flexible")
   - Si está en "Full strict", cámbialo a **Full** temporalmente
   - Si está en "Flexible", cámbialo a **Full**
   - Espera 2-3 minutos y verifica de nuevo
   - **Una vez que funcione**: Después de 24-48 horas, puedes cambiar a "Full strict" para mayor seguridad (como recomienda Cloudflare)

5. **Si después de verificar SSL/TLS sigue sin funcionar, prueba desactivar temporalmente el proxy:**
   - En Cloudflare → DNS → Records
   - Cambia los 4 registros A de "Proxied" (nube naranja) a "DNS only" (nube gris)
   - Espera 10-15 minutos
   - Ve a GitHub → Settings → Pages y verifica si el certificado se provisiona
   - Si GitHub muestra "✓ Verified" o el certificado se provisiona correctamente:
     - Vuelve a Cloudflare y activa el proxy (nube naranja)
     - Espera 5 minutos
     - El sitio debería funcionar ahora

6. **Verifica otras configuraciones en Cloudflare:**
   - En Cloudflare, ve a **SSL/TLS** → **Edge Certificates**
   - Asegúrate de que **Always Use HTTPS** esté activado
   - Verifica que no haya reglas de firewall bloqueando las conexiones

## 🔴 Error: "www.gusi.dev is improperly configured"

Si ves este error, significa que GitHub Pages está intentando verificar `www.gusi.dev` pero no encuentra el registro DNS.

**Solución rápida:**

1. **Opción A - Si NO quieres usar www:**
   - Ve a GitHub → Settings → Pages
   - Elimina `www.gusi.dev` de los dominios personalizados
   - Solo deja `gusi.dev`

2. **Opción B - Si SÍ quieres usar www:**
   - Agrega el registro CNAME del Paso 2.5 en Cloudflare
   - Espera 5-10 minutos para la propagación DNS
   - GitHub verificará automáticamente el dominio

## ⏱️ Tiempo de Espera Normal

- **Propagación DNS**: 5-15 minutos (puede tardar hasta 24 horas en casos raros)
- **Verificación de dominio en GitHub**: 5-10 minutos después de que los DNS se propaguen
- **Provisionamiento de certificado SSL**: 15-30 minutos después de la verificación exitosa

**Total estimado**: 30 minutos a 1 hora desde que configuras los DNS correctamente.

## ✅ Solución Rápida: Si Tienes los Registros Correctos pero Error 526 Persiste

Si ya verificaste que tienes los 4 registros A correctos en Cloudflare pero sigues viendo el error 526, sigue estos pasos en orden:

### Paso 1: Verificar Modo SSL/TLS (MÁS COMÚN)

1. Ve a Cloudflare → **SSL/TLS** → **Overview**
2. **Para la configuración inicial**: El modo debe estar en **Full** (NO "Full strict")
   - Cloudflare recomienda "Full strict" por seguridad, pero con GitHub Pages es mejor empezar con "Full"
   - "Full strict" requiere que GitHub Pages tenga certificados válidos y reconocidos, lo cual puede tardar
3. Si está en "Full strict", cámbialo a **Full** y espera 2-3 minutos
4. Prueba acceder a `https://gusi.dev` de nuevo
5. **Una vez que funcione**: Después de 24-48 horas, puedes cambiar a "Full strict" para seguir la recomendación de Cloudflare

### Paso 2: Forzar Re-verificación en GitHub

1. Ve a GitHub → Settings → Pages
2. Elimina el dominio `gusi.dev` (haz clic en los tres puntos → Remove)
3. Espera 2 minutos
4. Vuelve a agregar `gusi.dev` como dominio personalizado
5. Espera 10-15 minutos para que GitHub verifique

### Paso 3: Desactivar Proxy Temporalmente (Si los pasos anteriores no funcionan)

1. En Cloudflare → DNS → Records
2. Cambia los 4 registros A de "Proxied" (nube naranja) a "DNS only" (nube gris)
3. Espera 15 minutos
4. Verifica en GitHub si el certificado se provisiona (debería mostrar "✓ Verified")
5. Una vez verificado, vuelve a activar el proxy (nube naranja)
6. Espera 5 minutos y prueba de nuevo

## 🆘 Si el Error Persiste Después de 1 Hora

1. **Verifica los registros DNS desde fuera de Cloudflare:**

   ```bash
   # Usa un servicio externo para verificar
   # https://www.whatsmydns.net/#A/gusi.dev
   # Deberías ver las 4 IPs de GitHub Pages
   ```

2. **Verifica que el proxy de Cloudflare esté activado:**
   - Los registros A deben tener la nube naranja (Proxied)
   - Si está en gris (DNS only), GitHub no podrá verificar correctamente

3. **Desactiva temporalmente el proxy para verificar:**
   - Cambia los registros A a "DNS only" (nube gris) temporalmente
   - Espera 10 minutos
   - Verifica si GitHub puede verificar el dominio
   - Si funciona, vuelve a activar el proxy

4. **Verifica el modo SSL/TLS**: Cambia a "Full" si está en "Full (strict)"
5. **Limpia la caché de Cloudflare**: En el panel, ve a **Caching** → **Purge Everything**
6. **Verifica que GitHub Pages esté activo**: Revisa la pestaña Actions en tu repositorio
7. **Verifica los registros DNS**: Usa `dig www.gusi.dev +short` para verificar que el CNAME esté configurado
8. **Contacta a GitHub Support**: Si después de 24 horas sigue sin funcionar, puede haber un problema del lado de GitHub
