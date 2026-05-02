# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a multi-package monorepo (no workspace tooling — each package has its own `package.json` and `node_modules`). Three deployable apps share a single Supabase project defined in `supabase/migrations/`.

- `backend/` — NestJS 11 API (TypeScript). Default port `3005`. Public URL pattern: API consumed by the two Next.js apps.
- `luxya-pos/` — Next.js 16 (App Router, React 19, Tailwind 4) admin / POS dashboard. Deployed at `admin.lolly.sn`.
- `lollyshop/` — Next.js 16 customer-facing storefront. Deployed at `shop.lolly.sn`.
- `supabase/migrations/` — SQL migrations shared by all apps. Migration filenames are timestamped and applied in order.
- Root scripts (`convert_to_avif.js`, `test-ai.mjs`, `test-live-ai.mjs`) are one-off utilities, not part of any package.

## Common commands

Run from inside the relevant package directory.

### `backend/` (NestJS)
- `npm run start:dev` — watch-mode dev server
- `npm run start:prod` — run `dist/main` (after `npm run build`)
- `npm run lint` — ESLint with `--fix`
- `npm run test` — Jest unit tests (matches `*.spec.ts` under `src/`)
- `npm run test:e2e` — Jest with `test/jest-e2e.json`
- Run a single test: `npx jest src/path/to/file.spec.ts` or `npx jest -t "test name"`

### `luxya-pos/` and `lollyshop/` (Next.js)
- `npm run dev` — dev server (default port 3000; run them on different ports if both are needed)
- `npm run build` / `npm run start`
- `npm run lint` — `eslint` via `eslint-config-next`
- No test runner configured.

## Architecture

### Authentication and request flow
- Supabase is the single source of truth for users and data. Both Next.js apps use `@supabase/ssr` with three clients in `utils/supabase/{client,server,middleware}.ts`. Session is refreshed on every request through `proxy.ts` → `updateSession`.
- The Next.js apps call the NestJS backend through `utils/api.ts` (`authFetch`) which pulls the Supabase access token from the browser session and sends it as `Authorization: Bearer <token>`.
- The backend registers `AuthGuard` (`backend/src/auth/auth.guard.ts`) globally via `APP_GUARD`. Every route is protected unless decorated with `@Public()` (`auth/public.decorator.ts`). The guard validates the Bearer token against Supabase.
- `ThrottlerGuard` is also a global guard (60 req / 60 s by default).
- CORS in `backend/src/main.ts` is allowlist-based: `shop.lolly.sn`, `admin.lolly.sn`, localhost in non-prod, plus anything in `ALLOWED_ORIGINS` (comma-separated env var).

### Backend modules (`backend/src/`)
Top-level NestJS modules registered in `app.module.ts`: `auth`, `products`, `sales`, `expenses`, `ai`, `analytics`, `calendar`, plus `SupabaseModule`. Each follows the standard Nest layout (`*.module.ts`, `*.controller.ts`, `*.service.ts`, optional `dto/`).

`SupabaseService` (`backend/src/supabase.service.ts`) exposes two clients:
- `getClient()` — anon key, for user-scoped queries.
- `getAdminClient()` — service role key, for privileged operations. Throws if `SUPABASE_SERVICE_ROLE_KEY` is missing.

`@nestjs/config` is loaded globally; required env vars include `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `ALLOWED_ORIGINS`, plus AI/calendar credentials for those modules (`@google/generative-ai`, `googleapis`).

Global validation pipe is enabled with `whitelist`, `forbidNonWhitelisted`, and `transform` — DTOs must declare every accepted field.

### Frontend conventions (both Next.js apps)
- App Router (`app/` directory). Server-side fetches use `utils/api-server.ts`; client-side fetches use `utils/api.ts` with `safeFetch` (15 s timeout, 3 retries, JSON-only protection against HTML responses from Render cold starts).
- `NEXT_PUBLIC_API_URL` points to the NestJS backend (defaults to `http://127.0.0.1:3005`).
- `NEXT_PUBLIC_SITE_URL` is used for absolute URL generation.
- React Compiler is enabled (`babel-plugin-react-compiler`).
- Tailwind v4 with PostCSS plugin; no separate `tailwind.config`.
- `luxya-pos/next.config.ts` allows server actions up to 10 MB and whitelists the Supabase storage host for `next/image`.
- `luxya-pos/app/api/webhook-proxy/` exists because client-side webhook handling proxies through the Next app rather than hitting the backend directly.

### Database
All schema changes go through `supabase/migrations/` with timestamped filenames. RLS policies live in dedicated migration files (e.g. `*_enable_rls_policies.sql`). When adding a table, also add or update RLS — both apps rely on it for direct Supabase reads.
