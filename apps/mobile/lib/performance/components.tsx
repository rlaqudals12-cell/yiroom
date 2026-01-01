/**
 * 성능 최적화 컴포넌트
 * 최적화된 이미지, 가상화 리스트
 */

import React, { memo, useCallback, useState, useMemo } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  View,
  FlatList,
  FlatListProps,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';

/**
 * 최적화된 이미지 컴포넌트
 * - 로딩 상태 표시
 * - 에러 처리
 * - 메모이제이션
 */
interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  // 로딩 중 표시할 플레이스홀더
  placeholder?: React.ReactNode;
  // 에러 시 표시할 폴백
  fallback?: React.ReactNode;
  // 이미지 스타일
  imageStyle?: ImageStyle;
}

export const OptimizedImage = memo(function OptimizedImage({
  source,
  placeholder,
  fallback,
  style,
  imageStyle,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={style}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          {placeholder || (
            <ActivityIndicator
              size="small"
              color={isDark ? '#8b5cf6' : '#7c3aed'}
            />
          )}
        </View>
      )}
      <Image
        source={source}
        style={[{ width: '100%', height: '100%' }, imageStyle]}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </View>
  );
});

/**
 * 최적화된 FlatList 래퍼
 * - 기본 최적화 설정 적용
 * - 빈 상태 처리
 */
interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'data'> {
  data: T[] | null | undefined;
  // 빈 상태 컴포넌트
  emptyComponent?: React.ReactNode;
  // 로딩 상태
  isLoading?: boolean;
  // 로딩 컴포넌트
  loadingComponent?: React.ReactNode;
}

function OptimizedListInner<T>(
  {
    data,
    emptyComponent,
    isLoading = false,
    loadingComponent,
    renderItem,
    keyExtractor,
    ...props
  }: OptimizedListProps<T>,
  ref: React.ForwardedRef<FlatList<T>>
) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 최적화 설정
  const optimizedProps = useMemo(
    () => ({
      // 윈도우 크기 최적화
      windowSize: 5,
      // 초기 렌더링 아이템 수
      initialNumToRender: 10,
      // 최대 렌더링 배치 크기
      maxToRenderPerBatch: 10,
      // 스크롤 이벤트 스로틀
      scrollEventThrottle: 16,
      // 뷰포트 밖 아이템 제거
      removeClippedSubviews: true,
      // 업데이트 비활성화 (필요시)
      updateCellsBatchingPeriod: 50,
    }),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        {loadingComponent || (
          <ActivityIndicator
            size="large"
            color={isDark ? '#8b5cf6' : '#7c3aed'}
          />
        )}
      </View>
    );
  }

  if (!data || data.length === 0) {
    return <View style={styles.centered}>{emptyComponent}</View>;
  }

  return (
    <FlatList
      ref={ref}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      {...optimizedProps}
      {...props}
    />
  );
}

export const OptimizedList = React.forwardRef(OptimizedListInner) as <T>(
  props: OptimizedListProps<T> & { ref?: React.ForwardedRef<FlatList<T>> }
) => React.ReactElement;

/**
 * 메모이제이션 래퍼 HOC
 * 컴포넌트를 쉽게 메모이제이션
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, propsAreEqual);
}

/**
 * 깊은 비교 함수
 * memo의 propsAreEqual로 사용
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * 얕은 비교 함수
 */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }

  return true;
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
