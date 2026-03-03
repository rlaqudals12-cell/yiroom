/**
 * 스타일 카테고리 상세 페이지
 *
 * slug 파라미터로 카테고리를 식별하고 해당 아이템 목록을 표시.
 */
import { useLocalSearchParams } from 'expo-router';
import { SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';

import { ScreenContainer } from '../../../../components/ui';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  likeCount: number;
  createdAt: string;
}

type SortOption = 'popular' | 'latest';

// 카테고리 메타 정보
const CATEGORY_META: Record<string, { title: string; description: string }> = {
  casual: { title: '캐주얼', description: '편안하고 자연스러운 일상 스타일' },
  formal: { title: '포멀', description: '격식 있는 자리에 어울리는 깔끔한 스타일' },
  street: { title: '스트릿', description: '자유롭고 개성 넘치는 거리 패션' },
  minimal: { title: '미니멀', description: '군더더기 없는 깔끔한 스타일' },
  romantic: { title: '로맨틱', description: '부드럽고 여성스러운 무드' },
  sporty: { title: '스포티', description: '활동적이고 편안한 스타일' },
  vintage: { title: '빈티지', description: '복고풍 감성의 클래식 스타일' },
  classic: { title: '클래식', description: '시대를 초월한 정통 스타일' },
};

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'popular', label: '인기순' },
  { id: 'latest', label: '최신순' },
];

// 예시 데이터 (추후 API 연동)
const SAMPLE_ITEMS: CategoryItem[] = [
  { id: '1', name: '데일리 베이직 룩', description: '깔끔한 기본 아이템 조합', likeCount: 34, createdAt: '2026-03-01' },
  { id: '2', name: '레이어드 스타일링', description: '겹겹이 쌓아 만드는 무드', likeCount: 28, createdAt: '2026-02-28' },
  { id: '3', name: '원포인트 악세서리', description: '심플한 코디에 포인트 하나', likeCount: 42, createdAt: '2026-02-27' },
  { id: '4', name: '컬러 매칭 가이드', description: '색상 조합으로 완성하는 스타일', likeCount: 19, createdAt: '2026-02-25' },
  { id: '5', name: '시즌 트랜드 룩', description: '이번 시즌 주목할 아이템', likeCount: 56, createdAt: '2026-03-02' },
];

export default function StyleCategoryDetailScreen(): React.JSX.Element {
  const { colors, brand, shadows } = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const meta = CATEGORY_META[slug ?? ''] ?? {
    title: slug ?? '카테고리',
    description: '스타일 카테고리',
  };

  // 정렬 적용
  const sortedItems = useMemo(() => {
    const items = [...SAMPLE_ITEMS];
    if (sortBy === 'popular') {
      items.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return items;
  }, [sortBy]);

  const renderItem = useCallback(
    ({ item }: { item: CategoryItem }) => (
      <View
        style={[
          styles.itemCard,
          shadows.card,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        accessibilityLabel={`${item.name}, 좋아요 ${item.likeCount}개`}
      >
        {/* 이미지 플레이스홀더 */}
        <View
          style={[
            styles.itemImage,
            { backgroundColor: colors.muted, borderRadius: radii.xl },
          ]}
        >
          <Sparkles size={24} color={colors.mutedForeground} />
        </View>

        <View style={styles.itemContent}>
          <Text
            numberOfLines={1}
            style={[styles.itemName, { color: colors.foreground }]}
          >
            {item.name}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.itemDesc, { color: colors.mutedForeground }]}
          >
            {item.description}
          </Text>
          <Text style={[styles.itemLike, { color: colors.mutedForeground }]}>
            {item.likeCount} likes
          </Text>
        </View>
      </View>
    ),
    [colors, shadows]
  );

  return (
    <ScreenContainer
      testID="style-category-detail-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 카테고리 헤더 */}
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          accessibilityRole="header"
        >
          {meta.title}
        </Text>
        <Text style={[styles.headerDesc, { color: colors.mutedForeground }]}>
          {meta.description}
        </Text>
      </View>

      {/* 정렬 옵션 */}
      <View style={styles.sortRow}>
        <SlidersHorizontal size={14} color={colors.mutedForeground} />
        {SORT_OPTIONS.map((option) => {
          const isActive = option.id === sortBy;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.sortChip,
                {
                  backgroundColor: isActive ? brand.primary : colors.secondary,
                  borderRadius: radii.full,
                },
              ]}
              onPress={() => setSortBy(option.id)}
              accessibilityLabel={`${option.label}으로 정렬`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: isActive ? brand.primaryForeground : colors.mutedForeground },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 아이템 목록 */}
      {sortedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            아직 아이템이 없어요
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            이 카테고리에 해당하는 스타일을 준비 중이에요
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  headerDesc: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sortChip: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xs,
  },
  sortChipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.smx,
  },
  itemImage: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  itemDesc: {
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * typography.lineHeight.normal,
    marginBottom: spacing.xs,
  },
  itemLike: {
    fontSize: typography.size.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
