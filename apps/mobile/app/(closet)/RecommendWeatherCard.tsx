import { ChevronRight, Cloud, CloudRain, Info, Sun, Thermometer } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

import { styles } from './recommend.styles';
import { GlassCard } from '../../components/ui';
import type { PersonalColorSeason } from '../../lib/inventory/useClosetMatcher';
import type { WeatherData } from '../../lib/weather';

interface RecommendWeatherCardProps {
  weather: WeatherData | null;
  locationName: string;
  effectiveTemp: number | null;
  personalColor: PersonalColorSeason | null;
  bodyTypeLabel: string | null;
  hasDiagnosis: boolean;
  onAnalyzePress: () => void;
}

function WeatherIcon({ condition, color }: { condition: string; color: string }) {
  if (condition.includes('비') || condition.includes('소나기')) {
    return <CloudRain size={16} color={color} />;
  }
  if (condition.includes('맑') || condition.includes('쾌청')) {
    return <Sun size={16} color={color} />;
  }
  return <Cloud size={16} color={color} />;
}

export function RecommendWeatherCard({
  weather,
  locationName,
  effectiveTemp,
  personalColor,
  bodyTypeLabel,
  hasDiagnosis,
  onAnalyzePress,
}: RecommendWeatherCardProps) {
  const { colors, module: moduleTheme, status } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)}>
      <GlassCard shadowSize="md" style={{ ...styles.weatherCard }}>
        {weather?.usedFallback ? (
          <View
            testID="weather-fallback-notice"
            accessibilityRole="text"
            style={styles.weatherFallbackNotice}
          >
            <Info size={16} color={colors.mutedForeground} />
            <Text style={[styles.weatherText, { color: colors.mutedForeground, flex: 1 }]}>
              실시간 날씨를 불러오지 못해 날씨 정보는 추천에서 제외했어요.
            </Text>
          </View>
        ) : (
          <View style={styles.weatherRow}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>📍</Text>
              {weather?.locationSource === 'default' ? (
                <View
                  testID="weather-location-source-badge"
                  style={[styles.weatherSourceBadge, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.weatherSourceBadgeText, { color: colors.mutedForeground }]}>
                    서울 기준
                  </Text>
                </View>
              ) : (
                <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>
                  {locationName}
                </Text>
              )}
            </View>
            <View style={styles.weatherItem}>
              <Thermometer size={16} color={colors.mutedForeground} />
              <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>
                {effectiveTemp}°C
              </Text>
            </View>
            {weather?.current && (
              <View style={styles.weatherItem}>
                <WeatherIcon
                  condition={weather.current.description}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>
                  {weather.current.description}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.weatherTags}>
          {personalColor && (
            <View style={[styles.tag, { backgroundColor: moduleTheme.body.dark + '20' }]}>
              <Text style={[styles.tagText, { color: moduleTheme.body.dark }]}>
                {personalColor}
              </Text>
            </View>
          )}
          {bodyTypeLabel && (
            <View style={[styles.tag, { backgroundColor: status.info + '20' }]}>
              <Text style={[styles.tagText, { color: status.info }]}>{bodyTypeLabel}</Text>
            </View>
          )}
          {!hasDiagnosis && (
            <Pressable
              style={styles.analyzeCta}
              onPress={onAnalyzePress}
              testID="recommend-analyze-cta"
              accessibilityRole="button"
              accessibilityLabel="분석하고 맞춤 추천 받기"
            >
              <Text style={[styles.analyzeCtaText, { color: colors.mutedForeground }]}>
                분석하고 맞춤 추천 받기
              </Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}
