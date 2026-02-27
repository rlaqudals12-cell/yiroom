/**
 * Posture 자세 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '../../../components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme } from '@/lib/theme';

const FEATURES = [
  { icon: '🧍', title: '자세 유형 분석', desc: '거북목, 어깨 말림 등 자세 유형 진단' },
  { icon: '📐', title: '정렬도 측정', desc: '머리·어깨·척추·골반 정렬 상태 분석' },
  { icon: '🏋️', title: '교정 운동 추천', desc: '자세 유형별 맞춤 교정 운동 안내' },
  { icon: '💡', title: '생활 습관 조언', desc: '올바른 자세를 위한 일상 팁 제공' },
];

export default function PostureAnalysisScreen() {
  const { colors, brand } = useTheme();

  const handleStart = () => {
    router.push('/(analysis)/posture/camera');
  };

  return (
    <ScreenContainer testID="analysis-posture-screen" edges={['bottom']}>
      <Animated.View entering={staggeredEntry(0)}>
        <Text style={[styles.title, { color: colors.foreground }]}>자세 분석</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI가 자세를 분석하고{'\n'}맞춤 교정 운동을 추천해 드려요
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
      >
        <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>
          분석 시작하기
        </Text>
      </Pressable>

      <Text style={[styles.notice, { color: colors.mutedForeground }]}>
        옆모습이 잘 보이도록 전신 사진을 촬영해주세요
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
  features: { gap: 12, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: { fontSize: 28, marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  featureDesc: { fontSize: 14, lineHeight: 20 },
  startButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: { fontSize: 17, fontWeight: '600' },
  notice: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
