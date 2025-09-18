/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-17
 * PURPOSE: Extracted session logging and lifecycle management from ResponsivePuzzleSolver.tsx.
 * This hook manages session tracking, player action logging, and session lifecycle events.
 * Preserves exact behavior from the original implementation.
 * SRP and DRY check: Pass - Single responsibility for session logging and lifecycle
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import type { EventType } from '@/types/playfab';
import { playFabEvents } from '@/services/playfab/events';
import { idConverter } from '@/services/idConverter';

export interface SessionLoggerHook {
  // Session state
  sessionId: string;
  sessionStartTime: number;
  stepIndex: number;
  attemptNumber: number;

  // Actions
  logPlayerAction: (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null,
    status?: "won" | "fail" | "stop" | "start"
  ) => Promise<void>;
  incrementAttemptNumber: () => void;
}

export interface UseSessionLoggerOptions {
  puzzle: OfficerTrackPuzzle;
  selectedValue?: number;
}

/**
 * Session logging hook extracted from ResponsivePuzzleSolver.tsx
 * Copies exact behavior from lines 69-72, 203-267, 294-328
 */
export function useSessionLogger(options: UseSessionLoggerOptions): SessionLoggerHook {
  const { puzzle, selectedValue = 1 } = options;

  // EXACT COPY from lines 69-72: Session tracking state
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionStartTime = useRef(Date.now());
  const [stepIndex, setStepIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);

  const totalTests = puzzle.test?.length || 0;
  const trainingExamples = puzzle.train || [];

  // Convert puzzle ID to PlayFab format - use the first variant (CloudScript will search all batches)
  const playFabVariants = idConverter.getAllPlayFabVariants(puzzle.id);
  const playFabPuzzleId = playFabVariants[0] || puzzle.id;

  // EXACT COPY from lines 294-328: Helper function to log player actions and increment step index
  const logPlayerAction = useCallback(async (
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
        selectedValue,             // selection_value
        new Date().toISOString()   // game_time
      );

      // Increment step index for next action
      setStepIndex(prev => prev + 1);
    } catch (error) {
      // Event logging failures should not break gameplay - fail silently
    }
  }, [sessionId, attemptNumber, playFabPuzzleId, stepIndex, selectedValue]);

  // EXACT COPY from lines 203-267: Initialize session and log puzzle start event
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

    // Reset session start time and step index for new puzzle
    sessionStartTime.current = Date.now();
    setStepIndex(0);
    console.log(`[useSessionLogger] New session started for puzzle ${puzzle.id}. Session ID: ${sessionId}`);

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
  }, [sessionId, puzzle.id, attemptNumber, playFabPuzzleId, stepIndex, totalTests, trainingExamples.length]); // Only re-run when puzzle changes, not on every step

  // Utility to increment attempt number (used after validation)
  const incrementAttemptNumber = useCallback(() => {
    setAttemptNumber(prev => prev + 1);
  }, []);

  return {
    // Session state
    sessionId,
    sessionStartTime: sessionStartTime.current,
    stepIndex,
    attemptNumber,

    // Actions
    logPlayerAction,
    incrementAttemptNumber,
  };
}