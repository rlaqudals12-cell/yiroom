/**
 * WeatherOutfit — 날씨 기반 코디 추천 카드
 *
 * 현재 날씨(기온, 상태)에 기반한 코디 제안과 스타일 팁을 표시.
 * 날씨 아이콘 + 기온 + 코디 설명 + 팁 목록 구성.
 */
import React, { memo } from 'react';
import { CloudSun, Cloud, CloudRain, Snowflake, Sun, Thermometer } from 'lucide-react-native';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherOutfitProps {
  temperature: number;
  condition: WeatherCondition;
  outfitSuggestion: string;
  tips: string[];
  style?: ViewStyle;
}

const CONDITION_CONFIG: Record<
  WeatherCondition,
  { label: string; IconComponent: typeof Sun; iconColor: string; bgColor: string }
> = {
  sunny: { label: '맑음', IconComponent: Sun, iconColor: '#F59E0B', bgColor: '#FEF3C7' },
  cloudy: { label: '흐림', IconComponent: Cloud, iconColor: '#6B7280', bgColor: '#F3F4F6' },
  rainy: { label: '비', IconComponent: CloudRain, iconColor: '#3B82F6', bgColor: '#DBEAFE' },
  snowy: { label: '눈', IconComponent: Snowflake, iconColor: '#06B6D4', bgColor: '#CFFAFE' },
};

// 기온에 따른 색상 결정
function getTemperatureColor(temp: number): string {
  if (temp >= 28) return '#EF4444';
  if (temp >= 20) return '#F59E0B';
  if (temp >= 10) return '#22C55E';
  if (temp >= 0) return '#3B82F6';
  return '#06B6D4';
}

export const WeatherOutfit = memo(function WeatherOutfit({
  temperature,
  condition,
  outfitSuggestion,
  tips,
  style,
}: WeatherOutfitProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows, isDark } = useTheme();

  const config = CONDITION_CONFIG[condition];
  const tempColor = getTemperatureColor(temperature);
  const { IconComponent } = config;

  // 다크모드에서 배경 투명도 조정
  const weatherBgColor = isDark ? config.iconColor + '20' : config.bgColor;

  return (
    <View
      testID="weather-outfit"
      accessibilityLabel={`오늘 날씨 ${config.label}, ${temperature}도. ${outfitSuggestion}`}
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
      {/* 날씨 정보 헤더 */}
      <View style={styles.weatherHeader}>
        <View
          style={[
            styles.weatherIconBox,
            {
              backgroundColor: weatherBgColor,
              borderRadius: radii.xl,
            },
          ]}
        >
          <IconComponent size={28} color={config.iconColor} />
        </View>

        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              fontWeight: typography.weight.medium,
            }}
          >
            오늘의 날씨
          </Text>
          <View style={styles.tempRow}>
            <Text
              style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: tempColor,
              }}
            >
              {temperature}°
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginLeft: spacing.xs,
                alignSelf: 'flex-end',
                marginBottom: spacing.xxs,
              }}
            >
              {config.label}
            </Text>
          </View>
        </View>
      </View>

      {/* 구분선 */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: colors.border,
            marginVertical: spacing.md,
          },
        ]}
      />

      {/* 코디 제안 */}
      <View>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginBottom: spacing.xs,
          }}
        >
          추천 코디
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.foreground,
            lineHeight: typography.size.sm * typography.lineHeight.relaxed,
          }}
        >
          {outfitSuggestion}
        </Text>
      </View>

      {/* 스타일 팁 */}
      {tips.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginBottom: spacing.xs,
            }}
          >
            스타일 팁
          </Text>
          {tips.map((tip, index) => (
            <View
              key={`tip-${index}`}
              style={[styles.tipRow, { marginTop: index > 0 ? spacing.xs : 0 }]}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginRight: spacing.sm,
                }}
              >
                💡
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  lineHeight: typography.size.sm * typography.lineHeight.normal,
                }}
              >
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIconBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
