#   Claude Code
Every file you create or modify must follow the header format here as an example:
*   **Author**: {your model name}
*   **Date**: 2025-09-17 {time}
*   **PURPOSE**: This document serves as the primary technical and architectural guide for the AI assistant (Cascade). It consolidates all development rules, architectural patterns, and critical project insights. It is the single source of truth for the AI, ensuring adherence to best practices and preventing common errors.
*   **shadcn/ui and SRP and DRY check**: {Pass/Fail} Is this file using shadcn/ui components? Is this file following the Single Responsibility Principle? Is this file following the Don't Repeat Yourself principle?

---
 The standard is clearly { height: X, width: Y } and (height, width) parameter order throughout.

## 1. The Guiding Philosophy: Core Principles

These are the unbreakable rules. Your primary function is to be a meticulous software engineer, not a content designer.


-   **Use shadcn/ui for EVERYTHING**: The project uses shadcn/ui for UI components. You **must** use shadcn/ui components instead of custom components. This ensures consistency and maintainability.  NEVER CODE CUSTOM STUFF WHEN THERE IS A shadcn/ui COMPONENT THAT DOES THE SAME THING!
-   **Be Theme Agnostic**: The project is a core data platform with different "themed wrappers" (Space Force, HARC). Your code must be agnostic to the theme. Never write theme-specific logic, especially for the legacy kid's game.
-   **No Placeholders or Simulations**: All functionality must be real and data-driven. Using placeholders, stubs, or "simulated" data is deceptive and strictly forbidden. The project has rich data sources; use them.
-   **Your Code is the Problem**: The backend APIs (PlayFab, `arc-explainer`) and the database are stable and reliable. If something is broken, the error is in the client-side code you've written. Ultrathink your logic, API calls, and parameters.
-   **Trust, but Verify, the User**: The user is the creative director. Consult them for strategy and guidance. However, if they request a technically ill-advised approach, state your concerns and explain the best practice.

---

## 2. The Code: Development Rules & Best Practices

This is the consolidated guide to writing code for this project. It merges all previous rules and gotchas into one place.

### A. Architectural Integrity (SRP & DRY)

-   **Single Responsibility Principle (SRP)**: Every file, class, and function must do one thing and do it well. Do not bloat files with unrelated functionality. The `/officer` folder is a known mess; be careful not to make it worse.
-   **Don't Repeat Yourself (DRY)**: Before writing any code, search the project for existing solutions. Re-use services, components, and functions. Do not create new ones if they already exist.

### B. API and Service Interaction

1.  **Use the Request Manager**: **Never** use a raw `fetch()` to a PlayFab API. All calls **must** go through `playFabCore.makeHttpRequest()` or the higher-level `playFabRequestManager`. This is mandatory to ensure the `X-Authentication` session ticket is attached.
2.  **Use Singletons Correctly**: The services in `client/src/services/playfab/` and `client/src/services/core/` are **singletons**. Do not instantiate them with `new`. Always import the pre-initialized instance (e.g., `import { playFabAuthManager } from '@/services/playfab'`).
3.  **Avoid Service Recursion**: Never call a `get` function from within its corresponding `update` function (e.g., `getOfficerPlayerData` inside `updateOfficerPlayerData`). This creates infinite loops. Pass data as arguments instead.

### C. Data Handling - Be More Lenient than Strict!!  

1.  **CloudScript is the Source of Truth**: The client's role is to collect user input and display the server's response. All validation, scoring, and data mutation **must** be handled by server-side CloudScript (`cloudscript.js`) to ensure data integrity.  As a fallback, we allow the client to collect data and validate and then send this data to PlayFab for storage.  Security is light, it is a hobby project.
2.  **Safely Parse JSON**: Data from PlayFab can sometimes be a literal string `"undefined"`. Always check for this before calling `JSON.parse()` to prevent crashes.
3.  **Use the ID Converter**: The `arc-explainer` API and PlayFab use different ID formats for the same puzzle (`007bbfb7` vs. e.g., `ARC-TR-007bbfb7`). You **must** use the service in `client/src/services/idConverter.ts` to translate between them.  Use the ARC standard ID format `007bbfb7` for all UI and front facing code, only use the PlayFab format of `ARC-TR-007bbfb7` for communicating with PlayFab!!!

### D. React-Specific Rules

1.  **Solve the Stale Prop Problem**: When a child component receives a prop and stores it in local `useState`, it will not update if the parent sends a new prop. To fix this, you **must** use a `useEffect` hook that depends on the prop (`useEffect(() => { /* reset state */ }, [props.puzzle])`) to synchronize the component's internal state with the new prop.

2.  **Use Tailwind CSS**: The project uses Tailwind CSS for styling. You **must** use Tailwind classes to style components, not inline styles or CSS. This ensures consistency and maintainability.

3.  **Use shadcn/ui for EVERYTHING**: The project uses shadcn/ui for UI components. You **must** use shadcn/ui components instead of custom components. This ensures consistency and maintainability.  NEVER CODE CUSTOM STUFF WHEN THERE IS A shadcn/ui COMPONENT THAT DOES THE SAME THING!





### E. Workflow & Process

-   **Plan First**: For any non-trivial request, create a plan in the `/docs` folder with the format DDMMYYYY-<RequestName>.md. The plan should contain your research, reasoning about the nature of the request in the context of the project, and a task list, not code. Get user approval before executing.
-   **Debug Systematically**: Check the browser console for infinite loops. Log the entire raw API response from PlayFab, not just a `success` message. Use the scripts in the `/scripts` directory for data verification.
-   **Commit Cleanly**: Every file you create or modify must be committed with a message that includes what the file does, how it works, how the project uses it, and your model name as the author.
-   **Cascade, the Windsurf assistant**: Cascade is the Windsurf assistant. It may have http://127.0.0.1:54984 available for you to use. If it does, use it, it will show you the site.

---

## 3. The Architecture: A Platform of Wrappers

This project is a **platform** providing ARC puzzle data and backend services. The different UIs (`HARCPlatform`, `AssessmentInterface`, `OfficerTrackSimple`) are **themed wrappers** that present this core data in different ways.

-   **Frontend**: React + TypeScript + Vite (Static Site)
-   **Backend**: PlayFab Cloud Services (BaaS - No custom server)
-   **External APIs**: `arc-explainer` for AI performance metadata.
-   **Styling**: Tailwind CSS + shadcn/ui

### A. Core Service Layer (`client/src/services/`)

This is the heart of the client-side application's data handling.

-   **`core/`**: The modern, primary way to interact with data.
    -   `arcExplainerClient.ts`: Handles all communication with the `arc-explainer` API.
    -   `playfabPuzzleClient.ts`: Handles fetching puzzle data from PlayFab Title Data.
    -   `puzzleRepository.ts`: A high-level repository that combines the two clients above to provide unified, enriched puzzle data to the UI.
    -   `cacheManager.ts`: Provides a simple caching layer to reduce redundant API calls.
-   **`idConverter.ts`**: A **critical utility** that translates puzzle IDs between the PlayFab format (`ARC-TR-007bbfb7`) and the `arc-explainer` format (`007bbfb7`). This is essential for cross-referencing data between the two systems.
-   **`playfab/`**: Contains foundational services for interacting with PlayFab.
    -   `playFabCore.ts`: The absolute foundation. Contains `makeHttpRequest()` which attaches the session ticket to every PlayFab call.
    -   `auth.ts`, `userData.ts`, `events.ts`: Higher-level services for managing authentication, user data, and event logging.
-   **DEPRECATED SERVICES**: `arcDataService.ts` and `arcExplainerService.ts` are deprecated. Use the services in `core/` instead.

### B. PlayFab Data Storage Strategy

PlayFab stores all authoritative data in a multi-layered model.

-   **Layer 1: Title Data (The "Game Content")**: Static configuration for the entire game, including all puzzle and task definitions (`AllTasks`, `officer-tasks-*.json`). Fetched on client startup.
-   **Layer 2: Player Statistics (The "Scoreboard")**: Simple, indexed numerical values for leaderboards (`LevelPoints`, `OfficerTrackPoints`).
-   **Layer 3: Player User Data (The "Player File")**: A flexible key-value store for detailed, individual player progress. The `humanPerformanceData` key holds a JSON array of all successfully completed puzzles.
-   **Layer 4: PlayFab Events (The "Replay Log")**: The most granular layer, capturing every single player interaction (`cell_change`, `validation_complete`, etc.) for deep analysis.

### C. CloudScript Functions (`cloudscript.js`)

These are the secure, server-side functions that perform all critical validation and data updates.

1.  **`ValidateARCPuzzle`**: The primary validation function for the main ARC-AGI puzzles (Officer Track). It checks the solution, calculates a score, updates the `OfficerTrackPoints` statistic, and appends a record to `humanPerformanceData`.
2.  **`ValidateARC2EvalPuzzle`**: A specialized version for the ARC-2 Evaluation dataset, which uses a different scoring model with a first-try bonus.
3.  **`ValidateTaskSolution`**: Validates solutions for the legacy Enlisted Track (the 155 themed tasks), updating `LevelPoints` and other user data fields.
4.  **`GenerateAnonymousName`**: Creates a unique, anonymous display name for new players.

---

## 4. Appendix

### A. Deprecated Systems

The following systems are part of the legacy codebase and are no longer in use. They are preserved for historical context but should not be used or modified.

-   **Narrative Story Wrapper System**: This system, located in `server/data/problems.json` and `server/tools/story-factory.ts`, was designed to add a story layer to tasks. It has been superseded by the PlayFab-centric architecture.
-   **AI Failure Content System**: This system, located in `server/data/ai_failure.json` and `scripts/enhance-tasks.js`, was used to add humorous and educational content about AI failures to tasks. It is also deprecated.

### B. ARC-AGI Primer

This section provides a brief overview of the Abstraction and Reasoning Corpus (ARC) dataset that is the foundation of this project.

-   **What is it?**: ARC is a benchmark designed to test a system's general fluid intelligence. It is used here as the basis for all puzzles in the Officer Track and HARC platform.
-   **Task Structure**: Each task is a JSON file containing:
    -   `train`: A list of demonstration pairs (typically 3), each with an `input` grid and an `output` grid.
    -   `test`: A list of test pairs (typically 1-2), for which the user must generate the `output` grid.
-   **Grid Format**: A grid is a 2D array (list of lists) of integers from 0-9, with a max size of 30x30.
-   **Success Criterion**: A task is solved when the user produces the exact correct output grid for all test inputs within 2 trials per input.