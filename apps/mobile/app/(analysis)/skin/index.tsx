/**
 * S-1 피부 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme, typography} from '@/lib/theme';

export default function SkinAnalysisScreen() {
  const { colors, brand } = useTheme();

  const handleStartAnalysis = () => {
    router.push('/(analysis)/skin/camera');
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="analysis-skin-screen"
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Animated.View entering={staggeredEntry(0)} style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: brand.primary }]}>
            <Text style={[styles.iconText, { color: brand.primaryForeground }]}>AI</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>AI 피부 분석</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            사진 한 장으로 나의 피부 타입과{'\n'}맞춤 스킨케어 루틴을 확인하세요
          </Text>
        </Animated.View>

        {/* 분석 항목 */}
        <Animated.View entering={staggeredEntry(1)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>분석 항목</Text>
          <View style={styles.itemList}>
            <AnalysisItem label="피부 타입" description="건성/지성/복합/민감성" />
            <AnalysisItem label="수분도" description="피부 수분 레벨 측정" />
            <AnalysisItem label="유분도" description="피부 유분 밸런스" />
            <AnalysisItem label="모공" description="모공 상태 분석" />
            <AnalysisItem label="주름" description="피부 탄력 상태" />
            <AnalysisItem label="색소침착" description="기미/잡티 분석" />
            <AnalysisItem label="민감도" description="피부 민감 지수" />
          </View>
        </Animated.View>

        {/* 안내 */}
        <Animated.View entering={staggeredEntry(2)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>촬영 가이드</Text>
          <View style={styles.guideList}>
            <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
              • 화장을 지운 맨 얼굴로 촬영해주세요
            </Text>
            <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
              • 밝은 자연광 아래에서 촬영하면 좋아요
            </Text>
            <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
              • 정면을 바라보고 촬영해주세요
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 시작 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[styles.startButton, { backgroundColor: brand.primary }]}
          onPress={handleStartAnalysis}
          accessibilityRole="button"
          accessibilityLabel="피부 분석 시작하기"
        >
          <Text style={[styles.startButtonText, { color: brand.primaryForeground }]}>
            피부 분석 시작하기
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function AnalysisItem({ label, description }: { label: string; description: string }) {
  const { colors, brand } = useTheme();

  return (
    <View style={styles.analysisItem}>
      <View style={[styles.bullet, { backgroundColor: brand.primary }]} />
      <View>
        <Text style={[styles.itemLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.itemDescription, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: 16,
  },
  itemList: {
    gap: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
  },
  guideList: {
    gap: 8,
  },
  guideItem: {
    fontSize: typography.size.sm,
    lineHeight: 22,
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
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
