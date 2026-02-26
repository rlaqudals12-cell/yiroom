/**
 * 분석 비교 화면 (제네릭)
 *
 * 모듈별 최근 2건의 분석 결과를 비교하는 화면.
 * route: /analysis/compare?module=skin
 *
 * ComparisonCard 컴포넌트를 활용하여
 * 이전↔현재 지표를 나란히 시각화.
 */
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeftRight, RefreshCw, Clock, BarChart3 } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComparisonCard } from '@/components/analysis/ComparisonCard';
import { useTheme } from '@/lib/theme';
import { TIMING } from '@/lib/animations';
import { useAnalysisComparison } from '@/hooks/useAnalysisComparison';
import type { AnalysisModuleType } from '@/hooks/useAnalysisHistory';

// 모듈별 이력 화면 경로
const MODULE_HISTORY_PATH: Record<AnalysisModuleType, string> = {
  'personal-color': '/(analysis)/personal-color/history',
  skin: '/(analysis)/skin/history',
  body: '/(analysis)/body/history',
  hair: '/(analysis)/hair/history',
  makeup: '/(analysis)/makeup/history',
  'oral-health': '/(analysis)/oral-health/history',
  posture: '/(analysis)/posture/history',
};

// 모듈별 분석 시작 경로
const MODULE_START_PATH: Record<AnalysisModuleType, string> = {
  'personal-color': '/(analysis)/personal-color',
  skin: '/(analysis)/skin',
  body: '/(analysis)/body',
  hair: '/(analysis)/hair',
  makeup: '/(analysis)/makeup',
  'oral-health': '/(analysis)/oral-health',
  posture: '/(analysis)/posture',
};

function formatDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일`;
}

export default function CompareScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, isDark, brand } = useTheme();
  const params = useLocalSearchParams<{ module?: string }>();
  const moduleType = (params.module || 'skin') as AnalysisModuleType;

  const { data, isLoading, error, refetch } = useAnalysisComparison(moduleType);

  // 로딩
  if (isLoading) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.center, { flex: 1, backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={brand.primary} />
        <Text
          style={{
            marginTop: spacing.md,
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
          }}
        >
          비교 데이터를 불러오고 있어요
        </Text>
      </SafeAreaView>
    );
  }

  // 에러
  if (error) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[styles.center, { flex: 1, backgroundColor: colors.background }]}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          비교 데이터를 불러올 수 없어요
        </Text>
        <TouchableOpacity
          onPress={refetch}
          style={[
            styles.retryButton,
            { backgroundColor: brand.primary, borderRadius: radii.lg },
          ]}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={[styles.retryText, { fontSize: typography.size.sm }]}>다시 시도</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
      testID="compare-screen"
    >
      {/* 날짜 범위 표시 */}
      {data && data.previousDate && data.currentDate && (
        <Animated.View
          entering={FadeInUp.duration(TIMING.normal)}
          style={[
            styles.dateRange,
            {
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              borderColor: colors.border,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
            shadows.card,
          ]}
        >
          <View style={styles.dateItem}>
            <Clock size={14} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginLeft: spacing.xs,
              }}
            >
              이전: {formatDate(data.previousDate)}
            </Text>
          </View>
          <ArrowLeftRight size={16} color={brand.primary} />
          <View style={styles.dateItem}>
            <Clock size={14} color={brand.primary} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs,
              }}
            >
              현재: {formatDate(data.currentDate)}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* 비교 카드 */}
      {data && (
        <ComparisonCard
          title={data.title}
          metrics={data.metrics}
          previousTotal={data.previousTotal}
          currentTotal={data.currentTotal}
          isFirstAnalysis={data.isFirstAnalysis}
          testID="comparison-card"
        />
      )}

      {/* 액션 버튼 */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(TIMING.normal)}
        style={{ marginTop: spacing.lg }}
      >
        {/* 이력 보기 */}
        <TouchableOpacity
          onPress={() => router.push(MODULE_HISTORY_PATH[moduleType] as `/${string}`)}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              borderColor: colors.border,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
            shadows.card,
          ]}
          testID="view-history-button"
        >
          <BarChart3 size={20} color={brand.primary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              전체 이력 보기
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              과거 분석 결과를 모두 확인해요
            </Text>
          </View>
        </TouchableOpacity>

        {/* 새 분석 시작 */}
        <TouchableOpacity
          onPress={() => router.push(MODULE_START_PATH[moduleType] as `/${string}`)}
          style={[
            styles.actionButton,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.lg,
              padding: spacing.md,
            },
          ]}
          testID="new-analysis-button"
        >
          <RefreshCw size={20} color="#fff" />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: '#fff',
              }}
            >
              새 분석 시작
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: 'rgba(255,255,255,0.8)',
                marginTop: 2,
              }}
            >
              변화를 추적하려면 새 분석을 진행해요
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
