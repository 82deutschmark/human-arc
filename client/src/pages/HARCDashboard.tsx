/**
 * 
 * Author: Cascade using Claude 4 Sonnet
 * Date: 2025-09-21T21:48:39-04:00
 * PURPOSE: Scalable HARC performance dashboard supporting 5-50+ puzzle comparisons with modern UI
 * Displays player vs LLM performance with proper light theme, navbar consistency, and responsive layout
 * SRP and DRY check: Pass - Single responsibility (performance dashboard), reuses PuzzleComparisonCard and shadcn components
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/layout/Navbar';
import { playFabAuthManager } from '@/services/playfab/authManager';
import { playFabRequestManager } from '@/services/playfab/requestManager';
import { playFabUserData } from '@/services/playfab/userData';
import { arcExplainerClient, type AggregatedAIStats } from '@/services/core/arcExplainerClient';
import { idConverter } from '@/services/idConverter';
import { DashboardComparisonCard } from '@/components/comparison/DashboardComparisonCard';
import { Grid, List, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// Reuse data structures from existing components
interface HumanPerformanceRecord {
  puzzleId: string;
  correct: boolean;
  timestamp: string;
  basePoints: number;
  speedBonus: number;
  efficiencyBonus: number;
  firstTryBonus?: number;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
  attemptNumber: number;
}

interface EnhancedComparisonData {
  human: HumanPerformanceRecord;
  llmStats: AggregatedAIStats | null;
}

export default function HARCDashboard() {
  const [, setLocation] = useLocation();
  const [comparisonData, setComparisonData] = useState<EnhancedComparisonData[]>([]);
  const [filteredData, setFilteredData] = useState<EnhancedComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View controls for scalable UI (5-50+ cards)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardsPerPage, setCardsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'time' | 'accuracy'>('recent');
  const [filterCorrect, setFilterCorrect] = useState<'all' | 'correct' | 'incorrect'>('all');

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setIsLoading(true);

        // Initialize PlayFab following HARCPlatform pattern
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) throw new Error('VITE_PLAYFAB_TITLE_ID not set');
        
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ 
            titleId, 
            secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY 
          });
        }
        await playFabAuthManager.ensureAuthenticated();

        // Fetch human performance data
        const humanPerformance = await playFabUserData.getHumanPerformanceData();
        if (!humanPerformance || humanPerformance.length === 0) {
          setIsLoading(false);
          return;
        }

        // Get unique puzzle IDs and fetch LLM data
        const uniquePuzzleIds = [
          ...new Set(
            humanPerformance
              .map(record => idConverter.normalizeToArcId(record.puzzleId))
              .filter((id): id is string => id !== null)
          )
        ];

        const llmDataMap = await arcExplainerClient.getBatchExplanationsStats(uniquePuzzleIds);

        // Merge data, taking latest human record per puzzle
        const latestHumanRecords = new Map<string, HumanPerformanceRecord>();
        humanPerformance.forEach(record => {
          const existing = latestHumanRecords.get(record.puzzleId);
          if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
            latestHumanRecords.set(record.puzzleId, record);
          }
        });

        const mergedData: EnhancedComparisonData[] = Array.from(latestHumanRecords.values()).map(humanRecord => {
          const arcId = idConverter.normalizeToArcId(humanRecord.puzzleId);
          const llmStats = arcId ? llmDataMap.get(arcId) : null;
          return { human: humanRecord, llmStats: llmStats || null };
        });

        // Sort by most recent first
        mergedData.sort((a, b) => new Date(b.human.timestamp).getTime() - new Date(a.human.timestamp).getTime());

        setComparisonData(mergedData);
        setFilteredData(mergedData);

      } catch (err: any) {
        setError(err.message || 'Failed to load performance data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, []);

  // Filter and sort data based on controls
  useEffect(() => {
    let filtered = [...comparisonData];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(data => 
        data.human.puzzleId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply correctness filter
    if (filterCorrect !== 'all') {
      filtered = filtered.filter(data => 
        filterCorrect === 'correct' ? data.human.correct : !data.human.correct
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.human.timestamp).getTime() - new Date(a.human.timestamp).getTime();
        case 'score':
          return b.human.finalScore - a.human.finalScore;
        case 'time':
          return a.human.timeElapsed - b.human.timeElapsed;
        case 'accuracy':
          if (a.human.correct === b.human.correct) return 0;
          return a.human.correct ? -1 : 1;
        default:
          return 0;
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [comparisonData, searchQuery, filterCorrect, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + cardsPerPage);

  // Calculate summary statistics
  const totalScore = comparisonData.reduce((sum, data) => sum + data.human.finalScore, 0);
  const averageTime = comparisonData.length > 0
    ? (comparisonData.reduce((sum, data) => sum + data.human.timeElapsed, 0) / comparisonData.length).toFixed(1)
    : '0';
  const correctCount = comparisonData.filter(data => data.human.correct).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar title="Human ARC Platform" />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading your performance data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar title="Human ARC Platform" />
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <div className="text-red-600 font-semibold mb-2">Failed to Load Performance Data</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar title="Human ARC Platform" />

      <div className="max-w-7xl mx-auto p-6">
        {comparisonData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="text-xl text-gray-700 mb-2">No Performance Data</h2>
            <p className="text-gray-600 mb-6">Complete some ARC puzzles to see how you compare against LLMs.</p>
            <Button onClick={() => setLocation('/puzzles')} className="bg-blue-600 hover:bg-blue-700">
              Browse Puzzles
            </Button>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-blue-700 mb-2">Your Performance Dashboard</h1>
              <p className="text-gray-600">Compare your reasoning abilities with state-of-the-art AI models</p>
            </div>

            {/* Compact Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{comparisonData.length}</div>
                  <div className="text-sm text-gray-600">Puzzles Solved</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-emerald-600">
                    {((correctCount / comparisonData.length) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-amber-600">{totalScore.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{averageTime}s</div>
                  <div className="text-sm text-gray-600">Avg Time</div>
                </CardContent>
              </Card>
            </div>

            {/* View Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1 min-w-48">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search puzzles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={filterCorrect} onValueChange={(value: 'all' | 'correct' | 'incorrect') => setFilterCorrect(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="correct">Correct</SelectItem>
                        <SelectItem value="incorrect">Incorrect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(value: 'recent' | 'score' | 'time' | 'accuracy') => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="accuracy">Accuracy</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Cards Per Page */}
                  <Select value={cardsPerPage.toString()} onValueChange={(value) => setCardsPerPage(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + cardsPerPage, filteredData.length)} of {filteredData.length} puzzles
              </div>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Performance Comparison Cards */}
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg text-gray-700 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" 
                : "space-y-4"
              }>
                {paginatedData.map(data => (
                  <DashboardComparisonCard
                    key={data.human.puzzleId}
                    puzzleId={data.human.puzzleId}
                    humanResult={data.human}
                    aiResult={data.llmStats}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    if (totalPages <= 5) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    }
                    // For many pages, show smart pagination
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
