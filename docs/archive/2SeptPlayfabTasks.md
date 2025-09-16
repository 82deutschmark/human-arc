# PlayFab Tasks Migration Plan
*Date: September 2, 2025*
*Goal: Make PlayFab the Single Source of Truth for Tasks*

## Overview

Currently Unity and React both use different task sources:
- Unity: `https://sfmc.up.railway.app/api/tasks`
- React: Mixed (server API + incomplete PlayFab service)
- Goal: Both platforms use PlayFab Title Data as single source

## Architecture After Migration

```
PlayFab Title Data (Single Source of Truth)
    ↓
    ├── Unity → GetTitleData() → Tasks
    └── React → playFabService.getAllTasks() → Tasks
```

## Implementation Phases

### Phase 1: Task Migration ✅
**Objective**: Upload all current server tasks to PlayFab Title Data

1. **Build migration script** 
   - Read all tasks from current server storage
   - Format for PlayFab Title Data structure
   - Upload via PlayFab Admin API details are in .env as PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY

2. **Validate migration**
   - Test PlayFab GetTitleData() returns all tasks  (Worked in testing!)
   - Verify task format matches schema expectations
   - Confirm 155+ tasks are properly stored

3. **Test data integrity**
   - Compare server vs PlayFab task data
   - Validate JSON structure and required fields
   - Ensure emoji sets and examples are preserved

### Phase 2: Update React ✅
**Objective**: Switch React from server API to PlayFab service  (Needs to be audited for completeness)

1. **Update task loading components**
   - Replace `fetch('/api/tasks')` with `playFabService.getAllTasks()`
   - Update FIQTest and other task-consuming pages
   - Handle PlayFab authentication requirements

2. **Fix type compatibility**
   - Resolve differences between PlayFabTask and shared Task types
   - Add type conversion if needed
   - Ensure proper error handling

3. **Test React functionality**
   - Verify all task pages load from PlayFab
   - Test task filtering and selection
   - Confirm interactive grids work with PlayFab data


### Phase 4: Clean Up (Future)
**Objective**: Remove server dependency completely

1. **Remove server components**
   - Eliminate `/api/tasks` endpoint
   - Clean up unused server infrastructure
   - Update deployment configs

2. **Finalize architecture**
   - Both platforms using identical PlayFab data
   - Single source of truth achieved
   - Simplified maintenance and updates

## Success Criteria

- ✅ All tasks available in PlayFab Title Data
- ✅ React loads tasks from PlayFab successfully  
- ✅ Task functionality works identically to server version
- ⏳ Unity switches to PlayFab (future phase)
- ⏳ Server API removed (future phase)

## Implementation Notes

- Maintain backward compatibility during transition
- Ensure zero downtime for users
- Validate data integrity at each step
- Test all task-related functionality after each phase

## Migration Script Requirements

The migration script should:
1. Connect to current server storage system
2. Extract all task data in current format
3. Transform to PlayFab Title Data structure
4. Upload to PlayFab using Admin API
5. Verify successful upload and data integrity

This has all been completed successfully.  Please audit.