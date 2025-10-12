`

# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.
``

Project overview

- Stack: Astro 5 (SSG, static output) + Tailwind CSS + TypeScript (strict), ESM modules.
- Purpose: Retro-futuristic “Blade Runner” interactive terminal UI with command-driven views: news (NewsAPI), CV, projects, games (snake, tetris, tictactoe, hangman), and a “Cosmic Calculator” that uses NASA APOD.
- Deployment targets: Static hosting (dist/) — GitHub Pages workflow provided; README mentions Vercel/Netlify as options.

Commands

- Dev server (port 4321 by default)
  ```bash path=null start=null
  npm run dev
  ```
- Build (type-check + build) and local preview
  ```bash path=null start=null
  npm run build
  npm run preview
  ```
- Linting, formatting, and type checks

  ```bash path=null start=null
  # Lint & auto-fix
  npm run lint

  # Lint without fixing
  npm run lint:check

  # Format (Prettier) and check mode
  npm run format
  npm run format:check

  # Type check via Astro
  npm run type-check
  ```

- Astro CLI passthrough
  ```bash path=null start=null
  npm run astro -- <subcommand>
  # examples
  npm run astro -- add
  npm run astro -- check
  ```
- Tests: No test runner/config detected in this repository. If tests are added later, document the single-test invocation here.

Environment and configuration

- Node: README requires Node.js 18+; CI uses Node 20. Prefer Node 20 locally for parity.
- Env vars (.env):
  - PUBLIC_NASA_API_KEY — used by Cosmic Calculator (falls back to DEMO_KEY if absent).
  - PUBLIC_NEWS_API_KEY — used by NewsFeed (has enhanced demo fallback when absent or CORS-limited).
  ```bash path=null start=null
  cp .env.example .env
  # then edit .env to add real keys
  ```
- Astro config: static output; site is set to https://gusi.dev. If deploying to GitHub Pages under a subpath, set site/base in astro.config.mjs accordingly.

CI/CD

- GitHub Actions: .github/workflows/deploy.yml
  - Triggers: push to main, manual dispatch.
  - Node 20, npm ci, npm run build; uploads ./dist as Pages artifact; deploys with actions/deploy-pages.

Code architecture (high level)

- Page entrypoint
  - src/pages/index.astro orchestrates the UI: imports components, includes global styles (src/styles/terminal.css), sets meta tags, preconnects to external APIs, and mounts UI components.
- Terminal core and event model
  - src/components/Terminal.astro contains the interactive terminal UI and the TerminalController class.
    - Captures input, maintains history, renders output via printOutput, and maintains a command registry (help, menu, clear, date, whoami, numeric shortcuts, news/resume/cv/projects/games/calculator, exit, config).
    - Switches "views" by dispatching CustomEvent('loadView', { detail: { view } }).
    - Exposes window.terminal to allow other components to print into the terminal area.
- Feature components (render-on-demand via events)
  - NewsFeed (src/components/NewsFeed.astro):
    - Listens for loadView('news'), then uses window.terminal.printOutput to render content.
    - Fetches via NewsAPI using import.meta.env.PUBLIC_NEWS_API_KEY with resilient fallbacks (enhanced demo content; generalized queries; basic category filters: ai/cosmos/all). Regular auto-refresh interval.
  - CosmicCalculator (src/components/CosmicCalculator.astro):
    - Listens for loadView('calculator').
    - Computes planetary “ages” and shows a canvas-based solar-system visualization.
    - Retrieves NASA APOD for the birthdate when PUBLIC_NASA_API_KEY is set; otherwise shows alternative astronomy content without throwing.
  - Other sections (CV, Projects, Games) follow the same pattern: the terminal triggers the view by command; the component injects markup through the terminal.
- Client-side scripts and games
  - src/scripts/ contains game logic (snake, tetris, tictactoe, hangman). Games manage their own inputs to avoid interfering with the terminal input.
- Styling and theme
  - Tailwind config (tailwind.config.mjs) defines a terminal color palette (bg, text, dim, bright), mono font family, and keyframes (blink/typewriter). Component styles are augmented by src/styles/terminal.css. Themes can be toggled at runtime by applying body classes.
- Build output & assets
  - Static build to dist/. Public assets live under public/ (e.g., public/images/... for project tiles).

Linting & formatting policy

- ESLint (.eslintrc.cjs): recommended + plugin:astro + plugin:tailwindcss; TS parser enabled. Dist/.astro/node_modules are ignored. Enforces prefer-const/no-var and TS-specific unused-vars rules; tailwind class conflict/order checks.
- Prettier (.prettierrc): includes prettier-plugin-astro and prettier-plugin-tailwindcss.
- Husky/lint-staged are listed as dev dependencies; a pre-commit npm script is defined (lint:check, format:check, type-check). If Husky hooks are initialized in this repo, wire the pre-commit script into .husky/pre-commit.

Operational notes for Warp

- Use npm run dev for interactive iteration; components render into the terminal via events — inspect console logs when working on NewsFeed and API calls, as they implement verbose diagnostics and fallbacks.
- For GitHub Pages deployments, ensure site/base in astro.config.mjs matches the final URL structure to avoid broken asset paths.
- If API keys are redacted in commands, replace with {{PUBLIC_NASA_API_KEY}} / {{PUBLIC_NEWS_API_KEY}} placeholders and source from environment variables rather than inlining.
