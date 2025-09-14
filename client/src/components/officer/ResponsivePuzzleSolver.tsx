/**
 * Responsive Puzzle Solver
 * =========================
 * Complete responsive puzzle solving interface with proper scaling
 * Replaces SimplePuzzleSolver with full responsive design implementation
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { arcExplainerClient, type PerformanceData } from '@/services/core/arcExplainerClient';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { AssessmentStepSuccessModal } from '@/components/assessment/AssessmentStepSuccessModal';
import { ResponsiveOfficerGrid, ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { TrainingExamplesSection } from '@/components/officer/TrainingExamplesSection';
import { TestCaseNavigation } from '@/components/officer/TestCaseNavigation';
import { PuzzleSolverControls } from '@/components/officer/PuzzleSolverControls';
import { PuzzleTools } from '@/components/officer/PuzzleTools';
import { DisplayModeToolbar } from '@/components/officer/DisplayModeToolbar';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import type { DisplayMode, PuzzleDisplayState } from '@/types/puzzleDisplayTypes';
import type { EventType } from '@/types/playfab';
import type { EmojiSet } from '@/constants/spaceEmojis';
import { getRandomEmojiSet } from '@/constants/spaceEmojis';
import { playFabValidation } from '@/services/playfab/validation';
import { playFabEvents } from '@/services/playfab/events';
import { idConverter } from '@/services/idConverter';
import { SizeSlider } from '@/components/ui/SizeSlider';

interface ResponsivePuzzleSolverProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
  tutorialMode?: boolean;
  isAssessmentMode?: boolean;
  onSolve?: () => void;
  onValidationResult?: (result: any) => void;
  onAssessmentAdvance?: () => void;
}

export function ResponsivePuzzleSolver({ puzzle, onBack, tutorialMode = false, isAssessmentMode = false, onSolve, onValidationResult, onAssessmentAdvance }: ResponsivePuzzleSolverProps) {
  const [, setLocation] = useLocation();
  // Multi-test case state
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [solutions, setSolutions] = useState<ARCGrid[]>([]);
  const [outputDimensions, setOutputDimensions] = useState<Array<{width: number; height: number}>>([]);
  const [completedTests, setCompletedTests] = useState<boolean[]>([]);
  
  // Enhanced display state - randomize emoji set for variety
  const [displayState, setDisplayState] = useState<PuzzleDisplayState>({
    displayMode: 'hybrid',
    emojiSet: getRandomEmojiSet(),
    selectedValue: 1,
    showControls: true,
  });

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Session tracking state
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionStartTime = useRef(Date.now());
  const [stepIndex, setStepIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // Auto-advance state for assessment mode
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [autoAdvanceMessage, setAutoAdvanceMessage] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Performance stats state
  const [performanceStats, setPerformanceStats] = useState<PerformanceData | null>(null);

  const [inputCellSize, setInputCellSize] = useState(50);
  const [outputCellSize, setOutputCellSize] = useState(50);

  // Assessment mode guidance state
  const [assessmentTestsCompleted, setAssessmentTestsCompleted] = useState<boolean[]>([]);
  const [showNextTestButton, setShowNextTestButton] = useState(false);
  const [assessmentGuidanceMessage, setAssessmentGuidanceMessage] = useState<string>('');

  if (!puzzle) {
    return <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">No puzzle data.</div>;
  }

  const totalTests = puzzle.test?.length || 0;
  const currentTest = puzzle.test?.[currentTestIndex];
  const testInput = currentTest?.input || [];
  const expectedOutput = currentTest?.output || [];
  const trainingExamples = puzzle.train || [];


  // Convert puzzle ID to PlayFab format for consistency
  const playFabPuzzleId = idConverter.normalizeToPlayFabId(puzzle.id, 'evaluation') ||
                         idConverter.normalizeToPlayFabId(puzzle.id, 'training') ||
                         puzzle.id; // fallback to original if conversion fails

  // Reset component state when the puzzle prop changes
  useEffect(() => {
    console.log(`[Effect] New puzzle received: ${puzzle.id} -> PlayFab ID: ${playFabPuzzleId}. Resetting component state.`);
    setCurrentTestIndex(0);
    setValidationResult(null);
    setValidationError(null);
    setAttemptNumber(1);
    setSolutions([]);
    setOutputDimensions([]);
    setCompletedTests([]);
    setStepIndex(0);
    setIsValidating(false);
    setIsAutoAdvancing(false);
    setAutoAdvanceMessage(null);
    setShowSuccessModal(false);
    sessionStartTime.current = Date.now(); // Reset timer for the new puzzle
    console.log(`[TIMER] New puzzle ${puzzle.id}. Start time reset to: ${sessionStartTime.current}`);

    // Reset assessment mode guidance state
    setAssessmentTestsCompleted([]);
    setShowNextTestButton(false);
    setAssessmentGuidanceMessage('');

    // Randomize emoji set for each new puzzle
    setDisplayState(prev => ({
      ...prev,
      emojiSet: getRandomEmojiSet()
    }));

    if (puzzle.test && puzzle.test.length > 0) {
      const newSolutions: ARCGrid[] = [];
      const newDimensions: Array<{width: number; height: number}> = [];
      const newCompleted: boolean[] = [];

      puzzle.test.forEach((test) => {
        const inputHeight = test.input?.length || 3;
        const inputWidth = test.input?.[0]?.length || 3;
        const emptyGrid = Array(inputHeight).fill(null).map(() => Array(inputWidth).fill(0));
        
        newSolutions.push(emptyGrid);
        newDimensions.push({ width: inputWidth, height: inputHeight });
        newCompleted.push(false);
      });

      setSolutions(newSolutions);
      setOutputDimensions(newDimensions);
      setCompletedTests(newCompleted);

      // Initialize assessment mode tracking
      if (isAssessmentMode) {
        setAssessmentTestsCompleted(new Array(puzzle.test.length).fill(false));
      }
    }

    // Fetch performance stats for the new puzzle
    const fetchStats = async () => {
      const stats = await arcExplainerClient.getPuzzlePerformance(puzzle.id);
      setPerformanceStats(stats);
    };

    fetchStats();
  }, [puzzle.id]);

  // Initialize session and log puzzle start event
  useEffect(() => {
    const logSessionStart = async () => {
      try {
        await playFabEvents.logPuzzleEvent(
          "SFMC",                    // eventName
          sessionId,                 // sessionId
          attemptNumber,             // attemptNumber
          playFabPuzzleId,           // game_id (PlayFab format puzzle ID)
          stepIndex,                 // stepIndex (starts at 0)
          0,                         // positionX
          0,                         // positionY
          {                          // payloadSummary
            totalTests: totalTests,
            trainingExamples: trainingExamples.length,
            puzzleId: puzzle.id
          },
          0,                         // deltaMs (0 for start)
          "Officer Track Puzzle",    // game_title
          "start",                   // status
          "officer-track",           // category
          "game_start",             // event_type
          0,                         // selection_value
          new Date().toISOString()   // game_time
        );
      } catch (error) {
        // Event logging failures should not break gameplay - fail silently
      }
    };

    logSessionStart();

    // Cleanup function to log session end when component unmounts
    return () => {
      const logSessionEnd = async () => {
        try {
          const sessionDuration = Date.now() - sessionStartTime.current;
          await playFabEvents.logPuzzleEvent(
            "SFMC",                    // eventName
            sessionId,                 // sessionId
            attemptNumber,             // attemptNumber
            playFabPuzzleId,           // game_id (PlayFab format puzzle ID)
            stepIndex + 1,             // stepIndex (increment for final step)
            0,                         // positionX
            0,                         // positionY
            {                          // payloadSummary
              sessionDurationMs: sessionDuration,
              finalStepIndex: stepIndex,
              puzzleId: puzzle.id
            },
            sessionDuration,           // deltaMs (total session time)
            "Officer Track Puzzle",    // game_title
            "stop",                    // status
            "officer-track",           // category
            "game_completion",         // event_type
            0,                         // selection_value
            new Date().toISOString()   // game_time
          );
        } catch (error) {
          // Event logging failures should not break gameplay - fail silently
        }
      };

      logSessionEnd();
    };
  }, [sessionId, puzzle.id]); // Only re-run when puzzle changes, not on every step


  // Get suggested sizes from training examples
  const getSuggestedSizes = () => {
    const suggestions: Array<{ width: number; height: number; label: string }> = [];
    const seenSizes = new Set<string>();

    trainingExamples.forEach((example, index) => {
      const outputHeight = example.output?.length || 0;
      const outputWidth = example.output?.[0]?.length || 0;
      const sizeKey = `${outputWidth}x${outputHeight}`;
      
      if (!seenSizes.has(sizeKey) && outputWidth > 0 && outputHeight > 0) {
        seenSizes.add(sizeKey);
        suggestions.push({
          width: outputWidth,
          height: outputHeight,
          label: `(Ex ${index + 1})`
        });
      }
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  // Helper function to log player actions and increment step index
  const logPlayerAction = async (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null,
    status: "won" | "fail" | "stop" | "start" = "start"
  ) => {
    try {
      const currentTime = Date.now();
      const deltaMs = currentTime - sessionStartTime.current;
      
      await playFabEvents.logPuzzleEvent(
        "SFMC",                    // eventName
        sessionId,                 // sessionId
        attemptNumber,             // attemptNumber
        playFabPuzzleId,           // game_id (PlayFab format puzzle ID)
        stepIndex,                 // stepIndex (current step)
        positionX,                 // positionX
        positionY,                 // positionY
        payloadSummary,            // payloadSummary
        deltaMs,                   // deltaMs (time since session start)
        "Officer Track Puzzle",    // game_title
        status,                    // status
        "officer-track",           // category
        eventType as EventType,    // event_type
        displayState.selectedValue,// selection_value
        new Date().toISOString()   // game_time
      );
      
      // Increment step index for next action
      setStepIndex(prev => prev + 1);
    } catch (error) {
      // Event logging failures should not break gameplay - fail silently
    }
  };

  // Handle output size change for current test
  const handleSizeChange = (newWidth: number, newHeight: number) => {
    const oldDimensions = outputDimensions[currentTestIndex];
    
    const newDimensions = [...outputDimensions];
    newDimensions[currentTestIndex] = { width: newWidth, height: newHeight };
    setOutputDimensions(newDimensions);

    // Create new empty grid with new dimensions
    const newGrid = Array(newHeight).fill(null).map(() => Array(newWidth).fill(0));
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);

    // Mark as incomplete since we reset the solution
    const newCompleted = [...completedTests];
    newCompleted[currentTestIndex] = false;
    setCompletedTests(newCompleted);

    // Log grid size change event
    logPlayerAction(
      "grid_resize",
      0,
      currentTestIndex,
      {
        fromSize: oldDimensions,
        toSize: { width: newWidth, height: newHeight },
        testCase: currentTestIndex
      }
    );
  };

  // Handle test case selection
  const handleTestSelect = (testIndex: number) => {
    const oldTestIndex = currentTestIndex;
    setCurrentTestIndex(testIndex);

    // Log test case navigation event
    logPlayerAction(
      "test_navigation",
      0,
      testIndex,
      {
        fromTest: oldTestIndex,
        toTest: testIndex,
        totalTests: totalTests
      }
    );
  };

  // Get current solution for active test
  const currentSolution = solutions[currentTestIndex] || [];
  const currentDimensions = outputDimensions[currentTestIndex] || { width: 3, height: 3 };
  const hasExistingData = currentSolution.some(row => row.some(cell => cell !== 0));


  // Validate puzzle with PlayFab when all tests are complete
  const validatePuzzleWithPlayFab = async () => {
    if (isValidating) return; // Prevent double submission
    
    setIsValidating(true);
    setValidationError(null);
    
    // DEBUG: Log puzzle ID being sent to PlayFab
    console.log('🔍 DEBUG - Puzzle validation details:');
    console.log('  Puzzle ID:', puzzle.id);
    console.log('  Solutions array:', solutions);
    console.log('  Total test cases:', totalTests);
    console.log('  Expected outputs:', puzzle.test?.map(t => t.output));
    
    // Log validation start event
    logPlayerAction(
      "validation_start",
      0,
      0,
      {
        validationType: "playfab_cloudscript",
        totalTests: totalTests,
        puzzleId: puzzle.id,
        debugInfo: {
          puzzleIdSent: puzzle.id,
          solutionsCount: solutions.length,
          expectedTestCases: totalTests
        }
      },
      "start"
    );
    
    try {
      const validationStartTime = Date.now();
      const timeElapsedInSeconds = Math.floor((validationStartTime - sessionStartTime.current) / 1000);

      console.log(`[TIMER] Validation for ${puzzle.id}:\n  Start Time: ${sessionStartTime.current}\n  End Time:   ${validationStartTime}\n  Elapsed (s): ${timeElapsedInSeconds}`);

      console.log(`🔄 Using PlayFab ID: ${playFabPuzzleId} (converted from ${puzzle.id})`);

      const validationArgs = {
        puzzleId: playFabPuzzleId,
        solutions: solutions,
        timeElapsed: timeElapsedInSeconds,
        attemptNumber: attemptNumber,
        stepCount: Math.max(stepIndex, 1), // Ensure stepCount is at least 1
        sessionId: sessionId
      };

      console.log('🚀 DEBUG - Sending to CloudScript:', JSON.stringify(validationArgs, null, 2));

      const result = await playFabValidation.validateARCPuzzle(validationArgs);
      
      // Increment attempt number for the next try
      setAttemptNumber(prev => prev + 1);
      
      const validationDuration = Date.now() - validationStartTime;
      setValidationResult(result);
      
      console.log('✅ DEBUG - PlayFab validation result:', result);

      // Show success modal for correct answers
      if (result?.correct) {
        setShowSuccessModal(true);
      }

      // In assessment mode, use validation result callback for advancement logic
      if (isAssessmentMode) {
        if (onValidationResult) {
          console.log('📝 Assessment mode: Calling onValidationResult with:', result);
          onValidationResult(result);
        } else {
          console.error('⚠️ Assessment mode but no onValidationResult callback provided!');
        }
      }
      
      // In regular mode, use original onSolve logic
      if (!isAssessmentMode && result?.correct && onSolve) {
        console.log('✅ Regular mode: Puzzle solved, calling onSolve callback.');
        onSolve();
      }
      
      // Log validation complete event (success)
      logPlayerAction(
        "validation_complete",
        0,
        0,
        {
          serverResult: result,
          validationDurationMs: validationDuration,
          correct: result?.correct,
          puzzleId: puzzle.id
        },
        result?.correct ? "won" : "fail"
      );
      
    } catch (error: any) {
      console.error('❌ DEBUG - PlayFab validation error:', error);
      setValidationError(error.message || 'Validation failed');
      
      // Log validation complete event (error)
      logPlayerAction(
        "validation_complete",
        0,
        0,
        {
          error: error.message || 'Validation failed',
          validationType: "playfab_cloudscript",
          puzzleId: puzzle.id
        },
        "fail"
      );
      
    } finally {
      setIsValidating(false);
    }
  };

  // Update current solution
  const updateCurrentSolution = (newGrid: ARCGrid) => {
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);

    // Assessment mode: guided hand-holding with client-side validation
    if (isAssessmentMode && expectedOutput.length > 0 && totalTests > 1) {
      const matches = JSON.stringify(newGrid) === JSON.stringify(expectedOutput);
      const newAssessmentCompleted = [...assessmentTestsCompleted];
      const wasAlreadyCompleted = newAssessmentCompleted[currentTestIndex];
      newAssessmentCompleted[currentTestIndex] = matches;
      setAssessmentTestsCompleted(newAssessmentCompleted);

      if (matches && !wasAlreadyCompleted) {
        // Show success message and next test button
        if (currentTestIndex < totalTests - 1) {
          setAssessmentGuidanceMessage(`✅ Great! Test ${currentTestIndex + 1} completed. Click 'Next Test' to continue.`);
          setShowNextTestButton(true);
        } else {
          // Last test completed
          setAssessmentGuidanceMessage(`🎉 Excellent! All ${totalTests} tests completed. You can now submit.`);
          setShowNextTestButton(false);
        }
      } else if (!matches) {
        // Reset guidance if solution becomes incorrect
        setAssessmentGuidanceMessage('');
        setShowNextTestButton(false);
      }
    }
    // Regular mode: existing frontend validation logic
    else if (!isAssessmentMode && expectedOutput.length > 0) {
      const matches = JSON.stringify(newGrid) === JSON.stringify(expectedOutput);
      const newCompleted = [...completedTests];
      const wasAlreadyCompleted = newCompleted[currentTestIndex];
      newCompleted[currentTestIndex] = matches;
      setCompletedTests(newCompleted);

      // Log individual test case completion (only on state change) - regular mode only
      if (matches && !wasAlreadyCompleted) {
        logPlayerAction(
          "test_case_complete",
          0,
          currentTestIndex,
          {
            testCase: currentTestIndex,
            totalTests: totalTests,
            correctSolution: true,
            validationType: "frontend_only"
          },
          "won"
        );

        // Auto-advance between test cases within same puzzle (regular mode only)
        if (currentTestIndex < totalTests - 1) {
          console.log(`✅ Test ${currentTestIndex + 1} completed. Auto-advancing to test ${currentTestIndex + 2}...`);

          // Show auto-advance notification
          setIsAutoAdvancing(true);
          setAutoAdvanceMessage(`Test ${currentTestIndex + 1} of ${totalTests} complete! Moving to Test ${currentTestIndex + 2}...`);

          // Auto-advance to next test after a brief delay for user feedback
          setTimeout(() => {
            setCurrentTestIndex(prevIndex => prevIndex + 1);
            setIsAutoAdvancing(false);
            setAutoAdvanceMessage(null);
          }, 1500);
        }
      }
    }
  };

  // Enhanced display control handlers
  const handleDisplayModeChange = (mode: DisplayMode) => {
    const oldMode = displayState.displayMode;
    setDisplayState(prev => ({ ...prev, displayMode: mode }));

    // Log display mode change event
    logPlayerAction(
      "display_mode_change",
      0,
      0,
      {
        fromMode: oldMode,
        toMode: mode,
        emojiSet: displayState.emojiSet
      }
    );
  };

  const handleEmojiSetChange = (emojiSet: EmojiSet) => {
    const oldEmojiSet = displayState.emojiSet;
    setDisplayState(prev => ({ ...prev, emojiSet }));

    // Log emoji set change event
    logPlayerAction(
      "emoji_set_change",
      0,
      0,
      {
        fromSet: oldEmojiSet,
        toSet: emojiSet,
        displayMode: displayState.displayMode
      }
    );
  };

  const handleValueSelect = (value: number) => {
    const oldValue = displayState.selectedValue;
    setDisplayState(prev => ({ ...prev, selectedValue: value }));

    // Log palette value selection event
    logPlayerAction(
      "palette_selection",
      0,
      0,
      {
        fromValue: oldValue,
        toValue: value,
        displayMode: displayState.displayMode
      }
    );
  };

  // Enhanced cell interaction for value painting
  const handleCellInteraction = (row: number, col: number, value: number) => {
    const oldValue = currentSolution[row]?.[col] || 0;
    const newGrid = [...currentSolution];
    newGrid[row][col] = displayState.selectedValue;
    
    // Log cell modification event
    logPlayerAction(
      "cell_change",
      row,
      col,
      {
        oldValue: oldValue,
        newValue: displayState.selectedValue,
        testCase: currentTestIndex,
        tool: "paint"
      }
    );
    
    updateCurrentSolution(newGrid);
  };

  // Get values used in current puzzle for palette highlighting
  const getUsedValues = (): number[] => {
    const allGrids = [
      ...trainingExamples.flatMap(ex => [ex.input, ex.output]),
      testInput,
      expectedOutput
    ].filter(grid => grid.length > 0);

    const usedValues = new Set<number>();
    allGrids.forEach(grid => {
      grid.forEach(row => {
        row.forEach(cell => usedValues.add(cell));
      });
    });

    return Array.from(usedValues).sort((a, b) => a - b);
  };

  // Get context-aware validation message based on puzzle structure
  const getValidationMessage = (): string => {
    if (!validationResult) return '';
    
    if (validationResult.correct) return ' Puzzle solved successfully!';
    
    const testCount = puzzle.test?.length || 1;
    if (testCount === 1) {
      return ' Solution is incorrect. Try again!';
    } else {
      return ` Some test cases failed. (${testCount} tests required)`;
    }
  };

  // Copy input to solution
  const copyInput = () => {
    if (testInput.length > 0) {
      updateCurrentSolution(testInput.map(row => [...row]));
    }
  };

  // Handle Next Test button for assessment mode
  const handleNextTest = () => {
    if (currentTestIndex < totalTests - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
      setShowNextTestButton(false);
      setAssessmentGuidanceMessage('');
    }
  };

  // Reset solution to empty
  const handleReplayTutorial = () => {
    setLocation('/tutorial');
  };

  const resetSolution = () => {
    const { width, height } = currentDimensions;
    const emptyGrid = Array(height).fill(null).map(() => Array(width).fill(0));
    updateCurrentSolution(emptyGrid);
  };

  const renderBadges = () => {
    if (!performanceStats) return [];

    const badges = [
      <Badge key="dataset" variant="outline" className="border-sky-400 text-sky-300">
        Dataset: {performanceStats.dataset}
      </Badge>,
      <Badge key="accuracy" variant="outline" className="border-green-400 text-green-300">
        AI Accuracy: {performanceStats.avgAccuracy.toFixed(1)}%
      </Badge>,
      <Badge key="attempts" variant="outline" className="border-purple-400 text-purple-300">
        AI Attempts: {performanceStats.totalAttempts}
      </Badge>,
    ];

    // Add dangerous overconfidence warning if detected
    if (performanceStats.dangerousOverconfidence) {
      badges.push(
        <Badge key="warning" variant="outline" className="border-red-400 text-red-300 animate-pulse">
          🚨 AI Overconfident
        </Badge>
      );
    }


    return badges;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      <Navbar 
        title="Are you smarter than a Chatbot?" 
        badges={renderBadges()} 
        showBackButton={true} 
        onBack={onBack}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        

        {/* Training Examples Section */}
        {trainingExamples.length > 0 && (
          <TrainingExamplesSection
            examples={trainingExamples}
            emojiSet={displayState.emojiSet}
            displayMode={displayState.displayMode}
            title="Training Examples - Apply what you learn from them to solve the puzzle"
          />
        )}


        {/* Test Case Navigation - SILVER THEME */}
        {totalTests > 1 && (
          <div className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-200 border-2 border-slate-400 rounded-lg p-4 shadow-lg">
            <div className="mb-3">
              <h3 className="text-slate-800 text-lg font-bold flex items-center gap-2 mb-1">
                Multi-Test Puzzle - All {totalTests} Tests Required
              </h3>
              <p className="text-slate-700 text-base">
                {isAssessmentMode
                  ? `Complete each test step-by-step. Switch between tests using the buttons below.`
                  : `You must solve ALL ${totalTests} test cases to complete this puzzle. Switch between tests using the buttons below.`
                }
              </p>
            </div>
            <TestCaseNavigation
              totalTests={totalTests}
              currentTestIndex={currentTestIndex}
              completedTests={completedTests}
              onTestSelect={handleTestSelect}
            />
          </div>
        )}


        {/* Solving Interface - Full Screen Width */}
        <div className="w-full">
          {/* Auto-advance notification for assessment mode */}
          {isAutoAdvancing && autoAdvanceMessage && (
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-4 animate-pulse">
              <div className="text-green-300 text-center font-semibold flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-300"></div>
                {autoAdvanceMessage}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-amber-400 font-bold text-5xl">
                Test Case {currentTestIndex + 1}
                {isAssessmentMode && totalTests > 1 && (
                  <span className="text-slate-400 text-2xl font-normal ml-2">
                    of {totalTests}
                  </span>
                )}
              </h2>
              <DisplayModeToolbar 
                displayMode={displayState.displayMode} 
                onDisplayModeChange={handleDisplayModeChange}
                emojiSet={displayState.emojiSet}
                onEmojiSetChange={handleEmojiSetChange}
              />
            </div>
            <div className="text-slate-300 text-xl font-medium">
              {isValidating ? '🔄 Validating with PlayFab...' : 
               validationResult?.correct ? '🎉 PlayFab Verified!' :
               validationError ? '❌ PlayFab Validation Error' :
               'Apply the pattern to solve'}
            </div>
          </div>

          {/* Responsive layout: vertical on mobile, horizontal on larger screens */}
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Test Input - Full width on mobile, left column on large screens */}
            <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-amber-300 text-3xl font-bold text-center">Test Input</h3>
                <div className="w-1/2">
                  <SizeSlider value={inputCellSize} onChange={setInputCellSize} min={50} max={100} label="Grid Size" />
                </div>
              </div>
              <ResponsiveOfficerDisplayGrid
                grid={testInput}
                containerType="solver"
                emojiSet={displayState.emojiSet}
                displayMode={displayState.displayMode}
                className="w-full h-full"
                fixedCellSize={inputCellSize}
              />
            </div>

            {/* Central Controls Wrapper - Full width on mobile, center column on large screens */}
            <div className="flex flex-col items-center justify-center px-2 space-y-4 lg:max-w-md lg:flex-shrink-0">
              
              {/* Grid Size Controls */}
              <PuzzleSolverControls
                currentDimensions={currentDimensions}
                onSizeChange={handleSizeChange}
                getSuggestedSizes={getSuggestedSizes}
              />

              {/* Display Controls, Actions, Palette, and Validation */}
              <PuzzleTools
                displayMode={displayState.displayMode}
                emojiSet={displayState.emojiSet}
                selectedValue={displayState.selectedValue}
                onValueSelect={handleValueSelect}
                onCopyInput={copyInput}
                onResetSolution={resetSolution}
                onReplayTutorial={handleReplayTutorial}
                onValidate={() => validatePuzzleWithPlayFab()}
                isValidating={isValidating}
                allTestsCompleted={isAssessmentMode ? false : completedTests.every(test => test)}
                usedValues={getUsedValues()}
                isAssessmentMode={isAssessmentMode}
              />
            </div>

            {/* User Solution - Full width on mobile, right column on large screens */}
            <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-amber-300 text-3xl font-bold text-center">
                  Your Solution
                  {isAssessmentMode && totalTests > 1 && (
                    <span className="text-slate-400 text-xl font-normal ml-2">
                      - Test {currentTestIndex + 1} of {totalTests}
                    </span>
                  )}
                </h3>
                <div className="w-1/2">
                  <SizeSlider value={outputCellSize} onChange={setOutputCellSize} min={50} max={100} label="Grid Size" />
                </div>
              </div>

              {/* Assessment Mode Guidance */}
              {isAssessmentMode && totalTests > 1 && (
                <div className="mb-4 p-3 bg-slate-700 border border-slate-500 rounded-lg">
                  <p className="text-slate-300 text-center">
                    Complete each test step-by-step to learn the multi-test workflow.
                  </p>
                  {assessmentGuidanceMessage && (
                    <div className="mt-2 p-2 bg-green-900 border border-green-600 rounded text-green-300 text-center">
                      {assessmentGuidanceMessage}
                    </div>
                  )}
                  {showNextTestButton && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={handleNextTest}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all duration-300 ring-2 ring-blue-400 shadow-lg animate-pulse [animation-duration:2s]"
                      >
                        Next Test →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Copy Input Button with Glow - Positioned right under "Your Solution" */}
              <div className="mb-4 flex justify-center">
                <button
                  onClick={copyInput}
                  className="
                    px-6 py-3 text-lg font-bold rounded-lg h-12 transition-all duration-300
                    border-2 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white
                    bg-slate-700 hover:scale-105 hover:shadow-lg
                    ring-2 ring-blue-400 shadow-lg shadow-blue-400/30 animate-pulse [animation-duration:3s]
                  "
                  title="Copy the test input as a starting point for your solution"
                >
                  📋 Copy Input to Start
                </button>
              </div>

              {/* Submit Button with Glow - Right below Copy Input */}
              <div className="mb-4 flex justify-center">
                <button
                  onClick={() => validatePuzzleWithPlayFab()}
                  disabled={isValidating || (isAssessmentMode && totalTests > 1 && !assessmentTestsCompleted.every(test => test))}
                  className="
                    px-6 py-4 text-xl font-bold rounded-lg h-16 w-full transition-all duration-300
                    bg-amber-600 hover:bg-amber-700 text-white
                    ring-2 ring-amber-400 shadow-lg shadow-amber-400/30 animate-pulse [animation-duration:4s]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isValidating ? '🔄 Submitting to PlayFab...' :
                   isAssessmentMode && totalTests > 1 ? `🎯 Submit All ${totalTests} Tests` :
                   '🎯 Submit for Official Validation'}
                </button>
              </div>
              <ResponsiveOfficerGrid
                initialGrid={currentSolution}
                containerType="solver"
                emojiSet={displayState.emojiSet}
                displayMode={displayState.displayMode}
                selectedValue={displayState.selectedValue}
                onCellInteraction={handleCellInteraction}
                enableDragToPaint={true}
                className="w-full h-full"
                onChange={updateCurrentSolution}
                fixedCellSize={outputCellSize}
              />
            </div>
          </div>

          {/* Validation Status */}
          {validationError && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 mt-4">
              <div className="text-red-300 text-base">
                <strong>❌ Validation Error:</strong> {validationError}
              </div>
            </div>
          )}

          {validationResult && (
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mt-4">
              <div className="text-green-300 text-base">
                <strong>✅ PlayFab Validation Complete:</strong> 
                {getValidationMessage()}
                {validationResult.timeElapsed && (
                  <div>Time: {validationResult.timeElapsed.toFixed(1)}s</div>
                )}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Success Modal */}
      {isAssessmentMode ? (
        <AssessmentStepSuccessModal
          open={showSuccessModal}
          puzzleId={puzzle.id}
          onClose={() => setShowSuccessModal(false)} // onClose just closes the modal
          onAssessmentAdvance={onAssessmentAdvance} // onAssessmentAdvance handles moving to the next puzzle
        />
      ) : (
        <SuccessModal
          open={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
          }}
          title="Excellent Work!"
          message="Puzzle solved successfully! Click OK to continue to the next challenge..."
          showDesignerNotes={true}
        />
      )}
    </div>
  );
}