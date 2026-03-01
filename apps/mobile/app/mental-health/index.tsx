/**
 * 멘탈 헬스 화면
 *
 * 기분 추적, 스트레스 관리, 마인드풀니스 가이드를 제공한다.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '../../lib/theme';

type MoodLevel = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

interface MoodEntry {
  date: string;
  mood: MoodLevel;
  note: string;
}

const MOOD_OPTIONS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 'great', emoji: '😊', label: '아주 좋아요' },
  { level: 'good', emoji: '🙂', label: '좋아요' },
  { level: 'okay', emoji: '😐', label: '보통이에요' },
  { level: 'bad', emoji: '😔', label: '별로예요' },
  { level: 'terrible', emoji: '😢', label: '힘들어요' },
];

const MOCK_MOOD_HISTORY: MoodEntry[] = [
  { date: '2026-03-01', mood: 'good', note: '운동 후 기분 좋아짐' },
  { date: '2026-02-28', mood: 'great', note: '친구와 즐거운 시간' },
  { date: '2026-02-27', mood: 'okay', note: '' },
  { date: '2026-02-26', mood: 'bad', note: '수면 부족' },
  { date: '2026-02-25', mood: 'good', note: '영양 균형 잘 맞춤' },
];

const MINDFULNESS_TIPS = [
  { emoji: '🧘', title: '심호흡', description: '4초 들이쉬고, 7초 참고, 8초 내쉬세요', duration: '3분' },
  { emoji: '🌿', title: '그라운딩', description: '주변에서 5가지 보이는 것을 찾아보세요', duration: '5분' },
  { emoji: '📝', title: '감사 일기', description: '오늘 감사한 것 3가지를 적어보세요', duration: '5분' },
  { emoji: '🎵', title: '음악 명상', description: '좋아하는 음악을 들으며 눈을 감아보세요', duration: '10분' },
];

export default function MentalHealthScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status } = useTheme();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);

  const getMoodColor = (mood: MoodLevel): string => {
    const moodColors: Record<MoodLevel, string> = {
      great: status.success,
      good: '#22C55E',
      okay: status.warning,
      bad: '#F97316',
      terrible: status.error,
    };
    return moodColors[mood];
  };

  return (
    <ScrollView
      testID="mental-health-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        마음 건강
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        오늘 기분은 어떠세요?
      </Text>

      {/* 오늘 기분 선택 */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
          오늘의 기분
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {MOOD_OPTIONS.map((option) => {
            const selected = selectedMood === option.level;
            return (
              <Pressable
                key={option.level}
                accessibilityLabel={`기분: ${option.label}`}
                onPress={() => setSelectedMood(option.level)}
                style={{
                  alignItems: 'center',
                  padding: spacing.xs,
                  borderRadius: radii.lg,
                  backgroundColor: selected ? getMoodColor(option.level) + '20' : 'transparent',
                  borderWidth: selected ? 2 : 0,
                  borderColor: selected ? getMoodColor(option.level) : 'transparent',
                }}
              >
                <Text style={{ fontSize: 28 }}>{option.emoji}</Text>
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: selected ? getMoodColor(option.level) : colors.mutedForeground,
                    fontWeight: selected ? typography.weight.bold : typography.weight.normal,
                    marginTop: spacing.xxs,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 마인드풀니스 가이드 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        마인드풀니스
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {MINDFULNESS_TIPS.map((tip) => (
          <Pressable
            key={tip.title}
            accessibilityLabel={`${tip.title} 가이드`}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 28, marginRight: spacing.smx }}>{tip.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                {tip.title}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>{tip.description}</Text>
            </View>
            <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.full, backgroundColor: brand.primary + '15' }}>
              <Text style={{ fontSize: typography.size.xs, color: brand.primary }}>{tip.duration}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* 기분 히스토리 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        기분 기록
      </Text>
      <View style={{ gap: spacing.xs }}>
        {MOCK_MOOD_HISTORY.map((entry) => {
          const moodOption = MOOD_OPTIONS.find((o) => o.level === entry.mood);
          return (
            <View
              key={entry.date}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.sm,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: spacing.sm }}>{moodOption?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                  {moodOption?.label}
                </Text>
                {entry.note ? (
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>{entry.note}</Text>
                ) : null}
              </View>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>{entry.date}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
