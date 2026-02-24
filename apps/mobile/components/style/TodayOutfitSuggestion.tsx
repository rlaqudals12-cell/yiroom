/**
 * TodayOutfitSuggestion — 오늘의 코디 추천 카드
 *
 * useClosetMatcher에서 생성된 OutfitSuggestion을 표시.
 * 슬롯별 아이템 조합 (상의 + 하의 + 아우터 등) 시각화.
 */
import { Image } from 'expo-image';
import { Wand2 } from 'lucide-react-native';
import { StyleSheet, Text, View, Pressable, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../lib/theme';
import { TIMING } from '../../lib/animations';
import type { OutfitSuggestion, ClosetRecommendation } from '../../lib/inventory';

// 슬롯명 → 한국어 라벨
const SLOT_LABELS: Record<string, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  shoes: '신발',
  bag: '가방',
  accessory: '악세서리',
};

// OutfitSuggestion 슬롯에서 아이템 목록 추출
function extractSlots(suggestion: OutfitSuggestion): { slot: string; rec: ClosetRecommendation }[] {
  const slots: { slot: string; rec: ClosetRecommendation }[] = [];
  const keys = ['outer', 'top', 'bottom', 'shoes', 'bag', 'accessory'] as const;
  for (const key of keys) {
    const rec = suggestion[key];
    if (rec) slots.push({ slot: key, rec });
  }
  return slots;
}

interface TodayOutfitSuggestionProps {
  suggestion: OutfitSuggestion;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function TodayOutfitSuggestion({
  suggestion,
  onPress,
  style,
  testID,
}: TodayOutfitSuggestionProps): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, module: moduleColors, shadows } = useTheme();

  const slots = extractSlots(suggestion);
  const matchPercent = suggestion.totalScore;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`오늘의 코디: ${slots.length}개 아이템, 매칭률 ${matchPercent}%`}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: moduleColors.personalColor.light + '20' },
          ]}
        >
          <Wand2 size={18} color={moduleColors.personalColor.dark} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            오늘의 코디
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            매칭률 {matchPercent}%
          </Text>
        </View>
        {onPress && (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="코디 추천 더보기"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                color: brand.primary,
                fontWeight: typography.weight.semibold,
              }}
            >
              더보기
            </Text>
          </Pressable>
        )}
      </View>

      {/* 아이템 조합 */}
      <View style={[styles.outfitRow, { marginTop: spacing.sm, gap: spacing.sm }]}>
        {slots.map(({ slot, rec }) => (
          <View key={slot} style={styles.outfitItem}>
            <View
              style={[
                styles.outfitImageBox,
                {
                  borderRadius: radii.lg,
                  backgroundColor: colors.secondary,
                },
              ]}
            >
              <Image
                source={{ uri: rec.item.imageUrl }}
                style={[styles.outfitImage, { borderRadius: radii.lg }]}
                contentFit="cover"
                transition={200}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                textAlign: 'center',
                marginTop: 3,
                maxWidth: 64,
              }}
            >
              {SLOT_LABELS[slot] ?? slot}
            </Text>
          </View>
        ))}
      </View>

      {/* 팁 */}
      {suggestion.tips.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              fontStyle: 'italic',
            }}
          >
            {suggestion.tips[0]}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  outfitItem: {
    alignItems: 'center',
  },
  outfitImageBox: {
    width: 64,
    height: 64,
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
