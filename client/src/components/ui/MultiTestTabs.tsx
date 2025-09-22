/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Multi-test case navigation component using shadcn/ui Tabs. Replaces the custom TestCaseNavigation component that used a button grid with hardcoded colors. Provides tab-based navigation for puzzles with multiple test cases, showing completion status with proper theme-aware styling.
 * SRP and DRY check: Pass. Single responsibility: provide tabbed navigation for multiple test cases with status indicators. Uses standard shadcn/ui components exclusively.
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiTestTabsProps {
  /** Total number of test cases */
  totalTests: number;
  /** Currently active test index (0-based) */
  currentTestIndex: number;
  /** Array indicating which tests are completed */
  completedTests: boolean[];
  /** Callback when test case is selected */
  onTestSelect: (testIndex: number) => void;
  /** Optional content to render for each test case */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function MultiTestTabs({
  totalTests,
  currentTestIndex,
  completedTests,
  onTestSelect,
  children,
  className = ''
}: MultiTestTabsProps) {

  if (totalTests <= 1) {
    return null; // Don't show tabs for single test puzzles
  }

  const completedCount = completedTests.filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / totalTests) * 100);
  const allCompleted = completedCount === totalTests;

  return (
    <div className={cn("bg-card rounded-lg p-4 border border-border", className)}>
      {/* Header with progress info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-foreground text-base font-bold">
            🎯 Test Cases
          </h3>
          <Badge variant="outline">
            {completedCount}/{totalTests}
          </Badge>
        </div>
        {allCompleted && (
          <Badge className="bg-green-600 hover:bg-green-600 text-white shadow-md">
            ✅ All Solved!
          </Badge>
        )}
      </div>

      {/* Progress bar for complex puzzles (4+ tests) */}
      {totalTests >= 4 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs component */}
      <Tabs
        value={`test-${currentTestIndex}`}
        onValueChange={(value) => {
          const index = parseInt(value.replace('test-', ''));
          onTestSelect(index);
        }}
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 h-auto">
          {Array.from({ length: totalTests }, (_, index) => {
            const isCompleted = completedTests[index];
            const isActive = index === currentTestIndex;

            return (
              <TabsTrigger
                key={index}
                value={`test-${index}`}
                className={cn(
                  "flex items-center gap-1.5 h-9 text-xs",
                  isCompleted && !isActive && "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : isActive ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                <span className="font-medium">
                  Test {index + 1}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab content if children provided */}
        {children && (
          <div className="mt-4">
            {Array.from({ length: totalTests }, (_, index) => (
              <TabsContent key={index} value={`test-${index}`}>
                {children}
              </TabsContent>
            ))}
          </div>
        )}
      </Tabs>

      {/* Current test info */}
      <div className="mt-4 text-sm text-muted-foreground text-center">
        Currently solving: <span className="text-primary font-semibold">Test Case {currentTestIndex + 1}</span>
        {completedTests[currentTestIndex] && (
          <span className="text-green-600 ml-2">✓ Completed</span>
        )}
      </div>
    </div>
  );
}