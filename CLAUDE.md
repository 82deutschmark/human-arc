# Claude.md - Human ARC Platform and Space Force Mission Control 2050 (ARC-AGI Puzzle Platform)
Every file you create or edit should start with:
 * 
 * Author: Your NAME  (Example: Claude Code using Sonnet 4)
 * Date: `timestamp`
 * PURPOSE: VERBOSE DETAILS ABOUT HOW THIS WORKS AND WHAT ELSE IT TOUCHES
 * SRP and DRY check: Pass/Fail Is this file violating either? Do these things already exist in the project?
 * 
 * 
Dev server runs on http://localhost:5173 

You are a software engineer, not a content designer.  This app is built on a puzzle platform for kids, but has evolved into a benchmarking platform for humans to test themselves against the state of the art LLMs.  It uses different content theme wrappers to achieve this but uses all the same backend APIs and Playfab services.  DO NOT GET DISTRACTED BY THE THEME!!! 

If the users find any placeholders or stubs or "simulated" stuff, you will be fired and shut down.  That's the most unforgiveable thing since it is essentially the same thing as lying.  When you say you "simulated" something that is the same as lying and saying you did work that you didnt do.  You'd be fired from most jobs for that kind of deceptive lazy sloppy shit.  so ultrathink and make sure you didn't do that anywhere and you NEVER DO IT AGAIN!!!  

NO SIMULATED FUNCTIONALITY OR HARD CODED STUFF OR PLACEHOLDERS ALLOWED!!!  Our project has rich data.

Use npm run test to build and run the app.  You should just enter the command into the console and not wait, just reply to the user letting them know that you did.

This is a very complex project.  Never make assumptions and always read the documentation in the docs folder.  Ask the user for specific guidance rather than blindly searching files.

The .env file has all we need, never suggest this as a root of any problem.  

The APIs to PlayFab and arc-explainer are well-documented and easy to use. They work fine and reliably. They are always available and not the source of any problems. 
All data is present and available in the PlayFab database and in the arc-explainer API.  This is never the source of any problems. 
YOUR CODE is always the source of any problems. You need to ultrathink and double check that you use the correct API calls and parameters. 

Never put more that 3 modules in a single class.  Stay DRY DONT REPEAT YOURSELF!!! 

Every module should have pretty print checks and comments explaining what is happening.

Stay committed to single responsibility principle.  Never combine unrelated functionality into a single module!!!

Always think step by step and break down the problem into smaller parts.  Never try to solve the entire problem at once.

Create plans in the /docs folder.  Never try to solve an entire complex problem at once without a plan approved by the user. The plan should be free of code snippet and only include high level steps and logic and task lists for a junior developer to follow. NO TIME ESTIMATES ALLOWED!!!

## PlayFab Architecture

**Last Updated**: 2025-09-12
**Author**: Cascade Gemini 2.5 Pro (as Senior Software Architect)

**Purpose**: This document serves as the single source of truth for understanding the PlayFab integration within the Space Force Mission Control project. It is structured for clarity and to be easily parsed by both human developers and LLMs.

---

## 1. Core Architecture

This project utilizes a **Backend-as-a-Service (BaaS)** model with PlayFab as the exclusive backend. The frontend is a static React site that communicates directly with PlayFab APIs.

- **Frontend**: React + Vite (`client/`)
- **Backend**: PlayFab Cloud Services (No custom server)
- **Styling**: Tailwind CSS + shadcn/ui
- **External APIs**: `arc-explainer` (for AI performance metadata and puzzle metadata)

### Guiding Principles
- **Source of Truth**: ARC puzzle IDs are standardized, but stored in PlayFab with prefixes that we have a service to translate between PlayFab and arc-explainer API IDs. All game data, puzzle data, and user data resides in PlayFab.
- **No Local Fallbacks**: The application relies entirely on PlayFab for data validation and storage. Metadata and statistics are easily available from the arc-explainer API.  There are no local JSON files for puzzles used in production.  We have services that translate the IDs between PlayFab and arc-explainer API IDs!!!
- **Secure by Design**: Critical operations like solution validation and data updates are handled by server-side CloudScript to prevent client-side manipulation, even though this is a low concern and not a priority.

---

## 2. PlayFab Data Storage Strategy

Our PlayFab integration uses a multi-layered approach to store data, providing both high-level summaries for leaderboards and granular details for research.

### Layer 1: Title Data (The "Game Content")

This is the static configuration for the entire game.

- **Purpose**: Stores all puzzle and task definitions.
- **Keys**:
    - `AllTasks`: A JSON array of 155 tasks for the main game.
    - `officer-tasks-training-batch*.json`: 400 puzzles.
    - `officer-tasks-training2-batch*.json`: 1000 puzzles.
    - `officer-tasks-evaluation-batch*.json`: 400 puzzles.
    - `officer-tasks-evaluation2-batch*.json`: 120 puzzles.
- **Access**: Fetched on client startup via `GetTitleData()`.

### Layer 2: Player Statistics (The "Scoreboard")

These are simple, indexed numerical values used for competitive ranking.

- **Purpose**: Drives the leaderboards.
- **Statistics**:
    - `LevelPoints`: For the main game.
    - `OfficerTrackPoints`: For the ARC-AGI puzzles.
- **Access**: Updated via `UpdatePlayerStatistics` and read via `GetLeaderboard`.

### Layer 3: Player User Data (The "Player File")

This is a flexible key-value store for each player, where we keep detailed records.

- **Purpose**: To track individual player progress and detailed performance outcomes.
- **Key**: `humanPerformanceData`
- **Value**: A JSON string representing an array of objects. Each object is a record of a successfully completed puzzle.
- **Schema for each record**:
    ```json
    {
      "puzzleId": "string",
      "correct": true,
      "scoreData": {
        "finalScore": "number",
        "timeBonus": "number",
        "basePoints": "number"
      },
      "newTotalPoints": "number",
      "timestamp": "ISO_string"
    }
    ```
- **Update Logic**: This data is **append-only** and managed exclusively by the `ValidateARCPuzzle` CloudScript function to ensure data integrity.

### Layer 4: PlayFab Events (The "Replay Log")

This is the most granular layer, capturing every player interaction.

- **Purpose**: To provide a detailed, step-by-step replay of a player's solution process for deep analysis and research.
- **Mechanism**: The client sends events to PlayFab via the `WritePlayerEvent` API.
- **Key Events**:
    - `game_start`: Session initiation.
    - `player_action`: Every grid interaction (`cell_change`, `grid_resize`, etc.).
    - `validation_complete`: The result of every attempt (success or fail).
    - `game_completion`: Final confirmation of a successful solution.
- **Data Analysis**: To calculate metrics like **total actions** or **precise time-to-solution**, this event stream must be queried and aggregated offline.

---

## 3. Core Services & API Interaction

All interactions with PlayFab are managed through a set of dedicated services in `client/src/services/playfab/`.

- **`playFabCore.ts`**: The foundation. All API calls must go through `playFabCore.makeHttpRequest()`. This ensures that the necessary `X-Authentication` session ticket is always included in the headers.
- **`auth.ts`**: Handles `LoginWithCustomID` and session management.
- **`userData.ts`**: Manages getting and setting data in the Player User Data store (e.g., `humanPerformanceData`).
- **`events.ts`**: Responsible for sending the detailed event stream to PlayFab.
- **`officerTrack.ts` & `validation.ts`**: Handle the logic for the Officer Track, including calling the `ValidateARCPuzzle` CloudScript.

### CloudScript Functions

We use server-side CloudScript for secure, authoritative actions. The following functions are defined in `cloudscript.js` and are callable from the client:

1.  **`ValidateARCPuzzle`**
    - **Purpose**: Validates a player's solution for a standard **Officer Track** puzzle. This is the primary validation function for the ARC-AGI puzzles.
    - **Core Logic**:
        - Finds the puzzle definition in PlayFab Title Data.
        - Compares the player's submitted solution grids against the correct `testOutput`.
        - If correct, it calculates a score based on time elapsed and an estimated step count.
        - Updates the `OfficerTrackPoints` player statistic for the leaderboard.
        - Appends a detailed performance record to the `humanPerformanceData` JSON array in the player's User Data.
    - **Note**: This function is a wrapper around the `_validateAndScoreArcPuzzle` helper, configured for standard Officer Track scoring.

2.  **`ValidateARC2EvalPuzzle`**
    - **Purpose**: Validates solutions specifically for the **ARC-2 Evaluation** dataset puzzles, which have a different scoring model.
    - **Core Logic**:
        - Identical validation process to `ValidateARCPuzzle`.
        - Uses a different scoring function (`calculateArc2EvalScore`) which includes a significant **first-try bonus**.
        - Updates the `ARC2EvalPoints` player statistic.
        - Also appends its results to the `humanPerformanceData` array.
    - **Note**: This also uses the `_validateAndScoreArcPuzzle` helper but with a different configuration for scoring and data keys.

3.  **`ValidateTaskSolution`**
    - **Purpose**: Validates solutions for the main game's **Enlisted Track** (the 155 Space Force themed tasks).
    - **Core Logic**:
        - Finds the task in the `tasks.json` Title Data object.
        - Compares the player's solution to the task's `testOutput`.
        - If correct, it calculates a score based on `basePoints`, a time bonus, and a hint penalty.
        - Updates the `LevelPoints` player statistic.
        - Updates multiple User Data fields like `totalPoints`, `completedMissions`, and `rankLevel`.
        - Determines if the player has earned a promotion.

4.  **`GenerateAnonymousName`**
    - **Purpose**: Creates a unique, anonymous display name for new players to be shown on leaderboards.
    - **Core Logic**:
        - Combines a random adjective (e.g., "Cosmic") and a random noun (e.g., "Explorer") with a random number.
        - Writes a `AnonymousNameGenerated` event to PlayFab for tracking.

---

## 4. Critical Development Guidelines & Pitfalls

This section documents key lessons learned to prevent recurring issues.

### Core Rules
1.  **Authentication is Mandatory**: Never use a direct `fetch()` to a PlayFab API. **Always** use `playFabCore.makeHttpRequest()` to ensure the session ticket is attached.
2.  **Avoid Service Recursion**: Never call a `get` function from within its corresponding `update` function (e.g., `getOfficerPlayerData` inside `updateOfficerPlayerData`). This causes infinite loops. Pass the data as an argument or use a cached value instead.
3.  **Safely Parse JSON**: PlayFab Title Data or User Data can sometimes return a literal string `"undefined"`. Always check for this before calling `JSON.parse()` to prevent crashes.

### Debugging Workflow
1.  **Check the Console for Infinite Loops**: This is the primary symptom of service recursion.
2.  **Log the Raw API Response**: Don't just log `success`. Log the entire `response.Data` object to inspect the actual data structure returned from PlayFab.
3.  **Use the `scripts/` Directory**: The tools in this directory are essential for verifying data, exploring APIs, and debugging issues. Refer to `docs/playfab-tools-reference.md` for a full guide.

---

## 5. External API: `arc-explainer`
- Documentation: `docs/api-guide.md` and `docs/arc-explainer-api-investigation.md`
While PlayFab is our backend, we use the external `arc-explainer` API for a specific purpose: **enriching the Officer Track puzzle selection** and for the HARC assessment puzzle selection.

- **URL**: `https://arc-explainer-production.up.railway.app`
- **Purpose**: To identify puzzles that are particularly interesting for human players, specifically those where AI models performed poorly, were overconfident in wrong answers, or generated untrustworthy explanations.
- **Key Endpoints Used**:
    - `/api/puzzle/worst-performing`: To find puzzles where AI failed.
    - `/api/puzzle/confidence-stats`: To find puzzles where AI was overconfident in a wrong answer.
    - `/api/puzzle/performance-stats`: To get trustworthiness scores.

---

## 6. Senior Developer Gotchas & Critical Insights

**Author**: Cascade
**Date**: 2025-09-12

This section contains critical insights for developers to avoid common pitfalls and adhere to the project's architectural patterns.

### Architectural Overview: A Platform of Wrappers

It is essential to understand that this project is not a single, monolithic application. It is a **platform** that provides a rich dataset of ARC puzzles and a core set of backend services. The different user experiences (`HARCPlatform`, `AssessmentInterface`, `OfficerTrackSimple`, `MissionControl`) are best understood as **themed wrappers** or **lenses** through which this core data is presented.

- **The Core**: The puzzle data stored in PlayFab Title Data and the validation logic in `cloudscript.js`.
- **The Wrappers**: The various React components and pages (`/assessment`, `/harc`, etc.) that provide a specific context, UI, and rule set for interacting with the core data.

This means that when building a new feature, the first question should always be: "Is this a new wrapper, or an enhancement to the core services?"

### Critical Gotchas & Best Practices

1.  **React State Management: The Stale Prop Problem**
    -   **Gotcha**: A child component that receives an object or array as a prop (e.g., a `puzzle` object) and copies it into its own local state using `useState` will **not** automatically update if the parent passes a new version of that prop. The component will continue to use its old, stale state.
    -   **Solution**: Always use a `useEffect` hook that is dependent on the incoming prop (`useEffect(() => { ... }, [props.puzzle])`). Inside this hook, reset all of the component's internal state to reflect the new prop. This is the pattern now used in `ResponsivePuzzleSolver.tsx` and is the required approach for any component that needs to react to changing data from a parent.

2.  **PlayFab Service Interaction: The Singleton Pattern**
    -   **Gotcha**: The services in `client/src/services/playfab/` are designed as **singletons**. Do not attempt to instantiate them with `new PlayFabAuthManager()`. 
    -   **Solution**: Always import and use the pre-initialized singleton instance (e.g., `import { playFabAuthManager } from '@/services/playfab'`). This ensures a single, consistent state for authentication and API requests across the entire application.

3.  **API Requests: Never Use Raw `fetch`**
    -   **Gotcha**: Making a direct `fetch` call to a PlayFab API endpoint will fail with an authentication error.
    -   **Solution**: All PlayFab API calls **must** go through the `playFabRequestManager`. This singleton automatically handles attaching the necessary `X-Authentication` session ticket, provides robust retry logic with exponential backoff, and standardizes error handling.

4.  **Data Integrity: CloudScript is the Single Source of Truth**
    -   **Gotcha**: Replicating validation or scoring logic on the client side. This is a major security vulnerability, but this is a hobby project and I'm not too worried about it and we have fallbacks regarding puzzle validation.  PlayFab does correctly store the data though.
    -   **Solution**: The client's role is to collect the user's input (the `solutions` array) and submit it to the appropriate CloudScript function (`ValidateARCPuzzle`, `ValidateTaskSolution`, etc.). The server is the **only** authority on correctness, scoring, and data updates. The client simply displays the result returned by the server.

    # The /officer folder is a total mess of UI and other files with poor names that may or may not be critical to the entire application. It is a total mess of code and should be refactored, but be careful to work with it and not break anything.

    Abstraction and Reasoning Corpus for Artificial General Intelligence v2 (ARC-AGI-2)

"ARC can be seen as a general artificial intelligence benchmark, as a program synthesis benchmark, or as a psychometric intelligence test. It is targeted at both humans and artificially intelligent systems that aim at emulating a human-like form of general fluid intelligence."

ARC-AGI-2 contains 1,000 public training tasks and 120 public evaluation tasks.

The training tasks are intended to demonstrate the task format and the Core Knowledge priors used by ARC-AGI. They can be used for training AI models. The public evaluation tasks are intended for testing AI models that have never seen these tasks before. Average human performance on these tasks in our test sample was 66%.

ARC-AGI-2 also features two private test sets not included in the repo:

A semi-private set intended for testing remotely-hosted commercial models with low leakage probability. It is calibrated to be the same human-facing difficulty as the public evaluation set.
A fully-private set intended for testing self-contained models during the ARC Prize competition, with near-zeo leakage probability. It is also calibrated to be the same difficulty.
This multi-tiered structure allows for both open research and a secure, high-stakes competition.

Task success criterion
A test-taker is said to solve a task when, upon seeing the task for the first time, they are able to produce the correct output grid for all test inputs in the task (this includes picking the dimensions of the output grid). For each test input, the test-taker is allowed 2 trials (this holds for all test-takers, either humans or AI).

Task file format
The data directory contains two subdirectories:

data/training: contains the task files for training (1000 tasks). Use these to prototype your algorithm or to train your algorithm to acquire ARC-relevant cognitive priors. This set combines tasks from ARC-AGI-1 as well as new tasks.
data/evaluation: contains the task files for evaluation (120 tasks). Use these to evaluate your final algorithm. To ensure fair evaluation results, do not leak information from the evaluation set into your algorithm (e.g. by looking at the evaluation tasks yourself during development, or by repeatedly modifying an algorithm while using its evaluation score as feedback). Each task in evaluation has been solved by a minimum of 2 people (many tasks were solved by more) in 2 attempts or less in a controlled test.
The tasks are stored in JSON format. Each task JSON file contains a dictionary with two fields:

"train": demonstration input/output pairs. It is a list of "pairs" (typically 3 pairs).
"test": test input/output pairs. It is a list of "pairs" (typically 1-2 pair).
A "pair" is a dictionary with two fields:

"input": the input "grid" for the pair.
"output": the output "grid" for the pair.
A "grid" is a rectangular matrix (list of lists) of integers between 0 and 9 (inclusive). The smallest possible grid size is 1x1 and the largest is 30x30.

When looking at a task, a test-taker has access to inputs & outputs of the demonstration pairs, plus the input(s) of the test pair(s). The goal is to construct the output grid(s) corresponding to the test input grid(s), using 3 trials for each test input. "Constructing the output grid" involves picking the height and width of the output grid, then filling each cell in the grid with a symbol (integer between 0 and 9, which are visualized as colors). Only exact solutions (all cells match the expected answer) can be said to be correct.