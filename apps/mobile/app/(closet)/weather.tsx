/**
 * 날씨 기반 코디 추천 화면
 *
 * 현재 날씨와 기온에 맞는 코디를 추천한다.
 */
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

interface WeatherOutfit {
  id: string;
  name: string;
  items: string[];
  reason: string;
}

// 예시 데이터 — 실제로는 날씨 API + 옷장 데이터에서 생성
const MOCK_WEATHER = {
  temperature: 12,
  condition: '맑음',
  emoji: '☀️',
  humidity: 45,
};

const MOCK_OUTFITS: WeatherOutfit[] = [
  {
    id: '1',
    name: '가벼운 봄 레이어링',
    items: ['얇은 니트', '면 바지', '가디건'],
    reason: '12°C에 적합한 레이어링',
  },
  {
    id: '2',
    name: '캐주얼 외출룩',
    items: ['맨투맨', '청바지', '운동화'],
    reason: '맑은 날씨에 활동적인 스타일',
  },
  {
    id: '3',
    name: '오피스 룩',
    items: ['셔츠', '슬랙스', '자켓'],
    reason: '깔끔한 출근 스타일',
  },
];

export default function WeatherOutfitScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors } = useTheme();

  const getTemperatureColor = (temp: number): string => {
    if (temp >= 28) return status.error;
    if (temp >= 20) return status.warning;
    if (temp >= 10) return status.success;
    return status.info;
  };

  return (
    <ScrollView
      testID="weather-outfit-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {/* 날씨 정보 카드 */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: 48 }}>{MOCK_WEATHER.emoji}</Text>
        <Text
          style={{
            fontSize: typography.size['3xl'],
            fontWeight: typography.weight.bold,
            color: getTemperatureColor(MOCK_WEATHER.temperature),
            marginTop: spacing.xs,
          }}
        >
          {MOCK_WEATHER.temperature}°C
        </Text>
        <Text
          style={{
            fontSize: typography.size.base,
            color: colors.mutedForeground,
            marginTop: spacing.xxs,
          }}
        >
          {MOCK_WEATHER.condition} · 습도 {MOCK_WEATHER.humidity}%
        </Text>
      </View>

      {/* 추천 코디 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        오늘의 추천 코디
      </Text>

      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {MOCK_OUTFITS.map((outfit) => (
          <Pressable
            key={outfit.id}
            accessibilityLabel={`${outfit.name} 코디`}
            onPress={() => router.push({ pathname: '/(closet)/outfit/[id]' as never, params: { id: outfit.id } })}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: moduleColors.body.base,
            }}
          >
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.xs,
              }}
            >
              {outfit.name}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
              {outfit.items.map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                    borderRadius: radii.full,
                    backgroundColor: colors.secondary,
                  }}
                >
                  <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
              {outfit.reason}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 옷장 바로가기 */}
      <Pressable
        accessibilityLabel="내 옷장 보기"
        onPress={() => router.push('/(closet)')}
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          내 옷장에서 선택하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
