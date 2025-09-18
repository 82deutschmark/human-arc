/**
 * Author: Claude Code using Opus 4.1
 * Date: 2025-09-18
 * PURPOSE: Error boundary component for puzzle solver to catch and handle runtime errors gracefully.
 * This provides a robust error handling mechanism that prevents crashes and helps debugging.
 * SRP and DRY check: Pass - Single responsibility for error catching and display
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface PuzzleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

export class PuzzleErrorBoundary extends React.Component<PuzzleErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: PuzzleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('PuzzleErrorBoundary caught error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);

    // Update state with full error info
    this.setState({
      error,
      errorInfo
    });

    // In production, you could also log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send error to logging service
      console.log('Would send error to logging service in production');
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-6">
            <Alert className="border-red-600 bg-red-950">
              <AlertCircle className="h-4 w-4" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-red-400">
                  Oops! Something went wrong
                </h2>
                <p className="text-red-300">
                  The puzzle solver encountered an unexpected error. This has been logged for debugging.
                </p>
              </div>
            </Alert>

            {/* Show detailed error in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                <h3 className="text-amber-400 font-semibold">Error Details (Development Only)</h3>

                <div className="space-y-2">
                  <p className="text-slate-300">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>

                  {this.state.error.stack && (
                    <pre className="text-xs text-slate-400 overflow-auto bg-slate-900 p-2 rounded">
                      {this.state.error.stack}
                    </pre>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <details className="text-slate-400">
                      <summary className="cursor-pointer hover:text-slate-300">
                        Component Stack
                      </summary>
                      <pre className="text-xs overflow-auto bg-slate-900 p-2 rounded mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Try Again
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Refresh Page
              </Button>
            </div>

            <p className="text-center text-slate-500 text-sm">
              If this problem persists, please report it to the development team.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for specific puzzle error scenarios
export function withPuzzleErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onReset?: () => void
) {
  return (props: P) => (
    <PuzzleErrorBoundary fallback={fallback} onReset={onReset}>
      <Component {...props} />
    </PuzzleErrorBoundary>
  );
}