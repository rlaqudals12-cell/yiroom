/**
 * 카테고리별 의류 목록 화면
 *
 * 특정 카테고리의 옷장 아이템을 그리드로 표시한다.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface CategoryItem {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  wearCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  top: '👕',
  bottom: '👖',
  outer: '🧥',
  shoes: '👟',
  bag: '👜',
  accessory: '💍',
};

// 예시 데이터 — 실제로는 DB에서 가져옴
const MOCK_ITEMS: CategoryItem[] = [
  { id: '1', name: '베이지 니트', brand: 'ZARA', emoji: '👕', wearCount: 12 },
  { id: '2', name: '화이트 셔츠', brand: 'UNIQLO', emoji: '👔', wearCount: 8 },
  { id: '3', name: '스트라이프 티', brand: 'H&M', emoji: '👕', wearCount: 5 },
  { id: '4', name: '블랙 가디건', brand: 'COS', emoji: '🧶', wearCount: 15 },
];

export default function CategoryScreen(): React.ReactElement {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors, brand, spacing, radii, typography, module: moduleColors } = useTheme();

  const categoryLabel = CATEGORY_LABELS[slug ?? ''] ?? slug ?? '전체';
  const categoryEmoji = CATEGORY_EMOJIS[slug ?? ''] ?? '👗';

  return (
    <ScrollView
      testID="category-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {/* 카테고리 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ fontSize: 32, marginRight: spacing.sm }}>{categoryEmoji}</Text>
        <View>
          <Text
            style={{
              fontSize: typography.size['2xl'],
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {categoryLabel}
          </Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
            {MOCK_ITEMS.length}개 아이템
          </Text>
        </View>
      </View>

      {/* 정렬 옵션 */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        {['최신순', '착용순', '이름순'].map((label) => (
          <Pressable
            key={label}
            style={{
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              backgroundColor: label === '최신순' ? brand.primary : colors.secondary,
            }}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                color: label === '최신순' ? brand.primaryForeground : colors.foreground,
                fontWeight: label === '최신순' ? typography.weight.semibold : typography.weight.normal,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 아이템 목록 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityLabel={`${item.name}, ${item.brand}`}
            onPress={() => router.push({ pathname: '/(closet)/[id]', params: { id: item.id } })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.md,
                backgroundColor: moduleColors.body.base + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.smx,
              }}
            >
              <Text style={{ fontSize: typography.size.xl }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                {item.brand}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.foreground }}>
                {item.wearCount}
              </Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>회</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 아이템 추가 */}
      <Pressable
        accessibilityLabel="아이템 추가"
        onPress={() => router.push('/(closet)/add')}
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
          marginTop: spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          아이템 추가하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
