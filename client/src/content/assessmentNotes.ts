/**
 * @author Gemini 2.5 Pro
 * @date 2025-09-13
 * @description Central repository for designer-crafted educational content for assessment puzzles.
 * Adheres to SRP by separating static content from component logic.
 */

export interface DesignerNote {
  puzzleId: string;
  title: string;
  explanation: string;
  aiDifficultyContext: string;
}

// Using a Map for efficient, O(1) lookups by puzzleId.
export const assessmentNotes = new Map<string, DesignerNote>([
  [
    'e7dd8335',
    {
      puzzleId: 'e7dd8335',
      title: 'Symmetry Completion',
      explanation: 'This puzzle tests the ability to recognize and complete a symmetrical pattern. The goal is to fill the bottom half to mirror the top half.',
      aiDifficultyContext: 'AI models are good at recognizing symmetry, but can sometimes fail if the pattern has unusual gaps or noise. They approach this by learning abstract rules about reflection.'
    }
  ],
  [
    'fc754716',
    {
      puzzleId: 'fc754716',
      title: 'Outline from a Single Point',
      explanation: 'The core task is to identify the color of a single, isolated pixel and use that color to draw an outline around a given shape.',
      aiDifficultyContext: 'This requires a two-step reasoning process: first identify the relevant color, then apply a transformation. Chaining logic like this can be a point of failure for AI.'
    }
  ],
  [
    'a699fb00',
    {
      puzzleId: 'a699fb00',
      title: 'Connecting the Dots',
      explanation: 'This puzzle requires identifying pairs of same-colored dots and drawing a line to connect them.',
      aiDifficultyContext: 'AI needs to correctly group pairs of objects and then apply a line-drawing algorithm between them, which can be tricky if multiple pairs are present.'
    }
  ],
  [
    'ea786f4a',
    {
      puzzleId: 'ea786f4a',
      title: 'Diagonal Pattern Recognition',
      explanation: 'The goal is to create a large \'X\' shape that spans the entire grid, a fundamental test of diagonal pattern generation.',
      aiDifficultyContext: 'Generating perfect diagonals across a grid requires precise coordinate calculations. AI can sometimes produce incomplete or jagged lines if it misinterprets the geometric goal.'
    }
  ],
  [
    '66e6c45b',
    {
      puzzleId: '66e6c45b',
      title: 'Shape Expansion',
      explanation: 'This puzzle involves taking a small shape and scaling it up to a larger size while preserving its core form.',
      aiDifficultyContext: 'Scaling objects is a common AI task, but it becomes difficult when the scaling factor is not obvious or when the shape is irregular. The AI must infer the correct proportions.'
    }
  ]
]);

export const getAssessmentNote = (puzzleId: string): DesignerNote | undefined => {
  return assessmentNotes.get(puzzleId);
};
