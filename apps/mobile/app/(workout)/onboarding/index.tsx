/**
 * W-1 운동 온보딩 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { ScreenContainer } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export default function WorkoutOnboardingScreen() {
  const { colors, brand } = useTheme();

  const handleStart = () => {
    router.push('/(workout)/onboarding/goals');
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="workout-onboarding-screen"
    >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: brand.primary }]}>
            <Text style={[styles.iconText, { color: brand.primaryForeground }]}>W</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>맞춤 운동 플랜</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            체형과 목표에 맞는{'\n'}나만의 운동 루틴을 만들어보세요
          </Text>
        </View>

        {/* 특징 카드 */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>이룸 운동의 특징</Text>
          <View style={styles.featureList}>
            <FeatureItem
              emoji="🎯"
              title="5가지 운동 타입"
              description="토너, 빌더, 버너, 무버, 플렉서"
            />
            <FeatureItem
              emoji="📊"
              title="체형 기반 추천"
              description="C-1 분석 결과 연동"
            />
            <FeatureItem
              emoji="⭐"
              title="연예인 루틴"
              description="20명의 셀럽 운동 루틴"
            />
            <FeatureItem
              emoji="🔥"
              title="칼로리 트래킹"
              description="MET 기반 정확한 계산"
            />
          </View>
        </View>

        {/* 온보딩 단계 */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>온보딩 과정 (3단계)</Text>
          <View style={styles.stepList}>
            <StepItem number={1} title="운동 목표 선택" />
            <StepItem number={2} title="운동 빈도 설정" />
            <StepItem number={3} title="운동 타입 분석" />
          </View>
        </View>
      {/* 시작 버튼 */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable style={[styles.startButton, { backgroundColor: brand.primary }]} onPress={handleStart}>
          <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>운동 시작하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  const { colors, brand } = useTheme();
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
    </View>
  );
}

function StepItem({ number, title }: { number: number; title: string }) {
  const { colors, brand } = useTheme();
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: brand.primary }]}>
        <Text style={[styles.stepNumberText, { color: brand.primaryForeground }]}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
  },
  stepList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
