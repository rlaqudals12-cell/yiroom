/**
 * 코디 편집 화면
 *
 * 저장된 코디의 이름, 설명, 계절, 상황 정보를 수정한다.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';

import { useTheme } from '@/lib/theme';

const SEASONS = [
  { id: 'spring', label: '봄' },
  { id: 'summer', label: '여름' },
  { id: 'autumn', label: '가을' },
  { id: 'winter', label: '겨울' },
];

const OCCASIONS = [
  { id: 'casual', label: '캐주얼' },
  { id: 'office', label: '오피스' },
  { id: 'date', label: '데이트' },
  { id: 'sports', label: '스포츠' },
  { id: 'formal', label: '포멀' },
];

export default function EditOutfitScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, brand, spacing, radii, typography } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);

  const isValid = name.trim().length >= 1;

  const toggleSeason = (seasonId: string): void => {
    setSelectedSeasons((prev) =>
      prev.includes(seasonId) ? prev.filter((s) => s !== seasonId) : [...prev, seasonId]
    );
  };

  const handleSave = (): void => {
    Alert.alert('저장 완료', '코디 정보가 수정되었어요', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      testID="edit-outfit-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.lg,
        }}
      >
        코디 편집
      </Text>

      {/* 이름 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.xs }}>
        코디 이름
      </Text>
      <TextInput
        testID="outfit-name-input"
        accessibilityLabel="코디 이름"
        value={name}
        onChangeText={setName}
        placeholder="코디 이름을 입력하세요"
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

      {/* 설명 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.xs }}>
        설명
      </Text>
      <TextInput
        accessibilityLabel="코디 설명"
        value={description}
        onChangeText={setDescription}
        placeholder="이 코디에 대한 설명 (선택)"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={3}
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.md,
          padding: spacing.smx,
          fontSize: typography.size.base,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.md,
          minHeight: 80,
          textAlignVertical: 'top',
        }}
      />

      {/* 계절 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        계절
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {SEASONS.map((season) => {
          const selected = selectedSeasons.includes(season.id);
          return (
            <Pressable
              key={season.id}
              accessibilityLabel={`${season.label}${selected ? ', 선택됨' : ''}`}
              onPress={() => toggleSeason(season.id)}
              style={{
                paddingHorizontal: spacing.smx,
                paddingVertical: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: selected ? brand.primary : colors.secondary,
              }}
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: selected ? brand.primaryForeground : colors.foreground,
                  fontWeight: selected ? typography.weight.semibold : typography.weight.normal,
                }}
              >
                {season.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 상황 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        상황
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {OCCASIONS.map((occasion) => {
          const selected = selectedOccasion === occasion.id;
          return (
            <Pressable
              key={occasion.id}
              accessibilityLabel={`${occasion.label}${selected ? ', 선택됨' : ''}`}
              onPress={() => setSelectedOccasion(selected ? null : occasion.id)}
              style={{
                paddingHorizontal: spacing.smx,
                paddingVertical: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: selected ? brand.primary : colors.secondary,
              }}
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: selected ? brand.primaryForeground : colors.foreground,
                  fontWeight: selected ? typography.weight.semibold : typography.weight.normal,
                }}
              >
                {occasion.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 저장 버튼 */}
      <Pressable
        testID="save-outfit-button"
        accessibilityLabel="코디 저장"
        onPress={handleSave}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? brand.primary : colors.secondary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: isValid ? brand.primaryForeground : colors.mutedForeground,
          }}
        >
          저장하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
