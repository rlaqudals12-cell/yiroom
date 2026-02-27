/**
 * OH-1 구강건강 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '../../../components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme, typography} from '@/lib/theme';

const FEATURES = [
  { icon: '🦷', title: '치아 색상 분석', desc: 'VITA 기준 치아 색조 측정' },
  { icon: '🔬', title: '잇몸 건강 체크', desc: '잇몸 상태와 염증 여부 확인' },
  { icon: '✨', title: '미백 가능성 평가', desc: '미백 시술 효과 예측' },
  { icon: '💊', title: '관리 가이드', desc: '구강 건강 유지를 위한 맞춤 조언' },
];

export default function OralHealthAnalysisScreen() {
  const { colors, brand } = useTheme();

  const handleStart = () => {
    router.push('/(analysis)/oral-health/camera');
  };

  return (
    <ScreenContainer testID="analysis-oral-health-screen" edges={['bottom']}>
      <Animated.View entering={staggeredEntry(0)}>
        <Text style={[styles.title, { color: colors.foreground }]}>구강건강 분석</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI가 치아와 잇몸 상태를 분석하고{'\n'}맞춤 관리법을 알려드려요
        </Text>
      </Animated.View>

      <View style={styles.features}>
        {FEATURES.map((feature, index) => (
          <Animated.View
            key={index}
            entering={staggeredEntry(index + 1)}
            style={[styles.featureCard, { backgroundColor: colors.card }]}
          >
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                {feature.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Pressable
        style={[styles.startButton, { backgroundColor: brand.primary }]}
        onPress={handleStart}
        accessibilityRole="button"
        accessibilityLabel="구강건강 분석 시작하기"
      >
        <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>
          분석 시작하기
        </Text>
      </Pressable>

      <Text style={[styles.notice, { color: colors.mutedForeground }]}>
        밝은 곳에서 입을 벌린 상태로 촬영해주세요
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: typography.weight.bold, marginBottom: 8 },
  subtitle: { fontSize: typography.size.base, lineHeight: 24, marginBottom: 32 },
  features: { gap: 12, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: { fontSize: 28, marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: 4 },
  featureDesc: { fontSize: typography.size.sm, lineHeight: 20 },
  startButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: { fontSize: 17, fontWeight: typography.weight.semibold },
  notice: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
