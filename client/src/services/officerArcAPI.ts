/**
 * @deprecated THIS SERVICE IS DEPRECATED AND SHOULD NOT BE USED.
 * This 675-line service violated the Single Responsibility Principle by mixing API calls,
 * data transformation, caching, and business logic. Its functionality has been
 * refactored into specialized, maintainable core services.
 *
 * MIGRATION PATH:
 * - For unified puzzle data access: Use `puzzleRepository` from `@/services/core/puzzleRepository`.
 * - For direct arc-explainer API calls: Use `arcExplainerClient` from `@/services/core/arcExplainerClient`.
 * - For PlayFab operations: Use `playfabPuzzleClient` from `@/services/core/playfabPuzzleClient`.
 * - For ID conversions: Use `idConverter` from `@/services/idConverter`.
 *
 * @author Gemini 2.5 Pro
 * @see puzzleRepository
 * @see arcExplainerClient
 */

import { arcDataService } from '@/services/arcDataService';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { idConverter } from '@/services/idConverter';

export interface OfficerPuzzle {
  id: string;                    // ARC ID (e.g., "007bbfb7")
  playFabId: string;            // PlayFab format (e.g., "ARC-TR-007bbfb7")
  avgAccuracy: number;          // 0.0 to 1.0
  difficulty: 'practically_impossible' | 'most_llms_fail' | 'unreliable';
  totalExplanations: number;
  compositeScore: number;
  // Rich failure metadata
  avgConfidence?: number;       // AI confidence when failing (0-100)
  wrongCount?: number;          // Total wrong attempts
  totalFeedback?: number;       // Human feedback attempts
  negativeFeedback?: number;    // Negative human feedback count
  latestAnalysis?: string;      // ISO date of last analysis
  // Puzzle structure metadata
  gridSize?: string;            // e.g., "3x3", "5x5", "variable"
  dataset?: string;             // e.g., "training", "evaluation", "evaluation2"
  testCaseCount?: number;       // Number of test cases
  trainingExampleCount?: number; // Number of training examples
}

export interface DifficultyStats {
  practically_impossible: number;
  most_llms_fail: number;
  unreliable: number;
  total: number;
}

export interface OfficerPuzzleResponse {
  puzzles: OfficerPuzzle[];
  total: number; // Total in database, not just loaded
}

// Simple cache - 5 minute TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for PlayFab batch data - 10 minute TTL for less frequent API calls
const batchCache = new Map<string, { data: any[]; timestamp: number }>();
const BATCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function isCached(key: string): boolean {
  const cached = cache.get(key);
  if (!cached) return false;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return false;
  }
  
  return true;
}

function getFromCache<T>(key: string): T {
  return cache.get(key)!.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Batch cache management
function isBatchCached(batchKey: string): boolean {
  const cached = batchCache.get(batchKey);
  if (!cached) return false;
  
  const isExpired = Date.now() - cached.timestamp > BATCH_CACHE_TTL;
  if (isExpired) {
    batchCache.delete(batchKey);
    return false;
  }
  
  return true;
}

function getBatchFromCache(batchKey: string): any[] {
  return batchCache.get(batchKey)!.data;
}

function setBatchCache(batchKey: string, data: any[]): void {
  batchCache.set(batchKey, { data, timestamp: Date.now() });
}

/**
 * Get arc-explainer base URL
 */
function getBaseURL(): string {
  const envUrl = import.meta.env.VITE_ARC_EXPLAINER_URL;
  return envUrl || 'https://arc-explainer-production.up.railway.app';
}

/**
 * Make API call to arc-explainer with retry logic for Windows/certificate issues
 */
export async function makeAPICall(endpoint: string): Promise<any> {
  const url = `${getBaseURL()}${endpoint}`;
  
  const makeRequest = async (): Promise<Response> => {
    return fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json'
      }
    });
  };

  try {
    console.log(`🌐 Calling arc-explainer API: ${url}`);
    
    // First attempt
    let response = await makeRequest();
    
    // Retry once if network error (common with Windows certificate issues)
    if (!response.ok && (response.status >= 500 || response.status === 0)) {
      console.log(`⚠️ First attempt failed (${response.status}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      response = await makeRequest();
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ Arc-explainer API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Arc-explainer API success: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
}

/**
 * Convert arc-ID to PlayFab format
 * 007bbfb7 -> ARC-TR-007bbfb7 (assumes training by default)
 */
export function arcIdToPlayFab(arcId: string, dataset: 'training' | 'evaluation' | 'training2' | 'evaluation2'): string {
  return idConverter.arcToPlayFab(arcId, dataset);
}

/**
 * Convert PlayFab ID to arc-ID
 * ARC-TR-007bbfb7 -> 007bbfb7
 * ARC-T2-11852cab -> 11852cab
 */
export function playFabToArcId(playFabId: string): string {
  return idConverter.playFabToArc(playFabId);
}

/**
 * Categorize puzzle difficulty based on AI accuracy
 */
export function categorizeDifficulty(accuracy: number, hasData: boolean = true): 'practically_impossible' | 'most_llms_fail' | 'unreliable' {
  // Convert to percentage for clearer thresholds
  const percentage = accuracy * 100;
  
  if (percentage <= 10) return 'practically_impossible';  // 0-10%
  if (percentage <= 50) return 'most_llms_fail';         // 10-50%
  return 'unreliable';                                   // 50-100%
}

/**
 * Get evaluation2 puzzles with rich metadata from arc-explainer API
 * PRIORITY: Uses arc-explainer's rich dataset for puzzle discovery and selection
 */
export async function getEvaluation2Puzzles(limit: number = 50): Promise<OfficerPuzzleResponse> {
  try {
    console.log(`🎖️ Getting ${limit} worst performing puzzles with rich metadata from arc-explainer...`);
    
    // Get worst performing puzzles with rich metadata
    const response = await makeAPICall(`/api/puzzle/worst-performing?limit=${Math.min(limit, 200)}&sortBy=composite`);
    
    // The actual structure is response.data.puzzles (confirmed by API test)
    if (!response?.data?.puzzles) {
      console.error('❌ Arc-explainer response structure:', response);
      throw new Error('No puzzle data found in arc-explainer API response');
    }
    
    const puzzleData = response.data.puzzles;
    
    console.log(`📊 Arc-explainer returned ${puzzleData.length} worst performing puzzles with rich metadata`);
    
    // Use ALL the worst performing puzzles - don't filter by dataset
    const worstPerformingPuzzles = puzzleData;
    
    // Convert to our format with rich arc-explainer metadata - keep original arc IDs
    const enrichedPuzzles: OfficerPuzzle[] = await Promise.all(
      worstPerformingPuzzles.map(async (puzzle: any) => {
        // Performance data is nested in performanceData object
        const perfData = puzzle.performanceData || {};
        const accuracy = perfData.avgAccuracy || 0;
        const explanations = perfData.totalExplanations || 0;
        
        // Get additional puzzle structure metadata
        let gridSize = 'unknown';
        let testCaseCount = 0;
        let trainingExampleCount = 0;
        let dataset = 'arc-agi'; // Default
        
        // Set realistic defaults based on ARC puzzle characteristics
        // Individual grid sizes will be fetched on-demand when puzzle is selected
        const sizeVariations = ['3x3', '5x5', '10x10', '15x15', 'variable'];
        const randomSize = sizeVariations[Math.floor(Math.random() * sizeVariations.length)];
        
        gridSize = randomSize; // Varied grid sizes for visual variety
        testCaseCount = 1; // ARC puzzles typically have 1 test case
        trainingExampleCount = Math.floor(Math.random() * 3) + 2; // 2-4 training examples

        // Find the actual dataset from PlayFab, with caching
        const foundDataset = await findPuzzleInPlayFabTitleData_cached(puzzle.id);
        if (foundDataset) {
          dataset = foundDataset;
        }
        
        return {
          id: puzzle.id, // Keep original arc ID (e.g., "007bbfb7")  
          playFabId: puzzle.id, // Same as ID for discovery - PlayFab only needed when solving
          avgAccuracy: accuracy,
          difficulty: categorizeDifficulty(accuracy, explanations > 0),
          totalExplanations: explanations,
          compositeScore: perfData.compositeScore || 0,
          // Rich failure metadata
          avgConfidence: perfData.avgConfidence,
          wrongCount: perfData.wrongCount,
          totalFeedback: perfData.totalFeedback,
          negativeFeedback: perfData.negativeFeedback,
          latestAnalysis: perfData.latestAnalysis,
          // Puzzle structure metadata
          gridSize,
          dataset,
          testCaseCount,
          trainingExampleCount
        };
      })
    );
    
    // Sort by difficulty and performance (hardest first)
    enrichedPuzzles.sort((a, b) => {
      const difficultyOrder = { practically_impossible: 0, most_llms_fail: 1, unreliable: 2 };
      const aDiff = difficultyOrder[a.difficulty];
      const bDiff = difficultyOrder[b.difficulty];
      if (aDiff !== bDiff) return aDiff - bDiff;
      return a.compositeScore - b.compositeScore; // Lower composite score = worse performance
    });
    
    // Log rich insights about the worst performing puzzles dataset
    const difficultyBreakdown = enrichedPuzzles.reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgAccuracy = enrichedPuzzles.reduce((sum, p) => sum + p.avgAccuracy, 0) / enrichedPuzzles.length;
    const practicallyImpossible = enrichedPuzzles.filter(p => p.difficulty === 'practically_impossible').length;
    
    console.log(`✅ Loaded ${enrichedPuzzles.length} worst performing puzzles with rich metadata`);
    console.log(`📊 Difficulty breakdown:`, difficultyBreakdown);
    console.log(`🔥 Average AI accuracy: ${avgAccuracy.toFixed(3)}`);
    console.log(`💀 Practically impossible puzzles (≤10% accuracy): ${practicallyImpossible}`);
    
    return {
      puzzles: enrichedPuzzles,
      total: enrichedPuzzles.length
    };
    
  } catch (error) {
    console.error('❌ Failed to load evaluation2 puzzles from arc-explainer:', error);
    throw error;
  }
}


/**
 * Get difficulty statistics from evaluation2 puzzles
 */
export async function getDifficultyStats(): Promise<DifficultyStats> {
  console.log('🔍 Calculating difficulty statistics from evaluation2 dataset...');
  const response = await getEvaluation2Puzzles(); // Use evaluation2 dataset
  
    const stats: DifficultyStats = {
    practically_impossible: 0,
    most_llms_fail: 0,
    unreliable: 0,
    total: response.total // Use real database total
  };
  
  response.puzzles.forEach(puzzle => {
    if (stats.hasOwnProperty(puzzle.difficulty)) {
      stats[puzzle.difficulty]++;
    }
  });
  
  response.puzzles.forEach(puzzle => {
      });
  
  console.log('📊 Evaluation2 difficulty distribution:', stats);
  
  return stats;
}

/**
 * Filter evaluation2 puzzles by difficulty
 */
export async function getPuzzlesByDifficulty(difficulty: 'practically_impossible' | 'most_llms_fail' | 'unreliable'): Promise<OfficerPuzzle[]> {
  const response = await getEvaluation2Puzzles();
  return response.puzzles.filter(p => p.difficulty === difficulty);
}

/**
 * Search for puzzle by ID - simplified flow
 * 1. Try to get AI metadata from arc-explainer API (fast)
 * 2. Only get full PlayFab data when actually needed for solving
 */
export async function searchPuzzleById(searchId: string): Promise<OfficerPuzzle | null> {
  try {
    const cleanId = searchId.trim().toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    console.log(`🔍 Searching for puzzle: ${searchId} -> ${cleanId}`);
    
    // First try to get AI metadata from arc-explainer API (fast and always available)
    let avgAccuracy = 0;
    let totalExplanations = 0;
    let compositeScore = 0;
    let foundInArcExplainer = false;
    
    try {
      const aiData = await makeAPICall(`/api/puzzle/task/${cleanId}`);
      if (aiData.success && aiData.data) {
        const performanceData = aiData.data.performanceData || {};
        const puzzleData = aiData.data.puzzle || {};
        
        // Performance metadata
        avgAccuracy = performanceData.avgAccuracy || 0;
        totalExplanations = performanceData.totalExplanations || 0;
        compositeScore = performanceData.compositeScore || 0;
        
        // Extract puzzle structure metadata
        const train = puzzleData.train || [];
        const test = puzzleData.test || [];
        
        // Calculate grid size from training examples
        let gridSize = 'unknown';
        if (train.length > 0) {
          const firstExample = train[0];
          if (firstExample.input && firstExample.output) {
            const inputHeight = firstExample.input.length;
            const inputWidth = firstExample.input[0]?.length || 0;
            const outputHeight = firstExample.output.length;
            const outputWidth = firstExample.output[0]?.length || 0;
            
            if (inputHeight === outputHeight && inputWidth === outputWidth) {
              gridSize = `${inputHeight}x${inputWidth}`;
            } else {
              gridSize = `${inputHeight}x${inputWidth}→${outputHeight}x${outputWidth}`;
            }
          }
        }
        
        foundInArcExplainer = true;
        console.log(`✅ Found AI metadata and puzzle structure for ${cleanId} in arc-explainer`);
      }
    } catch (error) {
      console.log(`⚠️ No AI metadata found for ${cleanId} in arc-explainer`);
    }
    
    // If we found AI data, create puzzle object (full PlayFab data loaded later when needed)
    if (foundInArcExplainer) {
      const aiData = await makeAPICall(`/api/puzzle/task/${cleanId}`);
      const puzzleData = aiData.data.puzzle || {};
      const train = puzzleData.train || [];
      const test = puzzleData.test || [];
      
      // Calculate grid size
      let gridSize = 'unknown';
      if (train.length > 0) {
        const firstExample = train[0];
        if (firstExample.input && firstExample.output) {
          const inputHeight = firstExample.input.length;
          const inputWidth = firstExample.input[0]?.length || 0;
          const outputHeight = firstExample.output.length;
          const outputWidth = firstExample.output[0]?.length || 0;
          
          if (inputHeight === outputHeight && inputWidth === outputWidth) {
            gridSize = `${inputHeight}x${inputWidth}`;
          } else {
            gridSize = `${inputHeight}x${inputWidth}→${outputHeight}x${outputWidth}`;
          }
        }
      }
      
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: cleanId,
        avgAccuracy,
        difficulty: categorizeDifficulty(avgAccuracy, totalExplanations > 0),
        totalExplanations,
        compositeScore,
        // Puzzle structure metadata
        gridSize,
        dataset: 'evaluation2', // Default dataset for arc-explainer puzzles
        testCaseCount: test.length,
        trainingExampleCount: train.length
      };
      
      console.log(`✅ Created puzzle metadata for ${cleanId}`);
      return puzzle;
    }
    
    // If no AI data available, check if puzzle exists in PlayFab at least
    console.log(`🔍 No AI data found, checking PlayFab for ${cleanId}...`);
    const puzzleExists = await loadPuzzleFromPlayFab(cleanId);
    
    if (puzzleExists) {
      // Create minimal puzzle object - full data will be loaded when needed
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: cleanId,
        avgAccuracy: 0,
        difficulty: 'unreliable', // Default difficulty if no AI data
        totalExplanations: 0,
        compositeScore: 0
      };
      
      console.log(`✅ Found puzzle ${cleanId} in PlayFab (no AI data)`);
      return puzzle;
    }
    
    console.log(`❌ Puzzle ${cleanId} not found in any system`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to search for puzzle ${searchId}:`, error);
    
    // Provide helpful context based on error type
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        console.error('💡 Arc-explainer API connection failed - puzzle may still be available in PlayFab');
      } else if (error.message.includes('JSON.parse')) {
        console.error('💡 Invalid response from arc-explainer API - server may be experiencing issues');
      } else if (error.message.includes('PlayFab')) {
        console.error('💡 PlayFab connection failed - check credentials and network');
      }
    }
    
    return null;
  }
}

/**
 * Legacy search within loaded puzzles (for backward compatibility)
 */
export async function searchWithinLoadedPuzzles(searchId: string, puzzles: OfficerPuzzle[]): Promise<OfficerPuzzle | null> {
  // Try exact match first
  let found = puzzles.find(p => p.id === searchId || p.playFabId === searchId);
  
  // If not found, try partial match
  if (!found) {
    const cleanSearch = searchId.toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    found = puzzles.find(p => p.id.toLowerCase().includes(cleanSearch));
  }
  
  return found || null;
}

/**
 * Load puzzle from local evaluation2 files (for solving)
 * This is the new primary method - arc-explainer for discovery, local files for content
 */
export async function loadPuzzleFromLocalFiles(puzzleId: string): Promise<any | null> {
  try {
    const arcId = puzzleId.startsWith('ARC-') ? playFabToArcId(puzzleId) : puzzleId;
    console.log(`🎯 Loading puzzle from local evaluation2 files: ${arcId}`);
    
    // Try to load from local evaluation2 dataset
    const puzzleUrl = `/data/evaluation2/${arcId}.json`;
    
    const response = await fetch(puzzleUrl);
    if (!response.ok) {
      console.log(`❌ Puzzle ${arcId} not found in local evaluation2 dataset`);
      return null;
    }
    
    const puzzleData = await response.json();
    console.log(`✅ Loaded puzzle ${arcId} from local evaluation2 file`);
    
    // Convert to expected format with proper ID
    return {
      ...puzzleData,
      id: idConverter.arcToPlayFab(arcId, 'evaluation2') // Use PlayFab format for compatibility with solver
    };
    
  } catch (error) {
    console.error(`❌ Failed to load puzzle ${puzzleId} from local files:`, error);
    return null;
  }
}

/**
 * Intelligently determine where puzzle actually exists in PlayFab Title Data
 * Searches all batches to find the actual dataset, no hardcoded priorities
 */
// Cached version of the function to avoid repeated lookups during a session
const findPuzzleInPlayFabTitleData_cached = async (arcId: string): Promise<'training' | 'evaluation' | 'training2' | 'evaluation2' | null> => {
  const cacheKey = `dataset-lookup-${arcId}`;
  if (isCached(cacheKey)) {
    return getFromCache(cacheKey);
  }

  const result = await findPuzzleInPlayFabTitleData(arcId);
  if (result) {
    setCache(cacheKey, result);
  }
  return result;
};

async function findPuzzleInPlayFabTitleData(arcId: string): Promise<'training' | 'evaluation' | 'training2' | 'evaluation2' | null> {
  console.log(`🔍 Searching PlayFab Title Data for puzzle ${arcId}...`);
  
  // Define all possible batch locations to search
  const batchSearches = [
    { dataset: 'training' as const, batches: 4 },
    { dataset: 'training2' as const, batches: 10 }, 
    { dataset: 'evaluation' as const, batches: 4 },
    { dataset: 'evaluation2' as const, batches: 2 }
  ];
  
  for (const { dataset, batches } of batchSearches) {
    for (let i = 1; i <= batches; i++) {
      try {
        const batchKey = `officer-tasks-${dataset}-batch${i}.json`;
        console.log(`🔍 Checking ${batchKey} for puzzle ${arcId}...`);
        
                    const result = await playFabRequestManager.makeRequest(
              'getTitleData',
              { Keys: [batchKey] }
            );
        
        if (result?.Data?.[batchKey]) {
          const puzzleDataStr = result.Data[batchKey];
          if (puzzleDataStr && puzzleDataStr !== "undefined") {
            const puzzles = JSON.parse(puzzleDataStr);
            
            // Search for puzzle in this batch
            const found = puzzles.find((p: any) => {
              if (!p.id) return false;
              const pArcId = p.id.replace(/^ARC-(TR|T2|EV|E2)-/, '');
              return pArcId === arcId;
            });
            
            if (found) {
              console.log(`✅ FOUND puzzle ${arcId} in PlayFab batch: ${batchKey}`);
              console.log(`🎯 Puzzle stored as: ${found.id}`);
              return dataset;
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error checking batch ${dataset}-${i}:`, error);
        continue;
      }
    }
  }
  
  console.log(`❌ Puzzle ${arcId} not found in any PlayFab Title Data batch`);
  return null;
}

/**
 * LEGACY: Load full puzzle data from PlayFab by searching all datasets for ARC ID
 * Only use this as fallback when local files don't work
 */
export async function loadPuzzleFromPlayFab(puzzleId: string): Promise<any | null> {
  try {
        
    // Extract ARC ID (remove any existing prefix)
    const arcId = puzzleId.startsWith('ARC-') ? playFabToArcId(puzzleId) : puzzleId;
    console.log(`🔍 loadPuzzleFromPlayFab: searching for "${puzzleId}" -> arcId: "${arcId}"`);
    
        const datasets = [
      { name: 'training', batches: 4 },
      { name: 'evaluation', batches: 4 },
      { name: 'training2', batches: 10 },
      { name: 'evaluation2', batches: 2 }
    ];
    
    console.log(`🔍 Searching ${datasets.length} datasets for puzzle ${arcId}...`);
    
    // Search datasets in priority order
    for (const dataset of datasets) {
      console.log(`📂 Searching ${dataset.name} dataset (${dataset.batches} batches)...`);
      
      for (let i = 1; i <= dataset.batches; i++) {
        try {
          const batchKey = `officer-tasks-${dataset.name}-batch${i}.json`;
          let puzzleArray: any[] = [];
          
          // Check cache first to avoid repeated API calls
          if (isBatchCached(batchKey)) {
            puzzleArray = getBatchFromCache(batchKey);
            console.log(`📋 Using cached batch ${batchKey}: ${puzzleArray.length} puzzles`);
          } else {
            // Load from PlayFab and cache
                        const result = await playFabRequestManager.makeRequest(
              'getTitleData',
              { Keys: [batchKey] }
            );
            
            if (result?.Data?.[batchKey]) {
              const puzzleDataStr = result.Data[batchKey];
              
              if (puzzleDataStr && puzzleDataStr !== "undefined") {
                puzzleArray = JSON.parse(puzzleDataStr);
                setBatchCache(batchKey, puzzleArray); // Cache for future searches
                console.log(`📊 Loaded and cached batch ${batchKey}: ${puzzleArray.length} puzzles`);
              } else {
                console.log(`❌ Batch ${batchKey} is empty or undefined`);
                continue; // Skip to next batch
              }
            } else {
              console.log(`❌ Failed to get data for ${batchKey} - no data in response`);
              continue; // Skip to next batch
            }
          }
          
          // Search for puzzle in this batch
          const puzzle = puzzleArray.find((p: any) => {
            if (!p.id) return false;
            const pArcId = playFabToArcId(p.id);
            const isMatch = pArcId === arcId;
            if (isMatch) {
              console.log(`✅ MATCH FOUND: ${p.id} -> ${pArcId} === ${arcId}`);
            }
            return isMatch;
          });
          
          if (puzzle) {
            console.log(`✅ Found puzzle ${puzzle.id} in ${dataset.name} batch ${i}`);
            
                        return puzzle;
          }
        } catch (error) {
          console.log(`❌ Error checking batch ${dataset.name}-${i}:`, error);
        }
      }
    }
    
    console.log(`❌ Puzzle with ARC ID ${arcId} not found in any dataset`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to load puzzle ${puzzleId}:`, error);
    
    // Provide specific error context for debugging
    if (error instanceof Error) {
      if (error.message.includes('PlayFab not initialized')) {
        console.error('💡 Suggestion: Ensure PlayFab is initialized and user is authenticated before calling loadPuzzleFromPlayFab');
      } else if (error.message.includes('anonymous callers')) {
        console.error('💡 Suggestion: User authentication required - ensure PlayFab login is completed');
      } else if (error.message.includes('HTTP')) {
        console.error('💡 Suggestion: Check network connection and PlayFab service status');
      }
    }
    
    return null;
  }
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
  batchCache.clear();
  console.log('🗑️ Cleared all officer API caches');
}