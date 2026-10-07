/**
 * Author: Codex
 * Date: 2026-10-07
 * PURPOSE: Support Human ARC at a configurable hosting prefix within ARC Explainer.
 * SRP/DRY check: Pass — shared appPath helper keeps application and asset URLs consistent.
 */
import { appPath } from "@/utils/appPath";
/**
 * LoadingSplash Component
 * --------------------------------------------------------
 * Author: Cascade AI with Claude 3.7 Sonnet Thinking
 * Date: 2025-06-22
 * Version: 1.0.0
 * Fixed by: Claude 4 Sonnet
 * Description: 
 *   A fun splash screen that displays when the app first loads.
 *   Features Master Chief Wyatt with animated space emojis and a percentage counter.
 *   Purely decorative - not tied to actual loading processes.
 *   Added check to skip splash for /officer-track/solve/* routes.
 * Enhanced in September 2025 by Claude 4 Sonnet to add other chars
 */
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { SPACE_EMOJIS } from "@/constants/spaceEmojis";

const TRAINER_IMAGES = [
  appPath('/Trainer1.PNG'),
  appPath('/Trainer2.png'),
  appPath('/Trainer3.png'),
  appPath('/captain-divyapriya.PNG'),
  appPath('/captain-iki.png'),
  appPath('/col-kim.png'),
  appPath('/ltcol-Luz.png'),
  appPath('/master-chief-wyatt.png'),
  appPath('/masterchief-yasemin.png'),
  appPath('/Cadet-Yvonne.PNG'),
  appPath('/Cadet-fatma.png')
];

interface LoadingSplashProps {
  onComplete: () => void;
  duration?: number; // Duration in ms (default 1000)
}

export function LoadingSplash({ onComplete, duration = 3000 }: LoadingSplashProps) {
  const [pathname] = useLocation();

  // Skip splash screen for specific pages that don't need splash
  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/officer-track/solve/') || pathname.startsWith('/harc') || pathname.startsWith('/assessment') || pathname.startsWith('/dashboard')) {
      onComplete();
      return;
    }
  }, [pathname, onComplete]);

  if (pathname === '/' || pathname.startsWith('/officer-track/solve/') || pathname.startsWith('/harc') || pathname.startsWith('/assessment') || pathname.startsWith('/dashboard')) {
    return null;
  }
  const [progress, setProgress] = useState(0);
  const [emojiRow, setEmojiRow] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Memoize the combined emojis to prevent recreation on each render
  const combinedEmojis = useMemo(() => [
    ...SPACE_EMOJIS.celestial_set1.slice(1), 
    ...SPACE_EMOJIS.celestial_set2.slice(1)
  ], []);

  useEffect(() => {
    // Initialize emoji row
    setEmojiRow(combinedEmojis);
    
    // Use the duration prop to calculate intervals
    const totalSteps = 50;
    const intervalTime = duration / totalSteps;
    let step = 0;
    
    console.log('Starting progress animation with duration:', duration, 'ms, interval:', intervalTime, 'ms');
    
    // Progress counter using actual duration
    const progressInterval = setInterval(() => {
      step++;
      const newProgress = Math.min(Math.floor((step / totalSteps) * 100), 100);
      console.log('Progress:', newProgress + '%');
      setProgress(newProgress);
      
      // When we reach 100%, clear interval and finish
      if (step >= totalSteps) {
        clearInterval(progressInterval);
        setIsExiting(true);
        console.log('Animation complete, exiting...');
        setTimeout(() => onComplete(), 700);
      }
    }, intervalTime);
    
    // Faster emoji rotation and image cycling for 1-second total duration
    const emojiInterval = setInterval(() => {
      setEmojiRow(prev => {
        if (prev.length === 0) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      
      // Cycle to next image every 100ms to show all images within 1 second
      setCurrentImageIndex(prev => (prev + 1) % TRAINER_IMAGES.length);
    }, 100); // Change image every 100ms

    return () => {
      clearInterval(progressInterval);
      clearInterval(emojiInterval);
    };
  }, [onComplete, duration]); // Removed combinedEmojis from dependency array

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-700 
        ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative w-11/12 sm:w-4/5 max-w-md mx-auto mb-6 sm:mb-8">
        <img 
          src={TRAINER_IMAGES[currentImageIndex]} 
          alt="Space Force Trainer" 
          className="w-full h-auto object-contain max-h-[40vh] sm:max-h-[50vh] transition-opacity duration-75"
          key={currentImageIndex}
        />
        <div className="absolute -bottom-3 sm:-bottom-4 left-0 right-0 text-center">
          <span className="bg-black px-3 py-1 rounded-full text-amber-400 font-mono text-xs sm:text-sm">
            SPACE FORCE
          </span>
        </div>
      </div>
      
      <div className="w-11/12 sm:w-4/5 max-w-md mb-2">
        <div className="h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex space-x-1 text-lg sm:text-2xl mb-2 min-h-[2rem] overflow-hidden">
        {emojiRow.slice(0, 10).map((emoji, idx) => (
          <span key={idx} className="animate-pulse">{emoji}</span>
        ))}
      </div>
      
      <div className="text-cyan-400 font-mono text-sm sm:text-lg font-bold">
        {progress}% <span className="animate-pulse">▋</span>
      </div>
    </div>
  );
}
