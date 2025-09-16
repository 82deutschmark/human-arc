# Unity Implementation Analysis - ACTUAL ARCHITECTURE

## Key Discovery: Unity Uses Local JSON File, NOT PlayFab for Tasks

### Task Data Storage (MainManager.cs:104-121)
```csharp
public List<TaskData> LoadTasksFromFile()
{
    string path = Path.Combine(Application.persistentDataPath, "tasks.json");
    if (File.Exists(path))
    {
        string json = File.ReadAllText(path);
        List<TaskData> taskList = JsonConvert.DeserializeObject<List<TaskData>>(json);
        return taskList;
    }
}
```
**Reality**: Unity loads tasks from local `tasks.json` file in persistent data path, NOT from PlayFab

### PlayFab Usage in Unity (ACTUAL)
PlayFab is used for:
1. **Leaderboards** (`GetLeaderboard`, `UpdatePlayerStatistics`) - Lines 267-307, 747-769
2. **Player Profiles/Avatars** (`GetPlayerProfile`) - Lines 309-330  
3. **CloudScript Functions** (`GenerateAnonymousName`) - PlayFabAnonDeviceLogin.cs:168-172
4. **User Authentication** (`LoginWithCustomID`, `LoginWithAndroidDeviceID`, etc.)
5. **User Data Storage** (`UpdateUserData`, `GetUserData`)
6. **Analytics/Logging** (PuzzleEventLogger references)

PlayFab is NOT used for:
- ❌ Task/puzzle data storage (uses local JSON file)
- ❌ Task-related CloudScript functions  
- ❌ Title Data for game content
- ❌ Game configuration data

### Server API Still Referenced (MainManager.cs:28)
```csharp
[SerializeField] string TaskUrl = "https://sfmc.up.railway.app/api/tasks";
```
**This URL exists but appears unused** - Unity loads from local JSON file instead

## React Frontend Current State

### API Calls That Need Migration
1. **`FIQTest.tsx:47`**: `fetch('/api/tasks')` → Load from local JSON file
2. **`MissionControl.tsx:47,57,70,85,99`**: Various `/api` calls → Replace with local data + PlayFab for user progress

### Correct Migration Strategy

#### Phase 1: Local JSON Task Loading
- Move all ~95 JSON task files from `server/data/tasks/` to `public/data/tasks.json` (consolidated)  
- Replace `fetch('/api/tasks')` with `fetch('/data/tasks.json')`
- No PlayFab CloudScript needed for task data

#### Phase 2: PlayFab Integration (User Progress Only)
- **Authentication**: `LoginWithCustomID` for user sessions
- **User Progress**: `UpdateUserData` for task completion, attempts, scores
- **Leaderboards**: `UpdatePlayerStatistics` for global rankings  
- **Player Profiles**: `GetPlayerProfile` for user info

#### Phase 3: Remove Server
- Remove Express server completely
- Remove database/Drizzle dependencies  
- Frontend becomes pure client-side app with local JSON data + PlayFab user features

## Corrected Architecture

```
Frontend (React):
├── Task Data: Local JSON file (public/data/tasks.json)
├── User Auth: PlayFab LoginWithCustomID  
├── User Progress: PlayFab UserData
├── Leaderboards: PlayFab Statistics
└── Profiles: PlayFab Player Profiles

Backend: NONE (removed entirely)
Database: NONE (removed entirely)  
PlayFab: User features only, NOT game content
```

This matches the Unity implementation exactly - local task data with PlayFab for user features.