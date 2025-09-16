/*
 * Comprehensive PlayFab Data Storage Test
 * Test ALL possible ways tasks could be stored in PlayFab
 */

const PlayFabClient = require('playfab-sdk').PlayFabClient;

PlayFabClient.settings.titleId = "19FACB";

console.log("=== COMPREHENSIVE PlayFab Data Storage Test ===");

PlayFabClient.LoginWithCustomID({
    CustomId: "comprehensive-test-user",
    CreateAccount: true
}, function(error, result) {
    if (error) {
        console.error("Login Error:", JSON.stringify(error, null, 2));
        return;
    }
    
    console.log("Login Success - Player ID:", result.data.PlayFabId);
    
    // Test 1: All possible Title Data keys
    console.log("\n=== TESTING ALL POSSIBLE TITLE DATA KEYS ===");
    testAllTitleDataKeys();
});

function testAllTitleDataKeys() {
    // Comprehensive list of possible keys where tasks might be stored
    const possibleKeys = [
        'tasks', 'Tasks', 'TASKS',
        'puzzles', 'Puzzles', 'PUZZLES', 
        'gamedata', 'GameData', 'GAMEDATA',
        'content', 'Content', 'CONTENT',
        'missions', 'Missions', 'MISSIONS',
        'levels', 'Levels', 'LEVELS',
        'challenges', 'Challenges', 'CHALLENGES',
        'sfmc', 'SFMC', 'Sfmc',
        'spaceforce', 'SpaceForce', 'SPACEFORCE',
        'arcagi', 'ArcAgi', 'ARCAGI', 'ARC_AGI',
        'taskdata', 'TaskData', 'TASKDATA',
        'data', 'Data', 'DATA'
    ];
    
    PlayFabClient.GetTitleData({
        Keys: possibleKeys
    }, function(error, result) {
        if (error) {
            console.error("Title Data Error:", JSON.stringify(error, null, 2));
        } else {
            const foundKeys = Object.keys(result.data.Data || {});
            console.log("Found Title Data Keys:", foundKeys);
            
            foundKeys.forEach(key => {
                const data = result.data.Data[key];
                console.log(`\nKey "${key}":`);
                console.log(`  Length: ${data.length} characters`);
                console.log(`  Preview: ${data.substring(0, 300)}...`);
                
                if (data.startsWith('{') || data.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed)) {
                            console.log(`  ✅ JSON Array with ${parsed.length} items`);
                            if (parsed[0] && parsed[0].id) {
                                console.log(`  📋 Looks like tasks! Sample ID: ${parsed[0].id}`);
                            }
                        } else {
                            console.log(`  ✅ JSON Object with keys:`, Object.keys(parsed));
                        }
                    } catch (e) {
                        console.log(`  ❌ Invalid JSON`);
                    }
                }
            });
        }
        
        // Test 2: CloudScript functions with parameters
        testCloudScriptWithParams();
    });
}

function testCloudScriptWithParams() {
    console.log("\n=== TESTING CLOUDSCRIPT WITH PARAMETERS ===");
    
    const functionTests = [
        { name: 'GetTasks', params: {} },
        { name: 'GetTasks', params: { category: 'all' } },
        { name: 'GetAllTasks', params: {} },
        { name: 'LoadTaskData', params: {} },
        { name: 'FetchGameContent', params: {} },
        { name: 'GetGameData', params: { type: 'tasks' } },
        { name: 'GetContent', params: { contentType: 'tasks' } }
    ];
    
    let testIndex = 0;
    
    function testNext() {
        if (testIndex >= functionTests.length) {
            console.log("\n=== COMPREHENSIVE TEST COMPLETE ===");
            return;
        }
        
        const test = functionTests[testIndex];
        console.log(`\nTesting: ${test.name} with params:`, test.params);
        
        PlayFabClient.ExecuteCloudScript({
            FunctionName: test.name,
            FunctionParameter: test.params,
            GeneratePlayStreamEvent: false
        }, function(error, result) {
            if (error) {
                console.log(`❌ ${test.name} error:`, error.error || error);
            } else if (result.data.Error) {
                console.log(`⚠️ ${test.name}:`, result.data.Error.Error);
            } else {
                console.log(`✅ ${test.name} SUCCESS!`);
                console.log("Result:", JSON.stringify(result.data.FunctionResult, null, 2));
                if (result.data.Logs && result.data.Logs.length > 0) {
                    console.log("Logs:", result.data.Logs);
                }
            }
            
            testIndex++;
            setTimeout(testNext, 500);
        });
    }
    
    testNext();
}