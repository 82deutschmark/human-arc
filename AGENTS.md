# Repository Guidelines

## Project Structure & Module Organization
The SFMC codebase is split between a Vite React client and supporting server tooling.
- `client/src` holds all UI modules, hooks, and services; routes live in `pages`, and UI primitives under `components/ui`.
- `server` provides task generators, PlayFab data loaders, and CLI utilities; runnable scripts live under `server/cli` and `server/scripts`.
- `shared` stores Drizzle ORM schema and cross-cutting types shared by client and server.
- `scripts` contains operational automation (PlayFab sync, AI registration, reporting); run them with `npx tsx` unless a `.cjs` script specifies `node`.
- `cloudscript.js` mirrors the deployed PlayFab CloudScript, while `data/` and `server/data/` provide ARC datasets used by both tracks.

## Build, Test, and Development Commands
Install dependencies once with `npm install`.
- `npm run dev` boots the Vite dev server against `client/` (http://localhost:5173).
- `npm run build` emits production assets into `dist/`; `npm run start` previews that bundle.
- `npm run check` runs the strict TypeScript project defined in `tsconfig.json`.
- `npm run db:push` syncs the Drizzle schema to the configured database.
- `npm run sync-ai` and `node scripts/sync-cloudscript.cjs` refresh PlayFab content before validating feature work.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation, trailing semicolons, and double-quoted import paths, mirroring `client/src` and `shared/schema.ts`.
Use PascalCase for React components, camelCase for utilities, and maintain the `@` / `@shared` path aliases defined in `tsconfig.json`.
Keep feature folders cohesive: colocate `.test.ts`, styles, and content under the relevant `client/src/<domain>/` subdirectory.
Prefer Tailwind utility classes for styling and NextUI components for layout consistency.

## Testing Guidelines
Client specs live beside their features (`*.test.ts`) and rely on Vitest-style globals; run targeted suites with `npx vitest run path/to/spec`.
Server-side task validations execute through `npx tsx server/tests/generate-sample-task.ts` or the helpers in `server/tools/test-runner.ts`.
PlayFab integration tests need valid credentials in `.env`; use throwaway accounts and avoid committing secrets.
Before opening a PR, run `npm run build` plus any affected `scripts/test-*.ts` flows to validate data pipelines.

## Commit & Pull Request Guidelines
Follow the informal conventional commit pattern already used (`fix: ...`, `deprecate: ...`), keeping subjects under 72 characters.
Group changes logically, update `CHANGELOG.md` when a user-visible behavior shifts, and reference related tickets.
Pull requests should describe intent, outline manual test coverage, and include UI screenshots or logs when behavior changes.
Request review once CI or local checks pass and note any follow-up tasks for data migrations.

## Environment & Security Notes
Copy `.env` from the shared vault; populate PlayFab IDs, API secrets, and database URLs before running automation.
Guard production credentials—never store them in sample data or checked-in scripts.
For local experimentation, point Drizzle and PlayFab calls at staging resources and document any irreversible migrations in the PR.
