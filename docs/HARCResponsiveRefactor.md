# Refactoring Guide: ResponsivePuzzleSolver.tsx

**Author:** Cascade using Gemini 2.5 Pro
**Date:** 2025-09-17

## 1. Introduction & Goal

This document provides a high-level software engineering guide for refactoring the `ResponsivePuzzleSolver.tsx` component. 

**Primary Goal:** Improve the long-term maintainability, readability, and testability of the component by resolving its architectural issues. 

**Critical Constraint:** The current User Interface (UI) and User Experience (UX) are functioning well and should **NOT** be changed. This is a purely internal, architectural refactor. The component should look and behave identically to the user after the refactor is complete.

## 2. The Core Problem: A "God Component" Violating SRP

The `ResponsivePuzzleSolver.tsx` component is a classic example of a **"God Component"**. This is an anti-pattern where a single component knows too much and does too much.

This directly violates the **Single Responsibility Principle (SRP)**. In simple terms, SRP states that a component should have only one reason to change. `ResponsivePuzzleSolver` has many reasons to change:

-   **UI Display Logic:** It renders the entire puzzle interface, including training examples, test cases, and the solution grid.
-   **Complex State Management:** It manages dozens of `useState` hooks for everything from grid dimensions and solutions to display modes and session data.
-   **Event Handling:** It contains the logic for nearly every user interaction, from painting on the grid to submitting a solution.
-   **Data Orchestration:** It fetches and processes data from various sources to display hints, check answers, and log events.

This makes the component brittle, difficult to debug, and intimidating for new developers to work on.

## 3. The Refactoring Strategy: Divide and Conquer

The safest way to approach this is incrementally. Do not try to rewrite the entire component at once. The strategy is to carefully separate concerns into smaller, more focused pieces.

### Step 1: Extract Logic into Custom Hooks

The first and most important step is to untangle the business logic from the UI rendering. Custom hooks are the perfect tool for this.

Create a new directory: `src/hooks/puzzle-solver/`. Inside, create hooks to manage related pieces of state and logic. For example:

-   `usePuzzleState.ts`: Manages the core state of the puzzle, including `solutions`, `outputDimensions`, and `currentTestIndex`. It would expose functions like `updateCurrentSolution` and `changeGridSize`.
-   `useSolutionValidation.ts`: Handles the logic for submitting a solution, calling the `arcExplainerClient`, and managing the `isSubmitting` and `isCorrect` states.
-   `useDisplayMode.ts`: Manages the state related to `displayMode`, `emojiSet`, and `selectedValue`.
-   `useSessionLogger.ts`: Encapsulates all the logic for logging player actions to PlayFab.

By moving logic into these hooks, the main component becomes much simpler. It will call these hooks and receive the state and functions it needs, without needing to know the implementation details.

### Step 2: Decompose the UI into Smaller, Presentational Components

Once the logic is extracted, the giant JSX tree in `ResponsivePuzzleSolver.tsx` can be broken down. Identify logical sections of the UI and extract them into their own smaller components.

These new components should be "dumb" or **presentational**. They should not contain complex logic. They simply receive data as props and call functions (also passed down as props) when the user interacts with them.

Good candidates for extraction include:

-   `TrainingExamplesView.tsx`: The section that renders the training pairs.
-   `TestCasesView.tsx`: The section for navigating between multiple test cases.
-   `SolutionWorkspace.tsx`: The main area containing the output grid and the puzzle tools.

After this step, `ResponsivePuzzleSolver.tsx` will be a much smaller **container component**. Its primary job will be to call the custom hooks and pass the state and functions down to the smaller presentational components.

## 4. Where to Find Key Information

-   **Data Types:** All core data structures are defined in `src/types/`. Refer to `arcTypes.ts` and `puzzleDisplayTypes.ts` frequently.
-   **Backend Services:** All communication with the backend (PlayFab, arc-explainer) is handled by services in `src/services/`. You should not need to change these, but you will need to call them from your new custom hooks.
-   **Component's Public API:** The props that `ResponsivePuzzleSolver.tsx` currently accepts (`puzzle`, `onBack`, `tutorialMode`) are its public contract. The refactored component must continue to accept these props to avoid breaking the parts of the application that use it (like `TutorialPuzzleWrapper.tsx`).

## 5. Final Advice

-   **Commit Incrementally:** After you successfully extract a single hook or component, commit your work. This gives you safe checkpoints to return to if something goes wrong.
-   **Test Constantly:** After every small change, run the application and test the UI thoroughly. Make sure everything still works as expected.
-   **Be Patient:** Refactoring a complex component is like surgery. It requires care, precision, and patience. The goal is to leave it healthier than you found it.
