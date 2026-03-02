/**
 * M-1 메이크업 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  const { colors, brand } = useTheme();

  const handleStart = () => {
    router.push('/(analysis)/makeup/camera');
  };

  return (
    <ScreenContainer testID="analysis-makeup-screen" edges={['bottom']}>
      <Animated.View entering={staggeredEntry(0)}>
        <Text style={[styles.title, { color: colors.foreground }]}>메이크업 분석</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI가 얼굴형과 피부 톤을 분석해{'\n'}맞춤 메이크업을 추천해 드려요
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
        accessibilityLabel="메이크업 분석 시작하기"
      >
        <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>
          분석 시작하기
        </Text>
      </Pressable>

      <Text style={[styles.notice, { color: colors.mutedForeground }]}>
        자연광에서 정면 얼굴 사진을 촬영해주세요
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: typography.weight.bold, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.size.base, lineHeight: 24, marginBottom: spacing.xl },
  features: { gap: spacing.smx, marginBottom: spacing.xl },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.smx,
    padding: spacing.md,
  },
  featureIcon: { fontSize: 28, marginRight: spacing.md },
  featureText: { flex: 1 },
  featureTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold, marginBottom: spacing.xs },
  featureDesc: { fontSize: typography.size.sm, lineHeight: 20 },
  startButton: {
    borderRadius: radii.smx,
    padding: 18,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  startButtonText: { fontSize: 17, fontWeight: typography.weight.semibold },
  notice: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
