/**
 * 에러 바운더리 컴포넌트
 * 앱 크래시 방지 및 에러 화면 표시
 */

import * as Haptics from 'expo-haptics';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/theme';
import { errorLogger } from '../../lib/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 클래스 기반 에러 바운더리
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorLogger.error('Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * 에러 폴백 UI
 */
function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  // 함수형 컴포넌트에서 useTheme 사용
  return <ErrorFallbackContent error={error} onRetry={onRetry} />;
}

function ErrorFallbackContent({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { colors, brand, status } = useTheme();

  return (
    <SafeAreaView
      testID="error-boundary"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>😵</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>문제가 발생했어요</Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          앱에서 예상치 못한 오류가 발생했습니다.{'\n'}
          다시 시도해주세요.
        </Text>

        {__DEV__ && error && (
          <View style={[styles.errorBox, { backgroundColor: status.error + '20' }]}>
            <Text style={[styles.errorTitle, { color: colors.mutedForeground }]}>
              에러 정보 (개발 모드)
            </Text>
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error.message}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: brand.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={[styles.retryButtonText, { color: brand.primaryForeground }]}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
