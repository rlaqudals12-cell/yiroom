/**
 * Posture 자세 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

const FEATURES = [
  { icon: '🧍', title: '자세 유형 분석', desc: '거북목, 어깨 말림 등 자세 유형 진단' },
  { icon: '📐', title: '정렬도 측정', desc: '머리·어깨·척추·골반 정렬 상태 분석' },
  { icon: '🏋️', title: '교정 운동 추천', desc: '자세 유형별 맞춤 교정 운동 안내' },
  { icon: '💡', title: '생활 습관 조언', desc: '올바른 자세를 위한 일상 팁 제공' },
];

export default function PostureAnalysisScreen() {
  const { isDark } = useTheme();

  const handleStart = () => {
    router.push('/(analysis)/posture/camera');
  };

  return (
    <SafeAreaView
      testID="analysis-posture-screen"
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, isDark && styles.textLight]}>자세 분석</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          AI가 자세를 분석하고{'\n'}맞춤 교정 운동을 추천해 드려요
        </Text>

        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureCard, isDark && styles.featureCardDark]}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, isDark && styles.textLight]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, isDark && styles.textMuted]}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>분석 시작하기</Text>
        </TouchableOpacity>

        <Text style={[styles.notice, isDark && styles.textMuted]}>
          옆모습이 잘 보이도록 전신 사진을 촬영해주세요
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  containerDark: { backgroundColor: '#0a0a0a' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 32 },
  features: { gap: 12, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureCardDark: { backgroundColor: '#1a1a1a' },
  featureIcon: { fontSize: 28, marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
  featureDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  startButton: {
    backgroundColor: '#2e5afa',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  notice: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
  textLight: { color: '#fff' },
  textMuted: { color: '#999' },
});
