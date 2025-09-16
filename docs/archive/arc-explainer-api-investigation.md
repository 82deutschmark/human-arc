# Arc-Explainer API Investigation Results

**Date:** September 5, 2025  
**Investigation of:** D:\1Projects\arc-explainer actual API endpoints and data structures

## Complete Arc-Explainer API Endpoints

### Core Puzzle Management
- **`GET /api/puzzle/list`** - List all available puzzles
- **`GET /api/puzzle/overview`** - Get puzzle overview
- **`GET /api/puzzle/task/:taskId`** - Get specific puzzle by ID ✅ **USEFUL FOR DIRECT SEARCH**
- **`POST /api/puzzle/analyze/:taskId/:model`** - Analyze a puzzle with a specific model
- **`GET /api/puzzle/:puzzleId/has-explanation`** - Check if a puzzle has an explanation
- **`POST /api/puzzle/reinitialize`** - Force reinitialize puzzle loader (debug)

### Statistics & Analytics
- **`GET /api/puzzle/accuracy-stats`** - Get accuracy statistics (includes trustworthiness data)
- **`GET /api/puzzle/general-stats`** - Get general model statistics
- **`GET /api/puzzle/raw-stats`** - Get raw database statistics
- **`GET /api/puzzle/performance-stats`** - Get trustworthiness statistics ✅ **BETTER FOR DIFFICULTY STATS**
- **`GET /api/puzzle/confidence-stats`** - Get confidence analysis statistics
- **`GET /api/puzzle/worst-performing`** - Get worst performing puzzles ✅ **CURRENTLY USED**
  - **Parameters:** `limit`, `sortBy`, `minAccuracy`, `maxAccuracy`, `zeroAccuracyOnly`
  - **Max limit:** 50 (server-validated)

### Prompts
- **`POST /api/prompt/preview/:provider/:taskId`** - Preview prompt for a specific provider
- **`GET /api/prompts`** - Get all prompt templates
- **`POST /api/prompt-preview`** - Generate a preview of a prompt

### Explanations
- **`GET /api/puzzle/:puzzleId/explanations`** - Get all explanations for a puzzle
- **`GET /api/puzzle/:puzzleId/explanation`** - Get a specific explanation
- **`POST /api/puzzle/save-explained/:puzzleId`** - Save a new explanation

### Feedback & Solutions
- **`POST /api/feedback`** - Submit feedback
- **`GET /api/explanation/:explanationId/feedback`** - Get feedback for an explanation
- **`GET /api/puzzle/:puzzleId/feedback`** - Get feedback for a puzzle
- **`GET /api/feedback`** - Get all feedback
- **`GET /api/feedback/stats`** - Get feedback statistics ✅ **POTENTIAL ENHANCEMENT**
- **`GET /api/puzzles/:puzzleId/solutions`** - Get solutions for a puzzle
- **`POST /api/puzzles/:puzzleId/solutions`** - Submit a new solution
- **`POST /api/solutions/:solutionId/vote`** - Vote on a solution
- **`GET /api/solutions/:solutionId/votes`** - Get votes for a solution

### Saturn Analysis
- **`POST /api/saturn/analyze/:taskId`** - Analyze a task using Saturn
- **`POST /api/saturn/analyze-with-reasoning/:taskId`** - Analyze with detailed reasoning
- **`GET /api/saturn/status/:sessionId`** - Get status of a Saturn analysis

### Batch Processing
- **`POST /api/model/batch-analyze`** - Start a batch analysis
- **`GET /api/model/batch-status/:sessionId`** - Get status of a batch job
- **`POST /api/model/batch-control/:sessionId`** - Control a batch job (pause/resume/stop)
- **`GET /api/model/batch-results/:sessionId`** - Get results of a batch job
- **`GET /api/model/batch-sessions`** - Get all batch sessions

### Admin & Maintenance
- **`GET /api/admin/recovery-stats`** - Get recovery statistics
- **`POST /api/admin/recover-multiple-predictions`** - Recover multiple predictions data
- **`GET /api/health/database`** - Check database health

### Models
- **`GET /api/models`** - Get available AI models
- **`GET /api/models/:provider`** - Get models for a specific provider
### NEW
our list is missing the following endpoints that exist in the codebase:

GET /api/puzzles/stats: Gets performance metrics for all puzzles, used by the Puzzle DB Viewer.
GET /api/feedback/accuracy-stats: A dedicated route to get accuracy stats from the feedback controller.
GET /api/metrics/reliability: Retrieves model reliability statistics.
GET /api/metrics/comprehensive-dashboard: Gets data for a comprehensive analytics dashboard.
GET /api/models/:modelKey: Retrieves the configuration for a single, specific model by its key.
Minor Inaccuracies & Nuances:
GET /api/models/:provider: The correct path is GET /api/models/provider/:provider. The /provider/ segment is static.



## Currently Used vs Available Opportunities

### Currently Used:
- `/api/puzzle/worst-performing` - For both statistics and filtering data

## Key Findings vs My Assumptions

### ✅ What I Got Right
1. **Endpoint exists:** `/api/puzzle/worst-performing` works exactly as I coded it
2. **Parameter support:** `zeroAccuracyOnly`, `minAccuracy`, `maxAccuracy` all supported
3. **Response structure:** Matches what I implemented in `arcExplainerAPI.ts`

### ❌ What I Got Wrong
1. **Arbitrary limits:** Server enforces max limit of 50, not 1000 like I assumed
2. **No unlimited access:** Can't fetch all puzzles at once - server validates and limits
3. **Response format:** Data is nested under `performanceData` property, which I handle correctly

### 🔍 Critical Discovery
The `/api/puzzle/worst-performing` endpoint **ALREADY SUPPORTS** all the filtering I need:
- `zeroAccuracyOnly=true` - for impossible puzzles  
- `minAccuracy` and `maxAccuracy` - for accuracy ranges
- `sortBy` options - for different sorting strategies
- `limit` - with server-side validation (max 50)

## Root Cause of the Filtering Problem

**The issue is NOT the API** - the API works perfectly. 

**The issue is in my SFMC implementation:**

1. **Inconsistent data sources**: Statistics use one dataset, filtering uses another
2. **Arbitrary local limits**: Loading only 50 PlayFab puzzles but showing stats from different data
3. **Poor ID matching**: Not properly connecting PlayFab puzzle IDs to arc-explainer performance data

## What This Means for the Fix

### Good News
- The arc-explainer API already supports everything we need
- No need to modify or add API endpoints
- The filtering parameters work exactly as designed

### The Real Fix Required
1. **Load more PlayFab puzzles** or make multiple API calls to get broader dataset
2. **Properly match IDs** between PlayFab format (ARC-TR-007bbfb7) and arc-explainer format (007bbfb7) 
3. **Use consistent data sources** for both statistics display and filtering
4. **Remove arbitrary limits** that don't match what's actually available

### Recommended Architecture Change
Instead of:
- Load 50 PlayFab puzzles → Try to match with arc-explainer data

Do this:
- Call arc-explainer API with desired filters → Get performance data → Match to PlayFab puzzles
- This way the statistics and filtering use the same source of truth

## Next Steps

1. **Fix ID matching service** - ensure bidirectional conversion works
2. **Create unified data service** - merge arc-explainer results with PlayFab puzzle content  
3. **Remove arbitrary limits** - use proper pagination instead
4. **Test with actual API calls** - verify the integration works end-to-end

The arc-explainer API is solid. The problem is entirely in how I integrated it with the SFMC PlayFab data.

### Update: September 10, 2025

This is done.  The ID matching service now properly converts between ARC-TR-007bbfb7 and 007bbfb7 in most cases except for validation on PlayFab side.  We need to investigate what is going on.  We know how PlayFab stores the IDs and know they exist.