/**
 * 이룸 브랜드 탭바
 *
 * 기본 탭바를 대체하여:
 * - 활성 탭 아래 그라디언트 인디케이터 (브랜드 핑크)
 * - 탭 전환 시 햅틱 피드백 (Light impact)
 * - 프레스 스케일 애니메이션
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, spacing } from '../../lib/theme';
import { brand } from '../../lib/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BrandTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.card : colors.card,
          borderTopColor: colors.border,
        },
      ]}
      testID="brand-tab-bar"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
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
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    height: Platform.OS === 'ios' ? 84 : 60,
  },
  tabItem: {
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
