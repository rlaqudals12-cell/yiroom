/**
 * N-1 영양 온보딩 결과 화면
 * BMR/TDEE/매크로/영양제 추천 + Confetti
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

const NUTRITION_ACCENT = '#F97316';

const GOAL_LABELS: Record<string, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  health: '건강 유지',
  energy: '활력 증진',
};

export default function NutritionResultScreen() {
  const { colors, isDark } = useTheme();
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

  // 온보딩 완료 시 기본 영양제 추천
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
      testID="nutrition-result-screen"
    >
      {/* 완료 헤더 */}
      <Animated.View entering={FadeIn.duration(TIMING.normal)}>
        <LinearGradient
          colors={
            isDark ? [`${NUTRITION_ACCENT}10`, `${NUTRITION_ACCENT}18`] : ['#FFF7ED', '#FFEDD5']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { borderRadius: radii.xl }]}
        >
          <Text style={styles.confetti}>🎉</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            맞춤 영양 플랜 완성!
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {goalLabel} 목표에 맞는 플랜이에요
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* BMR/TDEE 큰 숫자 카드 */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(TIMING.normal)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          !isDark
            ? (Platform.select({
                ios: {
                  shadowColor: NUTRITION_ACCENT,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                },
                android: { elevation: 3 },
              }) ?? {})
            : {},
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>에너지 소비량</Text>
        <View style={styles.energyRow}>
          <View style={styles.energyItem}>
            <Text style={[styles.energyLabel, { color: colors.mutedForeground }]}>기초대사량</Text>
            <Text style={[styles.energyValue, { color: colors.foreground }]}>{bmr}</Text>
            <Text style={[styles.energyUnit, { color: colors.mutedForeground }]}>kcal/일</Text>
          </View>
          <View style={[styles.energyDivider, { backgroundColor: colors.border }]} />
          <View style={styles.energyItem}>
            <Text style={[styles.energyLabel, { color: colors.mutedForeground }]}>일일 권장</Text>
            <Text style={[styles.energyValue, { color: NUTRITION_ACCENT }]}>{tdee}</Text>
            <Text style={[styles.energyUnit, { color: colors.mutedForeground }]}>kcal/일</Text>
          </View>
        </View>
      </Animated.View>

      {/* 매크로 3열 카드 */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(TIMING.normal)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>일일 매크로 목표</Text>
        <View style={styles.macroRow}>
          <MacroCard label="탄수화물" value={carbG} unit="g" color="#3B82F6" colors={colors} />
          <MacroCard label="단백질" value={proteinG} unit="g" color="#10B981" colors={colors} />
          <MacroCard label="지방" value={fatG} unit="g" color="#F59E0B" colors={colors} />
        </View>
      </Animated.View>

      {/* 영양제 추천 */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(TIMING.normal)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>추천 영양제</Text>
        <View style={{ gap: spacing.smx }}>
          {supplements.map((sup, idx) => (
            <View key={idx} style={styles.supplementItem}>
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
      </Animated.View>

      {/* 시작하기 버튼 */}
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
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  colors: { foreground: string; mutedForeground: string; muted: string };
}) {
  return (
    <View style={styles.macroItem}>
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
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  confetti: { fontSize: 48, marginBottom: spacing.sm },
  headerTitle: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
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
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyItem: {
    flex: 1,
    alignItems: 'center',
  },
  energyLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xs,
  },
  energyValue: {
    fontSize: 36,
    fontWeight: typography.weight.bold,
  },
  energyUnit: {
    fontSize: typography.size.xs,
  },
  energyDivider: {
    width: 1,
    height: 60,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: typography.size.xs,
  },
  macroValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
  },
  supplementContent: { flex: 1 },
  supplementName: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  supplementDesc: { fontSize: 13 },
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
  },
  startButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
