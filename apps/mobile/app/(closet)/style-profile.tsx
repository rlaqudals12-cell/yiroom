/**
 * 스타일 프로필 온보딩 화면
 *
 * 사용자의 스타일 선호도를 수집하여 맞춤 코디 추천에 활용한다.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

import { useTheme } from '@/lib/theme';

type StylePreference = 'minimal' | 'casual' | 'street' | 'classic' | 'romantic' | 'sporty';

const STYLE_OPTIONS: { id: StylePreference; label: string; emoji: string; description: string }[] = [
  { id: 'minimal', label: '미니멀', emoji: '🤍', description: '깔끔하고 절제된 스타일' },
  { id: 'casual', label: '캐주얼', emoji: '👕', description: '편안하고 자연스러운 스타일' },
  { id: 'street', label: '스트릿', emoji: '🧢', description: '트렌디하고 개성 있는 스타일' },
  { id: 'classic', label: '클래식', emoji: '👔', description: '시간이 지나도 변하지 않는 스타일' },
  { id: 'romantic', label: '로맨틱', emoji: '🌸', description: '여성스럽고 부드러운 스타일' },
  { id: 'sporty', label: '스포티', emoji: '🏃', description: '활동적이고 건강한 스타일' },
];

const COLOR_OPTIONS = [
  { id: 'neutral', label: '뉴트럴', colors: ['#F5F5DC', '#808080', '#000000'] },
  { id: 'warm', label: '웜톤', colors: ['#FF6B35', '#E8C07D', '#8B4513'] },
  { id: 'cool', label: '쿨톤', colors: ['#4A90D9', '#9B59B6', '#2C3E50'] },
  { id: 'vivid', label: '비비드', colors: ['#FF1744', '#2979FF', '#00E676'] },
];

export default function StyleProfileScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography } = useTheme();

  const [selectedStyles, setSelectedStyles] = useState<StylePreference[]>([]);
  const [selectedColorTone, setSelectedColorTone] = useState<string | null>(null);

  const toggleStyle = (styleId: StylePreference): void => {
    setSelectedStyles((prev) =>
      prev.includes(styleId) ? prev.filter((s) => s !== styleId) : prev.length < 3 ? [...prev, styleId] : prev
    );
  };

  const isValid = selectedStyles.length >= 1 && selectedColorTone !== null;

  const handleComplete = (): void => {
    router.replace('/(closet)');
  };

  return (
    <ScrollView
      testID="style-profile-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        스타일 프로필
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.xl,
        }}
      >
        선호하는 스타일을 선택하면 맞춤 코디를 추천해드려요
      </Text>

      {/* 스타일 선택 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        선호 스타일 (최대 3개)
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        {STYLE_OPTIONS.map((option) => {
          const selected = selectedStyles.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityLabel={`${option.label}${selected ? ', 선택됨' : ''}`}
              onPress={() => toggleStyle(option.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.md,
                borderRadius: radii.xl,
                backgroundColor: selected ? brand.primary + '15' : colors.card,
                borderWidth: 2,
                borderColor: selected ? brand.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: spacing.smx }}>{option.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  {option.description}
                </Text>
              </View>
              {selected && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: brand.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: brand.primaryForeground, fontSize: typography.size.xs, fontWeight: typography.weight.bold }}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 색상 톤 선택 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        선호 색상 톤
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {COLOR_OPTIONS.map((option) => {
          const selected = selectedColorTone === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityLabel={`${option.label}${selected ? ', 선택됨' : ''}`}
              onPress={() => setSelectedColorTone(option.id)}
              style={{
                flex: 1,
                minWidth: 140,
                padding: spacing.md,
                borderRadius: radii.xl,
                backgroundColor: selected ? brand.primary + '15' : colors.card,
                borderWidth: 2,
                borderColor: selected ? brand.primary : colors.border,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs }}>
                {option.colors.map((c, i) => (
                  <View
                    key={i}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: c,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                ))}
              </View>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: selected ? typography.weight.semibold : typography.weight.normal,
                  color: colors.foreground,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 완료 버튼 */}
      <Pressable
        testID="complete-style-profile"
        accessibilityLabel="스타일 프로필 완료"
        onPress={handleComplete}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? brand.primary : colors.secondary,
          borderRadius: radii.xl,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: isValid ? brand.primaryForeground : colors.mutedForeground,
          }}
        >
          시작하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
