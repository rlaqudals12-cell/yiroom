/**
 * 분석 이력 화면
 *
 * 모든 분석 모듈의 이력을 통합 또는 모듈별 필터로 조회.
 * 기간 필터 (1개월/3개월/6개월/전체) 지원.
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/ui';
import { AnalysisHistoryCard } from '../../../components/analysis/AnalysisHistoryCard';
import {
  useAnalysisHistory,
  type AnalysisModuleType,
  type HistoryPeriod,
  type AnalysisHistoryItem,
} from '../../../hooks/useAnalysisHistory';
import { useTheme, spacing, radii, typography } from '../../../lib/theme';

// 모듈 필터 탭
const MODULE_TABS: { key: AnalysisModuleType | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'personal-color', label: '컬러' },
  { key: 'skin', label: '피부' },
  { key: 'body', label: '체형' },
  { key: 'hair', label: '헤어' },
  { key: 'makeup', label: '메이크업' },
  { key: 'oral-health', label: '구강' },
  { key: 'posture', label: '자세' },
];

// 기간 필터 탭
const PERIOD_TABS: { key: HistoryPeriod; label: string }[] = [
  { key: '1m', label: '1개월' },
  { key: '3m', label: '3개월' },
  { key: '6m', label: '6개월' },
  { key: 'all', label: '전체' },
];

export default function AnalysisHistoryScreen(): React.JSX.Element {
  const { colors, status, brand } = useTheme();
  const params = useLocalSearchParams<{ module?: string }>();

  // 초기 모듈 필터: URL 파라미터로 전달 가능
  const initialModule = (params.module as AnalysisModuleType | 'all') || 'all';
  const [selectedModule, setSelectedModule] = useState<AnalysisModuleType | 'all'>(initialModule);
  const [selectedPeriod, setSelectedPeriod] = useState<HistoryPeriod>('all');

  const { items, isLoading, error, hasMore, loadMore, refetch } = useAnalysisHistory(
    selectedModule,
    selectedPeriod
  );

  const handleModuleChange = useCallback((key: AnalysisModuleType | 'all') => {
    Haptics.selectionAsync();
    setSelectedModule(key);
  }, []);

  const handlePeriodChange = useCallback((key: HistoryPeriod) => {
    Haptics.selectionAsync();
    setSelectedPeriod(key);
  }, []);

  const handleItemPress = useCallback((item: AnalysisHistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 해당 분석의 결과 화면으로 이동
    const routeMap: Record<AnalysisModuleType, string> = {
      'personal-color': '/(analysis)/personal-color/result',
      skin: '/(analysis)/skin/result',
      body: '/(analysis)/body/result',
      hair: '/(analysis)/hair/result',
      makeup: '/(analysis)/makeup/result',
      'oral-health': '/(analysis)/oral-health/result',
      posture: '/(analysis)/posture/result',
    };
    const route = routeMap[item.moduleType];
    if (route) {
      router.push({ pathname: route as '/(analysis)/personal-color/result', params: { historyId: item.id } });
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AnalysisHistoryItem }) => (
      <AnalysisHistoryCard
        item={item}
        onPress={handleItemPress}
        style={{ marginBottom: spacing.sm }}
      />
    ),
    [handleItemPress]
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={brand.primary} />
      </View>
    );
  }, [hasMore, brand.primary]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📊</Text>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
            marginBottom: spacing.xs,
          }}
        >
          분석 기록이 없어요
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
          }}
        >
          AI 분석을 시작하면 이곳에서{'\n'}이력을 확인할 수 있어요
        </Text>
      </View>
    );
  }, [isLoading, colors]);

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="analysis-history-screen"
      edges={['bottom']}
    >
      {/* 모듈 필터 */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MODULE_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: spacing.md }}
          renderItem={({ item: tab }) => (
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedModule === tab.key ? brand.primary : colors.card,
                  borderColor:
                    selectedModule === tab.key ? brand.primary : colors.border,
                },
              ]}
              onPress={() => handleModuleChange(tab.key)}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                  color:
                    selectedModule === tab.key
                      ? colors.overlayForeground
                      : colors.foreground,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* 기간 필터 */}
      <View style={[styles.periodRow, { paddingHorizontal: spacing.md }]}>
        {PERIOD_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.periodChip,
              {
                backgroundColor:
                  selectedPeriod === tab.key ? colors.secondary : 'transparent',
                borderRadius: radii.md,
              },
            ]}
            onPress={() => handlePeriodChange(tab.key)}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: selectedPeriod === tab.key ? '600' : '400',
                color:
                  selectedPeriod === tab.key
                    ? colors.foreground
                    : colors.mutedForeground,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        {/* 비교 버튼 — 특정 모듈 선택 시 노출 */}
        {selectedModule !== 'all' && (
          <Pressable
            style={[
              styles.compareButton,
              {
                backgroundColor: brand.primary + '18',
                borderRadius: radii.md,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/(analysis)/compare?module=${selectedModule}` as `/${string}`);
            }}
            testID="compare-button"
          >
            <ArrowLeftRight size={14} color={brand.primary} />
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: brand.primary,
                marginLeft: spacing.xs,
              }}
            >
              비교
            </Text>
          </Pressable>
        )}
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginLeft: spacing.sm,
          }}
        >
          {items.length}건
        </Text>
      </View>

      {/* 로딩 */}
      {isLoading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text
            style={{
              marginTop: spacing.sm,
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            이력을 불러오고 있어요
          </Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: status.error,
              textAlign: 'center',
            }}
          >
            이력 조회에 실패했어요
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: brand.primary, borderRadius: radii.md }]}
            onPress={refetch}
          >
            <Text style={{ color: colors.overlayForeground, fontSize: typography.size.sm, fontWeight: typography.weight.semibold }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onRefresh={refetch}
          refreshing={isLoading && items.length > 0}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xxl,
            flexGrow: items.length === 0 ? 1 : undefined,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  periodChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
