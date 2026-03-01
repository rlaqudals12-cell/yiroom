/**
 * 프로필 완성 화면
 *
 * 회원가입 후 기본 프로필 정보를 입력받는다.
 * 이름, 생년월일, 성별, 피부 타입 등.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';

import { useTheme } from '@/lib/theme';

type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

const SKIN_TYPES: { id: SkinType; label: string; emoji: string }[] = [
  { id: 'dry', label: '건성', emoji: '🏜️' },
  { id: 'oily', label: '지성', emoji: '💧' },
  { id: 'combination', label: '복합성', emoji: '🔀' },
  { id: 'normal', label: '중성', emoji: '✨' },
  { id: 'sensitive', label: '민감성', emoji: '🌸' },
];

export default function CompleteProfileScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography } = useTheme();

  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [skinType, setSkinType] = useState<SkinType | null>(null);

  const isValid = nickname.trim().length >= 2 && birthYear.length === 4;

  const handleComplete = (): void => {
    // 프로필 저장 후 메인 화면으로 이동
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      testID="complete-profile-screen"
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
        프로필을 완성해주세요
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.xl,
        }}
      >
        맞춤 분석을 위해 기본 정보가 필요합니다
      </Text>

      {/* 닉네임 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        닉네임
      </Text>
      <TextInput
        testID="nickname-input"
        accessibilityLabel="닉네임"
        value={nickname}
        onChangeText={setNickname}
        placeholder="2자 이상 입력해주세요"
        placeholderTextColor={colors.mutedForeground}
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.md,
          padding: spacing.smx,
          fontSize: typography.size.base,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.md,
        }}
      />

      {/* 출생연도 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        출생연도
      </Text>
      <TextInput
        testID="birth-year-input"
        accessibilityLabel="출생연도"
        value={birthYear}
        onChangeText={setBirthYear}
        placeholder="예: 1995"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="number-pad"
        maxLength={4}
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.md,
          padding: spacing.smx,
          fontSize: typography.size.base,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.md,
        }}
      />

      {/* 피부 타입 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        피부 타입 (선택)
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {SKIN_TYPES.map((type) => (
          <Pressable
            key={type.id}
            accessibilityLabel={`${type.label}${skinType === type.id ? ', 선택됨' : ''}`}
            onPress={() => setSkinType(type.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: skinType === type.id ? brand.primary : colors.secondary,
            }}
          >
            <Text style={{ fontSize: typography.size.sm }}>{type.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: skinType === type.id ? brand.primaryForeground : colors.foreground,
                fontWeight: skinType === type.id ? typography.weight.semibold : typography.weight.normal,
              }}
            >
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 완료 버튼 */}
      <Pressable
        testID="complete-button"
        accessibilityLabel="프로필 완성"
        onPress={handleComplete}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? brand.primary : colors.secondary,
          borderRadius: radii.lg,
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
