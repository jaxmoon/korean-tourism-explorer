import React from 'react';
import { Button } from '@/components/ui/Button';

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface MapErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MapErrorBoundary caught error', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-gray-300 p-6 text-center">
          <p className="text-lg font-semibold text-gray-900">We couldn&apos;t load the interactive map.</p>
          <p className="text-sm text-gray-600">
            {this.state.error?.message ?? 'Please try again or check your network connection.'}
          </p>
          <Button variant="secondary" onClick={this.handleReset}>
            Retry Map
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
