/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17
 * PURPOSE: This component provides a navigation interface for puzzles that have multiple test cases. It displays a series of buttons, one for each test case, and indicates the completion status of each. This is a critical component for the ARC puzzle-solving experience, as many puzzles require the user to solve multiple tests to demonstrate their understanding of the underlying pattern.
 * SRP and DRY check: Pass. This component has a single responsibility: to allow the user to navigate between test cases. It is a presentational component that receives all its data and callbacks via props, making it reusable and well-encapsulated.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

interface TestCaseNavigationProps {
  /** Total number of test cases */
  totalTests: number;
  /** Currently active test index (0-based) */
  currentTestIndex: number;
  /** Array indicating which tests are completed */
  completedTests: boolean[];
  /** Callback when test case is selected */
  onTestSelect: (testIndex: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export function TestCaseNavigation({
  totalTests,
  currentTestIndex,
  completedTests,
  onTestSelect,
  className = ''
}: TestCaseNavigationProps) {
  
  if (totalTests <= 1) {
    return null; // Don't show navigation for single test puzzles
  }

  const completedCount = completedTests.filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / totalTests) * 100);

  return (
    <div className={`bg-slate-100/90 rounded-lg p-3 border border-slate-400 ${className}`}>
      {/* Inline Header Layout for Efficiency */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-slate-700 text-base font-bold">
            🎯 TEST CASES
          </h3>
          <Badge 
            variant="outline" 
            className={`text-sm ${completedCount === totalTests ? 'text-green-700 border-green-600 bg-green-100' : 'text-slate-600 border-slate-400 bg-white'}`}
          >
            {completedCount}/{totalTests}
          </Badge>
        </div>
        {completedCount === totalTests && (
          <Badge className="bg-green-600 text-white shadow-md text-sm">
            ✅ SOLVED!
          </Badge>
        )}
      </div>

      {/* Detailed Progress Bar - Only for Complex Puzzles (4+ tests) */}
      {totalTests >= 4 && (
        <div className="mb-2">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-300 rounded-full h-2">
            <div 
              className="bg-slate-600 h-2 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Test Case Buttons - Silver Theme */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {Array.from({ length: totalTests }, (_, index) => {
          const isActive = index === currentTestIndex;
          const isCompleted = completedTests[index];
          
          return (
            <Button
              key={index}
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={`
                relative h-8 flex items-center justify-center gap-1.5
                ${isActive 
                  ? 'bg-slate-600 hover:bg-slate-700 text-white border-slate-500 shadow-md' 
                  : isCompleted
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-500 shadow-sm'
                    : 'border-slate-400 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-500'
                }
                transition-all duration-200
              `}
              onClick={() => onTestSelect(index)}
            >
              {isCompleted ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
              <span className="font-semibold">
                Test {index + 1}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Current Test Info */}
      <div className="mt-4 text-sm text-slate-400 text-center">
        Currently solving: <span className="text-amber-400 font-semibold">Test Case {currentTestIndex + 1}</span>
        {completedTests[currentTestIndex] && (
          <span className="text-green-400 ml-2">✓ Completed</span>
        )}
      </div>
    </div>
  );
}
