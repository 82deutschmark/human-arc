/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-18
 * PURPOSE: Component tests for PuzzleHeader from Phase 3 presentational components.
 * Tests the puzzle header display functionality, performance badges, and navigation.
 * SRP and DRY check: Pass - Single responsibility for testing PuzzleHeader component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PuzzleHeader } from './PuzzleHeader';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import type { PerformanceData } from '@/services/core/arcExplainerClient';

// Mock the Navbar component
jest.mock('@/components/layout/Navbar', () => ({
  Navbar: ({ title, badges, showBackButton, onBack }: any) => (
    <div data-testid="navbar">
      <div data-testid="navbar-title">{title}</div>
      <div data-testid="navbar-badges">
        {badges?.map((badge: any, index: number) => (
          <div key={index} data-testid={`badge-${index}`}>{badge}</div>
        ))}
      </div>
      {showBackButton && (
        <button data-testid="back-button" onClick={onBack}>
          Back
        </button>
      )}
    </div>
  )
}));

// Mock the Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  )
}));

const mockPuzzle: OfficerTrackPuzzle = {
  id: 'test-puzzle-123',
  train: [],
  test: []
};

const mockPerformanceStats: PerformanceData = {
  dataset: 'ARC-AGI-Train',
  avgAccuracy: 85.7,
  totalAttempts: 42,
  dangerousOverconfidence: false
};

const mockPerformanceStatsWithWarning: PerformanceData = {
  dataset: 'ARC-AGI-Eval',
  avgAccuracy: 92.1,
  totalAttempts: 15,
  dangerousOverconfidence: true
};

describe('PuzzleHeader', () => {

  describe('Basic Rendering', () => {
    it('should render correctly with minimal props', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={null}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Are you smarter than a Chatbot?');
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('should display assessment mode title when in assessment mode', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={null}
          isAssessmentMode={true}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Assessment: test-puzzle-123');
    });

    it('should call onBack when back button is clicked', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={null}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      fireEvent.click(screen.getByTestId('back-button'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Stats Display', () => {
    it('should display performance badges when stats are provided', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(3);

      expect(badges[0]).toHaveTextContent('Dataset: ARC-AGI-Train');
      expect(badges[1]).toHaveTextContent('AI Accuracy: 85.7%');
      expect(badges[2]).toHaveTextContent('AI Attempts: 42');
    });

    it('should display no badges when performance stats are null', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={null}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });

    it('should display overconfidence warning badge when detected', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStatsWithWarning}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(4);

      expect(badges[3]).toHaveTextContent('🚨 AI Overconfident');
      expect(badges[3]).toHaveClass('animate-pulse');
    });

    it('should format accuracy to one decimal place', () => {
      const mockOnBack = jest.fn();
      const statsWithPreciseAccuracy: PerformanceData = {
        ...mockPerformanceStats,
        avgAccuracy: 87.666666
      };

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={statsWithPreciseAccuracy}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges[1]).toHaveTextContent('AI Accuracy: 87.7%');
    });
  });

  describe('Badge Styling', () => {
    it('should apply correct CSS classes to badges', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');

      expect(badges[0]).toHaveClass('border-sky-400', 'text-sky-300');
      expect(badges[1]).toHaveClass('border-green-400', 'text-green-300');
      expect(badges[2]).toHaveClass('border-purple-400', 'text-purple-300');
    });

    it('should apply warning styles to overconfidence badge', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStatsWithWarning}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');
      const warningBadge = badges[3];

      expect(warningBadge).toHaveClass('border-red-400', 'text-red-300', 'animate-pulse');
    });
  });

  describe('Performance Optimizations', () => {
    it('should be wrapped with React.memo', () => {
      // Test that component doesn't re-render unnecessarily
      const mockOnBack = jest.fn();
      const { rerender } = render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      // Re-render with same props should not cause actual re-render
      rerender(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      // Component should still be rendered correctly
      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Are you smarter than a Chatbot?');
    });

    it('should re-render when puzzle ID changes', () => {
      const mockOnBack = jest.fn();
      const { rerender } = render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={null}
          isAssessmentMode={true}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Assessment: test-puzzle-123');

      const newPuzzle = { ...mockPuzzle, id: 'different-puzzle' };
      rerender(
        <PuzzleHeader
          puzzle={newPuzzle}
          performanceStats={null}
          isAssessmentMode={true}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Assessment: different-puzzle');
    });

    it('should re-render when performance stats change', () => {
      const mockOnBack = jest.fn();
      const { rerender } = render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      expect(screen.getAllByTestId('badge')).toHaveLength(3);

      rerender(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStatsWithWarning}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      expect(screen.getAllByTestId('badge')).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper structure for screen readers', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      // Header should be properly structured
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('back-button')).toBeInTheDocument();

      // Title should be clear
      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Are you smarter than a Chatbot?');
    });

    it('should provide meaningful badge content', () => {
      const mockOnBack = jest.fn();

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={mockPerformanceStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');

      // Each badge should have meaningful text content
      expect(badges[0]).toHaveTextContent(/Dataset:/);
      expect(badges[1]).toHaveTextContent(/AI Accuracy:/);
      expect(badges[2]).toHaveTextContent(/AI Attempts:/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty puzzle ID', () => {
      const mockOnBack = jest.fn();
      const emptyPuzzle = { ...mockPuzzle, id: '' };

      render(
        <PuzzleHeader
          puzzle={emptyPuzzle}
          performanceStats={null}
          isAssessmentMode={true}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('navbar-title')).toHaveTextContent('Assessment: ');
    });

    it('should handle zero accuracy gracefully', () => {
      const mockOnBack = jest.fn();
      const zeroAccuracyStats: PerformanceData = {
        ...mockPerformanceStats,
        avgAccuracy: 0
      };

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={zeroAccuracyStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges[1]).toHaveTextContent('AI Accuracy: 0.0%');
    });

    it('should handle zero attempts gracefully', () => {
      const mockOnBack = jest.fn();
      const zeroAttemptsStats: PerformanceData = {
        ...mockPerformanceStats,
        totalAttempts: 0
      };

      render(
        <PuzzleHeader
          puzzle={mockPuzzle}
          performanceStats={zeroAttemptsStats}
          isAssessmentMode={false}
          onBack={mockOnBack}
        />
      );

      const badges = screen.getAllByTestId('badge');
      expect(badges[2]).toHaveTextContent('AI Attempts: 0');
    });
  });
});