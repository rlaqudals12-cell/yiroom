/**
 * N-1 영양 온보딩 결과 화면
 * BMR/TDEE/매크로/영양제 추천 + CelebrationEffect
 * UX v3: GlassCard + GradientCard + GradientText + CelebrationEffect + a11y
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  CelebrationEffect,
  GlassCard,
  GradientCard,
  GradientText,
  ScreenContainer,
} from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii, coloredShadow } from '@/lib/theme';

const NUTRITION_ACCENT = '#F97316';

const GOAL_LABELS: Record<string, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  health: '건강 유지',
  energy: '활력 증진',
};

/** 숫자 카운트업 애니메이션 텍스트 */
function CountUpText({
  target,
  style,
  suffix = '',
  accessibilityLabel,
}: {
  target: number;
  style: object;
  suffix?: string;
  accessibilityLabel?: string;
}): React.JSX.Element {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(target, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [sv, target]);

  return (
    <Text style={style} accessibilityLabel={accessibilityLabel}>
      {target}
      {suffix}
    </Text>
  );
}

export default function NutritionResultScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const [showCelebration, setShowCelebration] = useState(true);
  const params = useLocalSearchParams<{
    goal: string;
    gender: string;
    age: string;
    heightCm: string;
    weightKg: string;
    activityLevel: string;
    bmr: string;
    tdee: string;
    carbG: string;
    proteinG: string;
    fatG: string;
    mealCount: string;
  }>();

  const bmr = Number(params.bmr) || 0;
  const tdee = Number(params.tdee) || 0;
  const carbG = Number(params.carbG) || 0;
  const proteinG = Number(params.proteinG) || 0;
  const fatG = Number(params.fatG) || 0;
  const goalLabel = GOAL_LABELS[params.goal ?? ''] || '건강 유지';

  const supplements = useMemo(
    () => [
      { name: '종합 비타민', emoji: '💊', reason: '기본 영양소 보충' },
      { name: '오메가-3', emoji: '🐟', reason: '항염증 및 심혈관 건강' },
      { name: '유산균', emoji: '🦠', reason: '장 건강 및 면역력' },
    ],
    []
  );

  const handleStart = (): void => {
    router.replace('/(nutrition)/dashboard');
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="nutrition"
      testID="nutrition-result-screen"
    >
      {/* 축하 파티클 이펙트 */}
      <CelebrationEffect
        type="analysis_complete"
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
        autoDismiss
      />

      {/* 완료 헤더 — GlassCard */}
      <Animated.View entering={FadeIn.duration(TIMING.normal)}>
        <GlassCard shadowSize="xl" glowColor={NUTRITION_ACCENT} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.confetti}>🎉</Text>
            <GradientText
              variant="extended"
              fontSize={24}
              fontWeight="700"
              style={styles.headerTitle}
            >
              맞춤 영양 플랜 완성!
            </GradientText>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {goalLabel} 목표에 맞는 플랜이에요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* BMR/TDEE 큰 숫자 카드 — GradientCard */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GradientCard variant="nutrition" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>에너지 소비량</Text>
          <View style={styles.energyRow}>
            <View style={styles.energyItem} accessibilityLabel={`기초대사량 ${bmr} 킬로칼로리`}>
              <Text style={[styles.energyLabel, { color: colors.mutedForeground }]}>
                기초대사량
              </Text>
              <CountUpText
                target={bmr}
                style={[styles.energyValue, { color: colors.foreground }]}
                accessibilityLabel={`${bmr} 킬로칼로리`}
              />
              <Text style={[styles.energyUnit, { color: colors.mutedForeground }]}>kcal/일</Text>
            </View>
            <View style={[styles.energyDivider, { backgroundColor: colors.border }]} />
            <View
              style={styles.energyItem}
              accessibilityLabel={`일일 권장 칼로리 ${tdee} 킬로칼로리`}
            >
              <Text style={[styles.energyLabel, { color: colors.mutedForeground }]}>일일 권장</Text>
              <CountUpText
                target={tdee}
                style={[styles.energyValue, { color: NUTRITION_ACCENT }]}
                accessibilityLabel={`${tdee} 킬로칼로리`}
              />
              <Text style={[styles.energyUnit, { color: colors.mutedForeground }]}>kcal/일</Text>
            </View>
          </View>
          {/* 계산 근거 표시 */}
          <View style={[styles.basisRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.basisText, { color: colors.mutedForeground }]}>
              📐 Mifflin-St Jeor 공식 기반 계산
            </Text>
          </View>
        </GradientCard>
      </Animated.View>

      {/* 매크로 3열 카드 — GlassCard */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>일일 매크로 목표</Text>
            <View style={styles.macroRow}>
              <MacroCard
                label="탄수화물"
                value={carbG}
                unit="g"
                color="#3B82F6"
                colors={colors}
                isDark={isDark}
              />
              <MacroCard
                label="단백질"
                value={proteinG}
                unit="g"
                color="#10B981"
                colors={colors}
                isDark={isDark}
              />
              <MacroCard
                label="지방"
                value={fatG}
                unit="g"
                color="#F59E0B"
                colors={colors}
                isDark={isDark}
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 영양제 추천 — GlassCard */}
      <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>추천 영양제</Text>
            <View style={{ gap: spacing.smx }}>
              {supplements.map((sup, idx) => (
                <View
                  key={idx}
                  style={styles.supplementItem}
                  accessibilityLabel={`${sup.name}: ${sup.reason}`}
                >
                  <Text style={{ fontSize: 18 }}>{sup.emoji}</Text>
                  <View style={styles.supplementContent}>
                    <Text style={[styles.supplementName, { color: colors.foreground }]}>
                      {sup.name}
                    </Text>
                    <Text style={[styles.supplementDesc, { color: colors.mutedForeground }]}>
                      {sup.reason}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 비의료 고지 + 계산 한계 안내 */}
      <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
        <View
          style={[
            styles.disclaimerCard,
            { backgroundColor: isDark ? '#1E1E1E' : '#F9FAFB', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.disclaimerTitle, { color: colors.mutedForeground }]}>
            ℹ️ 참고 안내
          </Text>
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            이 결과는 일반적인 영양학 공식(Mifflin-St Jeor)에 기반한 추정치이며, 의학적 진단이나
            처방이 아닙니다. 개인의 건강 상태, 질환, 약물 복용 여부에 따라 실제 필요량은 달라질 수
            있습니다. 정확한 영양 상담은 전문 영양사와 상의해주세요.
          </Text>
        </View>
      </Animated.View>

      {/* 그라디언트 시작하기 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.startButton,
            { overflow: 'hidden' },
            !isDark
              ? (Platform.select({
                  ios: {
                    shadowColor: NUTRITION_ACCENT,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  },
                  android: { elevation: 4 },
                }) ?? {})
              : {},
          ]}
          onPress={handleStart}
          accessibilityRole="button"
          accessibilityLabel="영양 관리 시작하기"
        >
          <LinearGradient
            colors={[NUTRITION_ACCENT, '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: spacing.md, alignItems: 'center' }}
          >
            <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>영양 관리 시작하기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function MacroCard({
  label,
  value,
  unit,
  color,
  colors,
  isDark,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  colors: { foreground: string; mutedForeground: string; muted: string };
  isDark: boolean;
}): React.JSX.Element {
  return (
    <View
      style={[styles.macroItem, !isDark ? coloredShadow(color, 'sm') : {}]}
      accessibilityLabel={`${label} ${value}${unit}`}
    >
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.macroValue, { color: colors.foreground }]}>
        {value}
        <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  headerContent: { alignItems: 'center', padding: spacing.xl },
  confetti: { fontSize: 48, marginBottom: spacing.sm },
  headerTitle: { marginBottom: spacing.xs },
  headerSubtitle: { fontSize: typography.size.base, textAlign: 'center' },
  card: { marginBottom: spacing.md },
  cardInner: { padding: spacing.mlg },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  energyRow: { flexDirection: 'row', alignItems: 'center' },
  energyItem: { flex: 1, alignItems: 'center' },
  energyLabel: { fontSize: typography.size.xs, marginBottom: spacing.xs },
  energyValue: { fontSize: 36, fontWeight: typography.weight.bold },
  energyUnit: { fontSize: typography.size.xs },
  energyDivider: { width: 1, height: 60 },
  basisRow: { borderTopWidth: 1, paddingTop: spacing.smx, marginTop: spacing.md },
  basisText: { fontSize: 11, textAlign: 'center' },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  macroItem: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { fontSize: typography.size.xs },
  macroValue: { fontSize: typography.size.xl, fontWeight: typography.weight.bold },
  supplementItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.smx },
  supplementContent: { flex: 1 },
  supplementName: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  supplementDesc: { fontSize: 13 },
  disclaimerCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  disclaimerText: { fontSize: 12, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  startButton: { borderRadius: radii.full },
  startButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
