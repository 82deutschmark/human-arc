/**
 * Tutorial Page
 * =============
 * A dedicated page that guides new users through the Officer Academy tutorial.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { TutorialPuzzleWrapper } from '@/components/officer/TutorialPuzzleWrapper';
import { useTutorialProgress } from '@/hooks/useTutorialProgress';
import { useOfficerPuzzles } from '@/hooks/useOfficerPuzzles';
import { playFabUserData } from '@/services/playfab';

export function TutorialPage() {
  const [, setLocation] = useLocation();
  const [showTutorialModal, setShowTutorialModal] = useState(true);
  const [tutorialPuzzleId, setTutorialPuzzleId] = useState<string | null>(null);
  const { endTutorial } = useTutorialProgress();
  const { searchById } = useOfficerPuzzles();

  const [puzzle, setPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleStartTutorial = async (puzzleId: string) => {
    setLoading(true);
    const foundPuzzle = await searchById(puzzleId);
    if (foundPuzzle) {
      setPuzzle(foundPuzzle);
      setTutorialPuzzleId(puzzleId);
      setShowTutorialModal(false);
    } else {
      alert(`Could not find tutorial puzzle with ID: ${puzzleId}`);
    }
    setLoading(false);
  };

  const handleTutorialComplete = () => {
    endTutorial();
    playFabUserData.updatePlayerData({ hasCompletedTutorial: true });
    setLocation('/officer-track');
    alert('Congratulations! You have completed the Officer Academy training.');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">Loading tutorial puzzle...</div>;
  }

  return (
    <div>
      <OfficerTutorialModal
        open={showTutorialModal}
        onClose={() => setLocation('/officer-track')} // Go back if they close the modal
        onStartTutorial={handleStartTutorial}
      />

      {tutorialPuzzleId && puzzle ? (
        <TutorialPuzzleWrapper
          puzzle={puzzle}
          onBack={() => {
            setTutorialPuzzleId(null);
            setShowTutorialModal(true);
          }}
          onTutorialComplete={handleTutorialComplete}
        />
      ) : null}
    </div>
  );
}
