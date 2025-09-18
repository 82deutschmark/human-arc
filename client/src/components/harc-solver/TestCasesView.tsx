/**
 * Author: Cascade using gpt-4-turbo
 * Date: 2025-09-17T21:18:20-04:00
 * PURPOSE: This component renders the navigation for multi-test puzzles, allowing users to switch between different test cases. It displays the total number of tests and the user's progress.
 * SRP and DRY check: Pass. This component has a single responsibility: to display the test case navigation UI. It is reusable and does not contain business logic.
 */

import { TestCaseNavigation } from '@/components/officer/TestCaseNavigation';

export interface TestCasesViewProps {
  totalTests: number;
  currentTestIndex: number;
  completedTests: boolean[];
  onTestSelect: (index: number) => void;
  isAssessmentMode: boolean;
}

export const TestCasesView = ({ 
  totalTests,
  currentTestIndex,
  completedTests,
  onTestSelect,
  isAssessmentMode 
}: TestCasesViewProps) => {
  if (totalTests <= 1) {
    return null;
  }

  return (
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
        onTestSelect={onTestSelect}
      />
    </div>
  );
};
