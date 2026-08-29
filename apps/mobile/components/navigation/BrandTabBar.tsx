/**
 * 이룸 브랜드 탭바
 *
 * 기본 탭바를 대체하여:
 * - 활성 탭 아래 그라디언트 인디케이터 (브랜드 핑크)
 * - 탭 전환 시 햅틱 피드백 (Light impact)
 * - 프레스 스케일 애니메이션
 */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme, spacing } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HiddenAwareTabOptions {
  href?: string | null;
  tabBarButton?: unknown;
}

/**
 * Expo Router의 href=null과 React Navigation의 tabBarButton 숨김 계약을
 * 커스텀 탭바에서도 그대로 존중한다.
 */
export function isTabRouteHidden(options: HiddenAwareTabOptions): boolean {
  return options.href === null || options.tabBarButton != null;
}

/** 시스템 제스처 영역보다 최소 여백이 작아지지 않게 탭바 하단 여백을 계산한다. */
export function getTabBarBottomPadding(bottomInset: number): number {
  return Math.max(bottomInset, spacing.sm);
}

export function BrandTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps): React.JSX.Element {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.card : colors.card,
          borderTopColor: colors.border,
          paddingBottom: getTabBarBottomPadding(insets.bottom),
        },
      ]}
      testID="brand-tab-bar"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (isTabRouteHidden(options as HiddenAwareTabOptions)) return null;

        const isFocused = state.index === index;

        const label = options.tabBarLabel ?? options.title ?? route.name;
        const icon = options.tabBarIcon;

        return (
          <TabItem
            key={route.key}
            label={typeof label === 'string' ? label : route.name}
            icon={icon}
            isFocused={isFocused}
            activeTintColor={brand.primary}
            inactiveTintColor={colors.mutedForeground}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            }}
          />
        );
      })}
    </View>
  );
}

// --- 개별 탭 아이템 ---

interface TabItemProps {
  label: string;
  icon: BottomTabBarProps['descriptors'][string]['options']['tabBarIcon'];
  isFocused: boolean;
  activeTintColor: string;
  inactiveTintColor: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({
  label,
  icon,
  isFocused,
  activeTintColor,
  inactiveTintColor,
  onPress,
  onLongPress,
}: TabItemProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (): void => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = (): void => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const color = isFocused ? activeTintColor : inactiveTintColor;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedStyle]}
    >
      {/* 활성 탭 그라디언트 인디케이터 */}
      {isFocused && (
        <LinearGradient
          colors={[brand.gradientStart, brand.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.indicator}
        />
      )}

      {/* 아이콘 */}
      {icon?.({ color, size: 22, focused: isFocused })}

      {/* 라벨 */}
      <Text
        style={[
          styles.label,
          {
            color,
            fontWeight: isFocused ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tabItem: {
    // 고정 height 제거 후에도 터치 타깃 44pt(HIG)·48dp 접근성 하한을 지킨다
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  label: {
    fontSize: 10,
    marginTop: spacing.xxs,
  },
});
