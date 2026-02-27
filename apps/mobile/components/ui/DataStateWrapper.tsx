/**
 * DataStateWrapper — 로딩/에러/빈 상태 통합 래퍼
 *
 * 모든 데이터 화면에서 3가지 상태(로딩, 에러, 빈)를 일관되게 처리.
 * children은 데이터가 정상 로드된 경우에만 렌더링.
 */
import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { spacing } from '../../lib/theme';
import { EmptyState } from '../common/EmptyState';

import { ErrorState } from './ErrorState';
import { SkeletonCard, SkeletonLoader, SkeletonText } from './SkeletonLoader';

interface EmptyConfig {
  /** 아이콘 (React 노드 또는 이모지) */
  icon: ReactNode;
  /** 제목 */
  title: string;
  /** 설명 */
  description: string;
  /** 액션 버튼 라벨 */
  actionLabel?: string;
  /** 액션 핸들러 */
  onAction?: () => void;
}

interface DataStateWrapperProps {
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 객체 (truthy이면 에러 상태) */
  error?: Error | string | null;
  /** 데이터 비어있음 여부 */
  isEmpty?: boolean;
  /** 재시도 핸들러 (에러 + pull-to-refresh) */
  onRetry?: () => void;
  /** 빈 상태 설정 */
  emptyConfig?: EmptyConfig;
  /** 커스텀 로딩 UI (기본: SkeletonCard × 3) */
  loadingComponent?: ReactNode;
  /** 스켈레톤 카드 수 (기본 로딩 UI 사용 시) */
  skeletonCount?: number;
  /** 정상 상태일 때 렌더링할 콘텐츠 */
  children: ReactNode;
  /** 테스트 ID */
  testID?: string;
}

/** 기본 로딩 스켈레톤 */
function DefaultLoading({ count }: { count: number }): React.JSX.Element {
  return (
    <View style={styles.skeletonContainer} testID="data-state-loading">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.skeletonItem}>
          <SkeletonLoader width="40%" height={14} borderRadius={4} />
          <SkeletonText style={{ marginTop: spacing.sm, width: '70%' } as never} />
          <SkeletonCard style={{ marginTop: 12 } as never} />
        </View>
      ))}
    </View>
  );
}

export function DataStateWrapper({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  emptyConfig,
  loadingComponent,
  skeletonCount = 3,
  children,
  testID = 'data-state-wrapper',
}: DataStateWrapperProps): React.JSX.Element {
  // 1. 로딩 상태
  if (isLoading) {
    return (
      <View testID={testID}>
        {loadingComponent ?? <DefaultLoading count={skeletonCount} />}
      </View>
    );
  }

  // 2. 에러 상태
  if (error) {
    const message = typeof error === 'string' ? error : error.message;
    return (
      <View testID={testID}>
        <ErrorState message={message} onRetry={onRetry} />
      </View>
    );
  }

  // 3. 빈 상태
  if (isEmpty && emptyConfig) {
    return (
      <View testID={testID}>
        <EmptyState
          icon={emptyConfig.icon}
          title={emptyConfig.title}
          description={emptyConfig.description}
          actionLabel={emptyConfig.actionLabel}
          onAction={emptyConfig.onAction}
        />
      </View>
    );
  }

  // 4. 정상 — children 렌더링
  return <View testID={testID}>{children}</View>;
}

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonItem: {
    gap: spacing.xs,
  },
});
