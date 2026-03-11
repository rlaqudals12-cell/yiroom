/**
 * H-1 헤어 분석 - 시작 화면
 *
 * V3: GlassCard + GradientText 히어로 + backgroundGradient + LinearGradient CTA
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { GlassCard, GradientText, ScreenContainer } from '../../../components/ui';
import { TIMING } from '../../../lib/animations';

const FEATURES = [
  { icon: '💇', title: '모발 질감 분석', desc: '직모/웨이브/컬리 등 모발 유형 파악' },
  { icon: '🔬', title: '두피 건강 체크', desc: '두피 상태와 유분/수분 밸런스 확인' },
  { icon: '✨', title: '맞춤 케어 루틴', desc: 'AI 기반 개인 맞춤 헤어 관리법 추천' },
  { icon: '💈', title: '스타일 추천', desc: '모발 특성에 맞는 헤어스타일 제안' },
];

const GRADIENT_COLORS = ['#FBBF24', '#F59E0B'] as const;

export default function HairAnalysisScreen() {
  const { colors, module: moduleColors } = useTheme();
  const accent = moduleColors.hair;

  const handleStart = () => {
    router.push('/(analysis)/hair/camera');
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="analysis-hair-screen"
      edges={['bottom']}
      backgroundGradient="analysis"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* GlassCard 히어로 */}
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <GlassCard shadowSize="xl" glowColor={accent.base} style={{ ...styles.hero }}>
            <View style={styles.heroContent}>
              <Text style={styles.iconText}>💇</Text>
              <GradientText
                variant="extended"
                fontSize={24}
                fontWeight="700"
                colors={[GRADIENT_COLORS[0], GRADIENT_COLORS[1]]}
              >
                AI 헤어 분석
              </GradientText>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                모발 상태를 분석하고{'\n'}맞춤 케어 루틴을 추천해 드려요
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 분석 항목 카드 */}
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" glowColor={accent.base} style={{ ...styles.card }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>분석 항목</Text>
            <View style={styles.features}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.bullet, { backgroundColor: accent.base }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* 촬영 가이드 카드 */}
        <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" glowColor={accent.base} style={{ ...styles.card }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>촬영 가이드</Text>
            <View style={styles.guideList}>
              <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
                • 자연광에서 헤어가 잘 보이게 촬영해주세요
              </Text>
              <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
                • 묶지 않은 자연스러운 상태가 좋아요
              </Text>
              <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
                • 앞·옆·뒤 다양한 각도를 촬영하면 정확해요
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>

      {/* LinearGradient CTA */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="헤어 분석 시작하기"
          style={[styles.startButton, { overflow: 'hidden' }]}
        >
          <LinearGradient
            colors={[GRADIENT_COLORS[0], GRADIENT_COLORS[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>헤어 분석 시작하기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.mlg,
    paddingBottom: 100,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconText: {
    fontSize: 32,
    marginBottom: spacing.smx,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.smx,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  features: {
    gap: spacing.smx,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  featureDesc: {
    fontSize: 13,
  },
  guideList: {
    gap: spacing.sm,
  },
  guideItem: {
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: radii.full,
    alignItems: 'center',
  },
  startButtonGradient: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderRadius: radii.full,
  },
  startButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
  },
});
