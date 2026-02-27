/**
 * H-1 헤어 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

const FEATURES = [
  { icon: '💇', title: '모발 질감 분석', desc: '직모/웨이브/컬리 등 모발 유형 파악' },
  { icon: '🔬', title: '두피 건강 체크', desc: '두피 상태와 유분/수분 밸런스 확인' },
  { icon: '✨', title: '맞춤 케어 루틴', desc: 'AI 기반 개인 맞춤 헤어 관리법 추천' },
  { icon: '💈', title: '스타일 추천', desc: '모발 특성에 맞는 헤어스타일 제안' },
];

export default function HairAnalysisScreen() {
  const { colors, brand } = useTheme();

  const handleStart = () => {
    router.push('/(analysis)/hair/camera');
  };

  return (
    <SafeAreaView
      testID="analysis-hair-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>헤어 분석</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI가 모발 상태를 분석하고{'\n'}맞춤 케어 루틴을 추천해 드려요
        </Text>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: colors.card }]}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureText}>
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

        <Pressable
          style={[styles.startButton, { backgroundColor: brand.primary }]}
          onPress={handleStart}

        >
          <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>
            분석 시작하기
          </Text>
        </Pressable>

        <Text style={[styles.notice, { color: colors.mutedForeground }]}>
          자연광에서 헤어가 잘 보이는 사진을 촬영해주세요
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
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
