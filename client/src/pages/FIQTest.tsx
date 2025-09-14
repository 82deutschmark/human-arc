/* DEPRECATED MODULE - TO BE REMOVED
 * FIQTest.tsx
 * Author: Cascade
 * 
 * PURPOSE:
 * This page displays all onboarding tasks for Fluid Intelligence Quotient (FIQ) testing.
 * It provides a dedicated interface for users to view and test their FIQ with onboarding tasks.
 * 
 * FUNCTIONALITY:
 * - Fetches all onboarding tasks (OB-prefix) from the server API
 * - Displays tasks in a simple list for selection
 * - Renders selected tasks using the standard task UI with examples and interactive grid
 * - Provides navigation back to the main Mission Control dashboard
 * - Handles loading states and error conditions gracefully
 * 
 * HOW THE PROJECT USES IT:
 * - Accessed via the "Test FIQ" button in the MissionSelector component
 * - Serves as a standalone page for FIQ testing and onboarding task inspection
 * - Integrates with PlayFab service to fetch onboarding task data from Title Data
 * - Provides developers and users a way to test available onboarding content
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveGrid } from "@/components/game/InteractiveGrid";
import { SPACE_EMOJIS } from "@/constants/spaceEmojis";
import {
  playFabRequestManager,
  playFabAuthManager,
  playFabTasks,
  type PlayFabTask
} from '@/services/playfab';
import type { Task } from "@shared/schema";
import type { MissionExample } from "@/types/game";
import type { EmojiSet } from "@/constants/spaceEmojis";

export default function FIQTest() {
  const [onboardingTasks, setOnboardingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [playerGrid, setPlayerGrid] = useState<string[][]>([]);

  // Fetch onboarding tasks on component mount
    useEffect(() => {
    const fetchOnboardingTasks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // New initialization flow
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        
        const allTasks = await playFabTasks.getAllTasks();
        // Filter for onboarding tasks (any task with OB- in the name)
        const obTasks = allTasks.filter(task => task.id.includes('OB-'));
        
        setOnboardingTasks(obTasks as Task[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load onboarding tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingTasks();
  }, []);

  // Handle task selection
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    
    // Initialize empty grid for the selected task
    const emptyGrid = Array(task.gridSize).fill(null).map(() => 
      Array(task.gridSize).fill(SPACE_EMOJIS[task.emojiSet as EmojiSet][0])
    );
    setPlayerGrid(emptyGrid);
  };

  // Handle going back to task list
  const handleBackToTasks = () => {
    setSelectedTask(null);
    setPlayerGrid([]);
  };

  // Render example grid for task examples
  const renderExampleGrid = (grid: string[][], title: string) => (
    <div>
      <div className="text-xs text-slate-400 mb-2 text-center">{title}</div>
      <div 
        className="grid gap-1 bg-slate-800 p-2 rounded"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 1fr)` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded text-lg"
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-cyan-400 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400 mb-1">FIQ TEST CENTER</h1>
            <p className="text-slate-300 text-sm">Fluid Intelligence Quotient • Onboarding Task Assessment</p>
          </div>
          <Link href="/">
            <Button className="bg-slate-600 hover:bg-slate-500 text-slate-200">
              <i className="fas fa-arrow-left mr-2"></i>
              BACK TO MISSION CONTROL
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {!selectedTask ? (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-slate-300">Loading FIQ Test Tasks...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="bg-red-900 bg-opacity-30 border-red-600">
              <CardContent className="p-6 text-center">
                <i className="fas fa-exclamation-triangle text-red-400 text-3xl mb-4"></i>
                <h2 className="text-red-400 font-semibold mb-2">Error Loading Tasks</h2>
                <p className="text-slate-300">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Stats Header */}
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-cyan-400 mb-2">{onboardingTasks.length}</h3>
                    <p className="text-slate-400">Available FIQ Test Tasks</p>
                  </div>
                </CardContent>
              </Card>

              {/* Simple Task List */}
              <div className="grid gap-3">
                {onboardingTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="bg-slate-800 border-slate-600 hover:border-cyan-400 transition-all duration-200 cursor-pointer"
                    onClick={() => handleSelectTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-cyan-400 text-lg">{task.id}</h3>
                          <h4 className="text-slate-200 font-medium">{task.title}</h4>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-cyan-600 hover:bg-cyan-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTask(task);
                          }}
                        >
                          START TEST
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {onboardingTasks.length === 0 && !loading && (
                <Card className="bg-slate-800 border-slate-600">
                  <CardContent className="p-12 text-center">
                    <i className="fas fa-inbox text-slate-500 text-4xl mb-4"></i>
                    <h2 className="text-slate-400 font-semibold mb-2">No Onboarding Tasks Found</h2>
                    <p className="text-slate-500">No tasks with 'OB-' in the name were found in the system.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        ) : (
          /* Selected Task Interface - Standard Task UI */
          <div className="space-y-6">
            <Card className="bg-slate-800 border-cyan-400">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-cyan-400 mb-1">
                      FIQ TEST: {selectedTask.id} - {selectedTask.title}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Grid: <span className="text-amber-400">{selectedTask.gridSize}×{selectedTask.gridSize}</span>
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleBackToTasks}
                    className="bg-slate-600 hover:bg-slate-500 text-slate-200"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    BACK TO TASKS
                  </Button>
                </div>
                
                <div className="bg-slate-900 border border-slate-600 rounded p-4 mb-6">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-amber-400 font-semibold">Task Brief:</span> 
                    {selectedTask.description}
                  </p>
                </div>
                
                {/* Example Transformations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {((selectedTask.examples || []) as MissionExample[]).map((example, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-600 rounded p-4">
                      <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                        <i className="fas fa-eye mr-2"></i>
                        EXAMPLE {index + 1}
                      </h3>
                      
                      <div className="flex items-center justify-center space-x-4">
                        {renderExampleGrid(example.input, "INPUT")}
                        <div className="text-cyan-400 text-xl">→</div>
                        {renderExampleGrid(example.output, "OUTPUT")}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Interactive Test Grid */}
                <div className="bg-slate-900 border border-amber-400 rounded p-4">
                  <h3 className="text-amber-400 font-semibold mb-3 flex items-center">
                    <i className="fas fa-crosshairs mr-2"></i>
                    YOUR TASK: SOLVE THE PATTERN
                  </h3>
                  
                  <div className="flex items-center justify-center space-x-8 mb-6">
                    <div>
                      {renderExampleGrid(selectedTask.testInput as string[][], "TEST INPUT")}
                    </div>
                    
                    <div className="text-cyan-400 text-2xl">→</div>
                    
                    <div>
                      <div className="text-xs text-slate-400 mb-2 text-center">YOUR OUTPUT</div>
                      <InteractiveGrid
                        gridSize={selectedTask.gridSize}
                        emojiSet={selectedTask.emojiSet as EmojiSet}
                        onGridChange={setPlayerGrid}
                        initialGrid={playerGrid}
                      />
                    </div>
                  </div>
                  
                  <div className="text-center text-slate-400 text-sm">
                    <p>This is a testing interface. Click the grid cells to change values and test your understanding.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
