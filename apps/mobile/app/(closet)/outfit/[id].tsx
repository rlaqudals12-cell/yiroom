/**
 * 코디 상세 화면
 *
 * 저장된 코디의 구성 아이템, 착용 기록, 계절/상황 정보를 확인한다.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface OutfitItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
}

// 예시 데이터 — 실제로는 DB에서 가져옴
const MOCK_OUTFIT = {
  name: '봄 캐주얼 코디',
  description: '따뜻한 봄날에 어울리는 가벼운 캐주얼 룩',
  season: ['봄', '가을'],
  occasion: '캐주얼',
  wearCount: 5,
  lastWornAt: '2026-02-25',
  items: [
    { id: '1', name: '베이지 니트', category: '상의', emoji: '👕' },
    { id: '2', name: '와이드 슬랙스', category: '하의', emoji: '👖' },
    { id: '3', name: '캔버스 스니커즈', category: '신발', emoji: '👟' },
    { id: '4', name: '미니 크로스백', category: '가방', emoji: '👜' },
  ] as OutfitItem[],
};

export default function OutfitDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors } = useTheme();

  const outfit = MOCK_OUTFIT;

  return (
    <ScrollView
      testID="outfit-detail-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {/* 코디 이름 */}
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        {outfit.name}
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        {outfit.description}
      </Text>

      {/* 메타 정보 */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        {outfit.season.map((s) => (
          <View
            key={s}
            style={{
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              backgroundColor: status.info + '20',
            }}
          >
            <Text style={{ fontSize: typography.size.xs, color: status.info, fontWeight: typography.weight.medium }}>
              {s}
            </Text>
          </View>
        ))}
        <View
          style={{
            paddingHorizontal: spacing.smx,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: status.success + '20',
          }}
        >
          <Text style={{ fontSize: typography.size.xs, color: status.success, fontWeight: typography.weight.medium }}>
            {outfit.occasion}
          </Text>
        </View>
      </View>

      {/* 착용 정보 */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: spacing.lg,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground }}>
            {outfit.wearCount}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            착용 횟수
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground }}>
            {outfit.lastWornAt}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            마지막 착용
          </Text>
        </View>
      </View>

      {/* 구성 아이템 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        구성 아이템
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {outfit.items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityLabel={`${item.name}, ${item.category}`}
            onPress={() => router.push({ pathname: '/(closet)/[id]', params: { id: item.id } })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: moduleColors.body.base,
            }}
          >
            <Text style={{ fontSize: typography.size.lg, marginRight: spacing.smx }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                {item.category}
              </Text>
            </View>
            <Text style={{ fontSize: typography.size.lg, color: colors.mutedForeground }}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* 액션 버튼 */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Pressable
          accessibilityLabel="오늘 입었어요"
          onPress={() => {}}
          style={{
            flex: 1,
            backgroundColor: brand.primary,
            borderRadius: radii.lg,
            paddingVertical: spacing.smx,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: brand.primaryForeground }}>
            오늘 입었어요
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="코디 편집"
          onPress={() => router.push({ pathname: '/(closet)/outfit/edit/[id]' as never, params: { id: id ?? '' } })}
          style={{
            flex: 1,
            backgroundColor: colors.secondary,
            borderRadius: radii.lg,
            paddingVertical: spacing.smx,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground }}>
            편집
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
