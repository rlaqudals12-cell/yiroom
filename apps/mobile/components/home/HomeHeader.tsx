/**
 * HomeHeader — 그라디언트 히어로 배너 + 인사말
 */
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { getTimeGreeting } from '../../hooks/useTimeGreeting';
import { TIMING } from '../../lib/animations';
import { useTheme, typography, spacing } from '../../lib/theme';
import { GradientBackground, GradientText } from '../ui';

interface HomeHeaderProps {
  userName: string;
  isLoaded: boolean;
  /** 서버 브리핑과 동일한 인사 문장 — 없으면 로컬 시간 인사로 안전하게 폴백한다. */
  briefingGreeting?: string;
}

function getHeaderGreeting(briefingGreeting: string | undefined, userName: string): string {
  if (!briefingGreeting) {
    const localGreeting = getTimeGreeting();
    return localGreeting === '좋은 오후' ? '좋은 오후예요' : `${localGreeting}이에요`;
  }

  // 서버 인사는 "이름님, 좋은 아침이에요" 형식이므로 이름은 아래 제목에 한 번만 둔다.
  const namePrefix = `${userName}님,`;
  return briefingGreeting.startsWith(namePrefix)
    ? briefingGreeting.slice(namePrefix.length).trim()
    : briefingGreeting;
}

export function HomeHeader({
  userName,
  isLoaded,
  briefingGreeting,
}: HomeHeaderProps): React.JSX.Element {
  const { colors, spacing, radii, typography, isDark, brand } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(TIMING.normal)}
      style={[
        {
          marginBottom: spacing.lg,
          borderRadius: radii.xl + 8,
        },
        // 히어로 배너 그림자 (웹 shadow-lg 매칭)
        isDark
          ? {}
          : (Platform.select({
              ios: {
                shadowColor: brand.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
              },
              android: { elevation: 4 },
            }) ?? {}),
      ]}
      testID="home-header"
    >
      <GradientBackground
        variant="brand"
        style={{
          borderRadius: radii.xl + 8,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
        }}
      >
        <Text
          style={[
            styles.greeting,
            { fontSize: typography.size.sm, color: `${colors.overlayForeground}D9` },
          ]}
        >
          {getHeaderGreeting(briefingGreeting, userName)}
        </Text>
        <Text
          style={[
            styles.userName,
            {
              fontSize: typography.size['2xl'],
              color: colors.overlayForeground,
              letterSpacing: typography.letterSpacing.tighter,
            },
          ]}
        >
          {isLoaded ? userName : '...'}님
        </Text>
        <GradientText
          variant="extended"
          fontSize={typography.size.xs}
          fontWeight={typography.weight.medium}
          style={styles.slogan}
        >
          온전한 나를 찾는 여정, 이룸
        </GradientText>
      </GradientBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: spacing.xs,
  },
  userName: {
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  slogan: {
    marginTop: spacing.xxs,
  },
});
