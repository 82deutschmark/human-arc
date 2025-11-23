/**
 * @author Gemini 2.5 Pro
 * @date 2025-09-13
 * @description Central repository for Max Power's advice for assessment puzzles.
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
      explanation: 'The goal is to fill the bottom half to mirror the top half. Remember you can use the Copy Input button to copy the input grid so you dont need to fill in all the cells.',
      aiDifficultyContext: 'AI models are good at recognizing symmetry, but can sometimes fail if the pattern has unusual gaps or noise.'
    }
  ],
  [
    'fc754716',
    {
      puzzleId: 'fc754716',
      title: 'Outline from a Single Cell',
      explanation: 'Remember you can click and drag to fill multiple cells.',
      aiDifficultyContext: 'This requires a two-step reasoning process: first identify the relevant color, then apply a transformation. Chaining logic like this can be a point of failure for AI.'
    }
  ],
  [
    'a699fb00',
    {
      puzzleId: 'a699fb00',
      title: 'Connecting the Dots',
      explanation: 'This puzzle requires identifying pairs of same-colored cells and adding a specific cell to connect them.',
      aiDifficultyContext: 'AI needs to correctly group pairs of objects and then apply a line-drawing algorithm between them, which can be tricky if multiple pairs are present.'
    }
  ],
  [
    'ea786f4a',
    {
      puzzleId: 'ea786f4a',
      title: 'Make an X',
      explanation: 'The goal is to create a large \'X\' shape that spans the entire grid, a fundamental test of diagonal pattern generation.',
      aiDifficultyContext: 'Generating perfect diagonals across a grid requires precise coordinate calculations. AI can sometimes produce incomplete or jagged lines if it misinterprets the geometric goal.'
    }
  ],
  [
    '66e6c45b',
    {
      puzzleId: '66e6c45b',
      title: 'Cell Expansion',
      explanation: '',
      aiDifficultyContext: 'Scaling objects is a common AI task, but it becomes difficult when the scaling factor is not obvious or when the shape is irregular. The AI must infer the correct proportions.'
    }
  ]
]);

export const getAssessmentNote = (puzzleId: string): DesignerNote | undefined => {
  return assessmentNotes.get(puzzleId);
};

/**
 * Team notes for featured puzzles based on Gemini 3 Pro and DeepThinker analysis
 * These notes explain why each puzzle was selected and what it demonstrates
 */
export const TEAM_NOTES: Record<string, string> = {
  '65b59efc':
    'ARC v2 task highlighted by the team as evidence of clear complexity scaling over ARC v1.',
  'e3721c99':
    'ARC v2 task highlighted by the team as evidence of clear complexity scaling over ARC v1.',
  'dd6b8c4b':
    'ARC v2 task highlighted by the team as evidence of clear complexity scaling over ARC v1.',
  '2ba387bc':
    'Fastest ARC v2 task in the team\'s write‑up: Gemini 3 Pro solved it with ~772 tokens in 188 seconds vs humans at ~147 seconds.',
  '14754a24':
    'ARC v1 task that DeepThinker still gets wrong despite strong v2 performance — used as a surprising failure example.',
  'b457fec5':
    'ARC v1 task that DeepThinker still gets wrong — one of the team\'s canonical "obvious miss" examples.',
  '891232d6':
    'Another ARC v1 task called out by the team where reasoning systems still fail, even though it is simpler than many v2 solves.',
  '7b5033c1':
    'Case where Gemini 3 Pro reasoning solved the task with ~2,000 tokens while DeepThinker failed after ~300,000 tokens.',
  '981571dc':
    'Efficiency contrast example: both systems solved it, but Gemini 3 Pro needed ~7,600 tokens vs ~1,400,000 for DeepThinker (>100× efficiency).',
  '136b0064':
    'Additional curated ARC puzzle chosen as a visually interesting featured sample for this gallery.',
};

export const getTeamNote = (puzzleId: string): string | undefined => {
  return TEAM_NOTES[puzzleId];
};
