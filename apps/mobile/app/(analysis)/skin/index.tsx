/**
 * S-1 피부 분석 - 시작 화면
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Platform, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme, typography, radii , spacing, coloredShadow, moduleColors } from '@/lib/theme';

export default function SkinAnalysisScreen() {
  const { colors, brand, spacing, radii, typography, isDark, module: moduleColors } = useTheme();

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
          <View style={[
            styles.iconContainer,
            { backgroundColor: `${moduleColors.skin.base}18` },
            !isDark
              ? Platform.select({
                  ios: { shadowColor: moduleColors.skin.base, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
                  android: { elevation: 3 },
                }) ?? {}
              : {},
          ]}>
            <Text style={styles.iconText}>💧</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>AI 피부 분석</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            사진 한 장으로 나의 피부 타입과{'\n'}맞춤 스킨케어 루틴을 확인하세요
          </Text>
        </Animated.View>

        {/* 분석 항목 */}
        <Animated.View entering={staggeredEntry(1)} style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          !isDark ? coloredShadow(moduleColors.skin.base, 'sm') : {},
        ]}>
          <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.foreground }]}>분석 항목</Text>
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
        <Animated.View entering={staggeredEntry(2)} style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          !isDark ? coloredShadow(moduleColors.skin.base, 'sm') : {},
        ]}>
          <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.foreground }]}>촬영 가이드</Text>
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
          onPress={handleStartAnalysis}
          accessibilityRole="button"
          accessibilityLabel="피부 분석 시작하기"
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
        >
          <LinearGradient
            colors={[moduleColors.skin.base, moduleColors.skin.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.startButton,
              !isDark
                ? Platform.select({
                    ios: { shadowColor: moduleColors.skin.base, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
                    android: { elevation: 4 },
                  }) ?? {}
                : {},
            ]}
          >
            <Text style={[styles.startButtonText, { color: colors.overlayForeground }]}>
              피부 분석 시작하기
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
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
    paddingBottom: 100,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
