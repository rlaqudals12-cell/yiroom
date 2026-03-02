/**
 * QuickQuestions -- 빠른 질문 칩 목록
 *
 * 수평 스크롤 가능한 빠른 질문 칩.
 * "모공 관리법이 궁금해요", "건조한 피부 해결법" 등.
 */
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { HelpCircle } from 'lucide-react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface QuickQuestion {
  id: string;
  text: string;
}

export interface QuickQuestionsProps {
  questions: QuickQuestion[];
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export function QuickQuestions({
  questions,
  onSelect,
  style,
}: QuickQuestionsProps): React.JSX.Element {
  const { colors, spacing, typography, radii, module } = useTheme();

  const renderItem = ({ item }: { item: QuickQuestion }): React.JSX.Element => (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed
            ? module.skin.light + '40'
            : colors.card,
          borderColor: colors.border,
          borderRadius: radii.circle,
          paddingHorizontal: spacing.smx,
          paddingVertical: spacing.sm,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={() => onSelect(item.id)}
      accessibilityLabel={item.text}
      accessibilityRole="button"
      testID={`quick-question-${item.id}`}
    >
      <HelpCircle
        size={14}
        color={module.skin.base}
        style={{ marginRight: spacing.xs }}
      />
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.medium,
          color: colors.foreground,
        }}
        numberOfLines={1}
      >
        {item.text}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, style]} testID="quick-questions">
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
          color: colors.mutedForeground,
          marginBottom: spacing.sm,
          paddingHorizontal: spacing.md,
        }}
      >
        자주 묻는 질문
      </Text>
      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        }}
        accessibilityLabel="빠른 질문 목록"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
