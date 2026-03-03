/**
 * FAQList - 자주 묻는 질문 목록 컴포넌트
 * FAQ 항목을 확장/접기 형태로 표시한다.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FAQListProps {
  items: FAQItem[];
  style?: ViewStyle;
}

export function FAQList({ items, style }: FAQListProps): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (items.length === 0) {
    return (
      <View
        testID="faq-list"
        accessibilityLabel="FAQ 없음"
        style={[{ padding: spacing.xl, alignItems: 'center' }, style]}
      >
        <Text style={{ fontSize: typography.size['2xl'], marginBottom: spacing.sm }}>📋</Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          등록된 FAQ가 없습니다
        </Text>
      </View>
    );
  }

  return (
    <View
      testID="faq-list"
      accessibilityLabel={`자주 묻는 질문 ${items.length}개`}
      style={style}
    >
      <Text
        style={{
          fontSize: typography.size.xl,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.md,
          paddingHorizontal: spacing.md,
        }}
      >
        자주 묻는 질문
      </Text>

      {items.map((item, index) => {
        const isExpanded = expandedId === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityLabel={`${item.question}${isExpanded ? ', 펼침' : ', 접힘'}`}
            onPress={() => toggleExpand(item.id)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.md,
              marginHorizontal: spacing.md,
              marginBottom: index < items.length - 1 ? spacing.sm : 0,
            }}
          >
            {item.category ? (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: brand.primary,
                  fontWeight: typography.weight.semibold,
                  marginBottom: spacing.xxs,
                }}
              >
                {item.category}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  flex: 1,
                  marginRight: spacing.sm,
                }}
              >
                {item.question}
              </Text>
              <Text style={{ fontSize: typography.size.base, color: colors.mutedForeground }}>
                {isExpanded ? '▲' : '▼'}
              </Text>
            </View>

            {isExpanded && (
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  marginTop: spacing.sm,
                  lineHeight: 22,
                }}
              >
                {item.answer}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
