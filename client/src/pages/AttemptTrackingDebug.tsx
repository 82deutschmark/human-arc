/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Debug page for testing attempt tracking functionality.
 * Provides a UI to manually test attempt tracking and view detailed logs.
 * SRP and DRY check: Pass - Single responsibility for attempt tracking debugging
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runAttemptTrackingTest, testIncorrectAttempt, testValidationPath } from '@/services/playfab/manualAttemptTest';

export function AttemptTrackingDebug() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);

    try {
      addLog('Starting comprehensive attempt tracking test...');

      // Capture console logs
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '));
        originalConsoleLog(...args);
      };

      await runAttemptTrackingTest();
      addLog('✅ Full test completed successfully');

      // Restore console.log
      console.log = originalConsoleLog;

    } catch (error) {
      addLog(`❌ Test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTest = async () => {
    setIsRunning(true);
    try {
      addLog('Running single incorrect attempt test...');
      const result = await testIncorrectAttempt();
      setTestResults(result);
      addLog(`✅ Single test completed. Result: ${result.correct ? 'CORRECT' : 'INCORRECT'}, Attempts remaining: ${result.attemptsRemaining}`);
    } catch (error) {
      addLog(`❌ Single test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runPathTest = async () => {
    setIsRunning(true);
    try {
      addLog('Testing validation path detection...');
      const result = await testValidationPath();
      setTestResults(result);
      addLog(`✅ Path test completed. Using ${result.cloudScriptWorking ? 'CloudScript' : 'Fallback'}`);
    } catch (error) {
      addLog(`❌ Path test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Attempt Tracking Debug</h1>
        <p className="text-muted-foreground mt-2">
          Test and verify that puzzle attempts are being tracked correctly to PlayFab
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Full Test</CardTitle>
            <CardDescription>
              Run comprehensive test with 2 incorrect attempts + lockout verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runFullTest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running...' : 'Run Full Test'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Single Attempt</CardTitle>
            <CardDescription>
              Test single incorrect attempt tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runSingleTest}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? 'Running...' : 'Test Single Attempt'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Path Detection</CardTitle>
            <CardDescription>
              Check if CloudScript or Fallback validation is being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runPathTest}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              {isRunning ? 'Running...' : 'Test Path'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {typeof testResults === 'object' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant={testResults.correct ? 'default' : 'destructive'}>
                      {testResults.correct ? 'CORRECT' : 'INCORRECT'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">
                      Attempts Remaining: {testResults.attemptsRemaining ?? 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">
                      Total Attempts: {testResults.totalAttempts ?? 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={testResults.locked ? 'destructive' : 'default'}>
                      {testResults.locked ? 'LOCKED' : 'AVAILABLE'}
                    </Badge>
                  </div>
                  {testResults.fallback !== undefined && (
                    <div>
                      <Badge variant={testResults.fallback ? 'secondary' : 'default'}>
                        {testResults.fallback ? 'FALLBACK' : 'CLOUDSCRIPT'}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Test Logs</CardTitle>
            <CardDescription>
              Detailed logging output from test execution
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet. Run a test to see detailed output.</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs font-mono p-1 rounded ${
                      log.includes('❌') ? 'bg-red-50 text-red-700' :
                      log.includes('✅') ? 'bg-green-50 text-green-700' :
                      log.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' :
                      'bg-muted'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">1</Badge>
              <span>First incorrect attempt should be tracked and show 1 attempt remaining</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">2</Badge>
              <span>Second incorrect attempt should lock the puzzle (0 attempts remaining)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">3</Badge>
              <span>Third attempt should be blocked with locked error message</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">4</Badge>
              <span>All attempts (correct and incorrect) should be saved to PlayFab User Data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}