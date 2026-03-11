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
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ComparisonCard } from '@/components/analysis/ComparisonCard';
import { ScreenContainer, DataStateWrapper, GlassCard } from '@/components/ui';
import { useAnalysisComparison } from '@/hooks/useAnalysisComparison';
import type { AnalysisModuleType } from '@/hooks/useAnalysisHistory';
import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

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
  const { colors, spacing, radii, typography, brand } = useTheme();
  const params = useLocalSearchParams<{ module?: string }>();
  const moduleType = (params.module || 'skin') as AnalysisModuleType;

  const { data, isLoading, error, refetch } = useAnalysisComparison(moduleType);

  return (
    <ScreenContainer testID="compare-screen" backgroundGradient="analysis" edges={['bottom']}>
      <DataStateWrapper
        isLoading={isLoading}
        error={error ? String(error) : undefined}
        onRetry={refetch}
        isEmpty={!data}
        emptyConfig={{
          icon: <ArrowLeftRight size={48} color={colors.mutedForeground} />,
          title: '비교할 데이터가 없어요',
          description: '분석을 2회 이상 진행하면 비교할 수 있어요',
          actionLabel: '분석하러 가기',
          onAction: () => router.push(MODULE_START_PATH[moduleType] as `/${string}`),
        }}
      >
        {/* 날짜 범위 표시 */}
        {data && data.previousDate && data.currentDate && (
          <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ ...styles.dateRange, marginBottom: spacing.md }}>
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
            </GlassCard>
          </Animated.View>
        )}

        {/* 비교 카드 */}
        {data && (
          <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
            <ComparisonCard
              title={data.title}
              metrics={data.metrics}
              previousTotal={data.previousTotal}
              currentTotal={data.currentTotal}
              isFirstAnalysis={data.isFirstAnalysis}
              testID="comparison-card"
            />
          </Animated.View>
        )}

        {/* 액션 버튼 */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(TIMING.normal)}
          style={{ marginTop: spacing.lg }}
        >
          {/* 이력 보기 */}
          <GlassCard shadowSize="md" style={{ ...styles.actionButton, marginBottom: spacing.sm }}>
            <Pressable
              onPress={() => router.push(MODULE_HISTORY_PATH[moduleType] as `/${string}`)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
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
                    marginTop: spacing.xxs,
                  }}
                >
                  과거 분석 결과를 모두 확인해요
                </Text>
              </View>
            </Pressable>
          </GlassCard>

          {/* 새 분석 시작 */}
          <Pressable
            onPress={() => router.push(MODULE_START_PATH[moduleType] as `/${string}`)}
            style={[
              styles.actionButton,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.xl,
                padding: spacing.md,
              },
            ]}
            testID="new-analysis-button"
          >
            <RefreshCw size={20} color={brand.primaryForeground} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: brand.primaryForeground,
                }}
              >
                새 분석 시작
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: brand.primaryForeground + 'CC',
                  marginTop: spacing.xxs,
                }}
              >
                변화를 추적하려면 새 분석을 진행해요
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
