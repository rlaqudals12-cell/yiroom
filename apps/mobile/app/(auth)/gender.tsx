/**
 * 성별 선택 화면
 *
 * 온보딩 과정에서 성별을 선택한다.
 * 성별 중립 옵션 포함 (Phase K 성별 중립화).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';

type GenderOption = 'female' | 'male' | 'non-binary' | 'prefer-not-to-say';

const GENDER_OPTIONS: { id: GenderOption; label: string; emoji: string; description: string }[] = [
  { id: 'female', label: '여성', emoji: '👩', description: '여성 맞춤 분석' },
  { id: 'male', label: '남성', emoji: '👨', description: '남성 맞춤 분석' },
  { id: 'non-binary', label: '논바이너리', emoji: '🧑', description: '성별 중립 분석' },
  { id: 'prefer-not-to-say', label: '선택하지 않음', emoji: '🙂', description: '기본 분석' },
];

export default function GenderScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography } = useTheme();

  const [selected, setSelected] = useState<GenderOption | null>(null);

  const handleContinue = (): void => {
    router.push('/(auth)/complete-profile');
  };

  return (
    <View
      testID="gender-screen"
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: spacing.xs,
        }}
      >
        성별을 선택해주세요
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        맞춤 분석 결과를 제공하기 위해 필요합니다
      </Text>

      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        {GENDER_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            accessibilityLabel={`${option.label}${selected === option.id ? ', 선택됨' : ''}`}
            onPress={() => setSelected(option.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              borderRadius: radii.xl,
              backgroundColor: selected === option.id ? brand.primary + '15' : colors.card,
              borderWidth: 2,
              borderColor: selected === option.id ? brand.primary : colors.border,
            }}
          >
            <Text style={{ fontSize: 28, marginRight: spacing.smx }}>{option.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.size.lg,
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
          </Pressable>
        ))}
      </View>

      <Pressable
        testID="gender-continue-button"
        accessibilityLabel="계속하기"
        onPress={handleContinue}
        disabled={!selected}
        style={{
          backgroundColor: selected ? brand.primary : colors.secondary,
          borderRadius: radii.full,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: selected ? brand.primaryForeground : colors.mutedForeground,
          }}
        >
          계속하기
        </Text>
      </Pressable>
    </View>
  );
}
