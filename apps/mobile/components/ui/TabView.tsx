/**
 * TabView — 스와이프 가능한 탭 뷰 컴포넌트
 *
 * 분석 결과 화면의 요약/상세/추천 3탭 레이아웃에 사용.
 * - 탭 인디케이터 animated underline (Reanimated)
 * - 스와이프 전환 (ScrollView paging)
 * - 탭 클릭 전환
 * - 햅틱 피드백
 */
import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';

export interface TabItem {
  key: string;
  title: string;
  /** 탭 아이콘 (선택) */
  icon?: React.ReactNode;
  /** 탭 콘텐츠 렌더링 */
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: TabItem[];
  /** 초기 탭 인덱스 (기본 0) */
  initialIndex?: number;
  /** 탭 변경 콜백 */
  onTabChange?: (index: number) => void;
  /** 컨테이너 스타일 */
  style?: ViewStyle;
  /** 탭 바 스타일 */
  tabBarStyle?: ViewStyle;
  testID?: string;
}

const SPRING_CONFIG = { damping: 20, stiffness: 200 };

export function TabView({
  tabs,
  initialIndex = 0,
  onTabChange,
  style,
  tabBarStyle,
  testID,
}: TabViewProps): React.JSX.Element {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, typography, radii } = useTheme();

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const indicatorX = useSharedValue(initialIndex * (screenWidth / tabs.length));

  const tabWidth = screenWidth / tabs.length;

  // 인디케이터 애니메이션 스타일
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  // 탭 클릭 핸들러
  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return;

      Haptics.selectionAsync();
      setActiveIndex(index);
      indicatorX.value = withSpring(index * tabWidth, SPRING_CONFIG);
      scrollRef.current?.scrollTo({ x: index * screenWidth, animated: true });
      onTabChange?.(index);
    },
    [activeIndex, tabWidth, screenWidth, indicatorX, onTabChange]
  );

  // 스와이프 종료 핸들러
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tabs.length) {
        Haptics.selectionAsync();
        setActiveIndex(newIndex);
        indicatorX.value = withSpring(newIndex * tabWidth, SPRING_CONFIG);
        onTabChange?.(newIndex);
      }
    },
    [activeIndex, screenWidth, tabs.length, tabWidth, indicatorX, onTabChange]
  );

  // 스크롤 중 인디케이터 실시간 추적
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const ratio = scrollX / screenWidth;
      indicatorX.value = ratio * tabWidth;
    },
    [screenWidth, tabWidth, indicatorX]
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* 탭 바 */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
          tabBarStyle,
        ]}
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(index)}
              style={[styles.tab, { width: tabWidth }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.title}
            >
              {tab.icon && <View style={styles.tabIcon}>{tab.icon}</View>}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? brand.primary : colors.mutedForeground,
                    fontSize: typography.size.sm,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}

        {/* 인디케이터 underline */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth - 32,
              marginLeft: spacing.md,
              backgroundColor: brand.primary,
              borderRadius: radii.full,
            },
            indicatorStyle,
          ]}
        />
      </View>

      {/* 콘텐츠 — 가로 스크롤 (페이징) */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: initialIndex * screenWidth, y: 0 }}
      >
        {tabs.map((tab) => (
          <View key={tab.key} style={{ width: screenWidth }}>
            {tab.content}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 6,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
  },
});
