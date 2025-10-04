# 🖥️ Blade Runner Terminal

Terminal retro-futurista interactiva con estética inspirada en Blade Runner. Una aplicación web completa desarrollada con Astro que simula una terminal antigua con efectos visuales CRT, texto verde fosforescente y múltiples funcionalidades interactivas.

![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Astro](https://img.shields.io/badge/Astro-4.16-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Características

### 🎨 Diseño Retro-Futurista

- **Estética Blade Runner**: Fondo negro con texto verde fosforescente (#00ff41)
- **Efectos CRT**: Scanlines, parpadeo sutil y efectos de pantalla antigua
- **Tipografía Monospace**: Courier New para una experiencia auténtica
- **Animaciones**: Efecto de escritura tipo máquina y cursor parpadeante

### 🚀 Funcionalidades Principales

#### 1. **Terminal Interactiva**

- Sistema de comandos completo
- Historial de comandos (flechas arriba/abajo)
- Auto-completado y sugerencias
- Comandos disponibles: `ayuda`, `menu`, `limpiar`, `fecha`, `whoami`, etc.

#### 2. **Noticias Tecnológicas**

- Integración con NewsAPI
- Noticias sobre Inteligencia Artificial y Cosmos
- Actualización automática cada 5-10 minutos
- Filtrado por categorías

#### 3. **Currículum Digital**

- CV completo de Gusi en formato terminal
- Secciones: Educación, Experiencia, Habilidades, Idiomas
- Enlaces a perfiles profesionales
- Diseño adaptativo

#### 4. **Portafolio de Proyectos**

- Catálogo de proyectos con descripciones detalladas
- Enlaces a repositorios GitHub
- Estado y tecnologías de cada proyecto
- Organizado por categorías

#### 5. **Juegos Retro**

- **Snake**: Clásico juego de la serpiente con controles WASD o flechas
- **El Ahorcado Cósmico**: Adivina palabras relacionadas con el espacio
- **Tres en Raya**: Juega contra una IA con algoritmo Minimax

#### 6. **Calculadora Cósmica**

- Calcula tu edad en diferentes planetas del sistema solar
- Integración con NASA API (APOD)
- Muestra la imagen astronómica del día de tu nacimiento
- Estadísticas personalizadas

## 🛠️ Tecnologías

- **Framework**: [Astro](https://astro.build) 4.16+
- **Estilos**: [Tailwind CSS](https://tailwindcss.com) 3.4+
- **Lenguaje**: TypeScript
- **APIs**:
  - [NASA API](https://api.nasa.gov/) - APOD, NeoWs
  - [NewsAPI](https://newsapi.org/) - Noticias tecnológicas
- **Build**: SSG (Static Site Generation)
- **Despliegue**: Compatible con Vercel, Netlify, GitHub Pages

## 📦 Instalación

### Requisitos Previos

- Node.js 18+
- npm o pnpm

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/gusi/blade-runner-terminal.git
cd blade-runner-terminal
```

2. **Instalar dependencias**

```bash
npm install
# o
pnpm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y añade tus claves API:

```env
# NASA API Key (obtén una gratis en https://api.nasa.gov/)
PUBLIC_NASA_API_KEY=tu_clave_nasa_aqui

# NewsAPI Key (obtén una gratis en https://newsapi.org/)
PUBLIC_NEWS_API_KEY=tu_clave_newsapi_aqui
```

**Nota**: Puedes usar `DEMO_KEY` para NASA API durante desarrollo, pero tiene límites de uso.

4. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

## 🚀 Comandos Disponibles

| Comando           | Acción                                            |
| ----------------- | ------------------------------------------------- |
| `npm install`     | Instala dependencias                              |
| `npm run dev`     | Inicia servidor de desarrollo en `localhost:4321` |
| `npm run build`   | Construye el sitio en `./dist/`                   |
| `npm run preview` | Previsualiza el build localmente                  |
| `npm run astro`   | Ejecuta comandos de Astro CLI                     |

## 🎮 Comandos de Terminal

Una vez en la aplicación, puedes usar estos comandos:

- `ayuda` / `help` - Muestra todos los comandos disponibles
- `menu` - Abre el menú principal
- `limpiar` / `clear` - Limpia la pantalla
- `fecha` - Muestra la fecha actual
- `noticias` - Ver noticias tecnológicas
- `curriculum` / `cv` - Ver currículum de Gusi
- `proyectos` - Ver portafolio de proyectos
- `juegos` - Acceder a juegos retro
- `calculadora` - Abrir calculadora cósmica
- `salir` / `exit` - Cerrar sesión

También puedes usar números (1-6) para acceder directamente a las secciones del menú.

## 📱 Diseño Responsivo

La aplicación está optimizada para diferentes tamaños de pantalla:

- **Móvil** (hasta 480px): Terminal full-screen con controles táctiles
- **Tablet** (481-1024px): Menú plegable y diseño adaptativo
- **Escritorio** (1025px+): Experiencia completa con sidebar opcional

## 🎨 Personalización

### Colores

Edita `tailwind.config.mjs` para cambiar el esquema de colores:

```javascript
colors: {
  terminal: {
    bg: '#000000',      // Fondo
    text: '#00ff41',    // Texto principal
    dim: '#008f11',     // Texto secundario
    bright: '#39ff14'   // Resaltados
  }
}
```

### Contenido

- **CV**: Edita `src/components/CV.astro`
- **Proyectos**: Edita `src/components/Projects.astro`
- **Palabras del Ahorcado**: Edita `src/scripts/hangman.ts`

## 🌐 Despliegue

### Vercel (Recomendado)

1. Push a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Configura las variables de entorno
4. Despliega

### Netlify

1. Push a GitHub
2. Conecta tu repositorio en [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Configura variables de entorno

### GitHub Pages

```bash
npm run build
# Despliega la carpeta dist/ a GitHub Pages
```

## 📁 Estructura del Proyecto

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Terminal.astro       # Componente principal
│   │   ├── Menu.astro            # Menú principal
│   │   ├── NewsFeed.astro        # Noticias
│   │   ├── CV.astro              # Currículum
│   │   ├── Projects.astro        # Proyectos
│   │   ├── Games.astro           # Selector de juegos
│   │   └── CosmicCalculator.astro # Calculadora
│   ├── scripts/
│   │   ├── snake.ts              # Juego Snake
│   │   ├── hangman.ts            # Juego Ahorcado
│   │   └── tictactoe.ts          # Tres en Raya
│   ├── styles/
│   │   └── terminal.css          # Estilos retro
│   └── pages/
│       └── index.astro           # Página principal
├── astro.config.mjs              # Configuración Astro
├── tailwind.config.mjs           # Configuración Tailwind
├── tsconfig.json                 # Configuración TypeScript
└── package.json
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Inspirado en la estética de [Blade Runner](https://www.imdb.com/title/tt0083658/)
- Construido con [Astro](https://astro.build)
- APIs proporcionadas por [NASA](https://api.nasa.gov/) y [NewsAPI](https://newsapi.org/)

## 📧 Contacto

**Gusi** - [@gusi](https://github.com/gusi)

Project Link: [https://github.com/gusi/blade-runner-terminal](https://github.com/gusi/blade-runner-terminal)

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

🖥️ Desarrollado con ❤️ y mucho café en una terminal retro
