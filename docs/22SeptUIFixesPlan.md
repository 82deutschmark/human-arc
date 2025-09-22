# UI Refactoring Plan for Puzzle Solver: 22 Sept 2025

**Authored by:** Cascade using gpt-4-turbo
**Date:** 2025-09-22T00:28:00-04:00

## 1. Overview

This document outlines a plan to refactor the UI for the puzzle-solving page (`/puzzles/solve/:puzzleId`). The current implementation suffers from significant layout issues on smaller screen sizes and relies heavily on hardcoded colors instead of the established design token system. This plan provides a clear, step-by-step guide for Claude to address these problems, improving the user experience and maintainability of the codebase.

## 2. Problem Analysis

The root of the layout problem lies within the `SolutionWorkspace.tsx` component (`d:\1Projects\sfmc\client\src\components\harc-solver\SolutionWorkspace.tsx`).

### 2.1. Unresponsive Layout

The main container in `SolutionWorkspace.tsx` uses the following Tailwind CSS classes:

```html
<div class="flex flex-col lg:flex-row gap-4 w-full">
```

This forces the three main sections (Test Input, Central Controls, and Your Solution) into a horizontal row on screens wider than the `lg` breakpoint (1024px). On smaller screens, these elements do not wrap, causing the container to overflow the viewport and requiring the user to zoom out to an unusable level.

### 2.2. Hardcoded Colors

The component uses numerous hardcoded colors, such as `bg-yellow-600`, `text-amber-400`, and `text-white`. This is inconsistent with the project's theming strategy, which uses a semantic color system defined in `tailwind.config.ts`.

## 3. Refactoring Plan

Claude, your task is to implement the following changes. Please follow the steps carefully.

### Task 1: Make the `SolutionWorkspace` Layout Responsive

**File to Edit:** `d:\1Projects\sfmc\client\src\components\harc-solver\SolutionWorkspace.tsx`

**Objective:** Modify the main container to wrap its children on smaller screens, creating a responsive, mobile-first layout.

1.  **Locate the Container:** Find the `div` on or around line 174.

2.  **Modify the Classes:** Change the `flex` classes to ensure the layout is a column on small screens and a row on large screens. The `flex-wrap` utility will be crucial here.

    *   **Current:** `flex flex-col lg:flex-row gap-4 w-full`
    *   **Proposed:** `flex flex-col lg:flex-row lg:flex-wrap gap-4 w-full`

    This change will cause the flex items to wrap to the next line when they run out of space on medium-sized screens, and stack vertically on small screens.

### Task 2: Replace Hardcoded Colors with Design Tokens

**File to Edit:** `d:\1Projects\sfmc\client\src\components\harc-solver\SolutionWorkspace.tsx`

**Objective:** Replace all hardcoded colors with their semantic equivalents from the `tailwind.config.ts` theme. This will make the component theme-aware and improve consistency.

**Reference:** The available semantic colors are `primary`, `secondary`, `accent`, `destructive`, `background`, `foreground`, `card`, `popover`, `muted`, `border`, `input`, and `ring`.

**Instructions:**

1.  **Analyze the Component:** Go through `SolutionWorkspace.tsx` and identify all instances of hardcoded colors (e.g., `bg-amber-600`, `text-slate-400`, `ring-amber-400`).

2.  **Replace with Tokens:** Replace each hardcoded color with the appropriate semantic token. Use your judgment to select the best token for each use case. For example:

    *   `text-amber-400` (a primary action color) should become `text-primary`.
    *   `bg-card` is already used correctly in some places, but ensure all card-like containers use it.
    *   `text-slate-400` (muted or secondary text) should become `text-muted-foreground`.
    *   The submit button's colors (`bg-yellow-600`, `bg-amber-600`) should be replaced with a single class like `bg-primary` or `bg-accent`, and its hover state should be `hover:bg-primary/90` or `hover:bg-accent/90`.

**Example (Submit Button):**

*   **Current (lines 153-157):**
    ```jsx
    <Button
      className={`px-6 py-4 text-xl font-bold rounded-lg transition-all duration-300 ${
        attemptsRemaining === 1
          ? 'bg-yellow-600 hover:bg-yellow-700'
          : 'bg-amber-600 hover:bg-amber-700'
      } text-white ring-2 ring-amber-400 shadow-lg shadow-amber-400/30 animate-pulse [animation-duration:4s]`}
    >
    ```

*   **Proposed:**
    ```jsx
    <Button
      variant={attemptsRemaining === 1 ? 'destructive' : 'default'}
      className="px-6 py-4 text-xl font-bold rounded-lg transition-all duration-300 animate-pulse [animation-duration:4s] shadow-lg shadow-primary/30"
    >
    ```
    *(Note: This assumes you have appropriate variants defined for your Button component. If not, use classes like `bg-primary`, `hover:bg-primary/90`, `bg-destructive`, `hover:bg-destructive/90`)*

## 4. Verification

After implementing these changes, please verify the following:

1.  **Layout:** The puzzle solver page should be fully usable on small screens. The main sections should stack vertically without causing horizontal overflow.
2.  **Theming:** The component should correctly reflect the application's theme. No hardcoded colors should remain in `SolutionWorkspace.tsx`.

By completing this plan, you will have significantly improved the responsiveness and maintainability of this critical user interface.
