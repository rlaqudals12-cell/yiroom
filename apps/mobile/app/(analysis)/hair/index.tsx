/**
 * H-1 헤어 분석 - 시작 화면
 *
 * ADR-120: 단색 잉크 히어로 + 분석 안내
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTranslation } from '@/lib/i18n';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { GlassCard, ScreenContainer } from '../../../components/ui';
import { TIMING } from '../../../lib/animations';

const FEATURES = ['texture', 'scalp', 'routine', 'style'] as const;

const GRADIENT_COLORS = ['#FBBF24', '#F59E0B'] as const;

export default function HairAnalysisScreen() {
  const { t } = useTranslation();
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
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('analysis.mobileHairInput.title')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('analysis.mobileHairInput.subtitle')}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 분석 항목 카드 */}
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" glowColor={accent.base} style={{ ...styles.card }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t('analysis.mobileHairInput.featuresTitle')}
            </Text>
            <View style={styles.features}>
              {FEATURES.map((feature) => (
                <View key={feature} style={styles.featureItem}>
                  <View style={[styles.bullet, { backgroundColor: accent.base }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                      {t(`analysis.mobileHairInput.features.${feature}.title`)}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                      {t(`analysis.mobileHairInput.features.${feature}.description`)}
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
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t('analysis.mobileHairInput.guideTitle')}
            </Text>
            <View style={styles.guideList}>
              <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
                {t('analysis.mobileHairInput.guideLighting')}
              </Text>
              <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
                {t('analysis.mobileHairInput.guideLooseHair')}
              </Text>
              <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
                {t('analysis.mobileHairInput.guideAngles')}
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
          accessibilityLabel={t('analysis.mobileHairInput.start')}
          style={[styles.startButton, { overflow: 'hidden' }]}
        >
          <LinearGradient
            colors={[GRADIENT_COLORS[0], GRADIENT_COLORS[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>{t('analysis.mobileHairInput.start')}</Text>
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
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
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
