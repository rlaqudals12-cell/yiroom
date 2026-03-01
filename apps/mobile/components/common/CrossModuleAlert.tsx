/**
 * CrossModuleAlert — 분석 완료 후 교차 모듈 추천 네비게이션
 *
 * 예: 피부 분석 후 "맞춤 제품도 확인해보세요" 안내
 */
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../lib/theme';
import { TIMING } from '../../lib/animations';

export interface CrossModuleLink {
  /** 표시 라벨 */
  label: string;
  /** 이동 경로 */
  route: string;
  /** 아이콘 이모지 */
  emoji: string;
}

/** 모듈별 교차 추천 매핑 */
const MODULE_RECOMMENDATIONS: Record<string, CrossModuleLink[]> = {
  skin: [
    { label: '맞춤 제품 보기', route: '/products/recommendations', emoji: '🧴' },
    { label: '피부 일기 쓰기', route: '/(analysis)/skin/diary', emoji: '📝' },
  ],
  personalColor: [
    { label: '맞춤 제품 보기', route: '/products/recommendations', emoji: '💄' },
    { label: '코디 추천 받기', route: '/style', emoji: '👗' },
  ],
  body: [
    { label: '운동 플랜 보기', route: '/(workout)/plan/index', emoji: '💪' },
    { label: '체형 변화 추적', route: '/(reports)/body-progress', emoji: '📊' },
  ],
  workout: [
    { label: '영양 기록하기', route: '/(nutrition)', emoji: '🥗' },
    { label: '스트레칭 가이드', route: '/(workout)/stretching/index', emoji: '🧘' },
  ],
  nutrition: [
    { label: '운동 시작하기', route: '/(workout)', emoji: '🏃' },
    { label: '맞춤 레시피 보기', route: '/(nutrition)/recipe/index', emoji: '📖' },
  ],
  hair: [
    { label: '맞춤 제품 보기', route: '/products/recommendations', emoji: '💇' },
  ],
  makeup: [
    { label: '퍼스널컬러 분석', route: '/(analysis)/personal-color', emoji: '🎨' },
    { label: '맞춤 제품 보기', route: '/products/recommendations', emoji: '💄' },
  ],
  oralHealth: [
    { label: '맞춤 제품 보기', route: '/products/recommendations', emoji: '🪥' },
  ],
  face: [
    { label: '피부 분석 하기', route: '/(analysis)/skin', emoji: '🔬' },
    { label: '메이크업 추천', route: '/(analysis)/makeup', emoji: '💄' },
  ],
  posture: [
    { label: '스트레칭 가이드', route: '/(workout)/stretching/index', emoji: '🧘' },
    { label: '운동 플랜 보기', route: '/(workout)/plan/index', emoji: '💪' },
  ],
};

interface CrossModuleAlertProps {
  /** 현재 완료된 모듈 키 */
  moduleKey: string;
  /** 테스트 ID */
  testID?: string;
}

export function CrossModuleAlert({
  moduleKey,
  testID = 'cross-module-alert',
}: CrossModuleAlertProps): React.JSX.Element | null {
  const { colors, spacing, radii, typography, brand } = useTheme();

  const links = MODULE_RECOMMENDATIONS[moduleKey];
  if (!links || links.length === 0) return null;

  const handlePress = (route: string): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(500).duration(TIMING.normal)}
      testID={testID}
      style={{
        backgroundColor: brand.primary + '12',
        borderRadius: radii.xl,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
        }}
      >
        다음 단계도 확인해보세요
      </Text>

      <View style={{ gap: spacing.xs }}>
        {links.map((link) => (
          <Pressable
            key={link.route}
            onPress={() => handlePress(link.route)}
            accessibilityLabel={link.label}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.secondary : colors.card,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.smd,
              gap: spacing.sm,
            })}
          >
            <Text style={{ fontSize: 18 }}>{link.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: brand.primary,
                fontWeight: typography.weight.medium,
                flex: 1,
              }}
            >
              {link.label}
            </Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
              →
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
