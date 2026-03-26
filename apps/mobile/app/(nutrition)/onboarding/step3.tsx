/**
 * N-1 영양 온보딩 Step 3 — 알레르기 & 칼로리 미리보기
 * 알레르기 선택 + 식사횟수 + BMR/TDEE 실시간 계산
 * UX v3: GlassCard + GradientText 히어로 + GradientCard 미리보기 + coloredShadow + a11y
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  GlassCard,
  GradientCard,
  GradientText,
  ScalePressable,
  ScreenContainer,
  StepProgressBar,
} from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { calculateBMR, calculateTDEE } from '@/lib/nutrition';
import type { Gender, ActivityLevel } from '@/lib/nutrition';
import { useTheme, typography, spacing, radii, coloredShadow } from '@/lib/theme';

const NUTRITION_ACCENT = '#F97316';

const ALLERGIES = [
  { id: 'dairy', label: '유제품', emoji: '🥛' },
  { id: 'eggs', label: '달걀', emoji: '🥚' },
  { id: 'nuts', label: '견과류', emoji: '🥜' },
  { id: 'seafood', label: '해산물', emoji: '🦐' },
  { id: 'gluten', label: '글루텐', emoji: '🌾' },
  { id: 'soy', label: '대두', emoji: '🫘' },
  { id: 'none', label: '없음', emoji: '✅' },
];

const MEAL_COUNTS = [
  { id: '2', label: '2끼', description: '간헐적 단식' },
  { id: '3', label: '3끼', description: '규칙적 식사' },
  { id: '4', label: '4끼+', description: '소식 다빈도' },
];

export default function NutritionStep3Screen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{
    goal: string;
    gender: string;
    age: string;
    heightCm: string;
    weightKg: string;
    activityLevel: string;
    mealStyle: string;
    cookingSkill: string;
    budget: string;
  }>();

  const [allergies, setAllergies] = useState<string[]>([]);
  const [mealCount, setMealCount] = useState('3');

  const toggleAllergy = (id: string): void => {
    if (id === 'none') {
      setAllergies(['none']);
      return;
    }
    setAllergies((prev) => {
      const filtered = prev.filter((a) => a !== 'none');
      return filtered.includes(id) ? filtered.filter((a) => a !== id) : [...filtered, id];
    });
  };

  // BMR/TDEE 실시간 계산
  const { bmr, tdee } = useMemo(() => {
    const profile = {
      gender: (params.gender || 'male') as Gender,
      weightKg: Number(params.weightKg) || 65,
      heightCm: Number(params.heightCm) || 170,
      age: Number(params.age) || 25,
    };
    const bmrVal = calculateBMR(profile);
    const tdeeVal = calculateTDEE(bmrVal, (params.activityLevel || 'moderate') as ActivityLevel);
    return { bmr: Math.round(bmrVal), tdee: Math.round(tdeeVal) };
  }, [params.gender, params.weightKg, params.heightCm, params.age, params.activityLevel]);

  const macros = useMemo(() => {
    const goalId = params.goal || 'health';
    const ratios: Record<string, { carb: number; protein: number; fat: number }> = {
      weight_loss: { carb: 0.4, protein: 0.35, fat: 0.25 },
      muscle_gain: { carb: 0.45, protein: 0.3, fat: 0.25 },
      health: { carb: 0.5, protein: 0.25, fat: 0.25 },
      energy: { carb: 0.55, protein: 0.2, fat: 0.25 },
    };
    const r = ratios[goalId] ?? ratios.health;
    return {
      carb: Math.round((tdee * r.carb) / 4),
      protein: Math.round((tdee * r.protein) / 4),
      fat: Math.round((tdee * r.fat) / 9),
    };
  }, [tdee, params.goal]);

  const handleComplete = (): void => {
    router.push({
      pathname: '/(nutrition)/result',
      params: {
        ...params,
        allergies: JSON.stringify(allergies),
        mealCount,
        bmr: String(bmr),
        tdee: String(tdee),
        carbG: String(macros.carb),
        proteinG: String(macros.protein),
        fatG: String(macros.fat),
      },
    });
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="nutrition"
      testID="nutrition-onboarding-step3"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="lg" glowColor={NUTRITION_ACCENT} style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <BarChart3 size={36} color={NUTRITION_ACCENT} />
            </View>
            <GradientText
              variant="extended"
              fontSize={22}
              fontWeight="700"
              style={styles.heroTitle}
            >
              마지막 단계
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              알레르기 정보와 식사 횟수를 선택하면 맞춤 플랜이 완성돼요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 스텝 프로그레스 바 */}
      <StepProgressBar
        current={3}
        total={3}
        accentColor={NUTRITION_ACCENT}
        testID="step-progress"
      />

      {/* 알레르기 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          알레르기 / 식이 제한
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          해당 사항을 모두 선택해주세요
        </Text>
        <View style={styles.chipGrid}>
          {ALLERGIES.map((a) => (
            <ScalePressable
              key={a.id}
              selected={allergies.includes(a.id)}
              onPress={() => toggleAllergy(a.id)}
              accessibilityLabel={`${a.label} ${allergies.includes(a.id) ? '선택됨' : '선택 안됨'}`}
              style={[
                styles.allergyChip,
                {
                  backgroundColor: colors.card,
                  borderColor: allergies.includes(a.id) ? NUTRITION_ACCENT : colors.border,
                  borderWidth: allergies.includes(a.id) ? 2 : 1,
                },
                allergies.includes(a.id) ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                allergies.includes(a.id) && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
              <Text
                style={[
                  styles.allergyLabel,
                  { color: allergies.includes(a.id) ? NUTRITION_ACCENT : colors.foreground },
                  allergies.includes(a.id) && { fontWeight: typography.weight.bold },
                ]}
              >
                {a.label}
              </Text>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

      {/* 식사 횟수 */}
      <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>하루 식사 횟수</Text>
        <View style={styles.mealCountRow}>
          {MEAL_COUNTS.map((mc) => (
            <ScalePressable
              key={mc.id}
              selected={mealCount === mc.id}
              onPress={() => setMealCount(mc.id)}
              accessibilityLabel={`하루 ${mc.label}: ${mc.description}`}
              style={[
                styles.mealCountChip,
                {
                  backgroundColor: colors.card,
                  borderColor: mealCount === mc.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: mealCount === mc.id ? 2 : 1,
                },
                mealCount === mc.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                mealCount === mc.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <Text
                style={[
                  styles.mealCountLabel,
                  { color: mealCount === mc.id ? NUTRITION_ACCENT : colors.foreground },
                ]}
              >
                {mc.label}
              </Text>
              <Text style={[styles.mealCountDesc, { color: colors.mutedForeground }]}>
                {mc.description}
              </Text>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

      {/* 칼로리 미리보기 — GradientCard 사용 */}
      <Animated.View entering={FadeInUp.delay(240).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>칼로리 미리보기</Text>
        <GradientCard variant="nutrition" style={styles.previewCard}>
          <View style={styles.previewRow}>
            <View style={styles.previewItem} accessibilityLabel={`기초대사량 ${bmr} 킬로칼로리`}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                기초대사량 (BMR)
              </Text>
              <Text style={[styles.previewValue, { color: colors.foreground }]}>{bmr}</Text>
              <Text style={[styles.previewUnit, { color: colors.mutedForeground }]}>kcal</Text>
            </View>
            <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
            <View
              style={styles.previewItem}
              accessibilityLabel={`일일 권장 칼로리 ${tdee} 킬로칼로리`}
            >
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                일일 권장 (TDEE)
              </Text>
              <Text style={[styles.previewValue, { color: NUTRITION_ACCENT }]}>{tdee}</Text>
              <Text style={[styles.previewUnit, { color: colors.mutedForeground }]}>kcal</Text>
            </View>
          </View>

          <View style={[styles.macroRow, { borderTopColor: colors.border }]}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>탄수화물</Text>
              <Text style={[styles.macroValue, { color: colors.foreground }]}>{macros.carb}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>단백질</Text>
              <Text style={[styles.macroValue, { color: colors.foreground }]}>
                {macros.protein}g
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>지방</Text>
              <Text style={[styles.macroValue, { color: colors.foreground }]}>{macros.fat}g</Text>
            </View>
          </View>
        </GradientCard>
      </Animated.View>

      {/* 그라디언트 CTA 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.completeButton,
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
          onPress={handleComplete}
          accessibilityRole="button"
          accessibilityLabel="결과 보기"
        >
          <LinearGradient
            colors={[NUTRITION_ACCENT, '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeButtonGradient}
          >
            <Text style={[styles.completeButtonText, { color: '#FFFFFF' }]}>결과 보기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md },
  heroContent: { alignItems: 'center', padding: spacing.xl },
  heroIconWrap: { marginBottom: spacing.sm },
  heroTitle: { marginBottom: spacing.xs },
  heroSubtitle: { fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionDesc: { fontSize: 13, marginBottom: spacing.smx },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  allergyLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  mealCountRow: { flexDirection: 'row', gap: spacing.sm },
  mealCountChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xxs,
  },
  mealCountLabel: { fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  mealCountDesc: { fontSize: 11 },
  previewCard: { padding: spacing.mlg },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  previewItem: { flex: 1, alignItems: 'center' },
  previewLabel: { fontSize: typography.size.xs, marginBottom: spacing.xs },
  previewValue: { fontSize: 32, fontWeight: typography.weight.bold },
  previewUnit: { fontSize: typography.size.xs },
  previewDivider: { width: 1, height: 50 },
  macroRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: spacing.md },
  macroItem: { flex: 1, alignItems: 'center' },
  macroLabel: { fontSize: typography.size.xs, marginBottom: spacing.xxs },
  macroValue: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  completeButton: { borderRadius: radii.full },
  completeButtonGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  completeButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
