/**Author: Gemini 2.5 Pro
 * Date: September 10, 2025
 * Last Modified: September 14, 2025
 * Last Modified By: Gemini 2.5 Pro
 * Refactored from cloudscript.js.md
 *
 * PlayFab CloudScript Functions
 * Server-side functions for Mission Control 2050 React application
 *
 * SECURITY CRITICAL: These functions run on PlayFab servers and cannot be hacked by clients
 */

var handlers = {};

// =============================================================================
// REFACTOR CONSTANTS & HELPERS
// =============================================================================

const CONSTANTS = {
    // Title Data Batch Keys
    BATCH_KEYS: [
        "officer-tasks-training-batch1.json", "officer-tasks-training-batch2.json",
        "officer-tasks-training-batch3.json", "officer-tasks-training-batch4.json",
        "officer-tasks-training2-batch1.json", "officer-tasks-training2-batch2.json",
        "officer-tasks-training2-batch3.json", "officer-tasks-training2-batch4.json",
        "officer-tasks-training2-batch5.json", "officer-tasks-training2-batch6.json",
        "officer-tasks-training2-batch7.json", "officer-tasks-training2-batch8.json",
        "officer-tasks-training2-batch9.json", "officer-tasks-training2-batch10.json",
        "officer-tasks-evaluation-batch1.json", "officer-tasks-evaluation-batch2.json",
        "officer-tasks-evaluation-batch3.json", "officer-tasks-evaluation-batch4.json",
        "officer-tasks-evaluation2-batch1.json", "officer-tasks-evaluation2-batch2.json"
    ],
    // Player Statistic Names
    STATS: {
        LEVEL_POINTS: "LevelPoints",
        OFFICER_TRACK_POINTS: "OfficerTrackPoints",
        ARC2_EVAL_POINTS: "ARC2EvalPoints",
        HARC_TOTAL_POINTS: "HARCTotalPoints",
    },
    // Scoring Parameters
    SCORING: {
        OFFICER_TRACK: {
            BASE_POINTS: 10000,
            // NEW: 10,000 points minus 1 per millisecond, max 9,999 bonus (1ms), 0 bonus over 10 seconds
            SPEED_BONUS: { MAX_BONUS: 10000, CUTOFF_MS: 10000 },
            EFFICIENCY_BONUS: { PER_ACTION_POINTS: 50, UNDER_ACTIONS: 100 },
        },
        ARC2_EVAL: {
            BASE_POINTS: 25000, FIRST_TRY_BONUS: 5000,
            // Keep old logic for ARC2_EVAL for now
            SPEED_BONUS: { PER_MINUTE_POINTS: 200, UNDER_MINUTES: 30 },
            EFFICIENCY_BONUS: { PER_ACTION_POINTS: 100, UNDER_ACTIONS: 150 },
        },
    },
};

// =============================================================================
// UTILITIES
// =============================================================================

const Utils = {
    safeParseJSON(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return fallback;
        }
    },
    assert(condition, message) {
        if (!condition) throw new Error(message);
    },
    assertArgs(obj, requiredKeys) {
        for (const key of requiredKeys) {
            if (obj[key] === undefined || obj[key] === null) {
                throw new Error(`Missing required argument: ${key} (value: ${obj[key]})`);
            }
        }
    },
    arraysEqual(a, b, testIndex) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            log.error(`[Test ${testIndex}] Array structure mismatch (level 1). A is array: ${Array.isArray(a)}, B is array: ${Array.isArray(b)}, A.length: ${a?.length}, B.length: ${b?.length}`);
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!Array.isArray(a[i]) || !Array.isArray(b[i]) || a[i].length !== b[i].length) {
                log.error(`[Test ${testIndex}] Row ${i} structure mismatch. A[i] is array: ${Array.isArray(a[i])}, B[i] is array: ${Array.isArray(b[i])}, A[i].length: ${a[i]?.length}, B[i].length: ${b[i]?.length}`);
                return false;
            }
            for (let j = 0; j < a[i].length; j++) {
                if (a[i][j] != b[i][j]) {
                    log.error(`[Test ${testIndex}] Value mismatch at [${i},${j}]. Expected: ${b[i][j]} (type: ${typeof b[i][j]}), Got: ${a[i][j]} (type: ${typeof a[i][j]})`);
                    return false;
                }
            }
        }
        return true;
    },
    getRankName(rankLevel) {
        const ranks = [
            'Specialist 1', 'Specialist 2', 'Specialist 3', 'Specialist 4',
            'Corporal', 'Sergeant', 'Staff Sergeant', 'Technical Sergeant',
            'Master Sergeant', 'Senior Master Sergeant', 'Chief Master Sergeant'
        ];
        return ranks[rankLevel - 1] || 'Chief Master Sergeant';
    }
};

// =============================================================================
// PLAYFAB SERVICE (Data Access Layer)
// =============================================================================

const PlayFabService = {
    getTitleDataJSON(key) {
        const res = server.GetTitleData({ Keys: [key] });
        return res.Data && res.Data[key] ? Utils.safeParseJSON(res.Data[key]) : null;
    },
    getPuzzleById(puzzleId) {
        for (const key of CONSTANTS.BATCH_KEYS) {
            const puzzles = this.getTitleDataJSON(key);
            if (puzzles) {
                const cleanPuzzleId = puzzleId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
                for (const puzzle of puzzles) {
                    const cleanStoredId = puzzle.id.replace(/^ARC-(TR|T2|EV|E2)-/, '');
                    if (puzzle.id === puzzleId || cleanStoredId === cleanPuzzleId) {
                        log.info(`Found puzzle ${puzzleId} in batch ${key}`);
                        return { puzzle, batchKey: key };
                    }
                }
            }
        }
        log.error(`Puzzle ${puzzleId} not found in any batch`, { puzzleId });
        return null;
    },
    getPlayerData(playFabId, keys) {
        return server.GetUserData({ PlayFabId: playFabId, Keys: keys });
    },
    updatePlayerData(playFabId, dataObj) {
        return server.UpdateUserData({ PlayFabId: playFabId, Data: dataObj });
    },
    updatePlayerStats(playFabId, statsArray) {
        return server.UpdatePlayerStatistics({ PlayFabId: playFabId, Statistics: statsArray });
    },
    writePlayerEvent(playFabId, eventName, body) {
        return server.WritePlayerEvent({ PlayFabId: playFabId, EventName: eventName, Body: body });
    }
};

// =============================================================================
// SCORING SERVICE
// =============================================================================

const ScoringService = {
    speedBonusFor({ time, maxBonus, cutoffMs, perMinute, underMinutes }) {
        // NEW OFFICER TRACK LOGIC: 10,000 points minus 1 per millisecond
        if (maxBonus && cutoffMs) {
            const timeInMs = (time || 0) * 1000; // Convert seconds to milliseconds
            if (timeInMs >= cutoffMs) return 0; // Over 10 seconds = no bonus
            return Math.max(0, maxBonus - timeInMs); // 10,000 - milliseconds
        }
        
        // LEGACY ARC2_EVAL LOGIC: Keep old minute-based calculation
        if (perMinute && underMinutes) {
            const timeInMinutes = (time || 0) / 60;
            if (timeInMinutes <= 0.5) return 10000; // 30 seconds or less = 10,000 bonus
            if (timeInMinutes >= 10) return 0;      // 10+ minutes = no bonus
            return Math.max(0, 10000 - (Math.floor(timeInMinutes) * 1000));
        }
        
        return 0; // Fallback
    },
    efficiencyBonusFor({ steps, perAction, underActions }) {
        return steps < underActions ? (underActions - steps) * perAction : 0;
    },
    calculateOfficerTrackScore({ timeElapsed, stepCount }) {
        const params = CONSTANTS.SCORING.OFFICER_TRACK;
        const speedBonus = this.speedBonusFor({ time: timeElapsed, ...params.SPEED_BONUS });
        const efficiencyBonus = this.efficiencyBonusFor({ steps: stepCount, ...params.EFFICIENCY_BONUS });
        const finalScore = params.BASE_POINTS + speedBonus + efficiencyBonus;
        return { basePoints: params.BASE_POINTS, speedBonus, efficiencyBonus, finalScore };
    },
    calculateArc2EvalScore({ timeElapsed, stepCount, attemptNumber }) {
        const params = CONSTANTS.SCORING.ARC2_EVAL;
        const speedBonus = this.speedBonusFor({ time: timeElapsed, ...params.SPEED_BONUS });
        const efficiencyBonus = this.efficiencyBonusFor({ steps: stepCount, ...params.EFFICIENCY_BONUS });
        const firstTryBonus = (attemptNumber === 1) ? params.FIRST_TRY_BONUS : 0;
        const finalScore = params.BASE_POINTS + speedBonus + efficiencyBonus + firstTryBonus;
        return { basePoints: params.BASE_POINTS, speedBonus, efficiencyBonus, firstTryBonus, finalScore };
    }
};

// =============================================================================
// VALIDATION SERVICE
// =============================================================================

const ValidationService = {
    compareSolutions(puzzle, solutions) {
        log.info("--- Entering compareSolutions ---");
        log.info("Puzzle ID: " + puzzle.id);
        log.info("Received solutions count: " + solutions.length);
        try {
            log.info("Solutions received (stringified): " + JSON.stringify(solutions));
            log.info("Puzzle test cases (stringified): " + JSON.stringify(puzzle.test));
        } catch(e) {
            log.error("Could not stringify puzzle/solution data for logging.");
        }

        const failures = [];
        const testCases = Array.isArray(puzzle.test) ? puzzle.test : [puzzle.test];

        if (solutions.length !== testCases.length) {
            const errorMsg = `Expected ${testCases.length} solutions, got ${solutions.length}`;
            log.error(errorMsg);
            return { allCorrect: false, failures, error: errorMsg };
        }

        for (let i = 0; i < testCases.length; i++) {
            if (!Utils.arraysEqual(solutions[i], testCases[i].output, i)) { // Pass index for logging
                failures.push({ index: i, expected: testCases[i].output, got: solutions[i] });
            }
        }

        log.info("--- Exiting compareSolutions. Failures found: " + failures.length + " ---");
        return { allCorrect: failures.length === 0, failures };
    }
};

// =============================================================================
// TASK HANDLERS (CloudScript Entry Points)
// =============================================================================

function _validateAndScoreArcPuzzle(args, context, config) {
    try {
        Utils.assertArgs(args, ['puzzleId', 'solutions', 'timeElapsed', 'attemptNumber', 'stepCount']);
        const { puzzleId, solutions, timeElapsed, attemptNumber, stepCount, sessionId } = args;
        const playerId = context.currentPlayerId;
        Utils.assert(playerId, 'context.currentPlayerId is missing or undefined.');

        log.info(`Searching for puzzle: ${puzzleId}`);
        const puzzleData = PlayFabService.getPuzzleById(puzzleId);
        if (!puzzleData) {
            log.error(`Puzzle ${puzzleId} not found in any batch`);
            return { success: false, error: `Puzzle ${puzzleId} not found.` };
        }
        log.info(`Found puzzle ${puzzleId} in batch ${puzzleData.batchKey}`);
        const { puzzle } = puzzleData;

        const validationResult = ValidationService.compareSolutions(puzzle, solutions);
        if (validationResult.error) {
            return { success: false, error: validationResult.error };
        }

        if (!validationResult.allCorrect) {
            return { success: true, correct: false, failures: validationResult.failures };
        }

        const keysToFetch = [config.completedPuzzlesKey, config.pointsKey, 'humanPerformanceData'];
        const playerData = PlayFabService.getPlayerData(playerId, keysToFetch);
        const currentPoints = parseInt(playerData.Data[config.pointsKey]?.Value || '0');
        const completedPuzzles = Utils.safeParseJSON(playerData.Data[config.completedPuzzlesKey]?.Value, []);
        const humanPerformanceData = Utils.safeParseJSON(playerData.Data.humanPerformanceData?.Value, []);

        // CRITICAL FIX: Check if puzzle already completed BEFORE awarding points
        if (completedPuzzles.includes(puzzleId)) {
            // Find the previous score for this puzzle
            const previousRecord = humanPerformanceData.find(record => record.puzzleId === puzzleId);
            return {
                success: true,
                correct: true,
                alreadyCompleted: true,
                message: "Puzzle solved correctly (already completed)",
                previousScore: previousRecord || null
            };
        }

        // Only calculate score and award points for first completion
        const scoreData = config.scoringFunction({ timeElapsed, stepCount, attemptNumber });

        completedPuzzles.push(puzzleId);

        humanPerformanceData.push({
            puzzleId,
            correct: true,
            timestamp: new Date().toISOString(),
            ...scoreData,
            timeElapsed,
            stepCount,
            attemptNumber
        });

        const newTotalPoints = currentPoints + scoreData.finalScore;

        PlayFabService.updatePlayerStats(playerId, [
            { StatisticName: config.statisticName, Value: newTotalPoints }
        ]);

        PlayFabService.updatePlayerData(playerId, {
            [config.completedPuzzlesKey]: JSON.stringify(completedPuzzles),
            [config.pointsKey]: newTotalPoints.toString(),
            'humanPerformanceData': JSON.stringify(humanPerformanceData)
        });

        return { success: true, correct: true, ...scoreData };

    } catch (error) {
        log.error(`Error in ${config.handlerName}`, { error: error.message, stack: error.stack, args });
        return { success: false, error: `DEBUG: ${error.message} | PuzzleId: ${args?.puzzleId} | Solutions: ${args?.solutions?.length} items | TimeElapsed: ${args?.timeElapsed} | AttemptNumber: ${args?.attemptNumber} | StepCount: ${args?.stepCount} | SessionId: ${args?.sessionId}` };
    }
}

handlers.ValidateARCPuzzle = function(args, context) {
    const config = {
        handlerName: 'ValidateARCPuzzle',
        attemptEventName: 'ARCPuzzleAttempt',
        highScoreEventName: 'ARCHighScore',
        completedPuzzlesKey: 'completedARCPuzzles',
        pointsKey: 'officerTrackPoints',
        statisticName: CONSTANTS.STATS.OFFICER_TRACK_POINTS,
        scoringFunction: ScoringService.calculateOfficerTrackScore.bind(ScoringService)
    };
    return _validateAndScoreArcPuzzle(args, context, config);
};

handlers.GenerateAnonymousName = function(args, context) {
    const adjectives = [
        "Stellar", "Cosmic", "Quantum", "Galactic", "Nebula", "Solar", 
        "Lunar", "Orbital", "Plasma", "Photon", "Neutron", "Alpha",
        "Delta", "Omega", "Prime", "Nova", "Pulsar", "Quasar",
        "Asteroid", "Comet", "Meteor", "Phoenix", "Vortex", "Cipher"
    ];
    const nouns = [
        "Explorer", "Navigator", "Commander", "Pilot", "Engineer", "Scientist",
        "Guardian", "Sentinel", "Operative", "Specialist", "Technician", "Agent",
        "Ranger", "Scout", "Voyager", "Pioneer", "Wanderer", "Seeker",
        "Hunter", "Tracker", "Observer", "Monitor", "Analyst", "Decoder"
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    const generatedName = `${adjective}${noun}${number}`;

    PlayFabService.writePlayerEvent(context.playerId, "AnonymousNameGenerated", {
        generatedName,
        timestamp: new Date().toISOString()
    });

    return { newName: generatedName };
};

handlers.ValidateARC2EvalPuzzle = function(args, context) {
    const config = {
        handlerName: 'ValidateARC2EvalPuzzle',
        attemptEventName: 'ARC2EvalPuzzleAttempt',
        highScoreEventName: 'ARC2EvalHighScore',
        completedPuzzlesKey: 'completedARC2Puzzles',
        pointsKey: 'arc2EvalPoints',
        statisticName: CONSTANTS.STATS.ARC2_EVAL_POINTS,
        scoringFunction: ScoringService.calculateArc2EvalScore.bind(ScoringService)
    };
    return _validateAndScoreArcPuzzle(args, context, config);
};

handlers.ValidateTaskSolution = function(args, context) {
    try {
        Utils.assertArgs(args, ['taskId', 'solution']);
        const { taskId, solution, timeElapsed = 0, hintsUsed = 0, sessionId = 'unknown', attemptId = 1 } = args;
        const playerId = context.currentPlayerId;

        const tasks = PlayFabService.getTitleDataJSON("tasks.json");
        if (!tasks) {
            return { success: false, error: "Task data not found in Title Data" };
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            return { success: false, error: `Task ${taskId} not found` };
        }

        const isCorrect = Utils.arraysEqual(solution, task.testOutput);

        PlayFabService.writePlayerEvent(playerId, "TaskValidation", {
            taskId,
            result: isCorrect ? "correct" : "incorrect",
            sessionId, attemptId, timeElapsed, hintsUsed
        });

        if (!isCorrect) {
            return { success: true, correct: false, message: "Incorrect. Review the examples and try again." };
        }

        // --- On Success: Calculate Score & Update Player Data ---
        let pointsEarned = task.basePoints || 100;
        const timeBonus = (timeElapsed < 30) ? Math.max(0, Math.floor((30 - timeElapsed) / 5) * 10) : 0;
        const hintPenalty = hintsUsed * 5;
        pointsEarned = Math.max(0, pointsEarned + timeBonus - hintPenalty);

        const playerData = PlayFabService.getPlayerData(playerId, ["totalPoints", "completedMissions", "rankLevel"]);
        const currentTotalPoints = parseInt(playerData.Data.totalPoints?.Value || "0");
        const currentCompletedMissions = parseInt(playerData.Data.completedMissions?.Value || "0");
        const currentRankLevel = parseInt(playerData.Data.rankLevel?.Value || "1");

        const newTotalPoints = currentTotalPoints + pointsEarned;
        const newRankLevel = Math.min(Math.floor(newTotalPoints / 1000) + 1, 11);
        const newRank = Utils.getRankName(newRankLevel);
        const rankUp = newRankLevel > currentRankLevel;

        PlayFabService.updatePlayerData(playerId, {
            totalPoints: newTotalPoints.toString(),
            completedMissions: (currentCompletedMissions + 1).toString(),
            rankLevel: newRankLevel.toString(),
            rank: newRank,
            lastTaskCompleted: taskId,
            lastCompletionTime: new Date().toISOString()
        });

        PlayFabService.updatePlayerStats(playerId, [
            { StatisticName: CONSTANTS.STATS.LEVEL_POINTS, Value: newTotalPoints }
        ]);

        return {
            success: true,
            correct: true,
            pointsEarned, timeBonus, hintPenalty,
            totalScore: newTotalPoints,
            newRank: rankUp ? newRank : undefined,
            rankUp,
            message: rankUp ? `Outstanding! Promoted to ${newRank}!` : `Excellent work! Mission accomplished.`
        };

    } catch (error) {
        log.error("ValidateTaskSolution error", { error: error.message, stack: error.stack, args });
        return { success: false, error: "Internal server error during validation" };
    }
};

// =============================================================================
// HARC LEADERBOARD FUNCTION
// =============================================================================

handlers.UpdateHARCTotalScore = function(args, context) {
    try {
        const playerId = context.currentPlayerId;
        Utils.assert(playerId, "Player ID is required");

        // Get player's humanPerformanceData
        const userData = PlayFabService.getPlayerData(playerId, ["humanPerformanceData"]);
        const humanPerformanceDataStr = userData.Data?.humanPerformanceData?.Value;

        if (!humanPerformanceDataStr || humanPerformanceDataStr === "undefined") {
            log.info(`[HARC] Player ${playerId} has no performance data yet`);
            // Set initial score to 0
            PlayFabService.updatePlayerStats(playerId, [
                { StatisticName: CONSTANTS.STATS.HARC_TOTAL_POINTS, Value: 0 }
            ]);
            return { success: true, totalScore: 0 };
        }

        const humanPerformanceData = Utils.safeParseJSON(humanPerformanceDataStr, []);

        // Calculate total score from all finalScore values
        let totalScore = 0;
        for (let i = 0; i < humanPerformanceData.length; i++) {
            const record = humanPerformanceData[i];
            if (record && record.finalScore && typeof record.finalScore === 'number') {
                totalScore += record.finalScore;
            }
        }

        // Update the HARC leaderboard statistic
        PlayFabService.updatePlayerStats(playerId, [
            { StatisticName: CONSTANTS.STATS.HARC_TOTAL_POINTS, Value: totalScore }
        ]);

        log.info(`[HARC] Updated total score for player ${playerId}: ${totalScore} (from ${humanPerformanceData.length} puzzles)`);

        return {
            success: true,
            totalScore: totalScore,
            puzzleCount: humanPerformanceData.length
        };

    } catch (error) {
        log.error("UpdateHARCTotalScore error", { error: error.message, stack: error.stack, args });
        return { success: false, error: "Failed to update HARC total score" };
    }
};

// =============================================================================
// STRATEGY BONUS FUNCTION - Universal 10K Bonus for All Scoring Systems
// =============================================================================

handlers.AwardStrategyBonus = function(args, context) {
    try {
        Utils.assertArgs(args, ['puzzleId']);
        const { puzzleId } = args;
        const playerId = context.currentPlayerId;
        Utils.assert(playerId, 'context.currentPlayerId is missing or undefined.');

        log.info(`[StrategyBonus] Processing request for puzzle ${puzzleId}, player ${playerId}`);

        // Get current player data including strategy submissions tracking
        const playerData = PlayFabService.getPlayerData(playerId, [
            'strategySubmissions',
            'officerTrackPoints',
            'arc2EvalPoints',
            'totalPoints',
            'harcTotalPoints'
        ]);

        // Check if strategy bonus already awarded for this puzzle
        const strategySubmissions = Utils.safeParseJSON(
            playerData.Data.strategySubmissions?.Value,
            []
        );

        if (strategySubmissions.includes(puzzleId)) {
            log.info(`[StrategyBonus] Strategy bonus already claimed for puzzle ${puzzleId}`);
            return {
                success: true,
                bonusAwarded: false,
                message: "Strategy bonus already claimed for this puzzle",
                alreadyClaimed: true
            };
        }

        // Strategy bonus amount
        const bonusPoints = 10000;
        log.info(`[StrategyBonus] Awarding ${bonusPoints} bonus points for puzzle ${puzzleId}`);

        // Get current point totals for all scoring systems
        const currentOfficerPoints = parseInt(playerData.Data.officerTrackPoints?.Value || '0');
        const currentArc2Points = parseInt(playerData.Data.arc2EvalPoints?.Value || '0');
        const currentTotalPoints = parseInt(playerData.Data.totalPoints?.Value || '0');
        const currentHarcPoints = parseInt(playerData.Data.harcTotalPoints?.Value || '0');

        // Calculate new totals
        const newOfficerPoints = currentOfficerPoints + bonusPoints;
        const newArc2Points = currentArc2Points + bonusPoints;
        const newTotalPoints = currentTotalPoints + bonusPoints;
        const newHarcPoints = currentHarcPoints + bonusPoints;

        // Track this strategy submission
        strategySubmissions.push(puzzleId);

        // Update ALL leaderboard statistics with bonus points
        PlayFabService.updatePlayerStats(playerId, [
            { StatisticName: CONSTANTS.STATS.OFFICER_TRACK_POINTS, Value: newOfficerPoints },
            { StatisticName: CONSTANTS.STATS.ARC2_EVAL_POINTS, Value: newArc2Points },
            { StatisticName: CONSTANTS.STATS.LEVEL_POINTS, Value: newTotalPoints },
            { StatisticName: CONSTANTS.STATS.HARC_TOTAL_POINTS, Value: newHarcPoints }
        ]);

        // Update player data
        PlayFabService.updatePlayerData(playerId, {
            strategySubmissions: JSON.stringify(strategySubmissions),
            officerTrackPoints: newOfficerPoints.toString(),
            arc2EvalPoints: newArc2Points.toString(),
            totalPoints: newTotalPoints.toString(),
            harcTotalPoints: newHarcPoints.toString()
        });

        // Log the bonus award for analytics
        PlayFabService.writePlayerEvent(playerId, "StrategyBonusAwarded", {
            puzzleId,
            bonusPoints,
            newOfficerPoints,
            newArc2Points,
            newTotalPoints,
            newHarcPoints,
            timestamp: new Date().toISOString()
        });

        log.info(`[StrategyBonus] Successfully awarded ${bonusPoints} points to all scoring systems for player ${playerId}`);

        return {
            success: true,
            bonusAwarded: true,
            bonusPoints,
            updatedScores: {
                officerTrackPoints: newOfficerPoints,
                arc2EvalPoints: newArc2Points,
                totalPoints: newTotalPoints,
                harcTotalPoints: newHarcPoints
            },
            message: `Strategy bonus of ${bonusPoints} points awarded to all scoring systems!`
        };

    } catch (error) {
        log.error("AwardStrategyBonus error", { error: error.message, stack: error.stack, args });
        return { success: false, error: "Failed to award strategy bonus" };
    }
};