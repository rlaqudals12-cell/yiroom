/**
 * 스타일 영감 갤러리
 *
 * 코디 영감을 그리드로 탐색. 태그 기반 필터, 좋아요 기능.
 */
import { Heart, Sparkles } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';

import { ScreenContainer } from '../../../components/ui';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

interface InspirationItem {
  id: string;
  name: string;
  tags: string[];
  likeCount: number;
  isLiked: boolean;
}

const FILTER_CHIPS = [
  { id: 'all', label: '전체' },
  { id: 'casual', label: '캐주얼' },
  { id: 'formal', label: '포멀' },
  { id: 'street', label: '스트릿' },
  { id: 'minimal', label: '미니멀' },
];

// 예시 데이터 (추후 API 연동)
const SAMPLE_ITEMS: InspirationItem[] = [
  { id: '1', name: '데일리 캐주얼 룩', tags: ['캐주얼', '데일리'], likeCount: 24, isLiked: false },
  { id: '2', name: '오피스 포멀 룩', tags: ['포멀', '오피스'], likeCount: 18, isLiked: true },
  { id: '3', name: '스트릿 레이어드', tags: ['스트릿', '레이어드'], likeCount: 42, isLiked: false },
  { id: '4', name: '미니멀 모노톤', tags: ['미니멀', '모노톤'], likeCount: 31, isLiked: false },
  { id: '5', name: '주말 나들이 룩', tags: ['캐주얼', '주말'], likeCount: 15, isLiked: true },
  { id: '6', name: '비즈니스 캐주얼', tags: ['포멀', '캐주얼'], likeCount: 27, isLiked: false },
];

export default function StyleInspirationGalleryScreen(): React.JSX.Element {
  const { colors, brand, shadows } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [items, setItems] = useState<InspirationItem[]>(SAMPLE_ITEMS);

  // 필터 적용
  const filteredItems = selectedFilter === 'all'
    ? items
    : items.filter((item) => item.tags.some((t) => t === FILTER_CHIPS.find((c) => c.id === selectedFilter)?.label));

  const handleToggleLike = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1 }
          : item
      )
    );
  }, []);

  const renderCard = useCallback(
    ({ item }: { item: InspirationItem }) => (
      <View
        style={[
          styles.card,
          shadows.card,
          {
            backgroundColor: colors.card,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {/* 이미지 플레이스홀더 */}
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: colors.muted, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
          ]}
          accessibilityLabel={`${item.name} 이미지`}
        >
          <Sparkles size={28} color={colors.mutedForeground} />
        </View>

        <View style={styles.cardBody}>
          <Text
            numberOfLines={1}
            style={[styles.cardTitle, { color: colors.foreground }]}
          >
            {item.name}
          </Text>

          {/* 태그 */}
          <View style={styles.tagRow}>
            {item.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: brand.primary + '20' }]}
              >
                <Text style={[styles.tagText, { color: brand.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          {/* 좋아요 */}
          <Pressable
            style={styles.likeRow}
            onPress={() => handleToggleLike(item.id)}
            accessibilityLabel={item.isLiked ? '좋아요 취소' : '좋아요'}
            accessibilityRole="button"
          >
            <Heart
              size={16}
              color={item.isLiked ? '#EF4444' : colors.mutedForeground}
              fill={item.isLiked ? '#EF4444' : 'none'}
            />
            <Text style={[styles.likeCount, { color: colors.mutedForeground }]}>
              {item.likeCount}
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [colors, brand, shadows, handleToggleLike]
  );

  return (
    <ScreenContainer
      testID="style-inspiration-gallery-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 필터 칩 */}
      <FlatList
        horizontal
        data={FILTER_CHIPS}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: chip }) => {
          const isActive = chip.id === selectedFilter;
          return (
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? brand.primary : colors.secondary,
                  borderRadius: radii.full,
                },
              ]}
              onPress={() => setSelectedFilter(chip.id)}
              accessibilityLabel={`${chip.label} 필터`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? brand.primaryForeground : colors.mutedForeground },
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* 갤러리 그리드 또는 빈 상태 */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            아직 영감이 없어요
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            이 카테고리에 해당하는 스타일을 준비 중이에요
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  gridContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  gridRow: {
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    maxWidth: '49%',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  tagText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeCount: {
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
