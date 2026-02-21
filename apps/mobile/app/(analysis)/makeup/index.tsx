/**
 * M-1 메이크업 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

const FEATURES = [
  { icon: '🎨', title: '얼굴형 분석', desc: '얼굴 윤곽과 비율을 정밀 분석' },
  { icon: '👁️', title: '눈·입술 진단', desc: '눈 모양과 입술 형태별 맞춤 조언' },
  { icon: '💄', title: '컬러 매칭', desc: '언더톤 기반 최적 메이크업 컬러 추천' },
  { icon: '✨', title: '맞춤 메이크업', desc: 'AI 기반 베이스·아이·립 추천' },
];

export default function MakeupAnalysisScreen() {
  const { isDark } = useTheme();

  const handleStart = () => {
    router.push('/(analysis)/makeup/camera');
  };

  return (
    <SafeAreaView
      testID="analysis-makeup-screen"
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, isDark && styles.textLight]}>메이크업 분석</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          AI가 얼굴형과 피부 톤을 분석해{'\n'}맞춤 메이크업을 추천해 드려요
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
          자연광에서 정면 얼굴 사진을 촬영해주세요
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
