/**
 * 날씨 기반 코디 추천 화면
 *
 * 현재 날씨 표시 + 체감 온도 기반 3가지 코디 제안.
 */
import { CloudSun, Thermometer, Droplets, Wind } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

import { ScreenContainer } from '../../../components/ui';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

interface OutfitSuggestion {
  id: string;
  title: string;
  description: string;
  temperatureTag: string;
  matchReason: string;
  items: string[];
}

// 예시 날씨 데이터 (추후 useWeather 훅 연동)
const MOCK_WEATHER = {
  temp: 14,
  feelsLike: 12,
  condition: '구름 많음',
  humidity: 55,
  wind: 3.2,
};

// 예시 코디 추천 (추후 AI 매칭 연동)
const MOCK_SUGGESTIONS: OutfitSuggestion[] = [
  {
    id: '1',
    title: '가벼운 레이어드 룩',
    description: '얇은 니트 + 가디건 조합으로 온도 변화에 유연하게 대응해요',
    temperatureTag: '10~15°C',
    matchReason: '체감 온도가 낮아 레이어드가 적합해요',
    items: ['니트 스웨터', '가디건', '슬랙스', '로퍼'],
  },
  {
    id: '2',
    title: '캐주얼 자켓 코디',
    description: '셔츠 위에 가벼운 자켓을 걸쳐 깔끔한 인상을 줘요',
    temperatureTag: '10~15°C',
    matchReason: '바람이 있어 아우터가 필요해요',
    items: ['셔츠', '코튼 자켓', '데님', '스니커즈'],
  },
  {
    id: '3',
    title: '스포티 캐주얼',
    description: '후드 + 바람막이로 활동적이면서도 따뜻하게',
    temperatureTag: '10~15°C',
    matchReason: '습도가 적당해 면 소재가 편해요',
    items: ['후드 티', '바람막이', '조거 팬츠', '운동화'],
  },
];

export default function WeatherOutfitScreen(): React.JSX.Element {
  const { colors, brand, status, shadows } = useTheme();
  const [weather] = useState(MOCK_WEATHER);
  const [suggestions] = useState(MOCK_SUGGESTIONS);

  return (
    <ScreenContainer
      testID="weather-outfit-screen"
      edges={['bottom']}
      contentPadding={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 현재 날씨 카드 */}
        <View
          style={[
            styles.weatherCard,
            shadows.card,
            { backgroundColor: colors.card, borderRadius: radii.xl },
          ]}
          accessibilityLabel={`현재 날씨 ${weather.temp}도 ${weather.condition}`}
        >
          <View style={styles.weatherHeader}>
            <CloudSun size={36} color={brand.primary} />
            <View style={styles.weatherTempBlock}>
              <Text style={[styles.tempText, { color: colors.foreground }]}>
                {weather.temp}°C
              </Text>
              <Text style={[styles.conditionText, { color: colors.mutedForeground }]}>
                {weather.condition}
              </Text>
            </View>
          </View>

          <View style={styles.weatherDetailsRow}>
            <View style={styles.weatherDetail}>
              <Thermometer size={14} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                체감 {weather.feelsLike}°C
              </Text>
            </View>
            <View style={styles.weatherDetail}>
              <Droplets size={14} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                습도 {weather.humidity}%
              </Text>
            </View>
            <View style={styles.weatherDetail}>
              <Wind size={14} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                풍속 {weather.wind}m/s
              </Text>
            </View>
          </View>

          {/* 온도 범위 태그 */}
          <View style={[styles.tempTag, { backgroundColor: status.info + '20' }]}>
            <Text style={[styles.tempTagText, { color: status.info }]}>
              체감 온도 기반 추천
            </Text>
          </View>
        </View>

        {/* 오늘의 추천 코디 섹션 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          오늘의 추천 코디
        </Text>

        {suggestions.map((suggestion) => (
          <View
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              shadows.card,
              { backgroundColor: colors.card, borderRadius: radii.xl },
            ]}
            accessibilityLabel={`추천 코디: ${suggestion.title}`}
          >
            <View style={styles.suggestionHeader}>
              <Text style={[styles.suggestionTitle, { color: colors.foreground }]}>
                {suggestion.title}
              </Text>
              <View style={[styles.tempBadge, { backgroundColor: brand.primary + '20' }]}>
                <Text style={[styles.tempBadgeText, { color: brand.primary }]}>
                  {suggestion.temperatureTag}
                </Text>
              </View>
            </View>

            <Text style={[styles.suggestionDesc, { color: colors.mutedForeground }]}>
              {suggestion.description}
            </Text>

            {/* 아이템 목록 */}
            <View style={styles.itemsRow}>
              {suggestion.items.map((item) => (
                <View
                  key={item}
                  style={[styles.itemChip, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.itemChipText, { color: colors.foreground }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            {/* 매칭 이유 */}
            <View style={[styles.reasonRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.reasonText, { color: status.info }]}>
                {suggestion.matchReason}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  weatherCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  weatherTempBlock: {
    flex: 1,
  },
  tempText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  conditionText: {
    fontSize: typography.size.sm,
    marginTop: spacing.xxs,
  },
  weatherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.smx,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.size.xs,
  },
  tempTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  tempTagText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.md,
  },
  suggestionCard: {
    padding: spacing.md,
    marginBottom: spacing.smx,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    flex: 1,
  },
  tempBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  tempBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  suggestionDesc: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
    marginBottom: spacing.smx,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.smx,
  },
  itemChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  itemChipText: {
    fontSize: typography.size.xs,
  },
  reasonRow: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  reasonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
});
