/**
 * S-1 피부 분석 - 시작 화면
 */
import { router } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';

import { SkinSafetyScreeningCard } from '@/components/analysis/skin/SkinSafetyScreeningCard';
import { GlassCard, ScreenContainer } from '@/components/ui';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

import { staggeredEntry } from '../../../lib/animations';

export default function SkinAnalysisScreen() {
  const { colors, spacing, module: moduleColors } = useTheme();

  const handleSafetyComplete = () => {
    router.push('/(analysis)/skin/camera');
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="analysis-skin-screen"
      edges={['bottom']}
      backgroundGradient="analysis"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Animated.View entering={staggeredEntry(0)} style={styles.header}>
          <GlassCard
            shadowSize="md"
            glowColor={moduleColors.skin.base}
            style={{ padding: spacing.mlg, alignItems: 'center' }}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: `${moduleColors.skin.base}18` }]}
            >
              <Text style={styles.iconText}>💧</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>AI 피부 분석</Text>
            <Text
              style={[styles.subtitle, { color: colors.mutedForeground, marginTop: spacing.smx }]}
            >
              사진 한 장으로 나의 피부 타입과{'\n'}맞춤 스킨케어 루틴을 확인하세요
            </Text>
          </GlassCard>
        </Animated.View>

        {/* 분석 항목 */}
        <Animated.View entering={staggeredEntry(1)} style={styles.card}>
          <GlassCard
            shadowSize="md"
            glowColor={moduleColors.skin.base}
            style={{ padding: spacing.mlg }}
          >
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              분석 항목
            </Text>
            <View style={styles.itemList}>
              <AnalysisItem label="피부 타입" description="건성/지성/복합/민감성" />
              <AnalysisItem label="수분도" description="피부 수분 레벨 측정" />
              <AnalysisItem label="유분도" description="피부 유분 밸런스" />
              <AnalysisItem label="모공" description="모공 상태 분석" />
              <AnalysisItem label="주름" description="피부 탄력 상태" />
              <AnalysisItem label="색소침착" description="기미/잡티 분석" />
              <AnalysisItem label="민감도" description="피부 민감 지수" />
            </View>
          </GlassCard>
        </Animated.View>

        {/* 안내 */}
        <Animated.View entering={staggeredEntry(2)} style={styles.card}>
          <GlassCard
            shadowSize="md"
            glowColor={moduleColors.skin.base}
            style={{ padding: spacing.mlg }}
          >
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.foreground }]}
            >
              촬영 가이드
            </Text>
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
          </GlassCard>
        </Animated.View>

        <Animated.View entering={staggeredEntry(3)}>
          <SkinSafetyScreeningCard onComplete={handleSafetyComplete} />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

function AnalysisItem({ label, description }: { label: string; description: string }) {
  const { colors, module: moduleColors } = useTheme();

  return (
    <View style={styles.analysisItem}>
      <View style={[styles.bullet, { backgroundColor: moduleColors.skin.base }]} />
      <View style={{ flex: 1 }}>
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
    padding: spacing.mlg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.mlg,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.smx,
  },
  subtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  itemList: {
    gap: spacing.smx,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.smx,
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
    marginBottom: spacing.xxs,
  },
  itemDescription: {
    fontSize: 13,
  },
  guideList: {
    gap: spacing.sm,
  },
  guideItem: {
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
});
