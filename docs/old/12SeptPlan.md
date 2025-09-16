Understood. Here is the complete plan, ready to be saved as `docs/12SeptHARC.md`.

Since I'm operating in chat mode, I can't create or modify files on your system directly. You will need to create this file and paste the content below. If you would prefer me to handle file operations like this automatically in the future, we can switch to 'write mode'.

Let me know once you have created the file, and I will proceed with the first implementation step from the plan.

***

# Project Pivot: The HARC Platform

**Date**: September 12, 2025
**Status**: Strategic Plan for Reworking Existing Assets

## 1. Executive Summary

This document outlines a strategic pivot for the project, reframing it from a themed game into a serious **Human Abstract Reasoning Corpus (HARC) Platform**. This new direction directly addresses the goal of creating a sophisticated blend of an LLM benchmark, a personal cognitive assessment (like an IQ test), and a tool for users to discover their unique cognitive edge over AI.

This plan is not a rewrite; it is a **rework**. It leverages the project's deep, existing assets—including the mature PlayFab backend, the rich `arc-explainer` dataset, and the detailed scoring plans—to create a platform of significant value for both individual users and the broader research community.

The core mission is to build the definitive platform for collecting, analyzing, and presenting high-quality data on human performance against the ARC-AGI benchmark, providing a direct and quantitative answer to the question: "How do my reasoning abilities compare to those of a large language model?"

## 2. Leveraging Existing Assets

This plan is built upon the comprehensive work already completed. The following assets are critical and will be repurposed, not replaced.

| Existing Asset | Documentation | New Role in HARC Platform |
| :--- | :--- | :--- |
| **PlayFab Backend** | [playfab-api-analysis.md](cci:7://file:///d:/1Projects/sfmc/docs/playfab-api-analysis.md:0:0-0:0), [playfab-discovery-results.md](cci:7://file:///d:/1Projects/sfmc/docs/playfab-discovery-results.md:0:0-0:0) | **Secure Data Repository**: The backend for the HARC dataset. It will store detailed, server-validated human performance metrics. |
| **ARC Puzzle Scoring Logic** | [7SeptArcPointsPlan.md](cci:7://file:///d:/1Projects/sfmc/docs/7SeptArcPointsPlan.md:0:0-0:0) | **Cognitive Performance Metric**: The scoring formulas will be implemented to generate a "Cognitive Performance Score" (CPS), which forms the core of our human benchmark data. |
| **`arc-explainer` API Data** | [arc-explainer-api-investigation.md](cci:7://file:///d:/1Projects/sfmc/docs/arc-explainer-api-investigation.md:0:0-0:0), [api-guide.md](cci:7://file:///d:/1Projects/sfmc/docs/api-guide.md:0:0-0:0) | **AI Benchmark Dataset**: The authoritative source for AI performance, providing the direct comparison point for human participants. |
| **CloudScript Functions** | [cloudscript.js](cci:7://file:///d:/1Projects/sfmc/cloudscript.js:0:0-0:0), [7SeptArcPointsPlan.md](cci:7://file:///d:/1Projects/sfmc/docs/7SeptArcPointsPlan.md:0:0-0:0) | **Data Ingestion Endpoints**: [ValidateARCPuzzle](cci:1://file:///d:/1Projects/sfmc/cloudscript.js:364:0-375:2) and the proposed [ValidateARC2EvalPuzzle](cci:1://file:///d:/1Projects/sfmc/cloudscript.js:404:0-415:2) will be enhanced to serve as the secure endpoints for ingesting detailed human performance data. |
| **React Components** | `ResponsiveOfficerGrid.tsx`, `ResponsivePuzzleSolver.tsx` | **Assessment & Training Tools**: The solver becomes the core "Assessment Tool," and the grid becomes the "Training Center" where users can select puzzle sets. |

## 3. The HARC Endpoint: A New Conceptual Framework

The central proposal of this plan is the creation of the **HARC Endpoint**. This is not a literal API endpoint, but a new, user-facing application that serves two primary functions:

1.  **Data Collection**: It serves as the front door for human participants to contribute to the Human Abstract Reasoning Corpus (HARC).
2.  **Data Presentation**: It provides participants with a personalized, analytical dashboard comparing their performance data directly against the AI benchmark data.

## 4. Reworking the Scoring System for Benchmarking

The high-score system detailed in [7SeptArcPointsPlan.md](cci:7://file:///d:/1Projects/sfmc/docs/7SeptArcPointsPlan.md:0:0-0:0) is an excellent foundation. We will rework it to serve our new, data-centric purpose.

*   **From Points to Metrics**: The concept of "points" will be reframed as a **Cognitive Performance Score (CPS)**. This score is a valuable metric, not just a game mechanic.
*   **Detailed Data Capture**: The CloudScript functions ([ValidateARCPuzzle](cci:1://file:///d:/1Projects/sfmc/cloudscript.js:364:0-375:2), [ValidateARC2EvalPuzzle](cci:1://file:///d:/1Projects/sfmc/cloudscript.js:404:0-415:2)) will be enhanced. Instead of just storing a final score, they will store the component parts of the score as distinct metrics in PlayFab User Data for each puzzle completion:
    *   `puzzleId`: The ID of the puzzle.
    *   `baseScore`: The base CPS for a correct solution.
    *   `speedBonus`: The bonus derived from completion time.
    *   `efficiencyBonus`: The bonus derived from the number of actions.
    *   `firstTryBonus`: A boolean or score for first-attempt success.
    *   `totalCPS`: The final composite score.
    *   `timestamp`: The UTC timestamp of completion.
*   **Purpose of Data**: This detailed, structured data is the core of the HARC dataset. It will allow for deep analysis of human performance, far beyond a simple leaderboard.

## 5. The New User Journey

The user is a **Participant**, not a player. The journey is one of cognitive assessment and discovery.

1.  **Introduction**: A clean, professional landing page explaining the purpose of the HARC platform and inviting users to contribute to research and discover their own cognitive profile.
2.  **The Assessment**: The user is presented with curated sets of puzzles (e.g., "The Symmetry Set," "The Logic Set"). The `ResponsivePuzzleSolver` is used to solve them.
3.  **The Participant Dashboard**: After completing a set, the user is taken to their personal dashboard. This is the core reward loop. The dashboard will feature:
    *   A summary of their performance (CPS, time, efficiency) on the puzzles they've solved.
    *   A direct, side-by-side comparison with the `arc-explainer` data for those same puzzles (e.g., "Your CPS: 11,750 vs. AI Success Rate: 0%").
    *   Insights into their cognitive strengths based on the categories of puzzles they excel at.

## 6. Implementation Plan

This is a high-level plan for executing the pivot.

1.  **CloudScript Enhancement (Backend First)**:
    *   Implement the scoring logic from [7SeptArcPointsPlan.md](cci:7://file:///d:/1Projects/sfmc/docs/7SeptArcPointsPlan.md:0:0-0:0) into the [ValidateARCPuzzle](cci:1://file:///d:/1Projects/sfmc/cloudscript.js:364:0-375:2) function in [cloudscript.js](cci:7://file:///d:/1Projects/sfmc/cloudscript.js:0:0-0:0).
    *   Create the new [ValidateARC2EvalPuzzle](cci:1://file:///d:/1Projects/sfmc/cloudscript.js:404:0-415:2) function as planned.
    *   **Crucially**, modify both functions to save the *detailed* CPS metrics (base, speed, efficiency, etc.) to PlayFab User Data, not just the total score to a statistic.

2.  **Client-Side Data Service (Data Integrity)**:
    *   Create a robust client-side service to accurately track `timeElapsed`, `stepCount`, and `attemptNumber`.
    *   This service will pass this data securely to the CloudScript functions upon puzzle completion.

3.  **Participant Dashboard UI (The Reward)**:
    *   Create a new `ParticipantDashboard.tsx` component.
    *   This component will fetch the user's detailed performance data from PlayFab and the corresponding AI benchmark data from the `arc-explainer` API.
    *   It will be responsible for rendering the rich, comparative analysis that is the core of the user experience.

4.  **UI Refactoring (The Rebrand)**:
    *   Rebrand the main application to reflect the new "HARC Platform" identity.
    *   Refactor the `ResponsiveOfficerGrid` into the "Training Center," allowing users to select puzzle sets to work on.
    *   Create a new, minimalist "Assessment" flow that guides new users through a curated set of initial puzzles to generate their first dashboard insights.