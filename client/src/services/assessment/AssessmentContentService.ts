/**
 * @author Gemini 2.5 Pro
 * @date 2025-09-13
 * @description Service to aggregate hybrid content for the assessment success modal.
 * This service combines static designer notes with dynamic AI performance data.
 * Adheres to SRP by encapsulating the logic for fetching and merging assessment content.
 */

import { puzzleRepository, type EnhancedPuzzle } from '@/services/core/puzzleRepository';
import { getAssessmentNote, type DesignerNote } from '@/content/assessmentNotes';

export interface AssessmentContent extends DesignerNote {
  puzzle: EnhancedPuzzle;
}

class AssessmentContentService {
  /**
   * Fetches and combines all necessary content for the assessment success modal.
   *
   * @param puzzleId The ID of the puzzle to get content for.
   * @returns A promise that resolves to the aggregated AssessmentContent, or null if essential data is missing.
   */
  public async getAssessmentContent(puzzleId: string): Promise<AssessmentContent | null> {
    console.log(`[AssessmentContentService] Fetching content for puzzle: ${puzzleId}`);

    // 1. Get the dynamic puzzle data first (this is essential)
    const puzzle = await puzzleRepository.findById(puzzleId, true, true);
    if (!puzzle) {
      console.error(`[AssessmentContentService] Failed to fetch puzzle data for: ${puzzleId}`);
      // If the puzzle data itself is missing, we cannot proceed.
      return null;
    }

    // 2. Get the static designer note (with fallback)
    const note = getAssessmentNote(puzzleId);
    
    // 3. Create fallback content if no designer note exists
    const fallbackNote = {
      puzzleId: puzzleId,
      title: 'Puzzle Solved!',
      explanation: 'You successfully identified the pattern and applied the correct transformation to solve this ARC puzzle.',
      aiDifficultyContext: 'This puzzle challenges pattern recognition and logical reasoning abilities that are fundamental to human intelligence.'
    };

    // 4. Use designer note if available, otherwise use fallback
    const finalNote = note || fallbackNote;
    
    if (!note) {
      console.warn(`[AssessmentContentService] No designer note found for puzzle: ${puzzleId}, using fallback content`);
    }

    // 5. Combine the static and dynamic data into a single object.
    const combinedContent: AssessmentContent = {
      ...finalNote,
      puzzle,
    };

    console.log(`[AssessmentContentService] Successfully combined content for puzzle: ${puzzleId}`);
    return combinedContent;
  }
}

// Export a singleton instance of the service.
export const assessmentContentService = new AssessmentContentService();
