# Human ARC

[Open Human ARC on ARC Explainer](https://arc.markbarney.net/human-arc/)

Human ARC is a browser app for people to try ARC puzzles, review their results, and explore archived AI results on the same tasks. Created by Mark Barney, it includes a guided assessment, a puzzle library, a guest profile, and human-versus-AI comparison views.

The app also retains the earlier Space Force Mission Control experience under `/space-force`. Human ARC is the main entry point.

## What the results mean

Human ARC records puzzle attempts and progress. Its scores describe activity in this app; they are not IQ scores or a validated measure of intelligence. AI comparisons use the results available through ARC Explainer, including historical evaluations, and should not be read as a current model leaderboard or a controlled human-versus-AI experiment.

## Run locally

Use a recent Node.js release with npm.

```bash
npm ci
```

Create a `.env` file in the repository root with the public application configuration:

```dotenv
VITE_PLAYFAB_TITLE_ID=19FACB
VITE_ARC_EXPLAINER_URL=https://arc.markbarney.net
```

Then start Vite:

```bash
npm run dev
```

Open the local address printed by Vite. The browser connects to the configured live services; this is not an offline copy of the puzzle and progress databases. For an independent deployment, configure your own PlayFab title and its required data and CloudScript.

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development frontend. |
| `npm run build` | Build static files into `dist/`. |
| `npm start` | Preview the built frontend locally. |
| `npm run check` | Run TypeScript checking. |

The legacy `npm test` command is **not an automated test suite**. Its `pretest` scripts synchronize PlayFab CloudScript and AI-model data before building and starting the development server. Use the commands above for ordinary frontend development.

## Hosting on ARC Explainer

The public address is **https://arc.markbarney.net/human-arc/**. ARC Explainer builds a pinned revision of this repository as a separate frontend and serves it at that prefix.

To build for the same prefix, with the `.env` configuration above:

```bash
HARC_BASE_PATH=/human-arc/ npm run build
```

Root hosting remains the default when `HARC_BASE_PATH` is unset. For a subpath deployment, serve `dist/` beneath that prefix and return its `index.html` for application routes. Missing assets must return 404 rather than an HTML page. ARC Explainer provides this routing through its Human ARC middleware.

The PlayFab title ID is public configuration. Never put a PlayFab secret key in a `VITE_` variable or frontend bundle. Guest identity is stored in the browser, so moving between domains or clearing browser storage does not automatically preserve access to the same guest profile.

## How it is organized

- **Frontend:** React, TypeScript, Vite, Wouter, Tailwind CSS, and shadcn/ui components in `client/`.
- **Puzzle access:** the shared repository in `client/src/services/core/` combines ARC Explainer and PlayFab sources. The library solver uses ARC Explainer first, with PlayFab fallback.
- **Progress and profiles:** the PlayFab services in `client/src/services/playfab/` manage anonymous identity, stored progress, and leaderboard data.
- **Validation and scoring:** `cloudscript.js` contains the PlayFab CloudScript implementation; some client flows also retain fallback validation.
- **Historical code:** the repository includes earlier server and Space Force tooling. The standard Vite build produces the current static frontend; it does not start that legacy server.

## Documentation

- [ARC Explainer hosting plan](docs/07102026-ARCExplainerHosting.md) — integration scope, routing, and release checks.
- [October 2026 public-site cleanup](docs/07102026-public-site-cleanup.md) — guest navigation and clearer result descriptions.
- [Changelog](CHANGELOG.md) — changes across releases.
- [Assessment modal analysis](ASSESSMENT_MODAL_DEEP_DIVE.md) — assessment state transitions and earlier fixes.
- [Architecture notes](docs/architecture.md), [PlayFab integration](docs/playfab-integration.md), and [ARC Explainer integration](docs/arc-explainer-integration.md) — older design context; check current source and the hosting notes when implementing changes.
- [Archived plans](docs/archive/) — historical migrations, experiments, and retired systems.

## Contributing

Issues and pull requests are welcome. Describe the affected page, the steps to reproduce a problem, and what you expected. For development conventions, read [CLAUDE.md](CLAUDE.md). Changes to PlayFab data or CloudScript are separate from publishing the frontend.

## Credits

Built on the [Abstraction and Reasoning Corpus](https://github.com/fchollet/ARC-AGI) and the work of the [ARC Prize community](https://arcprize.org/). [ARC Explainer](https://github.com/82deutschmark/arc-explainer) supplies the public hosting and puzzle-result integration; PlayFab provides the existing progress services.
