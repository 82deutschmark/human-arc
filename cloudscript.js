/**Author: Gemini 2.5 Pro
 * Date: September 10, 2025
 * Last Modified: September 10, 2025
 * Last Modified By: Gemini 2.5 Pro
 * Refactored from cloudscript.js.md
 * 
 * PlayFab CloudScript Functions
 * Server-side functions for Mission Control 2050 React application
 * 
 * SECURITY CRITICAL: These functions run on PlayFab servers and cannot be hacked by clients
 */

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
    },
    // Scoring Parameters
    SCORING: {
        OFFICER_TRACK: {
            BASE_POINTS: 10000,
            SPEED_BONUS: { PER_MINUTE_POINTS: 100, UNDER_MINUTES: 20 },
            EFFICIENCY_BONUS: { PER_ACTION_POINTS: 50, UNDER_ACTIONS: 100 },
        },
        ARC2_EVAL: {
            BASE_POINTS: 25000, FIRST_TRY_BONUS: 5000,
            SPEED_BONUS: { PER_MINUTE_POINTS: 200, UNDER_MINUTES: 30 },
            EFFICIENCY_BONUS: { PER_ACTION_POINTS: 100, UNDER_ACTIONS: 150 },
        },
    },
};

// =============================================================================
// UTILITIES
// =============================================================================

const Utils = {
    /**
     * Safely parses a JSON string, returning a fallback value on error.
     * @param {string} str - The JSON string to parse.
     * @param {*} [fallback=null] - The value to return if parsing fails.
     * @returns {Object|null}
     */
    safeParseJSON(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return fallback;
        }
    },

    /**
     * Throws an error if a condition is not met.
     * @param {boolean} condition - The condition to check.
     * @param {string} message - The error message to throw if the condition is false.
     */
    assert(condition, message) {
        if (!condition) throw new Error(message);
    },

    /**
     * Validates that an object contains all required keys.
     * @param {Object} obj - The object to check.
     * @param {string[]} requiredKeys - An array of required key names.
     */
    assertArgs(obj, requiredKeys) {
        for (const key of requiredKeys) {
            this.assert(obj[key] !== undefined && obj[key] !== null, `Missing required argument: ${key}`);
        }
    },

    /**
     * Compares two 2D arrays for equality.
     * @param {Array<Array<any>>} a - The first array.
     * @param {Array<Array<any>>} b - The second array.
     * @returns {boolean}
     */
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

    /**
     * Get rank name based on rank level (matches Unity and React)
     * @param {number} rankLevel - The player's rank level.
     * @returns {string}
     */
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
    /**
     * Retrieves and parses a JSON object from Title Data.
     * @param {string} key - The key for the Title Data entry.
     * @returns {Object|null}
     */
    getTitleDataJSON(key) {
        const res = server.GetTitleData({ Keys: [key] });
        return res.Data && res.Data[key] ? Utils.safeParseJSON(res.Data[key]) : null;
    },

    /**
     * Finds a puzzle by its ID across all configured data batches.
     * @param {string} puzzleId - The ID of the puzzle to find.
     * @returns {{puzzle: Object, batchKey: string}|null}
     */
    getPuzzleById(puzzleId) {
        for (const key of CONSTANTS.BATCH_KEYS) {
            const puzzles = this.getTitleDataJSON(key);
            if (puzzles) {
                // Normalize IDs for robust matching (e.g., "ARC-TR-123" vs "123")
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

    /**
     * Gets user data from PlayFab.
     * @param {string} playFabId - The player's PlayFab ID.
     * @param {string[]} keys - The keys of the data to retrieve.
     * @returns {Object}
     */
    getPlayerData(playFabId, keys) {
        return server.GetUserData({ PlayFabId: playFabId, Keys: keys });
    },

    /**
     * Updates user data in PlayFab.
     * @param {string} playFabId - The player's PlayFab ID.
     * @param {Object} dataObj - A key-value object of data to update.
     * @returns {Object}
     */
    updatePlayerData(playFabId, dataObj) {
        return server.UpdateUserData({ PlayFabId: playFabId, Data: dataObj });
    },

    /**
     * Updates player statistics for leaderboards.
     * @param {string} playFabId - The player's PlayFab ID.
     * @param {Array<{StatisticName: string, Value: number}>} statsArray - An array of statistics to update.
     * @returns {Object}
     */
    updatePlayerStats(playFabId, statsArray) {
        return server.UpdatePlayerStatistics({ PlayFabId: playFabId, Statistics: statsArray });
    },

    /**
     * Writes a custom player event.
     * @param {string} playFabId - The player's PlayFab ID.
     * @param {string} eventName - The name of the event.
     * @param {Object} body - The event data payload.
     * @returns {Object}
     */
    writePlayerEvent(playFabId, eventName, body) {
        return server.WritePlayerEvent({ PlayFabId: playFabId, EventName: eventName, Body: body });
    }
};

// =============================================================================
// SCORING SERVICE
// =============================================================================

const ScoringService = {
    /**
     * Retrieves the number of steps (cell_change events) for a given session.
     * @param {string} playFabId - The player's PlayFab ID.
     * @param {string} sessionId - The session ID to query events for.
     * @returns {number} - The number of steps, or a default if none are found.
     */
    getStepCountFromEvents(playFabId, sessionId) {
        try {
            // Try to get player events for this session
            const events = server.GetPlayerEvents({
                PlayFabId: playFabId
                // EventNamespace: "custom.SFMC" - might not be needed
            });

            log.info(`[getStepCountFromEvents] Retrieved ${events && events.History ? events.History.length : 0} events for player ${playFabId}`);

            // Count cell_change events in this session
            let stepCount = 0;
            if (events && events.History) {
                for (let event of events.History) {
                    // Check for SFMC events with the right sessionId and event_type
                    if (event.EventName === "SFMC" &&
                        event.EventData &&
                        event.EventData.sessionId === sessionId &&
                        event.EventData.event_type === "cell_change") {
                        stepCount++;
                    }
                }
            }

            log.info(`[getStepCountFromEvents] Found ${stepCount} cell_change events for session ${sessionId}`);

            // Return the actual count, or default if no events found
            return stepCount > 0 ? stepCount : 100;

        } catch (error) {
            log.error(`[getStepCountFromEvents] Error retrieving events: ${error}`);
            // Return default step count to avoid breaking scoring
            return 100;
        }
    },

    /**
     * Calculates a speed bonus based on time elapsed.
     * @param {{time: number, perMinute: number, underMinutes: number}} params - Scoring parameters.
     * @returns {number}
     */
    speedBonusFor({ time, perMinute, underMinutes }) {
        const timeInMinutes = Math.ceil((time || 0) / 60);
        return timeInMinutes < underMinutes ? (underMinutes - timeInMinutes) * perMinute : 0;
    },

    /**
     * Calculates an efficiency bonus based on the number of steps.
     * @param {{steps: number, perAction: number, underActions: number}} params - Scoring parameters.
     * @returns {number}
     */
    efficiencyBonusFor({ steps, perAction, underActions }) {
        return steps < underActions ? (underActions - steps) * perAction : 0;
    },

    /**
     * Calculates the total score for an Officer Track puzzle.
     * @param {{timeElapsed: number, stepCount: number}} params - Player performance metrics.
     * @returns {Object} Detailed score breakdown.
     */
    calculateOfficerTrackScore({ timeElapsed, stepCount }) {
        const params = CONSTANTS.SCORING.OFFICER_TRACK;
        const speedBonus = this.speedBonusFor({ time: timeElapsed, ...params.SPEED_BONUS });
        const efficiencyBonus = this.efficiencyBonusFor({ steps: stepCount, ...params.EFFICIENCY_BONUS });
        const finalScore = params.BASE_POINTS + speedBonus + efficiencyBonus;
        return { basePoints: params.BASE_POINTS, speedBonus, efficiencyBonus, finalScore };
    },

    /**
     * Calculates the total score for an ARC-2 Evaluation puzzle.
     * @param {{timeElapsed: number, stepCount: number, attemptNumber: number}} params - Player performance metrics.
     * @returns {Object} Detailed score breakdown.
     */
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
    /**
     * Compares a player's solutions against the puzzle's test cases.
     * @param {Object} puzzle - The puzzle object from Title Data.
     * @param {Array<Array<Array<any>>>} solutions - The player's submitted solutions.
     * @returns {{allCorrect: boolean, failures: Array, error?: string}}
     */
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

/**
 * Private helper to handle the core logic for ARC puzzle validation and scoring.
 * This function is designed to be called by specific public handlers.
 * @param {Object} args - The arguments passed to the handler.
 * @param {Object} context - The PlayFab context object.
 * @param {Object} config - Configuration for the specific puzzle type.
 * @returns {Object} The result of the validation and scoring.
 * @private
 */
function _validateAndScoreArcPuzzle(args, context, config) {
    try {
        Utils.assertArgs(args, ['puzzleId', 'solutions', 'timeElapsed', 'attemptNumber']);
        const { puzzleId, solutions, timeElapsed, attemptNumber, sessionId } = args;
        const playerId = currentPlayerId;

        const puzzleData = PlayFabService.getPuzzleById(puzzleId);
        if (!puzzleData) {
            return { success: false, error: `Puzzle ${puzzleId} not found.` };
        }
        const { puzzle } = puzzleData;

        const validationResult = ValidationService.compareSolutions(puzzle, solutions);
        if (validationResult.error) {
            return { success: false, error: validationResult.error };
        }

        // Event logging is handled by the client - CloudScript focuses on validation only

        if (!validationResult.allCorrect) {
            return { success: true, correct: false, failures: validationResult.failures };
        }

        // --- On Success: Calculate Score & Update Player Data ---
        const stepCount = ScoringService.getStepCountFromEvents(playerId, sessionId);
        const scoreData = config.scoringFunction({ timeElapsed, stepCount, attemptNumber });

        const keysToFetch = [config.completedPuzzlesKey, config.pointsKey, 'humanPerformanceData'];
        const playerData = PlayFabService.getPlayerData(playerId, keysToFetch);
        const currentPoints = parseInt(playerData.Data[config.pointsKey]?.Value || '0');
        const completedPuzzles = Utils.safeParseJSON(playerData.Data[config.completedPuzzlesKey]?.Value, []);
        const humanPerformanceData = Utils.safeParseJSON(playerData.Data.humanPerformanceData?.Value, []);

        if (!completedPuzzles.includes(puzzleId)) {
            completedPuzzles.push(puzzleId);
        }

        // Add new detailed performance record
        humanPerformanceData.push({
            puzzleId,
            isCorrect: true, // Add the missing correctness flag
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
            'humanPerformanceData': JSON.stringify(humanPerformanceData) // Save the detailed metrics
        });

        // High score event logging is handled by the client

        return { success: true, correct: true, ...scoreData };

    } catch (error) {
        log.error(`Error in ${config.handlerName}`, { error: error.message, stack: error.stack, args });
        return { success: false, error: `DEBUG: ${error.message} | Args: ${JSON.stringify(args)} | Context: ${JSON.stringify(context)} | Stack: ${error.stack}` };
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
        const playerId = currentPlayerId;

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

