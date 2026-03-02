/**
 * 스타일 온보딩 화면
 *
 * 3단계로 선호 스타일 / 자주 입는 컬러 / 완료 요약을 수집.
 */
import { Check, ChevronRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

import { ScreenContainer } from '../../../components/ui';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

const STYLE_OPTIONS = [
  { id: 'casual', label: '캐주얼' },
  { id: 'minimal', label: '미니멀' },
  { id: 'street', label: '스트릿' },
  { id: 'formal', label: '포멀' },
  { id: 'romantic', label: '로맨틱' },
  { id: 'sporty', label: '스포티' },
  { id: 'vintage', label: '빈티지' },
  { id: 'classic', label: '클래식' },
  { id: 'modern', label: '모던' },
];

const COLOR_OPTIONS = [
  { id: 'black', label: '블랙', hex: '#1C1C1E' },
  { id: 'white', label: '화이트', hex: '#F5F4F2' },
  { id: 'navy', label: '네이비', hex: '#1E3A5F' },
  { id: 'beige', label: '베이지', hex: '#D4C5A9' },
  { id: 'gray', label: '그레이', hex: '#9CA3AF' },
  { id: 'brown', label: '브라운', hex: '#8B6F47' },
  { id: 'blue', label: '블루', hex: '#3B82F6' },
  { id: 'green', label: '그린', hex: '#22C55E' },
  { id: 'pink', label: '핑크', hex: '#F8C8DC' },
  { id: 'red', label: '레드', hex: '#EF4444' },
];

const STEP_TITLES = [
  '선호하는 스타일을 골라주세요',
  '자주 입는 컬러를 선택해주세요',
  '설정이 완료됐어요!',
];

export default function StyleOnboardingScreen(): React.JSX.Element {
  const { colors, brand, status } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const toggleStyle = useCallback((id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const toggleColor = useCallback((id: string) => {
    setSelectedColors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const canProceed =
    (step === 0 && selectedStyles.length > 0) ||
    (step === 1 && selectedColors.length > 0) ||
    step === 2;

  const handleNext = useCallback(() => {
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      // 완료 처리 (추후 저장 로직 연동)
    }
  }, [step]);

  return (
    <ScreenContainer
      testID="style-onboarding-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 진행률 바 */}
      <View style={[styles.progressContainer, { paddingHorizontal: spacing.md }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: brand.primary,
                width: `${((step + 1) / 3) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.stepIndicator, { color: colors.mutedForeground }]}>
          {step + 1} / 3
        </Text>
      </View>

      {/* 단계 제목 */}
      <Text
        style={[styles.title, { color: colors.foreground, paddingHorizontal: spacing.md }]}
        accessibilityRole="header"
      >
        {STEP_TITLES[step]}
      </Text>

      {/* Step 1: 스타일 선택 */}
      {step === 0 && (
        <ScrollView
          contentContainerStyle={styles.optionsGrid}
          showsVerticalScrollIndicator={false}
        >
          {STYLE_OPTIONS.map((option) => {
            const isSelected = selectedStyles.includes(option.id);
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.styleOption,
                  {
                    backgroundColor: isSelected ? brand.primary : colors.secondary,
                    borderRadius: radii.lg,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? brand.primary : colors.border,
                  },
                ]}
                onPress={() => toggleStyle(option.id)}
                accessibilityLabel={`${option.label} ${isSelected ? '선택됨' : '선택 안됨'}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.styleOptionText,
                    { color: isSelected ? brand.primaryForeground : colors.foreground },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Check size={16} color={brand.primaryForeground} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Step 2: 컬러 선택 */}
      {step === 1 && (
        <ScrollView
          contentContainerStyle={styles.colorGrid}
          showsVerticalScrollIndicator={false}
        >
          {COLOR_OPTIONS.map((option) => {
            const isSelected = selectedColors.includes(option.id);
            return (
              <Pressable
                key={option.id}
                style={styles.colorItem}
                onPress={() => toggleColor(option.id)}
                accessibilityLabel={`${option.label} ${isSelected ? '선택됨' : '선택 안됨'}`}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: option.hex,
                      borderWidth: isSelected ? 3 : 1,
                      borderColor: isSelected ? brand.primary : colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <Check size={18} color={option.id === 'black' ? '#FFFFFF' : '#1C1C1E'} />
                  )}
                </View>
                <Text style={[styles.colorLabel, { color: colors.foreground }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Step 3: 완료 요약 */}
      {step === 2 && (
        <ScrollView
          contentContainerStyle={styles.summaryContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              선호 스타일
            </Text>
            <View style={styles.summaryTags}>
              {selectedStyles.map((id) => {
                const option = STYLE_OPTIONS.find((o) => o.id === id);
                return (
                  <View key={id} style={[styles.summaryTag, { backgroundColor: brand.primary + '20' }]}>
                    <Text style={[styles.summaryTagText, { color: brand.primary }]}>
                      {option?.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.summaryLabel, { color: colors.mutedForeground, marginTop: spacing.md }]}>
              자주 입는 컬러
            </Text>
            <View style={styles.summaryColorRow}>
              {selectedColors.map((id) => {
                const option = COLOR_OPTIONS.find((o) => o.id === id);
                return (
                  <View
                    key={id}
                    style={[styles.summaryColorDot, { backgroundColor: option?.hex }]}
                  />
                );
              })}
            </View>
          </View>

          <Text style={[styles.completionText, { color: status.success }]}>
            맞춤 스타일 추천을 시작할 준비가 됐어요
          </Text>
        </ScrollView>
      )}

      {/* 하단 버튼 */}
      <View style={[styles.bottomBar, { paddingHorizontal: spacing.md }]}>
        <Pressable
          style={[
            styles.nextButton,
            {
              backgroundColor: canProceed ? brand.primary : colors.muted,
              borderRadius: radii.lg,
            },
          ]}
          onPress={handleNext}
          disabled={!canProceed}
          accessibilityLabel={step === 2 ? '완료' : '다음'}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.nextButtonText,
              { color: canProceed ? brand.primaryForeground : colors.mutedForeground },
            ]}
          >
            {step === 2 ? '완료' : '다음'}
          </Text>
          {step < 2 && (
            <ChevronRight
              size={18}
              color={canProceed ? brand.primaryForeground : colors.mutedForeground}
            />
          )}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  stepIndicator: {
    fontSize: typography.size.xs,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    minWidth: '45%',
    flexGrow: 1,
  },
  styleOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  colorItem: {
    alignItems: 'center',
    width: '18%',
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  colorLabel: {
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  summaryContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  summaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  summaryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  summaryTagText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  summaryColorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryColorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  completionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  bottomBar: {
    paddingVertical: spacing.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.smx,
  },
  nextButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
