/**
 * 옷장 아이템 편집 화면
 *
 * 기존 의류 아이템의 이름, 카테고리, 브랜드, 사이즈, 계절, 상황 태그를 수정한다.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';

import { useTheme } from '@/lib/theme';

interface EditableFields {
  name: string;
  brand: string;
  size: string;
  selectedSeasons: string[];
  selectedOccasions: string[];
}

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

export default function EditClosetItemScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, brand, spacing, radii, typography } = useTheme();

  // 예시 초기값 — 실제로는 DB에서 가져옴
  const [fields, setFields] = useState<EditableFields>({
    name: '',
    brand: '',
    size: '',
    selectedSeasons: [],
    selectedOccasions: [],
  });

  const isValid = fields.name.trim().length >= 1;

  const toggleSeason = (seasonId: string): void => {
    setFields((prev) => ({
      ...prev,
      selectedSeasons: prev.selectedSeasons.includes(seasonId)
        ? prev.selectedSeasons.filter((s) => s !== seasonId)
        : [...prev.selectedSeasons, seasonId],
    }));
  };

  const toggleOccasion = (occasionId: string): void => {
    setFields((prev) => ({
      ...prev,
      selectedOccasions: prev.selectedOccasions.includes(occasionId)
        ? prev.selectedOccasions.filter((o) => o !== occasionId)
        : [...prev.selectedOccasions, occasionId],
    }));
  };

  const handleSave = (): void => {
    Alert.alert('저장 완료', '아이템 정보가 수정되었어요', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      testID="edit-closet-item-screen"
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
        아이템 편집
      </Text>

      {/* 이름 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.xs }}>
        이름
      </Text>
      <TextInput
        testID="edit-name-input"
        accessibilityLabel="아이템 이름"
        value={fields.name}
        onChangeText={(text) => setFields((prev) => ({ ...prev, name: text }))}
        placeholder="아이템 이름을 입력하세요"
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

      {/* 브랜드 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.xs }}>
        브랜드
      </Text>
      <TextInput
        accessibilityLabel="브랜드"
        value={fields.brand}
        onChangeText={(text) => setFields((prev) => ({ ...prev, brand: text }))}
        placeholder="브랜드 (선택)"
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

      {/* 사이즈 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.xs }}>
        사이즈
      </Text>
      <TextInput
        accessibilityLabel="사이즈"
        value={fields.size}
        onChangeText={(text) => setFields((prev) => ({ ...prev, size: text }))}
        placeholder="예: M, 95, Free"
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

      {/* 계절 */}
      <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        계절
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {SEASONS.map((season) => {
          const selected = fields.selectedSeasons.includes(season.id);
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
          const selected = fields.selectedOccasions.includes(occasion.id);
          return (
            <Pressable
              key={occasion.id}
              accessibilityLabel={`${occasion.label}${selected ? ', 선택됨' : ''}`}
              onPress={() => toggleOccasion(occasion.id)}
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
        testID="save-button"
        accessibilityLabel="변경사항 저장"
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
