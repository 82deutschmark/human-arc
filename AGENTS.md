# Repository Guidelines

## Orientation for AI Agents
This codebase belongs to a solo hobbyist; keep changes lean, reversible, and always explain assumptions. Read `CLAUDE.md` before touching UI logic—the owner treats it as the canonical rulebook. Announce risky ideas (schema edits, PlayFab writes) and wait for explicit confirmation. Prefer practical fixes over process ceremony, and document any uncertainty directly in your response.

## Project Structure & Module Organization
The active front end lives in `client/src` (React + Vite). Routes sit in `pages/`, domain hooks under `hooks/`, and PlayFab logic in `services/`. `server/` houses ARC dataset tooling, task generators, and CLI helpers; most scripts expect to run via `npx tsx`. Shared Drizzle schemas live in `shared/`. `scripts/` contains operational PlayFab jobs—double-check arguments before invoking anything that mutates remote data. `cloudscript.js` mirrors the deployed CloudScript; treat it as the backend contract.

## Build, Test, and Development Commands
Run `npm install` once. Use `npm run dev` for the Vite dev server (client root). `npm run build` creates the `dist/` bundle; follow with `npm run start` for a local preview. `npm run check` executes the strict TypeScript project. Before touching PlayFab data, sync local fixtures with `node scripts/sync-cloudscript.cjs` and `npm run sync-ai`. The `npm run test` script simply builds then launches dev; prefer targeted checks such as `npx vitest run client/src/hooks/puzzle-solver/usePuzzleState.test.ts` when introducing test files.

## Coding Style & Naming Conventions
Match the existing TypeScript style: 2-space indentation, semicolons, and double-quoted imports. Respect the `@` and `@shared` path aliases from `tsconfig.json`. React components use PascalCase; utilities use camelCase. Favor Tailwind classes and shadcn/ui primitives per `CLAUDE.md`. Keep feature assets co-located within their domain folder, adding Markdown docs only when they unblock agent context.

## Testing & Verification Guidelines
When code touches puzzle flow or PlayFab services, exercise the relevant `*.test.ts` files with `npx vitest run`. For data integrity, lean on `server/tools/test-runner.ts` or `server/tests/generate-sample-task.ts` via `npx tsx`. Integration scripts require `.env` credentials; if absent, stop and ask. Always log what you ran in the final message so the owner can reproduce.

## Commit & Handoff Notes
Follow the informal conventional-commit style visible in `git log` (`fix:`, `deprecate:`). Summarize intent, manual checks, and any data migrations in your response; screenshots are optional unless UI changes. Before handing off, highlight open questions or risky assumptions so the human can weigh in quickly.
