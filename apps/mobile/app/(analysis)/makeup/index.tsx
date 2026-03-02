/**
 * M-1 메이크업 분석 - 시작 화면
 *
 * V2: 웹 비주얼 싱크 — 모듈 히어로 + 카드 그림자/테두리 + pill CTA
 */
import { router } from 'expo-router';
import { Platform, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '../../../components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

const FEATURES = [
  { icon: '🎨', title: '얼굴형 분석', desc: '얼굴 윤곽과 비율을 정밀 분석' },
  { icon: '👁️', title: '눈·입술 진단', desc: '눈 모양과 입술 형태별 맞춤 조언' },
  { icon: '💄', title: '컬러 매칭', desc: '언더톤 기반 최적 메이크업 컬러 추천' },
  { icon: '✨', title: '맞춤 메이크업', desc: 'AI 기반 베이스·아이·립 추천' },
];

export default function MakeupAnalysisScreen() {
  const { colors, spacing, radii, typography, isDark, module: moduleColors } = useTheme();
  const accent = moduleColors.makeup;

  const handleStart = () => {
    router.push('/(analysis)/makeup/camera');
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="analysis-makeup-screen"
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 모듈 히어로 */}
        <Animated.View entering={staggeredEntry(0)} style={styles.header}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${accent.base}18` },
            !isDark
              ? Platform.select({
                  ios: { shadowColor: accent.base, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
                  android: { elevation: 3 },
                }) ?? {}
              : {},
          ]}>
            <Text style={styles.iconText}>💄</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
            AI 메이크업 분석
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            AI가 얼굴형과 피부 톤을 분석해{'\n'}맞춤 메이크업을 추천해 드려요
          </Text>
        </Animated.View>

        {/* 분석 항목 카드 */}
        <Animated.View entering={staggeredEntry(1)} style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          !isDark
            ? Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
                android: { elevation: 2 },
              }) ?? {}
            : {},
        ]}>
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
        </Animated.View>

        {/* 촬영 가이드 카드 */}
        <Animated.View entering={staggeredEntry(2)} style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          !isDark
            ? Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
                android: { elevation: 2 },
              }) ?? {}
            : {},
        ]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>촬영 가이드</Text>
          <View style={styles.guideList}>
            <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
              • 자연광에서 정면 얼굴 사진을 촬영해주세요
            </Text>
            <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
              • 메이크업을 하지 않은 맨 얼굴이 정확해요
            </Text>
            <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
              • 이마가 보이도록 머리카락을 정리해주세요
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* pill CTA */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.startButton,
            { backgroundColor: accent.base },
            !isDark
              ? Platform.select({
                  ios: { shadowColor: accent.base, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
                  android: { elevation: 4 },
                }) ?? {}
              : {},
          ]}
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="메이크업 분석 시작하기"
        >
          <Text style={[styles.startButtonText, { color: colors.overlayForeground }]}>
            메이크업 분석 시작하기
          </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.mlg,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
