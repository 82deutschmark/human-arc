### How We Save `humanPerformanceData`
### Author: Gemini 2.5 Pro
### Date: 2025-09-12 2:06 PM




You're right to focus on the specifics of `humanPerformanceData` and how it connects to the detailed event tracking in PlayFab. It's the core of our performance analysis.

Let me break down exactly how we save and recall this data, and how it relates to metrics like action count and time taken.

### How We Save `humanPerformanceData`

The entire saving process is handled securely on the server-side by our **`ValidateARCPuzzle` CloudScript function** in PlayFab. This is crucial because it prevents players from manipulating their own performance data.

Here’s the step-by-step process that happens when you solve a puzzle:

1.  **Client-Side Trigger**: Your browser sends the puzzle solution to PlayFab, calling the `ValidateARCPuzzle` function. It also sends along important context like `timeElapsed`, `sessionId`, and `attemptId`.

2.  **Server-Side Validation**: The CloudScript validates your solution against the correct answer stored in PlayFab's Title Data.

3.  **Data Aggregation**: If the solution is correct, the CloudScript function gathers key performance metrics for that specific attempt. This includes:
    *   `puzzleId`: The ID of the puzzle you just solved.
    *   `correct`: A boolean `true`.
    *   `scoreData`: An object containing the `finalScore`, `timeBonus`, and `basePoints`.
    *   `newTotalPoints`: Your updated total score after this puzzle.
    *   `timestamp`: The server time when the puzzle was solved.

4.  **Update `humanPerformanceData`**: This is the key step. The CloudScript:
    *   **Fetches** the existing `humanPerformanceData` string for your player profile.
    *   **Parses** this string into a JSON array. If it doesn't exist, it creates a new empty array.
    *   **Appends** the new performance record (from step 3) to this array.
    *   **Stringifies** the updated array back into a JSON string.
    *   **Saves** this new string back to your player profile under the `humanPerformanceData` key.

This "read-modify-write" cycle ensures we maintain a running history of every puzzle you've successfully completed.

### How We Recall `humanPerformanceData`

The recalling process happens on the client-side, primarily within the [AssessmentInterface](cci:1://file:///d:/1Projects/sfmc/client/src/components/assessment/AssessmentInterface.tsx:24:0-264:1).

1.  **API Call**: When the assessment page loads, the [checkCompletedPuzzles](cci:1://file:///d:/1Projects/sfmc/client/src/components/assessment/AssessmentInterface.tsx:86:2-108:4) function calls our `playFabUserData.getPlayerData()` service.

2.  **Data Retrieval**: This service makes a `GetUserData` API call to PlayFab and specifically requests the `humanPerformanceData` key.

3.  **Client-Side Processing**: The component receives the raw JSON string. It then:
    *   **Parses** the string back into a JavaScript array of performance records.
    *   **Maps** over this array to extract just the `puzzleId` from each record.
    *   **Creates a `Set`** of these IDs (`completedPuzzles`).

This `Set` is then used to determine your progress, check if you've completed the assessment, and prevent you from having to re-solve puzzles you've already finished.

### Answering Your Question About Actions and Time

This is an excellent point and highlights the distinction between our two main data stores:

*   **`humanPerformanceData` stores the *outcome***. It records the final score, which is influenced by the time taken (via the `timeBonus`). It's a summary of a successful attempt.

*   **PlayFab Events store the *process***. This is where we track the granular details. Our `player_action` events log every single interaction with the grid. The `deltaMs` property on these events tells us the precise time between each action.

So, to get the **total time taken** and the **total number of actions**, we would query the PlayFab event stream for a specific `sessionId` and `puzzleId`. We can then aggregate this data to get the exact metrics you're asking about.

In short: `humanPerformanceData` tells us *what* you accomplished, while the event stream tells us *how* you accomplished it.