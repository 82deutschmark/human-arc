# Arc-Explainer API Guide

**Author**: Claude Code using Sonnet 4
**Date**: 2025-09-16
**Purpose**: Developer guide for integrating with arc-explainer API endpoints

> **Note**: This document provides implementation details for arc-explainer API integration. For comprehensive integration patterns, see [arc-explainer-integration.md](./arc-explainer-integration.md).

## API Endpoint Analysis

There are important nuances in how the metrics are calculated. This guide breaks down each endpoint's implementation and potential areas of confusion.

### 1. `GET /api/puzzle/accuracy-stats` & `GET /api/puzzle/general-stats`

Both of these API endpoints are powered by the same function: [getGeneralModelStats()](cci:1://file:///d:/1Projects/arc-explainer/server/repositories/MetricsRepository.ts:134:2-262:3). This is a major source of confusion. The function calculates a wide array of stats and then formats them into two different lists (`accuracyByModel` and `modelAccuracy`), which have different data and purposes.

Here is the step-by-step breakdown of [getGeneralModelStats()](cci:1://file:///d:/1Projects/arc-explainer/server/repositories/MetricsRepository.ts:134:2-262:3):

**Step 1: The `basicStats` Query (Lines 171-179)**

This query gets the high-level totals for the entire `explanations` table.

-   `COUNT(*) as total_explanations`: Counts every single row in the table.
-   `AVG(confidence) as avg_confidence`: Calculates the average confidence across all entries that have one.
-   `COUNT(...) as total_solver_attempts`: **This is specific.** It only counts rows where a prediction was actually made (`predicted_output_grid` or `multi_test_prediction_grids` is not null). This correctly isolates solver attempts from mere explanations.
-   `SUM(...) as total_correct_predictions`: This sums up the `1`s for every time `is_prediction_correct` or `multi_test_all_correct` is true. This is the total number of correctly solved puzzles.

**Step 2: The `modelStats` Query (Lines 182-211)**

This is the main query that aggregates data for each model (`GROUP BY e.model_name`).

-   `COUNT(e.id) as total_attempts`: **Potential Mistake/Confusion**: This is named `total_attempts` but it counts *every single entry* for a model, including those that were not solver attempts. It's more like "total interactions".
-   `solver_attempts`: This correctly counts only the prediction attempts for each model, same logic as the `basicStats` query.
-   `correct_predictions`: This correctly sums the correct predictions for each model.
-   `avg_trustworthiness_score`: This is the average of the `prediction_accuracy_score` column. This is the "trustworthiness" metric, which is separate from pure accuracy.
-   `solver_accuracy_percentage`: **This is the pure accuracy calculation.** It correctly divides the number of `correct_predictions` by the number of `solver_attempts`. This logic is sound.
-   `ORDER BY solver_accuracy_percentage DESC`: The entire result set is ordered by the pure accuracy of the models.

**Step 3: The Final JSON Response (Lines 215-258)**

The function returns a JSON object with two key arrays, and this is where the confusion is solidified:

1.  `accuracyByModel` (Lines 220-241):
    *   **What it is**: This is a rich object containing *all* calculated stats for each model, including `avgTrustworthiness`, `minTrustworthiness`, `maxTrustworthiness`, and the pure `accuracyPercentage`.
    *   **Analysis**: Despite its name, this is the most comprehensive list. It's not just "accuracy"; it's a full performance profile. The name is misleading. It should probably be called `modelPerformanceProfile`.

2.  `modelAccuracy` (Lines 242-257):
    *   **What it is**: This is a stripped-down version of the same data. It includes the `accuracyPercentage` but explicitly sets all trustworthiness fields (`avgTrustworthiness`, etc.) to `0`.
    *   **Analysis/Mistake**: This seems to be for a legacy purpose or a UI component that only needed pure accuracy. Creating a second, nearly identical array with zeroed-out data is inefficient and confusing. It's redundant. The `accuracyByModel` list already contains the pure accuracy, so this second list is unnecessary.

**Conclusion for these endpoints:** The underlying calculations for *pure accuracy* are correct. The "mistake" is in the confusing naming (`total_attempts`, `accuracyByModel`) and the redundant `modelAccuracy` array, which makes the API difficult to use correctly without this deep-dive.

### 2. `GET /api/puzzle/raw-stats`

This endpoint is powered by the [getRawDatabaseStats()](cci:1://file:///d:/1Projects/arc-explainer/server/repositories/MetricsRepository.ts:264:2-340:3) function (Lines 280-341). Its purpose is purely for monitoring infrastructure health and costs.

**Step 1: The SQL Query (Lines 301-318)**

This is a single query that calculates aggregate functions over the entire `explanations` table.

-   `AVG(api_processing_time_ms)`: Average time for the API to respond.
-   `AVG(prediction_accuracy_score) as avg_prediction_accuracy`: **Critical Point of Confusion**: As the comments state, this is the average of the *trustworthiness* score, NOT the prediction accuracy. The column name `avg_prediction_accuracy` is highly misleading.
-   `SUM(total_tokens)`, `AVG(total_tokens)`, `MAX(total_tokens)`: Standard token usage metrics.
-   `SUM(estimated_cost)`, `AVG(estimated_cost)`, `MAX(estimated_cost)`: Standard cost metrics.
-   `COUNT(...) FILTER (WHERE ...)`: These are useful. They count how many rows actually have data for tokens, cost, accuracy, and processing time, which helps assess data completeness.

**Step 2: The Final JSON Response (Lines 321-336)**

This part simply takes the raw results from the query, parses them into the correct number types, and returns them. The logic here is straightforward.

**Conclusion for this endpoint:** The calculations are correct for what they are measuring. The only significant "mistake" is the dangerously misleading alias `avg_prediction_accuracy` for the trustworthiness score.

### 3. `GET /api/puzzle/performance-stats` & `GET /api/puzzle/confidence-stats`

As I noted before, these endpoints are **not** handled by [MetricsRepository.ts](cci:7://file:///d:/1Projects/arc-explainer/server/repositories/MetricsRepository.ts:0:0-0:0). They are handled by `TrustworthinessRepository.ts`. This separation of concerns is actually good practice. The [MetricsRepository](cci:2://file:///d:/1Projects/arc-explainer/server/repositories/MetricsRepository.ts:121:0-478:1) is for broad, mixed analytics, while the `TrustworthinessRepository` is specialized. The logic for these endpoints would be in that file, which focuses exclusively on analyzing the `prediction_accuracy_score` and `confidence` columns.

### 4. `GET /api/puzzle/worst-performing`

This is also not handled by [MetricsRepository.ts](cci:7://file:///d:/1Projects/arc-explainer/server/repositories/MetricsRepository.ts:0:0-0:0). It would be in `PuzzleRepository.ts` and would likely query for puzzles that have the lowest average `accuracyPercentage` across all models or the highest number of `helpful` votes on feedback entries that are marked as incorrect.

I hope this detailed, code-level breakdown clarifies exactly how these statistics are generated and confirms your suspicion that while the underlying math is mostly sound, the naming and structure are confusing and potentially misleading.