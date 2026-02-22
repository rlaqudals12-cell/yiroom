/**
 * AnimatedList — 아이템 순차 fadeInUp 진입 애니메이션이 있는 FlatList 래퍼
 *
 * 기존 OptimizedList의 성능 최적화를 유지하면서
 * 각 아이템이 순차적으로 등장하는 staggered animation 추가.
 */
import { useCallback } from 'react';
import {
  FlatList,
  type FlatListProps,
  type ListRenderItem,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';
import { TIMING } from '../../lib/animations';

interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  /** 아이템 간 진입 딜레이 (ms). 기본 80ms */
  staggerDelay?: number;
  /** 진입 애니메이션 지속 시간 (ms). 기본 500ms */
  animationDuration?: number;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 빈 상태 컴포넌트 */
  emptyComponent?: React.ReactNode;
  /** 로딩 컴포넌트 */
  loadingComponent?: React.ReactNode;
}

export function AnimatedList<T>({
  data,
  renderItem,
  staggerDelay = TIMING.staggerInterval,
  animationDuration = TIMING.slow,
  isLoading = false,
  emptyComponent,
  loadingComponent,
  ...flatListProps
}: AnimatedListProps<T>): React.JSX.Element {
  const { colors } = useTheme();

  // 각 아이템을 Animated.View로 감싸서 순차 등장
  const animatedRenderItem: ListRenderItem<T> = useCallback(
    (info) => {
      const entering = FadeInUp.delay(info.index * staggerDelay).duration(animationDuration);

      return <Animated.View entering={entering}>{renderItem(info)}</Animated.View>;
    },
    [renderItem, staggerDelay, animationDuration]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        {loadingComponent ?? <ActivityIndicator size="large" color={brand.primary} />}
      </View>
    );
  }

  if (!data || data.length === 0) {
    if (emptyComponent) {
      return <View style={styles.centered}>{emptyComponent}</View>;
    }
    return <View />;
  }

  return (
    <FlatList
      data={data}
      renderItem={animatedRenderItem}
      windowSize={5}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      removeClippedSubviews
      scrollEventThrottle={16}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
