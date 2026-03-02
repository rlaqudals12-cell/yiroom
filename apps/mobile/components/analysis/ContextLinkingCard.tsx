/**
 * 교차 모듈 연결 카드
 *
 * 분석 결과에서 다른 모듈로의 자연스러운 네비게이션
 * 예: 피부 분석 후 → 스킨케어 루틴, 제품 추천
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, spacing, radii, typography } from '../../lib/theme';

export interface ContextLink {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** 네비게이션 대상 */
  route: string;
}

export interface ContextLinkingCardProps {
  /** 카드 제목 */
  title?: string;
  links: ContextLink[];
  onLinkPress?: (link: ContextLink) => void;
}

export function ContextLinkingCard({
  title = '다음 단계',
  links,
  onLinkPress,
}: ContextLinkingCardProps): React.ReactElement {
  const { colors, brand, typography } = useTheme();

  if (links.length === 0) return <View testID="context-linking-card" />;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="context-linking-card"
      accessibilityLabel={`${title}: ${links.length}개 추천`}
    >
      <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.base }]}>
        {title}
      </Text>

      {links.map((link) => (
        <Pressable
          key={link.id}
          style={[styles.linkRow, { borderBottomColor: colors.border }]}
          onPress={() => onLinkPress?.(link)}
          accessibilityRole="button"
          accessibilityLabel={`${link.title}: ${link.description}`}
        >
          <Text style={styles.linkIcon}>{link.icon}</Text>
          <View style={styles.linkContent}>
            <Text style={[styles.linkTitle, { color: colors.foreground, fontSize: typography.size.sm }]}>
              {link.title}
            </Text>
            <Text style={[styles.linkDesc, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              {link.description}
            </Text>
          </View>
          <Text style={[styles.arrow, { color: brand.primary }]}>→</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.smx,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.smx,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.smd,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkIcon: {
    fontSize: typography.size.xl,
    marginRight: spacing.smx,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  linkDesc: {},
  arrow: {
    fontSize: typography.size.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
