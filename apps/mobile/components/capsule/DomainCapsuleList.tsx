/**
 * DomainCapsuleList — 도메인별 캡슐 아이템 리스트
 *
 * 각 도메인의 캡슐 아이템을 CCS 점수와 함께 표시.
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';

interface DomainItem {
  id: string;
  name: string;
  score: number;
}

interface DomainCapsuleListProps {
  /** 도메인 이름 (표시용) */
  domainName: string;
  /** 아이템 목록 */
  items: DomainItem[];
  /** 전체 CCS 점수 */
  ccs: number;
  /** 최적 N */
  optimalN: number;
  /** 악센트 색상 */
  accentColor?: string;
  testID?: string;
}

// CCS 등급 판정
function getCCSGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'S', color: '#22C55E' };
  if (score >= 80) return { label: 'A', color: '#3B82F6' };
  if (score >= 70) return { label: 'B', color: '#F59E0B' };
  return { label: 'C', color: '#EF4444' };
}

export function DomainCapsuleList({
  domainName,
  items,
  ccs,
  optimalN,
  accentColor,
  testID,
}: DomainCapsuleListProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, isDark, shadows } = useTheme();
  const grade = getCCSGrade(ccs);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        },
        !isDark
          ? Platform.select({
              ios: {
                shadowColor: accentColor ?? '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
              },
              android: { elevation: 2 },
            }) ?? {}
          : {},
      ]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
            }}
          >
            {domainName}
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              marginTop: 2,
            }}
          >
            {items.length}/{optimalN} 아이템
          </Text>
        </View>
        {/* CCS 등급 칩 */}
        <View
          style={[
            styles.gradeChip,
            {
              backgroundColor: `${grade.color}18`,
              borderRadius: radii.full,
            },
          ]}
        >
          <Text
            style={{
              color: grade.color,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
            }}
          >
            {grade.label} ({ccs})
          </Text>
        </View>
      </View>

      {/* 아이템 리스트 */}
      {items.length > 0 ? (
        <View style={[styles.itemList, { marginTop: spacing.sm }]}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                {
                  borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
                  borderTopColor: colors.border,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  color: item.score >= 70 ? '#22C55E' : '#F59E0B',
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.medium,
                }}
              >
                {item.score}점
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.sm,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          아직 아이템이 없어요
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  itemList: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
