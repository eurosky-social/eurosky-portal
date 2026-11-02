# Contributing to the Eurosky Portal

Thanks for your interest in the Eurosky Portal. This guide gets you from a fresh clone to a merged pull request. For what the Portal is and how it fits with the Eurosky PDS and EU-HAUL, start with the [architecture overview in the README](README.md#architecture-overview).

By taking part in this project you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project layout](#project-layout)
- [Day-to-day development](#day-to-day-development)
- [Common tasks](#common-tasks)
- [Checks](#checks)
- [Submitting a pull request](#submitting-a-pull-request)
- [Releases](#releases)
- [Getting help](#getting-help)

## Ways to contribute

- **Report a bug or suggest a feature** by opening a [GitHub issue](https://github.com/eurosky-social/eurosky-portal/issues). Include what you expected, what happened, and steps to reproduce. Problems with an account on the Eurosky PDS itself (rather than this web app) belong in [eurosky-social/tech-support](https://github.com/eurosky-social/tech-support).
- **Translations.** The Portal ships in English, Catalan, Dutch, French and German. Corrections and new languages are very welcome; see [Translations](#translations).
- **Code and documentation.** Look for open issues, or open one first to discuss larger changes so nobody spends time on something that won't be merged.
- **Security issues** must not be reported in public. Follow [SECURITY.md](SECURITY.md).

## Development setup

### Prerequisites

- **Node.js 26** (the exact version is in [`.node-version`](.node-version); tools like `fnm`, `nvm` or `mise` pick it up automatically).
- **pnpm**, for example with `npm install --global pnpm`. Any recent version works.
- **Git**.
- **An AT Protocol account to sign in with.** Any Bluesky or other AT Protocol account works in development, because the example config allows external logins.
- Docker is optional, only needed to test the production image.

No other services are required: the database is a local SQLite file, and the queue and cache use the same database.

### First run

```sh
git clone https://github.com/eurosky-social/eurosky-portal.git
cd eurosky-portal
npm install --global pnpm
pnpm install

cp .env.example .env
node ace generate:key   # fills in APP_KEY in .env

pnpm db:migrate         # creates tmp/db.sqlite3
pnpm dev                # starts the server with hot reload
```

Open <http://127.0.0.1:4075> and sign in.

### About the development environment

- **Use the URL from `APP_URL`.** AT Protocol OAuth is strict about redirect URLs, so in development the app redirects any request on another host (for example `localhost` instead of `127.0.0.1`) to the host configured in `APP_URL`.
- **OAuth client.** Leave `ATPROTO_OAUTH_CLIENT_ID` unset locally. Production uses a published client metadata document instead.
- **Which PDS you sign in to.** `.env.example` sets `OAUTH_SERVICE=https://pds.rip/` (a test PDS) and `ALLOW_EXTERNAL_LOGINS=true`, so you can sign in with an existing account on any PDS. Using "Create account" creates a real account on whatever `OAUTH_SERVICE` points to, so do not point it at the production Eurosky PDS when testing sign-up.
- **External services.** In development the Portal still talks to public network services: Slingshot (identity resolution), the public Bluesky AppView (profiles and posts), atstore (app listings) and a Eurosky Jetstream (live activity). You need internet access, and some features degrade gracefully if one is unavailable.
- **Resetting state.** Stop the server and delete `tmp/db.sqlite3*`, then run `pnpm db:migrate` again.
- **Optional extras.** OpenTelemetry (`OTEL_ENABLED`) and Plausible (`PLAUSIBLE_ENABLED`) are off by default and not needed for development.

## Project layout

The Portal is an [AdonisJS](https://docs.adonisjs.com) 7 app with a React front end served through [Inertia](https://inertiajs.com).

```text
app/
  controllers/    HTTP controllers (one per area: oauth, account, dashboard, activity, files, discover, ...)
  middleware/     Auth, guest, legal "roadblock" (re-accept updated terms), locale detection, ...
  services/       Integrations: activity backfill, storage sync, Jetstream, Slingshot, Bluesky AppView, atstore, favorites, legal docs, Plausible
  jobs/           Background jobs (activity backfill, storage sync), run by the in-process queue worker
  models/         Lucid models: Account, ActivityRecord, Blob, OauthSession, OauthState
  events/         Domain events (auth flow started/completed, terms accepted, ...)
  listeners/      Event listeners, mostly analytics tracking
  transformers/   Shape server data into Inertia page props
  validators/     VineJS request validators
  lexicons/       Generated, typed AT Protocol lexicon clients (do not edit by hand)
  utils/          Helpers (OAuth scopes, PDS clients, rich text, embeds, telemetry, ...)
commands/         Ace commands (i18n:check, portal:backfill-handles, portal:resync-collection, storage:recategorize)
config/           Framework and package configuration
database/
  migrations/     Database migrations
  schema.ts       Generated model schema
data/             Markdown and JSON content per locale (FAQ, explore page)
inertia/
  pages/          One React component per page, matching the controllers' `inertia.render(...)` calls
  components/     Shared React components
lexicons/         Pinned lexicon JSON files (source for app/lexicons)
providers/        App providers, including the queue worker and Jetstream subscriber
resources/
  views/          Edge templates (the Inertia root layout)
service/          Example production deployment (Docker Compose, Caddy, systemd)
shared/           Code used by both server and front end (app catalog, brand, locales, MIME types)
  i18n/           Translations, for server and front end (one file per locale)
start/            Boot files: routes, env validation, middleware kernel, auto-migration
```

Imports use subpath aliases such as `#controllers/*`, `#services/*` and `#models/*` (see `imports` in [`package.json`](package.json)).

### Request flow in brief

A request hits a route in [`start/routes.ts`](start/routes.ts) (OAuth routes are in [`start/routes/oauth.ts`](start/routes/oauth.ts)), passes through middleware registered in [`start/kernel.ts`](start/kernel.ts), and reaches a controller. Controllers call services, then render an Inertia page from `inertia/pages/` with props shaped by a transformer. Signed-in routes use the `auth` and `legalRoadblock` middleware, which send people to `/onboarding` if they have not accepted the current terms.

## Day-to-day development

| Command           | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `pnpm dev`        | Start the dev server with hot module reloading         |
| `pnpm db:migrate` | Run pending database migrations                        |
| `pnpm lint`       | ESLint                                                 |
| `pnpm format`     | Format with Prettier (`pnpm format:check` only checks) |
| `pnpm typecheck`  | TypeScript checks for server and front end             |
| `pnpm i18n:check` | Verify every locale has the same translation keys      |
| `pnpm test`       | Run the Japa test runner                               |
| `pnpm build`      | Production build into `build/`                         |
| `pnpm changeset`  | Add a changeset describing your change (see below)     |
| `node ace list`   | List all Ace commands, including project-specific ones |

Editor setup: the repo includes an [`.editorconfig`](.editorconfig). Use the workspace TypeScript version and enable ESLint and Prettier integration.

## Common tasks

### Adding or changing a page

1. Add a route in `start/routes.ts`, inside the right group (guest, signed-in, or public).
2. Add or extend a controller in `app/controllers/`, returning `inertia.render('your-page', props)`.
3. Create `inertia/pages/your-page.tsx`.
4. Add any new strings to the translation files (see below).

### Database changes

Create a migration with `node ace make:migration <name>`, run `pnpm db:migrate`, and commit both the migration and the regenerated `database/schema.ts`. Migrations run automatically on deploy (`DATABASE_AUTOMIGRATE=true`), so they must be safe to run against an existing production database.

### Translations

Strings live in these places, and every locale must define the same keys:

- **Messages**, for the front end and the server (validation messages, flash errors and similar): `shared/i18n/<locale>.ts`
- Longer content, the FAQ and explore page, is in `data/<locale>/` (`faq.json`, `explore.md`).

English (`en`) is the reference locale. When you add a key, add it to every locale; if you can't translate it, copy the English text and mention it in your pull request so a translator can follow up. `pnpm i18n:check` runs in CI and fails if keys are missing or placeholders differ; it does not check `data/`.

To add a new locale, also add it to `locales` and `localeNames` in [`shared/locale.ts`](shared/locale.ts), and to `catalogs` in [`inertia/lib/i18n.tsx`](inertia/lib/i18n.tsx).

### AT Protocol lexicons

The lexicons the Portal uses are pinned in [`lexicons.json`](lexicons.json), with JSON files in `lexicons/` and generated TypeScript in `app/lexicons/`. To use a new record type or XRPC method, add it with the `lex` CLI (`pnpm lex --help`), then regenerate the clients with `pnpm lex:build`. Never edit `app/lexicons/` by hand.

### Supporting more file types

The files page sorts blobs into images, videos and other files by their MIME type. The types it can preview are listed in [`shared/mime.ts`](shared/mime.ts); their labels and download extensions are in [`inertia/utils/mime.ts`](inertia/utils/mime.ts), with label translations under `mimeType.*`. After changing these lists, run `node ace storage:recategorize` on the server to sort already stored blobs again; it needs no network access.

### Adding an app to the directory

Apps shown on the apps page are listed in [`shared/apps.ts`](shared/apps.ts). Find the app's listing on [atstore](https://atstore.fyi) and add its `at://` URI with a category; details are fetched from atstore at runtime. The comments in that file explain the options.

### OAuth scopes

Scopes are defined in [`app/utils/oauth.ts`](app/utils/oauth.ts). Keep sign-in scopes minimal and request additional scopes only at the moment a feature needs them, as the favorites flow does. Changes to scopes affect what people are asked to approve, so call them out clearly in your pull request.

### Adding a dependency

`pnpm-workspace.yaml` sets `minimumReleaseAge`, so pnpm will refuse package versions published less than 24 hours ago. This is a deliberate supply-chain safeguard: wait, or pick an earlier version. Packages that need install scripts must be explicitly allowed under `allowBuilds`.

## Checks

Every push and pull request runs the [`checks` workflow](.github/workflows/checks.yaml): translations, linting, formatting and type checking. Run the same thing locally before pushing:

```sh
pnpm i18n:check && pnpm lint && pnpm format:check && pnpm typecheck
```

There are currently no automated tests. Tests use [Japa](https://japa.dev) (configured in `tests/bootstrap.ts`), and contributions that add tests, especially around the OAuth and activity flows, are very welcome. Until coverage improves, describe in your pull request how you tested the change manually.

## Submitting a pull request

1. **Fork** the repository (or create a branch if you have write access) and branch from `main`.
2. **Keep it focused.** One logical change per pull request is easier to review and revert.
3. **Write clear commits.** Short imperative subject lines (for example "Add French translation", "Fix duplicate migration messages").
4. **Add a changeset** for any user-visible change: run `pnpm changeset`, choose a `patch`, `minor` or `major` bump, and write a short summary. This becomes the entry in [CHANGELOG.md](CHANGELOG.md). Pure refactors, CI changes and dependency updates can skip this.
5. **Run the checks** above and make sure they pass.
6. **Open the pull request** against `main`, describing what changed, why, and how you tested it. Add screenshots for UI changes, and link related issues.
7. **Review.** A maintainer will review and may ask for changes. Once approved and green, a maintainer merges it.

Please also keep in mind:

- **Privacy first.** The Portal handles identities. Don't log tokens, OAuth callback parameters or other personal data (see `redactCallbackParams` in `app/utils/oauth.ts`), and keep analytics events free of personal data.
- **Accessibility.** Use semantic HTML and keyboard-accessible components, and check contrast in both light and dark themes.
- **Branding.** Code is MIT licensed, but Eurosky branding and legal texts are not. See [trademarks.md](trademarks.md).

By contributing, you agree that your contributions are licensed under the project's [MIT License](LICENSE).

## Releases

Releases are automated with [Changesets](https://github.com/changesets/changesets). When changesets land on `main`, a bot opens a "Prepare next release" pull request that bumps the version and updates the changelog. Merging it tags the release and publishes Docker images to `ghcr.io/eurosky-social/eurosky-portal` (version tags and `latest`). Every push to `main` also publishes a `dev` image.

## Getting help

- Questions about the code: open a [GitHub issue](https://github.com/eurosky-social/eurosky-portal/issues) or ask in your pull request.
- Problems with a Eurosky account or the PDS: [eurosky-social/tech-support](https://github.com/eurosky-social/tech-support).
- Branding or partnership questions: team@eurosky.tech.
