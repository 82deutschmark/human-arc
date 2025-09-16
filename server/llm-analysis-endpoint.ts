/**
 * Authored by: Cascade using Gemini 2.5 Pro
 * Date: 2025-09-15T19:34:56-04:00
 * PURPOSE: Server endpoint to trigger LLM winner detection pipeline from UI
 * Allows users to run AI analysis and leaderboard updates on-demand
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface AnalysisRequest {
  puzzleId: string;
  triggeredBy?: string; // Optional user identifier
}

interface AnalysisResponse {
  success: boolean;
  message: string;
  puzzleId: string;
  executionTimeMs?: number;
  winnersFound?: number;
  error?: string;
}

/**
 * Triggers the LLM winner detection and PlayFab upload pipeline
 * for a specific puzzle ID
 */
export async function triggerLLMAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
  const { puzzleId, triggeredBy } = request;
  const startTime = Date.now();

  console.log(`🔄 Starting LLM analysis for puzzle ${puzzleId}${triggeredBy ? ` (triggered by ${triggeredBy})` : ''}`);

  try {
    // Validate puzzle ID format (basic check)
    if (!puzzleId || !/^[a-f0-9]{8}$/.test(puzzleId)) {
      return {
        success: false,
        message: 'Invalid puzzle ID format',
        puzzleId,
        error: 'Puzzle ID must be 8-character hex string'
      };
    }

    // Build path to the e2e pipeline script
    const scriptPath = path.resolve(__dirname, '../scripts/llm-winner-e2e-pipeline.ts');
    const command = `npx tsx "${scriptPath}" ${puzzleId}`;

    // Execute the pipeline script
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.resolve(__dirname, '..'),
      timeout: 300000, // 5 minute timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
    });

    const executionTime = Date.now() - startTime;

    // Parse output to extract winner count (basic parsing)
    const winnerMatch = stdout.match(/(\d+)\s+winners?\s+found/i);
    const winnersFound = winnerMatch ? parseInt(winnerMatch[1]) : undefined;

    console.log(`✅ LLM analysis completed for puzzle ${puzzleId} in ${executionTime}ms`);
    
    if (stderr) {
      console.warn(`⚠️ Pipeline stderr output:`, stderr);
    }

    return {
      success: true,
      message: `AI analysis completed successfully. Found ${winnersFound || 'unknown'} winners.`,
      puzzleId,
      executionTimeMs: executionTime,
      winnersFound
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    console.error(`❌ LLM analysis failed for puzzle ${puzzleId}:`, error);

    return {
      success: false,
      message: 'AI analysis failed',
      puzzleId,
      executionTimeMs: executionTime,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Express.js route handler for POST /api/llm-analysis
 * Usage: POST /api/llm-analysis { "puzzleId": "a699fb00" }
 */
export async function handleLLMAnalysisRequest(req: any, res: any) {
  try {
    const { puzzleId, triggeredBy } = req.body;

    if (!puzzleId) {
      return res.status(400).json({
        success: false,
        message: 'puzzleId is required',
        error: 'Missing required parameter'
      });
    }

    const result = await triggerLLMAnalysis({ puzzleId, triggeredBy });

    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);

  } catch (error: any) {
    console.error('LLM Analysis endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Batch analysis for multiple puzzles
 * Processes puzzles sequentially to avoid overwhelming the system
 */
export async function triggerBatchLLMAnalysis(puzzleIds: string[], triggeredBy?: string): Promise<AnalysisResponse[]> {
  const results: AnalysisResponse[] = [];
  
  console.log(`🔄 Starting batch LLM analysis for ${puzzleIds.length} puzzles`);

  for (const puzzleId of puzzleIds) {
    const result = await triggerLLMAnalysis({ puzzleId, triggeredBy });
    results.push(result);

    // Add delay between puzzles to be respectful of rate limits
    if (puzzleIds.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Batch analysis completed: ${successCount}/${puzzleIds.length} successful`);

  return results;
}
