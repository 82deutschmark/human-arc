/**
 * ID Format Validation Utilities
 * 
 * Tests and validates conversion between ARC puzzle ID formats:
 * - Raw ARC IDs: "007bbfb7", "11852cab" etc.
 * - PlayFab format: "ARC-TR-007bbfb7", "ARC-T2-11852cab" etc.
 * - Arc-explainer format: same as raw ARC IDs
 */

import { idConverter } from '@/services/idConverter';
import { arcExplainerClient } from '@/services/core/arcExplainerClient';

export interface IDValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  testResults: {
    [testName: string]: {
      passed: boolean;
      expected: string;
      actual: string;
      error?: string;
    };
  };
}

/**
 * Test ID conversion functions with known test cases
 */
export function validateIDConversions(): IDValidationResult {
  const result: IDValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    testResults: {}
  };

  // Test cases based on upload script format
  const testCases = [
    {
      name: 'Training dataset conversion',
      arcId: '007bbfb7',
      dataset: 'training' as const,
      expectedPlayFab: 'ARC-TR-007bbfb7'
    },
    {
      name: 'Training2 dataset conversion', 
      arcId: '11852cab',
      dataset: 'training2' as const,
      expectedPlayFab: 'ARC-T2-11852cab'
    },
    {
      name: 'Evaluation dataset conversion',
      arcId: '1ae2feb7',
      dataset: 'evaluation' as const,
      expectedPlayFab: 'ARC-EV-1ae2feb7'
    },
    {
      name: 'Evaluation2 dataset conversion',
      arcId: 'def67890',
      dataset: 'evaluation2' as const,
      expectedPlayFab: 'ARC-E2-def67890'
    }
  ];

  console.log('🧪 Running ID conversion validation tests...');

  // Test arcIdToPlayFab function
  testCases.forEach(testCase => {
    try {
      const actual = idConverter.arcToPlayFab(testCase.arcId, testCase.dataset);
      const passed = actual === testCase.expectedPlayFab;
      
      result.testResults[`${testCase.name} - arcIdToPlayFab`] = {
        passed,
        expected: testCase.expectedPlayFab,
        actual
      };

      if (!passed) {
        result.success = false;
        result.errors.push(`arcIdToPlayFab(${testCase.arcId}, ${testCase.dataset}) returned ${actual}, expected ${testCase.expectedPlayFab}`);
      }
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.testResults[`${testCase.name} - arcIdToPlayFab`] = {
        passed: false,
        expected: testCase.expectedPlayFab,
        actual: 'ERROR',
        error: errorMsg
      };
      result.errors.push(`arcIdToPlayFab(${testCase.arcId}, ${testCase.dataset}) threw error: ${errorMsg}`);
    }
  });

  // Test playFabToArcId function (reverse conversion)
  testCases.forEach(testCase => {
    try {
      const actual = idConverter.playFabToArc(testCase.expectedPlayFab);
      const passed = actual === testCase.arcId;
      
      result.testResults[`${testCase.name} - playFabToArcId`] = {
        passed,
        expected: testCase.arcId,
        actual
      };

      if (!passed) {
        result.success = false;
        result.errors.push(`playFabToArcId(${testCase.expectedPlayFab}) returned ${actual}, expected ${testCase.arcId}`);
      }
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.testResults[`${testCase.name} - playFabToArcId`] = {
        passed: false,
        expected: testCase.arcId,
        actual: 'ERROR',
        error: errorMsg
      };
      result.errors.push(`playFabToArcId(${testCase.expectedPlayFab}) threw error: ${errorMsg}`);
    }
  });

  // Test arc-explainer API conversion functions
  testCases.forEach(testCase => {
    try {
      const actual = idConverter.arcToPlayFab(testCase.arcId, testCase.dataset);
      const passed = actual === testCase.expectedPlayFab;
      
      result.testResults[`${testCase.name} - arcExplainerAPI.convertArcIdToPlayFabId`] = {
        passed,
        expected: testCase.expectedPlayFab,
        actual
      };

      if (!passed) {
        result.success = false;
        result.errors.push(`arcExplainerAPI.convertArcIdToPlayFabId(${testCase.arcId}, ${testCase.dataset}) returned ${actual}, expected ${testCase.expectedPlayFab}`);
      }
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.testResults[`${testCase.name} - arcExplainerAPI.convertArcIdToPlayFabId`] = {
        passed: false,
        expected: testCase.expectedPlayFab,
        actual: 'ERROR',
        error: errorMsg
      };
      result.errors.push(`arcExplainerAPI.convertArcIdToPlayFabId(${testCase.arcId}, ${testCase.dataset}) threw error: ${errorMsg}`);
    }
  });

  // Test reverse conversion for arc-explainer API
  testCases.forEach(testCase => {
    try {
      const actual = idConverter.playFabToArc(testCase.expectedPlayFab);
      const passed = actual === testCase.arcId;
      
      result.testResults[`${testCase.name} - arcExplainerAPI.convertPlayFabIdToArcId`] = {
        passed,
        expected: testCase.arcId,
        actual
      };

      if (!passed) {
        result.success = false;
        result.errors.push(`arcExplainerAPI.convertPlayFabIdToArcId(${testCase.expectedPlayFab}) returned ${actual}, expected ${testCase.arcId}`);
      }
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.testResults[`${testCase.name} - arcExplainerAPI.convertPlayFabIdToArcId`] = {
        passed: false,
        expected: testCase.arcId,
        actual: 'ERROR',
        error: errorMsg
      };
      result.errors.push(`arcExplainerAPI.convertPlayFabIdToArcId(${testCase.expectedPlayFab}) threw error: ${errorMsg}`);
    }
  });

  // Test validation function
  testCases.forEach(testCase => {
    try {
      const validationResult = idConverter.validateId(testCase.expectedPlayFab);
      const passed = validationResult.isValid && validationResult.format === 'playfab' && validationResult.dataset === testCase.dataset;
      
      result.testResults[`${testCase.name} - arcExplainerAPI.validatePuzzleId`] = {
        passed,
        expected: `valid: true, format: playfab, dataset: ${testCase.dataset}`,
        actual: `valid: ${validationResult.isValid}, format: ${validationResult.format}, dataset: ${validationResult.dataset}`
      };

      if (!passed) {
        result.warnings.push(`validatePuzzleId(${testCase.expectedPlayFab}) validation failed`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.testResults[`${testCase.name} - arcExplainerAPI.validatePuzzleId`] = {
        passed: false,
        expected: `valid: true, format: playfab, dataset: ${testCase.dataset}`,
        actual: 'ERROR',
        error: errorMsg
      };
      result.warnings.push(`validatePuzzleId(${testCase.expectedPlayFab}) threw error: ${errorMsg}`);
    }
  });

  // Summary
  const totalTests = Object.keys(result.testResults).length;
  const passedTests = Object.values(result.testResults).filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;

  console.log(`✅ ID validation completed: ${passedTests}/${totalTests} tests passed`);
  
  if (failedTests > 0) {
    console.error(`❌ ${failedTests} tests failed`);
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn(`⚠️ ${result.warnings.length} warnings`);
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return result;
}

/**
 * Test actual data flow by attempting to load a known puzzle
 */
export async function validateDataFlow(testPuzzleId: string = '007bbfb7'): Promise<{
  success: boolean;
  steps: Array<{
    name: string;
    success: boolean;
    error?: string;
    data?: any;
  }>;
}> {
  const steps: Array<{ name: string; success: boolean; error?: string; data?: any }> = [];
  
  console.log(`🔍 Testing complete data flow with puzzle ID: ${testPuzzleId}`);

  // Step 1: Test arc-explainer API search
  try {
    const { searchPuzzleById } = await import('@/services/officerArcAPI');
    const puzzleMetadata = await searchPuzzleById(testPuzzleId);
    
    steps.push({
      name: 'Arc-explainer API puzzle search',
      success: !!puzzleMetadata,
      data: puzzleMetadata ? { id: puzzleMetadata.id, difficulty: puzzleMetadata.difficulty } : null
    });
  } catch (error) {
    steps.push({
      name: 'Arc-explainer API puzzle search',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Step 2: Test PlayFab puzzle loading
  try {
    const { loadPuzzleFromPlayFab } = await import('@/services/officerArcAPI');
    const fullPuzzleData = await loadPuzzleFromPlayFab(testPuzzleId);
    
    steps.push({
      name: 'PlayFab full puzzle data loading',
      success: !!fullPuzzleData,
      data: fullPuzzleData ? { 
        id: fullPuzzleData.id, 
        hasTrainData: Array.isArray(fullPuzzleData.train) && fullPuzzleData.train.length > 0,
        hasTestData: Array.isArray(fullPuzzleData.test) && fullPuzzleData.test.length > 0
      } : null
    });
  } catch (error) {
    steps.push({
      name: 'PlayFab full puzzle data loading',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Step 3: Test ID conversions
  const conversionResult = validateIDConversions();
  steps.push({
    name: 'ID conversion functions',
    success: conversionResult.success,
    data: { 
      totalTests: Object.keys(conversionResult.testResults).length,
      passed: Object.values(conversionResult.testResults).filter(t => t.passed).length
    },
    error: conversionResult.errors.length > 0 ? conversionResult.errors.join('; ') : undefined
  });

  const success = steps.every(step => step.success);
  
  console.log(`${success ? '✅' : '❌'} Data flow validation ${success ? 'passed' : 'failed'}`);
  steps.forEach(step => {
    console.log(`  ${step.success ? '✅' : '❌'} ${step.name}`);
    if (step.error) console.error(`    Error: ${step.error}`);
  });

  return { success, steps };
}