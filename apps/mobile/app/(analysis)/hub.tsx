/**
 * 분석 모듈 허브 화면
 * UX v3: GlassCard + GradientText 히어로 + backgroundGradient + coloredShadow + 모듈별 그라디언트 아이콘
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, GradientText, ScalePressable, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii, coloredShadow } from '@/lib/theme';

interface AnalysisModule {
  id: string;
  name: string;
  emoji: string;
  description: string;
  route: string;
  gradient: readonly [string, string];
}

interface AnalysisCategory {
  title: string;
  modules: AnalysisModule[];
}

const CATEGORIES: AnalysisCategory[] = [
  {
    title: '뷰티',
    modules: [
      {
        id: 'personal-color',
        name: '퍼스널컬러',
        emoji: '🎨',
        description: '나에게 어울리는 색상 찾기',
        route: '/(analysis)/personal-color',
        gradient: ['#C084FC', '#A855F7'],
      },
      {
        id: 'skin',
        name: '피부 분석',
        emoji: '✨',
        description: '피부 타입과 상태 진단',
        route: '/(analysis)/skin',
        gradient: ['#F472B6', '#EC4899'],
      },
      {
        id: 'hair',
        name: '헤어 분석',
        emoji: '💇',
        description: '두피 상태와 헤어 스타일',
        route: '/(analysis)/hair',
        gradient: ['#FBBF24', '#F59E0B'],
      },
      {
        id: 'makeup',
        name: '메이크업',
        emoji: '💄',
        description: 'AI 맞춤 메이크업 추천',
        route: '/(analysis)/makeup',
        gradient: ['#F9A8D4', '#EC4899'],
      },
    ],
  },
  {
    title: '바디',
    modules: [
      {
        id: 'body',
        name: '체형 분석',
        emoji: '📐',
        description: '체형 타입과 비율 분석',
        route: '/(analysis)/body',
        gradient: ['#818CF8', '#6366F1'],
      },
      {
        id: 'posture',
        name: '자세 분석',
        emoji: '🧘',
        description: '자세 교정과 체형 개선',
        route: '/(analysis)/posture',
        gradient: ['#60A5FA', '#3B82F6'],
      },
    ],
  },
  {
    title: '건강',
    modules: [
      {
        id: 'oral-health',
        name: '구강 건강',
        emoji: '🦷',
        description: '치아와 잇몸 상태 체크',
        route: '/(analysis)/oral-health',
        gradient: ['#34D399', '#10B981'],
      },
    ],
  },
];

export default function AnalysisHubScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <ScreenContainer
      testID="analysis-hub-screen"
      edges={['bottom']}
      contentPadding={20}
      backgroundGradient="analysis"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="xl" glowColor="#A855F7" style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🔬</Text>
            <GradientText
              variant="extended"
              fontSize={24}
              fontWeight="700"
              style={styles.heroTitle}
            >
              AI 분석
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              원하는 분석을 선택해주세요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 카테고리별 모듈 카드 */}
      {CATEGORIES.map((category, catIdx) => (
        <View key={category.title} style={{ marginBottom: spacing.lg }}>
          {/* 카테고리 헤더 */}
          <Animated.View entering={FadeInUp.delay(80 + catIdx * 100).duration(TIMING.normal)}>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginBottom: spacing.smx,
              }}
            >
              {category.title}
            </Text>
          </Animated.View>

          <View style={styles.moduleList}>
            {category.modules.map((mod, idx) => (
              <Animated.View
                key={mod.id}
                entering={FadeInUp.delay(120 + catIdx * 100 + idx * 50).duration(TIMING.normal)}
              >
                <ScalePressable
                  selected={false}
                  onPress={() => router.push(mod.route as never)}
                  accessibilityLabel={`${mod.name} 분석`}
                  style={[
                    styles.moduleCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                    !isDark ? coloredShadow(mod.gradient[1], 'sm') : {},
                  ]}
                >
                  <View
                    style={[styles.iconContainer, !isDark ? coloredShadow(mod.gradient[1], 'sm') : {}]}
                  >
                    <LinearGradient
                      colors={[mod.gradient[0], mod.gradient[1]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconGradient}
                    >
                      <Text style={styles.moduleEmoji}>{mod.emoji}</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.moduleContent}>
                    <Text style={[styles.moduleName, { color: colors.foreground }]}>{mod.name}</Text>
                    <Text style={[styles.moduleDesc, { color: colors.mutedForeground }]}>
                      {mod.description}
                    </Text>
                  </View>

                  <Text style={[styles.chevron, { color: colors.mutedForeground }]}>›</Text>
                </ScalePressable>
              </Animated.View>
            ))}
          </View>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.lg },
  heroContent: { alignItems: 'center', padding: spacing.xl },
  heroEmoji: { fontSize: 40, marginBottom: spacing.sm },
  heroTitle: { marginBottom: spacing.xs },
  heroSubtitle: { fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  moduleList: { gap: spacing.smx - 2 },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    marginRight: spacing.smx,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  moduleEmoji: { fontSize: 24 },
  moduleContent: { flex: 1 },
  moduleName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  moduleDesc: { fontSize: 13 },
  chevron: { fontSize: 22, fontWeight: '300' as const },
});
