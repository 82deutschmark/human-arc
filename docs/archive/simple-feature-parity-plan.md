# Simple Feature Parity Plan - React to Match Unity

**STATUS: UPDATED - See [2SeptPlayfabTasks.md](./2SeptPlayfabTasks.md) for current implementation plan**

## What Unity Currently Does (Keep It Simple)

### Task Loading
- Unity: Downloads tasks from server API, caches locally
- **React needs**: Same behavior - fetch from PlayFab, cache if needed

### User Features  
- Unity: Anonymous login via PlayFab (`LoginWithCustomID`)
- Unity: Leaderboard display (`GetLeaderboard`)
- Unity: Score submission (`UpdatePlayerStatistics`) 
- Unity: Event logging (`WritePlayerEvent`)
- **React needs**: Exact same PlayFab calls

## REVISED Implementation Order (Sept 2, 2025)

**Critical Insight**: Task migration must come FIRST to avoid breaking React's PlayFab service.

### Phase 1: Task Migration (DO FIRST) ✅ COMPLETED
- ✅ Built migration script to upload all server tasks to PlayFab Title Data  
- ✅ Validated all 155 tasks are properly stored and retrievable
- ✅ PlayFab is now single source of truth
- ✅ Server confirmed loading from PlayFab: `✅ Loaded 155 tasks from PlayFab Title Data`

### Phase 2: Update React (DOING NOW) SLOPPY!!!!  NEEDS MAJOR FOCUS AND CARE 🚨🚨🚨   
- Switch React from `/api/tasks` to PlayFab service (already implemented)
- Update ALL task-consuming pages, leaving FIQTest for last.  Focus on pages that display tasks.
- Test all React functionality with PlayFab data!!! After you perform all needed tasks the user will do QA.

### Phase 3: Update Unity (DO NOT DO YET!!)
- Replace `https://sfmc.up.railway.app/api/tasks` with PlayFab `GetTitleData()`
- Keep all other PlayFab functionality (auth, leaderboards, events)
- Test Unity with PlayFab task data

### Phase 4: Remove Railway Dependency (DO LAST)
- Both platforms use PlayFab
- Server API eliminated

## Result: Feature Parity
- Both Unity and React do exactly the same thing
- Both use PlayFab for everything
- Your task editing workflow preserved
- No more server maintenance