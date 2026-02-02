'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 전역 에러 바운더리
 * 렌더링 중 발생하는 에러를 캐치하여 사용자에게 친절한 UI 제공
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry 에러 리포팅
    Sentry.captureException(error, {
      tags: { type: 'error-boundary' },
      extra: { componentStack: errorInfo.componentStack },
    });
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full" data-testid="error-boundary">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>문제가 발생했습니다</CardTitle>
              <CardDescription>
                페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
              <Button onClick={this.handleGoHome} className="w-full" variant="outline">
                <Home className="w-4 h-4 mr-2" />
                홈으로 이동
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs text-muted-foreground">
                  <summary className="cursor-pointer">오류 상세 (개발용)</summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
