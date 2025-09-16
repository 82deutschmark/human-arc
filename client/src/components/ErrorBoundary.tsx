/*
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-14
 * PURPOSE: React Error Boundary to catch component crashes and show fallback UI
 * Prevents the entire app from crashing when individual components fail
 * SRP and DRY check: Pass - Single responsibility of error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-slate-800 border-red-600 text-center max-w-md mx-auto mt-8">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-2" />
            <h3 className="text-xl font-bold text-red-400">Something went wrong</h3>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              A component error occurred. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}