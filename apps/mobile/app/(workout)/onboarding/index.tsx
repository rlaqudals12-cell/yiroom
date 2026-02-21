/**
 * W-1 운동 온보딩 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

export default function WorkoutOnboardingScreen() {
  const { colors, isDark } = useTheme();

  const handleStart = () => {
    router.push('/(workout)/onboarding/goals');
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
      testID="workout-onboarding-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>W</Text>
          </View>
          <Text style={[styles.title, isDark && styles.textLight]}>맞춤 운동 플랜</Text>
          <Text style={[styles.subtitle, isDark && styles.textMuted]}>
            체형과 목표에 맞는{'\n'}나만의 운동 루틴을 만들어보세요
          </Text>
        </View>

        {/* 특징 카드 */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>이룸 운동의 특징</Text>
          <View style={styles.featureList}>
            <FeatureItem
              emoji="🎯"
              title="5가지 운동 타입"
              description="토너, 빌더, 버너, 무버, 플렉서"
              isDark={isDark}
            />
            <FeatureItem
              emoji="📊"
              title="체형 기반 추천"
              description="C-1 분석 결과 연동"
              isDark={isDark}
            />
            <FeatureItem
              emoji="⭐"
              title="연예인 루틴"
              description="20명의 셀럽 운동 루틴"
              isDark={isDark}
            />
            <FeatureItem
              emoji="🔥"
              title="칼로리 트래킹"
              description="MET 기반 정확한 계산"
              isDark={isDark}
            />
          </View>
        </View>

        {/* 온보딩 단계 */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>온보딩 과정 (3단계)</Text>
          <View style={styles.stepList}>
            <StepItem number={1} title="운동 목표 선택" isDark={isDark} />
            <StepItem number={2} title="운동 빈도 설정" isDark={isDark} />
            <StepItem number={3} title="운동 타입 분석" isDark={isDark} />
          </View>
        </View>
      </ScrollView>

      {/* 시작 버튼 */}
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>운동 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  emoji,
  title,
  description,
  isDark,
}: {
  emoji: string;
  title: string;
  description: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, isDark && styles.textLight]}>{title}</Text>
        <Text style={[styles.featureDescription, isDark && styles.textMuted]}>{description}</Text>
      </View>
    </View>
  );
}

function StepItem({ number, title, isDark }: { number: number; title: string; isDark: boolean }) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, isDark && styles.textLight]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
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
    color: '#111',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
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
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 15,
    color: '#111',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f8f9fc',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerDark: {
    backgroundColor: '#0a0a0a',
    borderTopColor: '#222',
  },
  startButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
