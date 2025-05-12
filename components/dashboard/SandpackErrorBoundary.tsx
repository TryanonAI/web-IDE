'use client';

import React from 'react';
import { toast } from 'sonner';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SandpackErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('SandpackErrorBoundary caught error:', error);
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by SandpackErrorBoundary:', error);
    console.error('Error info:', errorInfo);

    // Log the error to your analytics or logging service
    const errorMessage = error.message || 'Unknown error occurred';
    toast.error(`Sandpack error: ${errorMessage}`);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4 rounded-md">
          <div className="text-red-500 max-w-md text-center">
            <h3 className="font-bold text-lg mb-2">Preview Error</h3>
            <p className="mb-4">
              {this.state.error?.message || 'Failed to load code preview'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This could be caused by a network issue or compatibility problem.
            </p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
              onClick={this.resetError}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SandpackErrorBoundary;
