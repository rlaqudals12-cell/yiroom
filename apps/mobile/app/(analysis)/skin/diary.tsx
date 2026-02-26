/**
 * 피부 다이어리 메인 화면
 * 월별 엔트리 목록 + 요약 통계 + 기록 추가
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native';

import { useTheme, brand } from '../../../lib/theme';
import { spacing, radii, typography } from '../../../lib/theme';
import { useSkinDiary } from '../../../hooks/useSkinDiary';
import {
  CONDITION_LABELS,
  CONDITION_EMOJIS,
  WEATHER_ICONS,
  WEATHER_LABELS,
  type SkinDiaryEntry,
} from '../../../lib/skincare/diary-types';

export default function SkinDiaryScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const {
    entries,
    loading,
    error,
    summary,
    year,
    month,
    setMonth,
    deleteEntry,
    refresh,
  } = useSkinDiary();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePrevMonth = useCallback((): void => {
    if (month === 1) setMonth(year - 1, 12);
    else setMonth(year, month - 1);
  }, [year, month, setMonth]);

  const handleNextMonth = useCallback((): void => {
    if (month === 12) setMonth(year + 1, 1);
    else setMonth(year, month + 1);
  }, [year, month, setMonth]);

  const handleAddEntry = useCallback((): void => {
    const today = new Date().toISOString().split('T')[0];
    router.push({
      pathname: '/(analysis)/skin/diary-entry' as '/(analysis)/skin/camera',
      params: { date: today },
    });
  }, []);

  const handleEditEntry = useCallback((entry: SkinDiaryEntry): void => {
    router.push({
      pathname: '/(analysis)/skin/diary-entry' as '/(analysis)/skin/camera',
      params: { date: entry.entryDate, entryId: entry.id },
    });
  }, []);

  const handleDeleteEntry = useCallback(
    (entry: SkinDiaryEntry): void => {
      Alert.alert(
        '기록 삭제',
        `${entry.entryDate} 기록을 삭제할까요?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => deleteEntry(entry.id),
          },
        ],
      );
    },
    [deleteEntry],
  );

  // 월 셀렉터
  const renderMonthSelector = (): React.JSX.Element => (
    <View
      style={[
        styles.monthSelector,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Pressable onPress={handlePrevMonth} hitSlop={12}>
        <ChevronLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.monthTitle, { color: colors.foreground }]}>
        {year}년 {month}월
      </Text>
      <Pressable onPress={handleNextMonth} hitSlop={12}>
        <ChevronRight size={24} color={colors.foreground} />
      </Pressable>
    </View>
  );

  // 요약 카드
  const renderSummary = (): React.JSX.Element | null => {
    if (!summary) return null;

    const trendText =
      summary.trend === 'improving'
        ? '개선 중 📈'
        : summary.trend === 'declining'
          ? '주의 필요 📉'
          : '안정적 ➡️';

    return (
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
          이번 달 요약
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary.totalEntries}일
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              기록
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary.avgCondition}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              평균 컨디션
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary.routineRate.morning}%
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              아침 루틴
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary.routineRate.evening}%
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              저녁 루틴
            </Text>
          </View>
        </View>
        <Text style={[styles.trendText, { color: colors.muted }]}>
          트렌드: {trendText}
        </Text>
      </View>
    );
  };

  // 엔트리 카드
  const renderEntry = ({ item }: { item: SkinDiaryEntry }): React.JSX.Element => {
    const emoji = CONDITION_EMOJIS[item.skinCondition];
    const label = CONDITION_LABELS[item.skinCondition];
    const weatherIcon = item.weather ? WEATHER_ICONS[item.weather] : null;
    const weatherLabel = item.weather ? WEATHER_LABELS[item.weather] : null;

    return (
      <Pressable
        onPress={() => handleEditEntry(item)}
        style={[
          styles.entryCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        testID="diary-entry-card"
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryDate}>
            <Text style={[styles.entryDateText, { color: colors.foreground }]}>
              {formatDisplayDate(item.entryDate)}
            </Text>
            {weatherIcon && weatherLabel && (
              <Text style={[styles.weatherText, { color: colors.muted }]}>
                {weatherIcon} {weatherLabel}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => handleDeleteEntry(item)}
            hitSlop={8}
            testID="delete-entry-btn"
          >
            <Trash2 size={16} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.conditionRow}>
          <Text style={styles.conditionEmoji}>{emoji}</Text>
          <Text style={[styles.conditionLabel, { color: colors.foreground }]}>
            {label}
          </Text>
        </View>

        {item.conditionNotes ? (
          <Text
            style={[styles.notes, { color: colors.muted }]}
            numberOfLines={2}
          >
            {item.conditionNotes}
          </Text>
        ) : null}

        <View style={styles.factorRow}>
          {item.sleepHours != null && (
            <View
              style={[styles.factorChip, { backgroundColor: isDark ? colors.card : colors.muted + '20' }]}
            >
              <Text style={[styles.factorText, { color: colors.foreground }]}>
                💤 {item.sleepHours}시간
              </Text>
            </View>
          )}
          {item.waterIntakeMl != null && (
            <View
              style={[styles.factorChip, { backgroundColor: isDark ? colors.card : colors.muted + '20' }]}
            >
              <Text style={[styles.factorText, { color: colors.foreground }]}>
                💧 {item.waterIntakeMl}ml
              </Text>
            </View>
          )}
          {item.morningRoutineCompleted && (
            <View
              style={[styles.factorChip, { backgroundColor: isDark ? colors.card : colors.muted + '20' }]}
            >
              <Text style={[styles.factorText, { color: colors.foreground }]}>
                🌅 아침루틴
              </Text>
            </View>
          )}
          {item.eveningRoutineCompleted && (
            <View
              style={[styles.factorChip, { backgroundColor: isDark ? colors.card : colors.muted + '20' }]}
            >
              <Text style={[styles.factorText, { color: colors.foreground }]}>
                🌙 저녁루틴
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // 빈 상태
  const renderEmpty = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyEmoji]}>📝</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        아직 기록이 없어요
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.muted }]}>
        매일 피부 상태를 기록하면{'\n'}나만의 피부 패턴을 발견할 수 있어요
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: brand.primary }]}
        onPress={handleAddEntry}
      >
        <Text style={[styles.emptyButtonText, { color: '#fff' }]}>
          오늘 기록하기
        </Text>
      </Pressable>
    </View>
  );

  if (loading && entries.length === 0) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
        testID="skin-diary-screen"
      >
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          다이어리를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (error && entries.length === 0) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
        testID="skin-diary-screen"
      >
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </Text>
        <Pressable
          style={[styles.retryButton, { borderColor: brand.primary }]}
          onPress={refresh}
        >
          <Text style={{ color: brand.primary }}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="skin-diary-screen"
    >
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={
          <>
            {renderMonthSelector()}
            {renderSummary()}
          </>
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={brand.primary}
          />
        }
      />

      {/* FAB: 새 기록 추가 */}
      <Pressable
        style={[styles.fab, { backgroundColor: brand.primary }]}
        onPress={handleAddEntry}
        testID="add-diary-btn"
      >
        <Plus size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

function formatDisplayDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr);
  const day = dayOfWeek[date.getDay()];
  return `${Number(m)}월 ${Number(d)}일 (${day})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.base,
  },
  errorText: {
    fontSize: typography.size.base,
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  // 월 선택
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
  },
  // 요약
  summaryCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: typography.size.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  trendText: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // 엔트리 카드
  entryCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  entryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryDateText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  weatherText: {
    fontSize: typography.size.xs,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  conditionEmoji: {
    fontSize: 20,
  },
  conditionLabel: {
    fontSize: typography.size.base,
  },
  notes: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xs,
  },
  factorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  factorChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  factorText: {
    fontSize: typography.size.xs,
  },
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  emptyButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
