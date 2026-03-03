/**
 * DiaryEntryForm — 피부 일기 작성 폼
 *
 * 날짜별 피부 상태, 컨디션, 메모를 입력하는 폼.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export type SkinCondition = 'good' | 'normal' | 'bad';

export interface DiaryEntryFormProps {
  date: string;
  initialCondition?: SkinCondition;
  initialMemo?: string;
  onSave?: (data: { condition: SkinCondition; memo: string }) => void;
  style?: ViewStyle;
}

const CONDITIONS: { key: SkinCondition; label: string; emoji: string }[] = [
  { key: 'good', label: '좋음', emoji: '😊' },
  { key: 'normal', label: '보통', emoji: '😐' },
  { key: 'bad', label: '나쁨', emoji: '😔' },
];

export function DiaryEntryForm({
  date,
  initialCondition = 'normal',
  initialMemo = '',
  onSave,
  style,
}: DiaryEntryFormProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module } = useTheme();
  const [condition, setCondition] = useState<SkinCondition>(initialCondition);
  const [memo, setMemo] = useState(initialMemo);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="diary-entry-form"
      accessibilityLabel={`${date} 피부 일기 작성`}
    >
      {/* 날짜 */}
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        {date}
      </Text>

      {/* 컨디션 선택 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginBottom: spacing.xs,
        }}
      >
        오늘 피부 상태
      </Text>
      <View style={[styles.conditionRow, { gap: spacing.sm }]}>
        {CONDITIONS.map((c) => (
          <Pressable
            key={c.key}
            style={[
              styles.conditionBtn,
              {
                backgroundColor: condition === c.key ? module.skin.base : colors.secondary,
                borderRadius: radii.xl,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              },
            ]}
            onPress={() => setCondition(c.key)}
            accessibilityLabel={`피부 상태: ${c.label}`}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: typography.size.lg }}>{c.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
                color: condition === c.key ? colors.overlayForeground : colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 메모 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.md,
          marginBottom: spacing.xs,
        }}
      >
        메모
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.xl,
            padding: spacing.sm,
            fontSize: typography.size.sm,
            color: colors.foreground,
          },
        ]}
        value={memo}
        onChangeText={setMemo}
        placeholder="오늘 피부에 특이사항이 있나요?"
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={3}
        accessibilityLabel="피부 일기 메모"
        testID="diary-memo-input"
      />

      {/* 저장 버튼 */}
      {onSave && (
        <Pressable
          style={[
            styles.saveBtn,
            {
              backgroundColor: module.skin.base,
              borderRadius: radii.xl,
              paddingVertical: spacing.smd,
              marginTop: spacing.md,
            },
          ]}
          onPress={() => onSave({ condition, memo })}
          accessibilityLabel="피부 일기 저장"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.overlayForeground,
              textAlign: 'center',
            }}
          >
            저장
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  conditionRow: {
    flexDirection: 'row',
  },
  conditionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveBtn: {},
});
